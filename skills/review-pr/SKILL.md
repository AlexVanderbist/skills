---
name: review-pr
description: Review a pull request, branch, or local diff by running parallel correctness and project-convention reviewers, then verifying and consolidating their findings.
---

# Review PR

Coordinate a thorough review of the requested changes. Report findings without editing code, committing, or posting to GitHub unless the user explicitly requests those actions.

## Establish one review scope

- Use the PR, branch, commit range, or files specified by the user. Read the PR description and linked requirements when available; a specification is useful context, not a prerequisite.
- For a PR, establish its actual base and head. For branch work, compare the head against the merge-base with the target branch. Do not assume the tracking branch is the target.
- For local work, inspect tracked changes against `HEAD` and relevant untracked files. Do not discard or modify existing work to prepare a review.
- Record the base and head revisions, or capture the local diff, so all reviewers assess the same changes. If the work changes during review, reconcile the affected findings before reporting.
- Read applicable project instructions and identify the relevant personal skills. Resolve their actual paths rather than assuming every skill is globally installed.
- Ask for the target only when it cannot be established from the request or repository context.

## Coordinate checks once

Use existing results for the reviewed revision when available. Otherwise run configured formatting checks, linting, and static analysis in non-mutating modes where practical. Launch independent checks alongside the reviewers; share their results before consolidation.

The coordinator owns these checks. Tell reviewers not to repeat them or run auto-fix commands, even when a loaded skill normally does so. If no non-mutating check is available, report the limitation and continue reviewing.

Do not automatically run the test suite. The testing reviewer assesses test quality and coverage. Run tests only when the user requests them or applicable project instructions require them; reuse existing results and state their scope accurately.

## Spawn parallel reviewers

Use the host's actual subagent tools to launch independent reviewers concurrently. This is the default workflow: do not merely describe parallel reviews or perform each pass sequentially when subagents are available.

For ordinary changes, launch a correctness reviewer and the relevant specialist reviewers together. For a small change, combine overlapping specialist scopes into one agent. For a large change, split independent areas into additional bounded reviews. Skip irrelevant specialties.

Respect the host's concurrency limit. Start the most useful reviewers first and schedule the remaining work as slots become available. While they run, inspect cross-cutting contracts and gather context needed to verify findings.

The coordinator owns delegation. Ask reviewers to return findings directly and avoid spawning further reviewers unless explicitly assigned to do so. If the built-in review already delegates internally, account for that and avoid launching a duplicate general review.

If subagent tools are genuinely unavailable or fail, perform the remaining passes yourself and disclose that limitation. Do not silently substitute a serial review for available parallel execution.

### Correctness reviewer

Use the host's built-in code-review capability when it is actually callable and can review the established scope without edits or publication. Inspect the available tools or command help before invoking it. A slash command is not automatically a skill or callable from a subagent; do not invent an invocation or assume an installed skill named `code-review` is the built-in reviewer.

Run that capability alongside the specialist agents. If it is unavailable or cannot target the same changes, spawn a general correctness reviewer instead and state the fallback.

Review concrete regressions, incorrect behavior, authorization and data isolation, data integrity, compatibility, failure handling, and meaningful performance risks. Trace affected callers and contracts rather than reviewing the diff in isolation. Evaluate the intended change against available requirements.

### Specialist reviewers

Load the applicable skill's actual instructions and use them as review criteria:

| Reviewer | Scope |
| --- | --- |
| Laravel/PHP conventions | Use `laravel-php` for PHP and Blade changes. |
| Laravel architecture | Use `laravel-architecture` for domain responsibilities, entry points, and external integrations. Combine with PHP conventions for small changes. |
| Frontend | Use `frontend` for component reuse, boundaries, state, contracts, and interaction behavior. Follow the repository's own frontend conventions first. |
| Testing | Use `testing` to inspect existing coverage for the affected feature or domain, including when the diff adds no tests. Respect cases where automated tests are unnecessary. |

Apply additional project-specific guidance when relevant. If a named skill is unavailable, report the gap and use available project guidance without pretending to have loaded it.

Do not invoke the automatic cleanup workflow from `simplify` as part of a review. Do not add reviewers solely to repeat formatting or lint rules.

### Brief every reviewer

Provide each agent with:

- The exact review scope and a shared diff or a reliable way to obtain it, including relevant untracked files.
- The task or PR intent, known constraints, and any user focus.
- Applicable project instructions, assigned skill paths, and check results available so far.
- A bounded responsibility and permission to inspect surrounding code, callers, contracts, and tests as needed.
- An explicit instruction to remain read-only, avoid posting comments, and leave checks and delegation to the coordinator.

Request findings with a file and precise line, the problematic behavior or violated convention, a concrete trigger or example, the impact, and a suggested direction. Require evidence from the code or documented project rules.

Returning no findings is valid. Do not invent concerns to meet a quota. Avoid speculative scenarios, personal style preferences, and pre-existing issues unrelated to the change.

## Verify and consolidate

- Wait for all assigned reviewers, or clearly report any that could not complete.
- Read the cited code yourself. Validate the trigger, relevant callers, existing safeguards, and whether the change actually introduces or exposes the issue.
- Merge reports about the same underlying problem. Keep the strongest evidence and one actionable finding.
- Resolve conflicting recommendations against project instructions, intended behavior, and actual contracts. Seek focused follow-up evidence when needed.
- Exclude mechanical tooling failures from skill findings; summarize them separately with check results.
- Distinguish correctness defects from documented convention violations and optional design suggestions. Do not present an architectural preference as a proven bug.
- If a useful proposal would change behavior or a public contract, label that consequence explicitly. Do not implement it as part of the review.

## Report

Lead with verified findings, ordered by impact. Each finding should identify the file and line, explain the problem and when it occurs, and suggest a concise next step.

Keep the output proportionate to the change. Include convention or design suggestions only when concrete and useful, clearly separated from defects. Do not repeat each reviewer's report or list rules that the code already follows.

Finish with a short account of the reviewed scope, checks actually run, and material gaps, including unavailable built-in review, skipped tests, or incomplete reviewers. If no actionable findings remain, say so without claiming the change is proven correct.
