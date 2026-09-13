# Localisation contract

Supacharger uses `next-intl` without locale-based routing. Route paths are language-neutral: changing language changes rendered messages and formatting, not the URL. Do not add a top-level `[locale]` segment, locale-prefixed links, or `next-intl` routing middleware unless the human owner explicitly changes this SaaS contract.

## Developer-owned i18n surface

- `src/i18n/config.ts` declares `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, and `LOCALE_COOKIE_NAME`.
- `src/i18n/request.ts` resolves the request locale and loads its catalogue.
- `messages/` contains the application's translation catalogues.

The CLI installs these starter paths for a new application. After installation, `coreupdate` ignores locale configuration and catalogues during exact-file integrity checks. It preserves locale configuration and every secondary catalogue byte-for-byte. It may recursively add a missing canonical key or fill an empty English value in `messages/en.json`, while preserving all existing non-empty application wording.

The developer-owned root-layout template obtains locale and messages from `next-intl/server`; it must not import a catalogue directly. `ROOT_PROVIDERS.INTERNATIONALISATION` controls whether the template mounts `NextIntlClientProvider`. The protected `/api/intl` endpoint validates requested locales against the developer-owned configuration, stores the choice in an HTTP-only, same-site cookie, and writes the two-letter code to the authenticated user's `app.profiles.language_code` profile field.

Every Supacharger application enables Next.js Cache Components in its merge-managed Next configuration. Because the validated locale cookie determines both `<html lang>` and the messages provider before the document can render, the developer-owned root layout exports `instant = false`. Next validates each route segment independently, so a page or nested layout that directly performs request-time authentication must also choose an explicit boundary: use `instant = false` for deliberately blocking identity/access checks or local `Suspense` for work that can stream. Do not restore `dynamic = 'force-dynamic'` or put user-specific authentication reads behind `use cache`.

## Translation authoring

- Every task that adds or changes user-facing copy, introduces or changes a `useTranslations` or `getTranslations` call, or adds or changes a translation key must add or update the complete English source value in `messages/en.json` in the same change. This is required even when the human did not ask for translation work.
- Before reporting the task complete, verify that every referenced namespace and every statically referenced key exist in `messages/en.json` with non-empty English values. The consuming code and English catalogue are one atomic change; a task with missing English messages is incomplete and must not be reported as complete.
- Do not invent, machine-translate, copy English wording into, or otherwise fill any secondary-language value unless the human explicitly asks for translation into that specific language.
- When catalogue structure or validation requires corresponding keys in secondary catalogues, add those keys with empty strings as untranslated placeholders. Otherwise leave secondary catalogues unchanged.
- Treat empty secondary-language values as pending translation. Do not describe the affected language, catalogue, or surface as translated, complete, or reviewed.
- Run the project's English-catalogue or i18n validation command when one exists. The absence of an automated check does not waive the manual English namespace and key verification.
- Keep the English-source and translation requirements active through explicit instruction routing. Root `AGENTS.md` may be a short entry point; project instructions may be blank. Do not duplicate this policy in every instruction file.
- Never omit the English key, and do not use placeholder secondary-language content as a substitute for a deliberate English fallback where the runtime requires one.

## Marketing-site handoff and persistence

A separate marketing application may link to any SaaS route with `?lang=<code>`, for example `/login?lang=es`. Treat this parameter as a transient handoff, not locale-based routing:

1. Accept it only when the exact lowercase code is in `SUPPORTED_LOCALES`.
2. Store an accepted value in `supacharger_locale` and in the signed-in profile.
3. If the visitor is signed out, retain a pending-profile marker and persist the cookie value immediately after authentication.
4. Redirect to the same pathname with only the `lang` parameter removed; preserve all other query parameters.
5. If a signed-in request has no valid locale cookie, restore a supported `app.profiles.language_code` value into the cookie.

The effective precedence is accepted `lang` handoff, explicit cookie preference, saved profile preference, then `DEFAULT_LOCALE`. Unknown, uppercase, malformed, or unsupported handoff values must not be stored. The database constraint intentionally permits any lowercase two-letter code so an application can add languages without another schema change; the application configuration remains the supported-locale allowlist.

## Upgrade consequence

Because application catalogues are not exact CLI-managed files, a core release that adds or renames a message key must keep canonical English complete. The updater merges missing/empty English source values without removing product keys. Add secondary placeholders only when catalogue structure requires them, and never translate them unless the human explicitly requests it. Do not hide missing keys by overwriting non-empty product wording or accepting unvalidated cookie values.
