import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { renderCode, scopedRows } from "../code-view.js";

const builder = fileURLToPath(
  new URL("./build-code-data.mjs", import.meta.url),
);

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), "pr-map-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const repository = join(directory, "source");
  const output = join(directory, "viewer");
  await mkdir(repository);
  await mkdir(output);
  const git = (...args) =>
    execFileSync("git", ["-C", repository, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  git("init", "--quiet");
  git("config", "core.hooksPath", "/dev/null");
  const commit = () => {
    git("add", ".");
    git(
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.test",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "--quiet",
      "-m",
      "Update fixture",
    );
    return git("rev-parse", "HEAD");
  };
  const before = `<?php
use Example\\Legacy;
class Worker
{
    public function run(): int
    {
        $amount = 3;
        return $amount + 2;
    }

    public function obsolete(): int
    {
        return 99;
    }
}
`;
  const after = `<?php
use Example\\Current;
class Worker
{
    public function run(): int
    {
        return $this->calculate();
    }

    public function calculate(): int
    {
        $amount = 3;
        return $amount + 2;
    }
}
`;
  await writeFile(join(repository, "Worker.php"), before);
  await writeFile(
    join(repository, "Caller.php"),
    "<?php\nfunction dispatchWork() { return (new Worker)->run(); }\n",
  );
  const base = commit();
  await writeFile(join(repository, "Worker.php"), after);
  const head = commit();
  const patch = execFileSync(
    "git",
    [
      "-C",
      repository,
      "diff",
      "--no-ext-diff",
      "--no-textconv",
      base,
      head,
      "--",
      "Worker.php",
    ],
    { encoding: "utf8" },
  );
  const map = {
    headRefOid: head,
    edges: [{ from: "caller", to: "worker", label: "dispatchWork()" }],
    nodes: [
      {
        id: "worker",
        file: "Worker.php",
        methods: ["run", "calculate", "obsolete"],
        title: "Worker",
        kind: "ACTION",
        summary: "Calculate a value.",
      },
      {
        id: "caller",
        file: "Caller.php",
        methods: ["dispatchWork"],
        title: "Caller",
        kind: "CONTEXT",
        summary: "Call the worker.",
      },
    ],
  };
  await writeFile(
    join(output, ".pr-map-state.json"),
    JSON.stringify({ sourceRepository: repository }),
  );
  await writeFile(
    join(output, "pr-data.json"),
    JSON.stringify({
      headRefOid: head,
      mergeBaseOid: base,
      files: [{ path: "Worker.php", changeType: "MODIFIED" }],
      patches: { "Worker.php": patch },
    }),
  );
  await writeFile(join(output, "map.json"), JSON.stringify(map));
  await writeFile(
    join(repository, "Worker.php"),
    '<?php\nthrow new RuntimeException("Uncommitted change");\n',
  );
  return { output, map };
}

function build(output) {
  return execFileSync(process.execPath, [builder], {
    cwd: output,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function source(output, path) {
  const manifest = JSON.parse(
    await readFile(join(output, "code-data/manifest.json"), "utf8"),
  );
  return JSON.parse(
    await readFile(join(output, "code-data", manifest[path].file), "utf8"),
  );
}

function textFor(code, rows, side) {
  const column = side === "before" ? "old" : "new";
  return rows
    .filter((row) => row[column] !== null)
    .map((row) => code[side].lines[row[column] - 1].text)
    .join("\n");
}

test("method diffs preserve moved and deleted code from pinned revisions", async (t) => {
  const { output } = await fixture(t);
  build(output);
  const code = await source(output, "Worker.php");
  const run = scopedRows(code, ["run"], false);
  assert.match(textFor(code, run, "before"), /return \$amount \+ 2/);
  assert.match(textFor(code, run, "after"), /return \$this->calculate\(\)/);
  assert.doesNotMatch(
    textFor(code, run, "after"),
    /function calculate|return 99|Uncommitted/,
  );
  assert.equal(
    textFor(code, scopedRows(code, ["calculate"], false), "before"),
    "",
  );
  assert.equal(
    textFor(code, scopedRows(code, ["obsolete"], false), "after"),
    "",
  );
  assert.doesNotMatch(
    textFor(code, scopedRows(code, null, false), "after"),
    /use Example/,
  );
  assert.match(
    textFor(code, scopedRows(code, null, true), "after"),
    /use Example/,
  );
  const result = renderCode(code, {
    names: ["run"],
    mode: "result",
    showImports: false,
    expanded: false,
  });
  assert.match(result, /calculate/);
  assert.doesNotMatch(result, /return 99|class Worker|Uncommitted/);
  assert.match(
    renderCode(code, {
      names: ["run"],
      mode: "split",
      showImports: false,
      expanded: false,
    }),
    /split-row/,
  );
  const caller = await source(output, "Caller.php");
  assert.ok(caller.rows.every((row) => row.type === "context"));
});

test("a stale revision or missing mapped method stops the build", async (t) => {
  const { output, map } = await fixture(t);
  await writeFile(
    join(output, "map.json"),
    JSON.stringify({ ...map, headRefOid: "stale" }),
  );
  assert.throws(() => build(output), /Update map.json/);
  map.nodes[0].methods = ["missingMethod"];
  await writeFile(join(output, "map.json"), JSON.stringify(map));
  assert.throws(() => build(output), /Mapped method not found/);
});
