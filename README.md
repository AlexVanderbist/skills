# Skills

Personal skills for Codex and Claude Code.

## Available skills

- [composer-local-package](skills/composer-local-package/README.md): Switch Composer packages between Packagist and local copies.
- [frontend](skills/frontend/SKILL.md): Build and review frontend code with reusable UI components and clear structure.
- [laravel-architecture](skills/laravel-architecture/SKILL.md): Organize Laravel entry points, business domains, and external integrations.
- [laravel-php](skills/laravel-php/SKILL.md): Personal Laravel and PHP conventions for implementation and review.
- [review-pr](skills/review-pr/SKILL.md): Coordinate parallel correctness and specialist reviews, then verify and consolidate findings.
- [simplify](skills/simplify/SKILL.md): Review code with four reviewers and apply cleanup without changing behavior.
- [testing](skills/testing/SKILL.md): Write and review feature-focused tests with readable setup and minimal mocking.
- [version-control](skills/version-control/SKILL.md): Personal conventions for commits, pull requests, and merging branches.

## Install

```bash
npx skills add AlexVanderbist/skills -g -a codex claude-code
```

## Workflow

Coding conventions apply during implementation and review. Existing project instructions take precedence over the shared defaults.

These skills assume the project has appropriate tooling and CI automation for code style, static analysis, and architecture checks. Anything that can be checked or validated reliably by tooling belongs in that tooling and CI configuration, not in an AI skill. Skills should not enforce code style; they guide decisions that require context and judgment. They may run configured checks and report their results, but they do not replace automated enforcement.

| Work | Skills | Invocation |
| --- | --- | --- |
| Frontend code | `frontend` | Automatic |
| Laravel code | `laravel-php` and `laravel-architecture` together | Automatic |
| Other PHP code | `laravel-php`, using the relevant PHP guidance | Automatic |
| Writing or reviewing tests | `testing`, for backend and frontend behavior | Automatic |
| Commits and PR creation or updates | `version-control` | Automatic |
| Code cleanup | `simplify` | Manual only |
| PR, branch, or local-diff review | `review-pr` | Manual only |

Automatic selection depends on the skills being installed, available to the host, and matched to the task. These are skill-selection rules, not file hooks.

A typical workflow is:

1. Build or change a feature. The relevant coding and testing skills guide the work without requiring a separate command.
2. Optionally invoke `simplify`. It runs four review perspectives in parallel where available and applies worthwhile changes that preserve behavior.
3. Invoke `review-pr` when ready for review. It runs the available built-in correctness review, or a fallback reviewer, alongside relevant specialist subagents. It verifies and consolidates findings without changing code or posting to GitHub. Test execution remains separate unless requested or required by project instructions.
4. Address findings, then request a commit or PR. The version-control conventions apply automatically. For UI changes, create the PR first, then offer optional screenshots unless already requested.

Use `$simplify` and `$review-pr` in Codex, or `/simplify` and `/review-pr` in Claude Code. Both skills are configured for manual invocation in both hosts. Automatic coding guidance does not itself start either workflow or authorize a commit, push, or PR.

## Sources

These references informed the skills. Personal preferences override upstream guidance. Links to `main` can change; versioned links identify the source used.

### Upstream skills and guidelines

| Local skill | References |
| --- | --- |
| `composer-local-package` | Existing skill in this repository; [Composer Link](https://github.com/sandersander/composer-link) is its preferred linking tool. |
| `frontend` | Primary fallback: Sebastian De Deyne's [frontend structure article](https://spatie.be/blog/how-to-structure-the-frontend-of-a-laravel-inertia-react-application). Personal project references below supply additional conventions. |
| `version-control` | [Spatie version-control skill](https://github.com/spatie/guidelines-skills/blob/main/resources/boost/skills/spatie-version-control/SKILL.md), [Spatie version-control guidelines](https://spatie.be/guidelines/version-control). |
| `laravel-php` | [Spatie Laravel/PHP skill](https://github.com/spatie/guidelines-skills/blob/main/resources/boost/skills/spatie-laravel-php/SKILL.md), [its detailed reference](https://github.com/spatie/guidelines-skills/blob/main/resources/boost/skills/spatie-laravel-php/references/spatie-laravel-php-guidelines.md), [Spatie guidelines](https://spatie.be/guidelines). |
| `laravel-architecture` | Personal project conventions and review notes listed below. |
| `review-pr` | Personal review preferences; the `laravel-php`, `laravel-architecture`, `frontend`, and `testing` skills; code-review references below. |
| `testing` | Personal project instructions and Monizze review notes listed below; Pest documentation for [architecture tests](https://pestphp.com/docs/arch-testing), [parallel execution](https://pestphp.com/docs/optimizing-tests), and [Test Impact Analysis](https://pestphp.com/docs/tia). |
| `simplify` | Claude Code's bundled `/simplify` from [version 2.1.274](https://www.npmjs.com/package/@anthropic-ai/claude-code/v/2.1.274), combined with Anthropic's [code-simplifier prompt at the source revision](https://github.com/anthropics/claude-plugins-official/blob/ceb9b72b4c4c20ad39efce780edd0aabe80ebce3/plugins/code-simplifier/agents/code-simplifier.md). |

The previous local `simplify` was a Codex adaptation of Claude Code [2.1.63](https://www.npmjs.com/package/@anthropic-ai/claude-code/v/2.1.63). The newer bundled prompt was extracted from the published native package, not a standalone GitHub Markdown file.

For future comparisons, see the [current code-simplifier prompt](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md), its [license](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/LICENSE), and the [Claude Code changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).

### Personal project instructions

These are local references under `~/Projects`, unless another path is shown. Their contents are not copied into this repository.

| File | Relevant guidance |
| --- | --- |
| `~/.claude/CLAUDE.md` | PR descriptions, screenshot attachments, tests, comments, and reuse. |
| `~/.codex/AGENTS.md` | Global preferences supplied with repository work. |
| `flareapp.io/CLAUDE.md` | PHP conventions, method extraction, exceptions, entry points, and domain responsibilities. |
| `flareapp.io/.claude/FRONTEND.md` | Shared components, data helpers, and intentional integration exceptions. |
| `flareapp.io/docs/frontend-structure.md` | Component boundaries, convenient shared APIs, and reasons to keep different forms separate. |
| `crew-backoffice/CLAUDE.md` | Laravel Data, actions, visibility, and migrations. |
| `cas-frontend/CLAUDE.md` | Shared UI components, endpoint factories, and `useData`. |
| `cas-frontend/README.md` | Feature organization, component reuse, and direct imports. |
| `cas-frontend/docs/i18n.md` | Translation context, complete messages, and language changes. |
| `cas-frontend/docs/zebra-browser-print.md` | Inspected for frontend integration guidance; device-specific rules remain local. |
| `cas-fallback/CLAUDE.md` | Inspected for additional conventions; no specific rule adopted. |
| `gj-2020-backoffice/CLAUDE.md` and `AGENTS.md` | Domain organization, protected properties, and migrations. |
| `laravel-mailcoach/CLAUDE.md` | Public-repository content, extensibility, and API specifications. |
| `mailcoach-app/CLAUDE.md` | Existing conventions, documentation versions, and framework usage. |
| `Pluck/CLAUDE.md` | Update original PR descriptions and keep their formatting simple. |

Only the following Monizze review notes informed the PHP, architecture, and testing skills. Monizze source files and team-authored conventions are not sources for these skills.

- `~/Projects/monizze/review/code-writing-and-style.md`
- `~/Projects/monizze/review/standards-and-enforcement.md`
- `~/Projects/monizze/review/repository-structure-and-patterns.md`
- `~/Projects/monizze/review/card-service.md`
- `~/Projects/monizze/review/alix-backend.md`
- `~/Projects/monizze/review/architecture-across-applications.md`

These notes contain alternatives and discussion points. They are not adopted wholesale as rules.

### Code-review references

These informed the PR review workflow. The external reviewers are not installed or copied by this repository.

- [Matt Pocock's code-review skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md): separate standards and specification reviews.
- [Codex built-in review rubric](https://github.com/openai/codex/blob/main/codex-rs/prompts/templates/review/rubric.md): evidence requirements, severity, and finding format.
- [Codex repository review orchestrator](https://github.com/openai/codex/blob/main/.codex/skills/code-review/SKILL.md) and supporting skills: [breaking changes](https://github.com/openai/codex/blob/main/.codex/skills/code-review-breaking-changes/SKILL.md), [change size](https://github.com/openai/codex/blob/main/.codex/skills/code-review-change-size/SKILL.md), [testing](https://github.com/openai/codex/blob/main/.codex/skills/code-review-testing/SKILL.md), and [model context](https://github.com/openai/codex/blob/main/.codex/skills/code-review-context/SKILL.md).
- [Codex command documentation](https://learn.chatgpt.com/docs/developer-commands#codex-review) and [review prompting](https://learn.chatgpt.com/docs/prompting): built-in review invocation.
- [Claude Code review documentation](https://code.claude.com/docs/en/code-review#review-a-diff-locally) and [command reference](https://code.claude.com/docs/en/commands): `/review`, `/code-review`, and their options.
- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) and [skills](https://code.claude.com/docs/en/skills): skill invocation and review orchestration.
- [Anthropic's PR review toolkit simplifier](https://github.com/anthropics/claude-code/blob/main/plugins/pr-review-toolkit/agents/code-simplifier.md): another public simplifier reference.

### Authoring tools

Local skills used to create, validate, or document this collection:

- `~/.codex/skills/.system/skill-creator/SKILL.md`
- `~/.codex/skills/.system/openai-docs/SKILL.md`
- `~/.agents/skills/simple-english/SKILL.md`
