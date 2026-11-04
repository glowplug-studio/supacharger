# Icon usage

Read this file whenever selecting or changing application UI icons. Maintain this project's mappings between logical concepts and icon components here, so the same concept uses the same icon throughout its UI.

For each approved mapping, record the concept, component, import source, scope and any explicit exceptions. Reuse the mapping at each relevant call site. Preserve existing choices when no mapping has been agreed; do not invent a global convention from a single example. Keep accessible labels and decorative-icon handling appropriate to the control.

## Approved project mappings

Use `ClipboardCopy` from `lucide-react` for copy-to-clipboard actions, with `Check` only during successful feedback. Shared controls use `src/supacharger/components/buttons/clipboard-copy-button.tsx`: immediate animated “Click to copy” tooltip on hover/focus, “Copied” after the clipboard write succeeds, then dismissal after 2.5 seconds. Show failure feedback when copying fails and clear timers on unmount.

## Illustrative example only

A developer could record “Replay → `CircleFadingPlay` from `lucide-react`, for replay controls”. This demonstrates the format only: it is not an approved mapping, an instruction to import that icon, or a requirement to alter source code.
