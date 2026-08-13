# Localisation contract

Supacharger uses `next-intl` without locale-based routing. Route paths are language-neutral: changing language changes rendered messages and formatting, not the URL. Do not add a top-level `[locale]` segment, locale-prefixed links, or `next-intl` routing middleware unless the human owner explicitly changes this SaaS contract.

## Developer-owned i18n surface

- `src/i18n/config.ts` declares `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, and `LOCALE_COOKIE_NAME`.
- `src/i18n/request.ts` resolves the request locale and loads its catalogue.
- `messages/` contains the application's translation catalogues.

The CLI installs these starter paths for a new application. After installation, `coreupdate` must ignore them during integrity checks and preserve them byte-for-byte. When `messages/` already exists, an update must not add, replace, or remove any catalogue within it.

The protected root layout obtains locale and messages from `next-intl/server`; it must not import a catalogue directly. The protected `/api/intl` endpoint validates requested locales against the developer-owned configuration and stores the choice in an HTTP-only, same-site cookie.

## Upgrade consequence

Because application catalogues are not CLI-managed, a core release that adds or renames a message key must document the required catalogue edits. Update every supported application locale before using the new core UI. Do not hide missing keys by overwriting catalogues or accepting unvalidated cookie values.
