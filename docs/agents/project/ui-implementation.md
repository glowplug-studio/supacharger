# UI implementation guidance

Read this file before implementing or changing application UI. This is project-owned guidance: maintain this application's component choices, visual conventions and interaction rules here, with icon meanings in [icon-usage.md](icon-usage.md).

- Inspect existing project components and styles before adding an alternative. Preserve the application's established presentation and accessibility behaviour.
- Read the project's `docs/agents/project-widgets.md`, `loading-ui.md`, `svg-guidance.md` and `localisation.md` when relevant to the change.
- Record durable project-specific UI decisions here; keep the main project AGENTS.md as a short pointer rather than duplicating these rules.
- Do not infer approved visual or icon conventions from examples. Confirm conflicting project rules before changing them.

## UI components

Before implementing interactive controls, inspect and use the best-fitting project component-library primitive, including shadcn components where installed. Do not use bare HTML inputs, selects, textareas, buttons, checkboxes or radio controls when a suitable library component exists; extend or compose the shared component when a variant is missing. Use a native control only when no suitable project primitive exists or native semantics are specifically required. Preserve accessible labels, keyboard interaction and visible focus states.
