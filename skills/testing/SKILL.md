---
name: testing
description: Write and review tests for meaningful application behavior, with feature tests, readable setup, and minimal mocking.
---

# Testing

Prefer a small, readable suite that covers business behavior.
Judge coverage by the behaviors protected, not a percentage or test count.

The examples primarily use PHP and Laravel, but the principles also apply to frontend tests: meaningful behavior, readable setup, minimal mocking, and a small suite. Adapt them to the project's frontend framework and test tools.

## Decide whether a test is needed

- Not every change needs an automated test. Temporary features, developer-only routes, and one-off maintenance commands usually do not need lasting tests.
- A new page behind existing developer-only middleware does not need a test merely to prove that middleware is attached. Verify the page and access behavior with a quick browser check, using the browser agent skill when available.
- Repository scripts, maintenance scripts, GitHub Actions, and their supporting scripts usually do not need dedicated tests. Prefer an appropriate direct check or dry run.
- Test meaningful business logic, data changes, or failure risks when they warrant it, even in temporary tooling. Judge the behavior rather than requiring tests for every file.

## Start with existing coverage

- Before adding a test, inspect the affected feature or domain's tests, shared setup, and factories.
- Prefer extending existing coverage when it expresses the behavior clearly.
- Follow the project's framework, naming, and directory structure. Do not impose a new Feature/Unit split or namespace layout.
- Consult version-matched documentation through Context7 when needed and available.

## Prefer feature tests

- Exercise application behavior through its normal entry point.
- For Laravel HTTP features, use methods such as `getJson` and `postJson` rather than calling controllers directly. Use the equivalent framework tools for commands, Livewire, and other entry points.
- Run real application code against the test database. Assert meaningful responses, persisted changes, and side effects.
- Reserve unit tests for clearly isolated logic, such as input-output calculations.
- Cover related outcomes of one operation together without duplicating coverage at every internal layer or combining unrelated workflows.

## Factories and readable setup

- Default to existing factories and their states.
- Add factories, improve existing factories, or introduce states when they make useful scenarios easier to express.
- Before changing a factory, inspect its callers and the assumptions they make about its defaults, relationships, and states.
- Refactor other tests using the same infrastructure when that improves clarity or supports the updated factory. Preserve the meaningful behaviors they cover; exact test counts and coverage percentages need not stay fixed.
- Group related tests and share their common setup through `setUp`, `beforeEach`, or the project's equivalent.
- Prefer straightforward shared setup, even with a few extra factory-created models, over repeated setup or configurable fixture builders.
- Keep each test in setup, execution, assertion order. Make scenario-specific changes visible in the test.
- Extensive individual setup is a reason to reconsider the grouping or testing approach.
- Name tests after the behavior they protect.

## Fake boundaries

- Prefer Laravel's built-in fakes, such as `Http::fake()`, `Queue::fake()`, and `Mail::fake()`.
- Keep internal business logic running. Avoid custom mocks, fake implementations, and interfaces introduced only for testing.
- Fake external HTTP calls while exercising the real application client. Prevent unexpected network requests with the project's test tools.
- Assert relevant recipients, payloads, and counts when they matter.
- Occasionally, stub an action's `execute` method to stop a workflow at a deliberate boundary and assert that it was invoked correctly. Do not mock every step.
- Dispatch assertions cover queuing work, not executing it. Check existing coverage of the queued behavior before adding more tests.

## Keep valuable tests

- Focus on business rules and meaningful user flows.
- Avoid tests that repeat implementation details, trivial initialization, configuration, framework behavior, or styling.
- Cover failure cases that protect meaningful business rules, permissions, or data integrity. Do not enumerate every possible edge case.
- For a bug, identify the general rule that failed and why existing coverage missed it. Strengthen that coverage instead of preserving incidental details from the report as a narrowly tailored test.
- Use small datasets when different inputs illustrate the same rule.
- Remove temporary development checks before finishing. Keep tests that protect lasting behavior.
- Review additions alongside the affected domain's suite and consolidate overlapping coverage without losing distinct guarantees.

## Architecture tests

- When useful, add Pest architecture tests, even if the project has none.
- Encode established project rules, such as dependency boundaries. Do not introduce new architectural restrictions through tests.
- Keep the rules focused and avoid duplicating checks already enforced by formatters or static analysis.

## Run tests efficiently

- Use the project's existing test commands and configuration.
- Run focused tests during development and the affected suites before finishing. Factory or shared-setup changes may affect several domains.
- Use parallel execution for full-suite runs when the project supports it.
- Use Pest's Test Impact Analysis locally when available to run only tests affected by changes.
- Control time when needed and respect test database and parallel-worker isolation.
- During review, assess test quality and missing behavioral coverage. State which tests actually ran and any remaining verification gaps.
