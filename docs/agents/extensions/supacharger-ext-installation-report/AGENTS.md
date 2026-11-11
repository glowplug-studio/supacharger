# Using the installation report

This is a temporary, local-only installation UI. It reads `docs/reports/sc-install/first-install-handhold-me.md`; maintain progress in that developer-owned checklist and never edit the Core reference to change the display.

The extension must not remain in a deployed application. When installation is complete, remove every manifest-listed installation-report target. Removing `src/app/(project)/(extensions)/(sc_extensions)/(installation-report)/` removes the page hook without any application layout edit; restart development or build so Core regenerates its page-hook registry.

The page hook renders outside the application's client translation provider. Resolve the shared `Clipboard` messages in `page-hook.tsx` and pass them to `ClipboardCopyButtonBase`; do not call `useTranslations` from the popup for this control. Keep the removable source path presented as inline code with translated Copy, Copied and failure feedback.
