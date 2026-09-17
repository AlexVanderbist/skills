---
name: laravel-php
description: Apply whenever creating, editing, debugging, refactoring, or reviewing Laravel code, PHP code, or Blade templates. For Laravel work, use alongside laravel-architecture to apply both coding conventions and architectural guidance.
---

# Laravel and PHP

Do things the Laravel way. Follow applicable project instructions.

For every Laravel feature or package you use, consult its documentation through Context7 or an available Laravel documentation skill. Determine the project's Laravel and relevant package versions from installed dependencies or `composer.lock`, and explicitly consult documentation matching those versions. Prefer documented framework features over custom implementations.

## Framework helpers

- Use Laravel collections by default for transforming, filtering, and grouping data. Prefer collection methods over vanilla PHP array functions.
- Consider vanilla PHP arrays only for performance-critical or memory-sensitive processing. Large arrays, for example over 10,000 keys, are a reason to evaluate the tradeoff, not an automatic exception. Otherwise, use collections.
- Use explicit collection callbacks. Never use higher-order collection proxies.
- Prefer `Str::` and `str()` helpers over hand-written string manipulation.

## Structured data

- Prefer DTOs over passing associative array payloads between methods or classes when they contain more than a couple of keys or require complicated array-shape docblocks.
- Start with a simple PHP class containing typed properties. Avoid adding data-mapping infrastructure for a straightforward value object.
- For more complex data objects, or objects that need JSON serialization, consider Spatie's Laravel Data package when available.
- Check whether `spatie/laravel-data` is installed and inspect how the application uses it before choosing request or response classes.
- If the project uses Laravel Data for controller input and validation, follow that pattern instead of introducing FormRequest classes.
- If the project uses Laravel Data for controller responses, follow that pattern instead of introducing JSON resources.
- Installation alone does not establish the convention. Check existing endpoints and applicable project instructions.

## Write code that explains itself

- Use method and variable names that describe the value or operation. Do not abbreviate: use `$expirationDate`, `$customer`, and `$exception`.
- Name checks as checks and operations as operations.
- Prefer early returns. Handle failure and exceptional cases first; keep the happy path last.
- Split complicated conditions into separate, understandable checks. Preserve any work that must happen afterward.
- Split long methods into smaller, clearly named protected methods. Loops are often useful extraction boundaries.
- Extract long expressions or calculations into named methods or temporary variables when the name explains a meaningful step.
- In output arrays, prefer a descriptive variable over a long inline calculation as the value.
- Keep values used by one method close to their use rather than moving them to class constants without a reason.

## Naming classes

Use names that explain the responsibility, with the usual suffix:

- Actions: `ActivateAccountAction`
- Jobs: `SendWelcomeEmailJob`
- Controllers: `PostsController`, `FavoritePostController`
- Commands: `DeleteExpiredTokensCommand`
- Mailables: `AccountActivatedMail`
- Resources: `UserResource`
- Listeners: `SendWelcomeEmailListener`

Do not add `Interface`, `Exception`, or `Enum` suffixes:

- Interface: `PaymentGateway`
- Implementation: `StripePaymentGateway`
- Exception: `PaymentFailed`
- Enum: `PaymentStatus`

Name events after what happens or has happened, such as `UserRegistering` or `UserRegistered`.

## Classes and methods

- Prefer protected over private visibility for properties and methods, even when overriding is not currently expected. Keep public entry points public.
- Do not make classes final.
- Avoid readonly classes by default. Use one only when immutability is a deliberate requirement and its restrictions fit the class.
- Add `void` return types to methods and functions that return no value, where compatible with inherited or framework contracts.

## PHPDoc

Use docblocks only to add type information that native PHP types cannot express, such as collection key and value types, generics, or fixed array shapes. Do not repeat native type declarations.

Keep PHPStan types honest. An annotation must describe the actual runtime data, not merely silence an error. For Eloquent property inference problems, check model casts, schema information, and the code's shape before adding `@property` annotations. Correct the underlying mismatch where possible.

## Exceptions

Never silently swallow an exception. Every catch must propagate the failure, report it, or record it durably through the application's established failure-tracking mechanism, such as a database record. Preserve enough context to diagnose the failure, including the original exception when wrapping it.

## Migrations and API contracts

- Do not write `down()` methods in migrations. Correct deployed schema changes with a new forward migration.
- When changing API endpoints, inputs, or responses, check for maintained OpenAPI specifications or API documentation, including `docs/`, `resources/docs/`, and paths identified by project instructions. Update affected contracts through the project's established editing or generation workflow.

## Review

For review-only requests, report findings without editing files. Run configured formatting checks and static analysis in non-mutating modes unless the coordinating workflow owns those checks or already ran them for the current changes. When implementing or fixing code, use the configured formatter to resolve mechanical formatting issues.

Do not duplicate tooling failures as review findings. If a check cannot run, state that and continue reviewing.

Report concrete issues against these guidelines. Do not invent findings or repeat rules already enforced by tooling.
