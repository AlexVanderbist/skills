# Skills

Personal skills for Codex and Claude Code.

These skills assume configured CI tooling for code style, static analysis, and architecture checks. Tooling enforces mechanically checkable rules; skills guide decisions that need context and judgment. Existing project instructions take precedence over shared defaults.

## Available skills

| Skill | What it does | When to invoke |
| --- | --- | --- |
| [composer-local-package](skills/composer-local-package/README.md) | Switch Composer packages between Packagist and local copies. | When working with a local package checkout. |
| [frontend](skills/frontend/SKILL.md) | Guide component reuse, readable frontend code, and structure. | Automatically when planning, changing, or reviewing frontend code. |
| [laravel-architecture](skills/laravel-architecture/SKILL.md) | Organize entry points, domain responsibilities, and external integrations. | Automatically for Laravel work, alongside `laravel-php`. |
| [laravel-php](skills/laravel-php/SKILL.md) | Apply Laravel and PHP conventions during implementation and review. | Automatically for Laravel, PHP, and Blade work. |
| [review-pr](skills/review-pr/SKILL.md) | Run parallel correctness and specialist reviews, then verify and consolidate findings without editing code. Uses Codex's built-in review when available, with a general reviewer as fallback. | Manual only: `$review-pr` in Codex or `/review-pr` in Claude Code. |
| [simplify](skills/simplify/SKILL.md) | Review code from four perspectives and apply cleanup that preserves behavior. Replaces Claude Code's bundled `/simplify` when installed as a personal or project skill. | Manual only: `$simplify` in Codex or `/simplify` in Claude Code. |
| [testing](skills/testing/SKILL.md) | Favor meaningful feature coverage, readable setup, and minimal mocking for backend and frontend tests. | Automatically when writing or reviewing tests. |
| [version-control](skills/version-control/SKILL.md) | Apply commit, PR description, screenshot, and merge conventions. | Automatically before commits and PR creation or updates, and when merging. |

Automatic selection requires the skills to be installed and available to the host; it is not a file hook. `review-pr` and `simplify` have manual-only policies for both Codex and Claude Code.

## Install

```bash
npx skills add AlexVanderbist/skills -g -a codex claude-code
```

Remove or disable overlapping skills, such as the original Spatie guideline skills, before using these replacements. Loading both can introduce conflicting or duplicate instructions.

### Optional: load guidance before planning

After installing the skills, add this snippet to your global `~/.codex/AGENTS.md` and `~/.claude/CLAUDE.md`. If those files share a symlink target, edit it only once. This makes the timing explicit rather than relying only on automatic skill selection. Project instruction files can record project-specific exceptions.

```markdown
## Before implementation

- Before planning or changing Laravel code, read and apply both `laravel-php` and `laravel-architecture`.
- Before planning or changing frontend code, read and apply `frontend`.
- Apply `testing` when writing or reviewing tests.
- Apply `version-control` before committing or creating/updating a PR.
- Invoke `review-pr` and `simplify` only when explicitly requested.
```

## Sources

These references informed the skills. Personal preferences override upstream guidance. Links to `main` can change; versioned links identify the source used.

### Upstream skills and guidelines

| Local skill | References |
| --- | --- |
| `composer-local-package` | Existing skill in this repository; [Composer Link](https://github.com/sandersander/composer-link) is its preferred linking tool. |
| `frontend` | Primary fallback: Sebastian De Deyne's [frontend structure article](https://spatie.be/blog/how-to-structure-the-frontend-of-a-laravel-inertia-react-application). |
| `version-control` | [Spatie version-control skill](https://github.com/spatie/guidelines-skills/blob/main/resources/boost/skills/spatie-version-control/SKILL.md), [Spatie version-control guidelines](https://spatie.be/guidelines/version-control). |
| `laravel-php` | [Spatie Laravel/PHP skill](https://github.com/spatie/guidelines-skills/blob/main/resources/boost/skills/spatie-laravel-php/SKILL.md), [its detailed reference](https://github.com/spatie/guidelines-skills/blob/main/resources/boost/skills/spatie-laravel-php/references/spatie-laravel-php-guidelines.md), [Spatie guidelines](https://spatie.be/guidelines). |
| `laravel-architecture` | Personal architecture preferences. |
| `review-pr` | Personal review preferences; the `laravel-php`, `laravel-architecture`, `frontend`, and `testing` skills; code-review references below. |
| `testing` | Personal testing preferences; Pest documentation for [architecture tests](https://pestphp.com/docs/arch-testing), [parallel execution](https://pestphp.com/docs/optimizing-tests), and [Test Impact Analysis](https://pestphp.com/docs/tia). |
| `simplify` | Claude Code's bundled `/simplify` from [version 2.1.274](https://www.npmjs.com/package/@anthropic-ai/claude-code/v/2.1.274), combined with Anthropic's [code-simplifier prompt at the source revision](https://github.com/anthropics/claude-plugins-official/blob/ceb9b72b4c4c20ad39efce780edd0aabe80ebce3/plugins/code-simplifier/agents/code-simplifier.md). |

The previous local `simplify` was a Codex adaptation of Claude Code [2.1.63](https://www.npmjs.com/package/@anthropic-ai/claude-code/v/2.1.63). The newer bundled prompt was extracted from the published native package, not a standalone GitHub Markdown file.

For future comparisons, see the [current code-simplifier prompt](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md), its [license](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/LICENSE), and the [Claude Code changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).

### Code-review references

These informed the PR review workflow. The external reviewers are not installed or copied by this repository.

- [Matt Pocock's code-review skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md): separate standards and specification reviews.
- [Codex built-in review rubric](https://github.com/openai/codex/blob/main/codex-rs/prompts/templates/review/rubric.md): evidence requirements, severity, and finding format.
- [Codex repository review orchestrator](https://github.com/openai/codex/blob/main/.codex/skills/code-review/SKILL.md) and supporting skills: [breaking changes](https://github.com/openai/codex/blob/main/.codex/skills/code-review-breaking-changes/SKILL.md), [change size](https://github.com/openai/codex/blob/main/.codex/skills/code-review-change-size/SKILL.md), [testing](https://github.com/openai/codex/blob/main/.codex/skills/code-review-testing/SKILL.md), and [model context](https://github.com/openai/codex/blob/main/.codex/skills/code-review-context/SKILL.md).
- [Codex command documentation](https://learn.chatgpt.com/docs/developer-commands#codex-review) and [review prompting](https://learn.chatgpt.com/docs/prompting): built-in review invocation.
- [Claude Code review documentation](https://code.claude.com/docs/en/code-review#review-a-diff-locally) and [command reference](https://code.claude.com/docs/en/commands): `/review`, `/code-review`, and their options.
- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) and [skills](https://code.claude.com/docs/en/skills): skill invocation and review orchestration.
- [Anthropic's PR review toolkit simplifier](https://github.com/anthropics/claude-code/blob/main/plugins/pr-review-toolkit/agents/code-simplifier.md): another public simplifier reference.
