import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHighlighter } from "shiki";
import { diffLines, applyPatch } from "diff";
import PhpParser from "php-parser";
import { parse as parseJavaScript } from "@babel/parser";

const state = JSON.parse(await readFile(".pr-map-state.json", "utf8"));
const repository = state.sourceRepository;
const data = JSON.parse(await readFile("pr-data.json", "utf8"));
const base = data.mergeBaseOid;
const map = JSON.parse(await readFile("map.json", "utf8"));
if (map.headRefOid !== data.headRefOid)
  throw new Error("Update map.json for the current PR commit before building.");
if (
  !Array.isArray(map.nodes) ||
  !Array.isArray(map.edges)
)
  throw new Error("Invalid map collections.");
if (map.direction && !["LR", "TB"].includes(map.direction))
  throw new Error("Map direction must be LR or TB.");
const nodeIds = new Set();
for (const node of map.nodes) {
  if (
    typeof node.id !== "string" ||
    !node.id ||
    nodeIds.has(node.id)
  )
    throw new Error("Map nodes need unique string IDs.");
  nodeIds.add(node.id);
  if (
    !node.title ||
    !node.kind ||
    !node.summary ||
    !Array.isArray(node.methods)
  )
    throw new Error(`Incomplete map node: ${node.id}`);
}
for (const edge of map.edges) {
  if (
    !nodeIds.has(edge.from) ||
    !nodeIds.has(edge.to)
  )
    throw new Error("Invalid map edge.");
}
const highlighter = await createHighlighter({
  themes: ["github-light"],
  langs: [
    "php",
    "blade",
    "javascript",
    "typescript",
    "tsx",
    "html",
    "css",
    "json",
    "lua",
    "markdown",
    "yaml",
  ],
});
const phpParser = new PhpParser({
  parser: { phpVersion: "8.4" },
  ast: { withPositions: true },
});
const escapeHtml = (value) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const extensions = {
  php: "php",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "tsx",
  ts: "typescript",
  tsx: "tsx",
  html: "html",
  css: "css",
  json: "json",
  lua: "lua",
  md: "markdown",
  yml: "yaml",
  yaml: "yaml",
};

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((child) => walk(child, visit));
    return;
  }
  visit(value);
  for (const [key, child] of Object.entries(value)) {
    if (
      ![
        "loc",
        "comments",
        "leadingComments",
        "trailingComments",
        "tokens",
        "extra",
      ].includes(key)
    )
      walk(child, visit);
  }
}

function structure(source, language, path) {
  const symbols = [];
  const imports = [];
  if (!source) return { symbols, imports };
  if (language === "php") {
    const ast = phpParser.parseCode(source, path);
    walk(ast, (node) => {
      if (["method", "function"].includes(node.kind) && node.name) {
        symbols.push({
          name: node.name.name || node.name,
          start: node.loc.start.line,
          end: node.loc.end.line,
        });
      }
      if (node.kind === "usegroup")
        imports.push([node.loc.start.line, node.loc.end.line]);
    });
  }
  if (["javascript", "typescript", "tsx"].includes(language)) {
    const ast = parseJavaScript(source, {
      sourceType: "unambiguous",
      plugins: ["typescript", "jsx"],
    });
    walk(ast, (node) => {
      if (node.type === "ImportDeclaration")
        imports.push([node.loc.start.line, node.loc.end.line]);
      if (node.type === "FunctionDeclaration" && node.id)
        symbols.push({
          name: node.id.name,
          start: node.loc.start.line,
          end: node.loc.end.line,
        });
      if (
        node.type === "VariableDeclarator" &&
        ["ArrowFunctionExpression", "FunctionExpression"].includes(
          node.init?.type,
        ) &&
        node.id?.name
      )
        symbols.push({
          name: node.id.name,
          start: node.loc.start.line,
          end: node.loc.end.line,
        });
    });
  }
  if (language === "css") {
    for (const match of source.matchAll(/^\s*@import\s[^;]+;/gm)) {
      const start = source.slice(0, match.index).split("\n").length;
      imports.push([start, start + match[0].split("\n").length - 1]);
    }
  }
  return { symbols, imports };
}

function version(source, language, path) {
  if (!source) return { lines: [], symbols: [], imports: [] };
  const plainLines = source.split("\n");
  if (source.endsWith("\n")) plainLines.pop();
  const { tokens } = highlighter.codeToTokens(source, {
    lang: language,
    theme: "github-light",
  });
  const lines = plainLines.map((text, index) => ({
    text,
    html: tokens[index]
      .map(
        (token) =>
          `<span style="color:${token.color}">${escapeHtml(token.content)}</span>`,
      )
      .join(""),
  }));
  let parsed = { symbols: [], imports: [] };
  try {
    parsed = structure(source, language, path);
  } catch (error) {
    console.warn(
      `Cannot extract methods from ${path}: ${error.message}. Use explicit ranges or a file-level node.`,
    );
  }
  const duplicates = new Set(
    parsed.symbols
      .filter(
        (symbol, index, symbols) =>
          symbols.findIndex((candidate) => candidate.name === symbol.name) !==
          index,
      )
      .map((symbol) => symbol.name),
  );
  if (duplicates.size)
    console.warn(
      `Ambiguous methods in ${path}: ${[...duplicates].join(", ")}. Use named explicit ranges for these methods.`,
    );
  parsed.symbols = parsed.symbols.filter(
    (symbol) => !duplicates.has(symbol.name),
  );
  return { lines, ...parsed };
}

function rows(before, after, oldStart = 1, newStart = 1) {
  let oldLine = oldStart,
    newLine = newStart;
  const result = [];
  for (const change of diffLines(before, after)) {
    for (let index = 0; index < change.count; index++) {
      result.push({
        type: change.added ? "add" : change.removed ? "remove" : "context",
        old: change.added ? null : oldLine++,
        new: change.removed ? null : newLine++,
      });
    }
  }
  return result;
}

function readSource(revision, path) {
  try {
    return execFileSync(
      "git",
      ["-C", repository, "show", `${revision}:${path}`],
      {
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch (error) {
    try {
      execFileSync(
        "git",
        ["-C", repository, "cat-file", "-e", `${revision}:${path}`],
        { stdio: "ignore" },
      );
    } catch {
      return null;
    }
    throw error;
  }
}

function explicitSymbols(content) {
  for (const symbol of map.symbols?.[content.path] || []) {
    if (!symbol.name)
      throw new Error(`An explicit range needs a name: ${content.path}`);
    for (const side of ["before", "after"]) {
      const range = symbol[side];
      content[side].symbols = content[side].symbols.filter(
        (existing) => existing.name !== symbol.name,
      );
      if (range === null) continue;
      if (
        !Array.isArray(range) ||
        range.length !== 2 ||
        !range.every(Number.isInteger) ||
        range[0] < 1 ||
        range[1] < range[0] ||
        range[1] > content[side].lines.length
      )
        throw new Error(
          `Invalid ${side} range for ${content.path}: ${symbol.name}`,
        );
      content[side].symbols.push({
        name: symbol.name,
        start: range[0],
        end: range[1],
      });
    }
  }
}

await mkdir("code-data", { recursive: true });
const manifest = {};
const files = [...data.files];
for (const node of map.nodes) {
  if (node.file && !files.some((file) => file.path === node.file))
    files.push({ path: node.file, changeType: "CONTEXT" });
}
for (const [index, file] of files.entries()) {
  if (file.binary) {
    manifest[file.path] = {
      unavailable: "Binary file. Open the source link to inspect it.",
      symbols: [],
    };
    continue;
  }
  const previous = readSource(base, file.path);
  const next = readSource(data.headRefOid, file.path);
  if (previous === null && next === null)
    throw new Error(
      `Source file does not exist at either revision: ${file.path}`,
    );
  const before = previous ?? "";
  const after = next ?? "";
  if (
    data.patches[file.path] &&
    applyPatch(before, data.patches[file.path]) !== after
  )
    throw new Error(`PR patch does not match the pinned source: ${file.path}`);
  const language = file.path.endsWith(".blade.php")
    ? "blade"
    : extensions[file.path.split(".").pop()] || "text";
  const content = {
    path: file.path,
    language,
    before: version(before, language, file.path),
    after: version(after, language, file.path),
    rows: rows(before, after),
  };
  explicitSymbols(content);
  content.methodRows = {};
  for (const name of new Set(
    [...content.before.symbols, ...content.after.symbols].map(
      (symbol) => symbol.name,
    ),
  )) {
    const previousSymbol = content.before.symbols.find(
      (symbol) => symbol.name === name,
    );
    const nextSymbol = content.after.symbols.find(
      (symbol) => symbol.name === name,
    );
    const methodSource = (source, symbol) =>
      symbol
        ? source.lines
            .slice(symbol.start - 1, symbol.end)
            .map((line) => line.text)
            .join("\n") + "\n"
        : "";
    content.methodRows[name] = rows(
      methodSource(content.before, previousSymbol),
      methodSource(content.after, nextSymbol),
      previousSymbol?.start || 1,
      nextSymbol?.start || 1,
    );
  }
  const filename = `${data.headRefOid.slice(0, 12)}-${index}.json`;
  await writeFile(`code-data/${filename}`, JSON.stringify(content));
  manifest[file.path] = {
    file: filename,
    language,
    symbols: [
      ...new Set(
        [...content.after.symbols, ...content.before.symbols].map(
          (symbol) => symbol.name,
        ),
      ),
    ],
  };
}
for (const node of map.nodes) {
  if (node.methods.length && !node.file)
    throw new Error(`Methods need a source file: ${node.id}`);
  for (const method of node.methods) {
    if (!manifest[node.file]?.symbols.includes(method))
      throw new Error(`Mapped method not found: ${node.file} -> ${method}`);
  }
}
await writeFile("code-data/manifest.json", JSON.stringify(manifest));
console.log(
  `Built ${files.length} source files and ${map.nodes.length} nodes at ${data.headRefOid.slice(0, 7)}.`,
);
highlighter.dispose();
