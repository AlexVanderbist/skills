---
name: frontend
description: Apply whenever creating, editing, debugging, refactoring, or reviewing frontend code, including JavaScript, TypeScript, UI components, HTML, CSS, and frontend templates. Guide component reuse, readable logic, and structure using the project's conventions.
---

# Frontend

Read the project's frontend instructions and inspect related code first. Existing repository conventions take precedence over these defaults. Where they leave gaps, apply the personal preferences below, with [Sebastian De Deyne's structure article](https://spatie.be/blog/how-to-structure-the-frontend-of-a-laravel-inertia-react-application) as the primary fallback for organization and component patterns.

## Default structure

For Laravel Inertia React applications without an established structure, organize `resources/js` around:

- `common/`: generic UI components and utilities without application-specific concepts.
- `modules/`: application-specific features shared across pages or complex enough to deserve their own context.
- `pages/`: routed pages, organized close to the URL structure, with global or section layouts and page-specific components and helpers.
- Keep small modules flat. Introduce directories such as `components`, `hooks`, and `helpers` as a module grows.
- Introduce separate application directories only when distinct areas, such as admin and customer interfaces, need them.

Use this structure to fill gaps, not to reorganize an established application or introduce a different frontend stack.

## Reuse existing components

- Look for existing UI components, hooks, and helpers before creating alternatives.
- Prefer extending an existing component when a requirement is a natural variation of what it already does. Add a color option to the existing `Button` instead of creating a separate `RedButton`.
- Check existing callers before changing shared components. Preserve their behavior and defaults unless a change is intended.
- Give frequently used components straightforward APIs. Encapsulate repeated low-level composition inside the UI library so feature code stays easy to read.
- Keep component APIs small and understandable. Avoid accumulating flags for unrelated behaviors.
- Share genuinely common behavior. Similar-looking features do not always need a single configurable implementation.
- Keep third-party component code separate when the project maintains it as an upstream-derived layer.

## Keep responsibilities clear

- Keep generic UI components independent of business concepts.
- Keep feature-specific components and logic near their feature. Move them into shared code when there is a concrete shared use.
- Separate substantial calculations, transformations, and workflow logic from rendering.
- Extract components, functions, or hooks when they give a meaningful name and boundary to a coherent responsibility.
- Avoid fragmenting straightforward code into tiny abstractions that make the flow harder to follow.
- Default to direct imports without barrel files when the repository has no clear convention.

## Write code that explains itself

- Use descriptive component, function, and variable names. Avoid abbreviations.
- Prefer early returns and keep the happy path last where that clarifies the flow.
- Split complicated conditions into understandable checks.
- Give long expressions and calculations descriptive temporary variables, especially inside JSX and output objects.
- Keep rendering readable. Extract substantial conditional sections rather than nesting several conditions inside one expression.

## Data and state

- Reuse the project's existing data-access and state-management patterns.
- Keep state close to where it is used. Share it only when needed.
- Derive values from existing state when practical instead of storing duplicate values that must be synchronized.
- Reuse existing types and generated API contracts. Update their source rather than editing generated output.
- Fix incorrect assumptions instead of hiding them with type assertions.

## Prefer the web platform

- Reuse existing UI components first. When implementing or extending them, prefer native HTML and modern CSS over equivalent JavaScript machinery: `<dialog>`, the Popover API, CSS positioning, and CSS-driven interactions where suitable.
- For tabs and similar controls, prefer HTML and CSS where they meet the required behavior while preserving semantics, keyboard navigation, and focus handling. Add JavaScript where needed to complete the interaction.
- Check the project's supported browsers before adopting newer features.
- Keep framework wrappers thin when the browser already provides the behavior. This preference does not require replacing existing UI libraries.

## Preserve UI behavior

- When extending shared components, preserve accessibility, keyboard interactions, focus behavior, and relevant loading or error states.
- Use existing design tokens and variants instead of introducing slightly different copies of established styles.
- Make reusable components work within their available space rather than assuming one page layout.

## Translations

- Follow the project's translation scope and conventions.
- Reuse translations only when their meaning and context match.
- Keep messages whole and interpolate values rather than assembling sentences from fragments.
- Ensure translated values respond to language changes where supported.

## Work within the project

- Follow the documented direction for new code without expanding the task into an unrelated migration.
- Preserve deliberate exceptions instead of enforcing uniformity blindly.
- Consult version-matched documentation through Context7 when needed and available.
- During implementation, use configured formatting, linting, and type checks rather than duplicating their rules here. Use the testing skill when available for behavioral coverage and verify changed interactions in the browser.
- For review-only requests, report findings without editing files or triggering state-changing UI flows. Use non-mutating checks and leave execution to the coordinator when one is managing the review.
