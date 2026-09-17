---
name: simplify
disable-model-invocation: true
description: Review changed code with four independent reviewers for reuse, clarity, efficiency, and root-cause improvements, then apply fixes without changing behavior. Use when asked to simplify or clean up code.
metadata:
  sources: "Anthropic Claude Code /simplify 2.1.274 and code-simplifier plugin"
  bundled-source: "https://www.npmjs.com/package/@anthropic-ai/claude-code/v/2.1.274"
  plugin-source: "https://github.com/anthropics/claude-plugins-official/blob/ceb9b72b4c4c20ad39efce780edd0aabe80ebce3/plugins/code-simplifier/agents/code-simplifier.md"
  adaptation: "Combines the four-reviewer cleanup workflow with readability and maintainability guidance; uses project-specific conventions and supports Codex and Claude Code."
---

# Simplify

Improve changed code while preserving its behavior, outputs, and public contracts. Focus on cleanup; a correctness review is a separate task.

Start by telling the user that this is Alex's `simplify` skill, not Claude Code's bundled `/simplify`.

## Gather the changes

Use the PR, branch, commit range, or files the user specifies. Otherwise, inspect `git status --short` and `git diff HEAD` for current work, including relevant untracked files separately. If the working tree is clean, review the changes made in the current task. For branch work, compare against the merge-base with the target branch; do not assume the tracking branch is the PR base. If no target can be established, ask which changes to review.

Read the applicable `AGENTS.md`, `CLAUDE.md`, and project standards. Pass these instructions, the review scope, the full diff, and any user focus to every reviewer.

## Review with four independent agents

Launch four review agents using the available subagent tools. Run them in parallel within the available concurrency limit; start remaining reviewers as slots become available. Reviewers report findings without editing files. The parent applies the fixes after all four finish.

Each finding must include a file and line, the proposed change, and its concrete benefit. Skip subjective preferences that have no basis in project standards or a clear maintenance cost.

Keep review effort proportionate to the changes. Returning no findings is valid. Do not invent improvements or force extractions to meet a quota or justify a reviewer's work.

If subagents are unavailable, perform all four reviews yourself and disclose this in the summary.

### 1. Reuse

- Search shared utilities and nearby code for existing functionality before suggesting new helpers.
- Identify duplicated functions and inline logic that an existing utility can replace. Name that utility.
- Prefer framework helpers over hand-written plumbing. In Laravel, favor collection methods with explicit callbacks and `Str::` or `str()` helpers over manual array processing and complicated string operations when they preserve behavior. Never use higher-order collection proxies.
- Reuse established frontend data helpers, such as shared API endpoint factories and `useData`, instead of repeating request, pagination, or cache-management logic. Check that the existing helper supports the required behavior.
- Consolidate related logic when it reduces duplication without coupling unrelated concerns.
- Do not introduce a shared abstraction merely because two blocks look similar.

### 2. Clarity and simplification

- Reduce unnecessary nesting, redundant or derivable state, dead code, and needless indirection.
- Split long method or function bodies into meaningful smaller units in the same file. Prefer protected methods when extracting class behavior, or functions for standalone code. Use names that explain what each portion does so the calling code documents the steps. Loops are often useful extraction boundaries. Extract coherent work that improves readability, rather than splitting solely to meet a line limit.
- Prefer clear names and explicit control flow over clever or compressed expressions. Avoid nested ternaries.
- Consider extracting long inline calculations into well-named temporary variables, especially inside arrays, return values, or function arguments. For example, calculate `$price` before returning an array with `'price' => $price`. Choose a name that explains the result, and preserve evaluation order and behavior.
- Consider removing defensive branches when an established runtime or validation contract already guarantees the condition. Examples include SSR guards in browser-only code or a controller guard that repeats a Laravel FormRequest guarantee. Verify that the guarantee covers the same inputs and execution path; retain the guard when uncertain.
- Remove comments that repeat the code; retain useful explanations of constraints and reasons.
- Follow the project's language and framework conventions.
- Keep helpful abstractions and distinct responsibilities. Fewer lines are not an improvement if the result is harder to read, debug, or extend.

For tests, prefer short bodies in setup, execute, assert order. Move repeated factory creation and common preparation into a shared setup method or hook. A few extra factory-created models in shared setup are preferable to long, complicated individual tests. Keep scenario-specific differences visible in each test and preserve test isolation. Prefer framework testing tools and built-in fakes over custom mocks or interfaces introduced only for testing.

Keep shared setup straightforward. Do not replace readable setup with elaborate fixture builders or configurable test helpers.

### 3. Efficiency

- Identify redundant computation, repeated I/O, duplicate requests, N+1 queries, and overly broad reads.
- Consider concurrency for independent work, while preserving ordering, failure behavior, and resource limits.
- Check for blocking work added to startup or frequently executed paths.
- Look for unbounded retained data, missing cleanup, and long-lived closures retaining unnecessary values. Establish what is retained before claiming a leak.
- Name a concrete cheaper alternative. Avoid speculative optimizations that add complexity without a meaningful benefit.

### 4. Root cause and abstraction level

- Check whether the change addresses the underlying mechanism or adds a fragile special case around it.
- Prefer a simpler fix at the appropriate layer when it removes workarounds and preserves intended behavior.
- Flag leaky abstractions and functions that combine unrelated concerns.
- Apply the deletion test to wrappers: imagine removing the wrapper and calling its implementation directly. If this simplifies callers without spreading complexity, consider removing it. If callers must repeat coordination or implementation details, keep it. Preserve thin layers that serve a concrete framework or architectural purpose.
- In PHP, extract cohesive business operations into action classes when this makes the calling code easier to understand. Follow existing action conventions and preserve behavior. Simple reads or writes can stay inline; broader domain restructuring belongs in a separate architecture task.
- Keep fixes within the review scope. Do not turn cleanup into a broad redesign or build abstractions for hypothetical future needs.

## Apply and verify

Combine the four reports and deduplicate findings about the same mechanism. Check each suggestion against the code before applying it.

Apply all worthwhile fixes within the review scope automatically when they preserve behavior, including changes to shared components. Do not suggest changing requirements or behavior to make the code simpler. Skip false positives, fixes whose behavior preservation is uncertain, and changes that require work well outside the reviewed scope. Follow applicable project instructions.

Run the relevant existing checks for the files you changed. Add tests only when needed to cover a meaningful behavior risk; do not add tests merely to mirror a refactor.

Briefly summarize significant improvements, checks run, and material skipped findings. If no fixes were worthwhile, say the code was already clean.
