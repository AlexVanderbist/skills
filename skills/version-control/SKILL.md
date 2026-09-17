---
name: version-control
description: Apply personal Git conventions when writing commits, staging changes, creating or updating pull requests, and merging branches.
---

# Version Control

## Commits

- Use present tense.
- Good: `Update deps`, `Fix vat calculation in delivery costs`.
- Bad: `wip`, `commit`, `a lot`, `solid`.
- Prefer small, focused commits.
- Use `git add -p` to stage granular changes.

## Pull requests

- Keep descriptions short and natural. Write for other developers.
- Use subheadings only for very large PRs where they improve readability. Small PRs need only a short description.
- No em dashes, code snippets, or "what's next" sections.
- Use backticks for code and keywords.
- Link to files only when needed.
- Prefer updating the original PR description over commenting on your own PR.
- Attach screenshots with `gh pr create --attach <image>` or `gh pr edit <number> --attach <image>`. Do not commit screenshots for PR descriptions.

## Shared context

- Never reference local agents or AI chats in commit messages or PR descriptions.
- For public repositories, exclude internal links, customer information, production data, and real identifiers from GitHub content. Use fictitious examples.

## Merging

- Use squash merges when integrating feature branches: `git merge <branch> --squash`.
- Prefer rebasing onto the target branch over merging it into the working branch to resolve conflicts.

## Repository naming examples

- Site: `spatie.be`.
- Subdomain: `guidelines.spatie.be`.
- Package or other project: `laravel-backup`, `spoon`.
