#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
from urllib.parse import urlparse


def run(*arguments, cwd=None):
    return subprocess.check_output(arguments, cwd=cwd, text=True)


def snapshot(repository, metadata):
    base = run("git", "-C", str(repository), "merge-base", metadata["baseRefOid"], metadata["headRefOid"]).strip()
    arguments = ["git", "-C", str(repository), "-c", "core.quotePath=false", "diff", "--no-ext-diff", "--no-textconv", "--no-renames", base, metadata["headRefOid"]]
    statuses = run(*arguments, "--name-status", "-z").rstrip("\0").split("\0")
    changes = dict(zip(statuses[1::2], statuses[0::2]))
    files = []
    patches = {}
    for entry in run(*arguments, "--numstat", "-z").split("\0"):
        if not entry:
            continue
        additions, deletions, path = entry.split("\t", 2)
        binary = additions == "-"
        files.append({
            "path": path,
            "additions": 0 if binary else int(additions),
            "deletions": 0 if binary else int(deletions),
            "binary": binary,
            "changeType": {"A": "ADDED", "D": "DELETED"}.get(changes[path], "MODIFIED"),
        })
        patches[path] = "" if binary else run(*arguments, "--", path)
    return {**metadata, "mergeBaseOid": base, "files": files, "patches": patches}


def write_json(path, value):
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2) + "\n")
    temporary.replace(path)


def prepare(url, repository, output):
    parsed = urlparse(url)
    match = re.match(r"^/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)/pull/([0-9]+)(?:/|$)", parsed.path)
    if parsed.scheme != "https" or parsed.netloc != "github.com" or not match:
        raise ValueError("Use a GitHub PR URL: https://github.com/owner/repository/pull/123")
    owner, name, number = match.groups()
    slug = f"{owner}/{name}"
    repository = Path(run("git", "-C", str(repository), "rev-parse", "--show-toplevel").strip()).resolve()
    output = output.resolve()
    if output == repository or repository in output.parents:
        raise ValueError("Choose an output directory outside the source repository.")
    state_path = output / ".pr-map-state.json"
    if output.exists() and any(output.iterdir()) and not state_path.exists():
        raise ValueError("Output is not an existing PR map or an empty directory.")
    if state_path.exists():
        state = json.loads(state_path.read_text())
        if state["repository"] != slug or state["number"] != int(number):
            raise ValueError("Output belongs to another PR. Choose a different directory.")
    metadata = json.loads(run("gh", "pr", "view", number, "--repo", slug, "--json", "number,title,headRefOid,baseRefOid,url"))
    metadata["repository"] = slug
    remote = subprocess.run(["git", "-C", str(repository), "remote", "get-url", "origin"], capture_output=True, text=True)
    fetch_url = f"git@github.com:{slug}.git" if remote.stdout.startswith("git@github.com:") else f"https://github.com/{slug}.git"
    for revision in [metadata["headRefOid"], metadata["baseRefOid"]]:
        if not re.fullmatch(r"[0-9a-f]{40,64}", revision):
            raise ValueError("GitHub returned an invalid commit ID.")
        exists = subprocess.run(["git", "-C", str(repository), "cat-file", "-e", revision], capture_output=True).returncode == 0
        if not exists:
            subprocess.run(["git", "-C", str(repository), "fetch", "--no-tags", fetch_url, revision], check=True)
    latest = snapshot(repository, metadata)
    previous = json.loads((output / "pr-data.json").read_text()) if (output / "pr-data.json").exists() else None
    if not state_path.exists():
        template = Path(__file__).resolve().parents[1] / "assets" / "viewer"
        shutil.copytree(template, output, dirs_exist_ok=True, ignore=shutil.ignore_patterns("node_modules", "__pycache__", "code-data", "dist"))
    write_json(output / "pr-data.json", latest)
    write_json(state_path, {"repository": slug, "number": int(number), "sourceRepository": str(repository)})
    if previous:
        changed = sorted(path for path in set(previous["patches"]) | set(latest["patches"]) if previous["patches"].get(path) != latest["patches"].get(path))
        print(f"Snapshot {previous['headRefOid'][:7]} -> {latest['headRefOid'][:7]}")
        print("Changed patches:\n" + "\n".join(changed))
    else:
        print(f"Snapshot {latest['headRefOid'][:7]}: {len(latest['files'])} changed files")
    print(f"Output: {output}")
    print("Create or update map.json for this commit, then run npm ci and npm run build:data in the output directory.")


def main():
    parser = argparse.ArgumentParser(description="Prepare or refresh a local GitHub PR map without changing the source checkout.")
    parser.add_argument("url")
    parser.add_argument("--repo", type=Path, required=True, help="Existing local checkout")
    parser.add_argument("--output", type=Path, required=True, help="Generated viewer directory outside the checkout")
    arguments = parser.parse_args()
    try:
        prepare(arguments.url, arguments.repo, arguments.output)
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f"PR map: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
