#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile


SOURCE_URL = "https://github.com/alexvanderbist/skills"
MANIFEST = ".amp-skills-source.json"
MIB = 1024 * 1024


def adapt(name, text):
    if name == "simplify":
        text = text.replace(
            "Use when asked to simplify or clean up code.",
            "Use only when explicitly asked to simplify or clean up code.",
        )
    if name in {"orchestrate", "review-pr", "simplify"}:
        description = re.search(r"^description: .+$", text, re.MULTILINE)
        if not description:
            raise ValueError(f"{name}: expected a single-line description")
        if "Use only when explicitly" not in description.group():
            text = text[:description.end()] + " Use only when explicitly requested." + text[description.end():]
    if name == "pr-map":
        original = "Give the user the local URL and the pinned commit."
        replacement = (
            "Give the user the URL and the pinned commit. In an Amp orb, run the viewer "
            "as a supervised service and share its Amp portal URL, not a loopback URL."
        )
        if text.count(original) != 1:
            raise ValueError("pr-map: portal adaptation no longer matches; review the source")
        text = text.replace(original, replacement)
    return text


def validate(root):
    skills = sorted(path for path in root.iterdir() if path.is_dir() and (path / "SKILL.md").is_file())
    if not 1 <= len(skills) <= 200:
        raise ValueError("Hosted repositories require between 1 and 200 skills")
    total = 0
    for skill in skills:
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", skill.name) or len(skill.name) > 64:
            raise ValueError(f"Invalid skill name: {skill.name}")
        text = (skill / "SKILL.md").read_text()
        frontmatter = re.match(r"\A---\n(.*?)\n---\n", text, re.DOTALL)
        if not frontmatter:
            raise ValueError(f"{skill.name}: missing YAML frontmatter")
        fields = frontmatter.group(1)
        if not re.search(rf"^name: {re.escape(skill.name)}$", fields, re.MULTILINE):
            raise ValueError(f"{skill.name}: directory and frontmatter names must match")
        description = re.search(r"^description: (.+)$", fields, re.MULTILINE)
        if not description or not 1 <= len(description.group(1)) <= 1024:
            raise ValueError(f"{skill.name}: invalid single-line description")
        files = [path for path in skill.rglob("*") if path.is_file()]
        if len(files) > 200:
            raise ValueError(f"{skill.name}: exceeds 200 files")
        size = 0
        for path in files:
            if path.is_symlink():
                raise ValueError(f"Hosted skills cannot contain symlinks: {path}")
            data = path.read_bytes()
            data.decode("utf-8")
            if b"\0" in data or len(data) > 10 * MIB:
                raise ValueError(f"{path}: binary file or exceeds 10 MiB")
            size += len(data)
        if size > 25 * MIB:
            raise ValueError(f"{skill.name}: exceeds 25 MiB")
        total += size
    return [skill.name for skill in skills], total


def export(repository, target):
    if repository == target or repository in target.parents or target in repository.parents:
        raise ValueError("Target must be outside the source repository")
    if not target.is_dir():
        raise ValueError("Target must be an existing export directory or hosted repository checkout")
    if (target / ".git").exists():
        dirty_target = subprocess.check_output(["git", "status", "--porcelain"], cwd=target, text=True)
        if dirty_target:
            raise ValueError("Target repository must have a clean working tree")
    revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=repository, text=True).strip()
    dirty = subprocess.check_output(["git", "status", "--porcelain", "--", "skills"], cwd=repository, text=True)
    if dirty:
        raise ValueError("Commit skill changes before exporting a revision-pinned publication")
    for path in (repository / "skills").rglob("*"):
        if path.is_symlink():
            raise ValueError(f"Hosted skills cannot contain symlinks: {path}")
    with tempfile.TemporaryDirectory() as directory:
        output = Path(directory)
        for skill in sorted((repository / "skills").iterdir()):
            if not skill.is_dir() or not (skill / "SKILL.md").is_file():
                raise ValueError(f"Expected a skill directory: {skill}")
            shutil.copytree(skill, output / skill.name)
            instructions = output / skill.name / "SKILL.md"
            instructions.write_text(adapt(skill.name, instructions.read_text()))
        names, _ = validate(output)
        manifest_path = target / MANIFEST
        previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {"source": SOURCE_URL, "skills": []}
        if previous["source"] != SOURCE_URL:
            raise ValueError("Target is managed by a different source repository")
        for name in previous["skills"]:
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name):
                raise ValueError("Invalid managed skill name in target manifest")
        manifest = {"source": SOURCE_URL, "revision": revision, "skills": names}
        (output / MANIFEST).write_text(json.dumps(manifest, indent=2) + "\n")
        (output / "README.md").write_text(
            f"# Personal skills\n\nPublished from {SOURCE_URL} at revision `{revision}`.\n\n"
            "Edit the GitHub source under `skills/`, not these generated copies. The publishing "
            "workflow applies manual-only descriptions and Amp orb portal guidance.\n"
        )
        managed = set(previous["skills"]) | set(names)
        with tempfile.TemporaryDirectory() as validation_directory:
            validation = Path(validation_directory)
            for path in target.iterdir():
                if path.name != ".git" and path.name not in managed and path.name not in {MANIFEST, "README.md"}:
                    if path.is_dir():
                        shutil.copytree(path, validation / path.name, symlinks=True)
                    else:
                        shutil.copy2(path, validation / path.name)
            for path in output.iterdir():
                if path.is_dir():
                    shutil.copytree(path, validation / path.name)
                else:
                    shutil.copy2(path, validation / path.name)
            _, size = validate(validation)
            total = sum(path.stat().st_size for path in validation.rglob("*") if path.is_file())
            if total > 25 * MIB:
                raise ValueError("Hosted repository exceeds 25 MiB")
        for name in managed:
            path = target / name
            if path.exists():
                shutil.rmtree(path)
        for path in output.iterdir():
            if path.is_dir():
                shutil.copytree(path, target / path.name)
            else:
                shutil.copy2(path, target / path.name)
        print(f"Exported {len(names)} skills ({size:,} skill bytes) from {revision}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export skills to Amp's hosted layout without committing or pushing.")
    parser.add_argument("target", type=Path)
    arguments = parser.parse_args()
    try:
        export(Path(__file__).resolve().parents[1], arguments.target.resolve())
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        parser.exit(1, f"Export failed: {error}\n")
