# Localisation contract

Supacharger uses `next-intl` without locale-based routing. Route paths are language-neutral: changing language changes rendered messages and formatting, not the URL. Do not add a top-level `[locale]` segment, locale-prefixed links, or `next-intl` routing middleware unless the human owner explicitly changes this SaaS contract.

## Developer-owned i18n surface

- `src/i18n/config.ts` declares `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, and `LOCALE_COOKIE_NAME`.
- `src/i18n/request.ts` resolves the request locale and loads its catalogue.
- `messages/` contains the application's translation catalogues.

The CLI installs these starter paths for a new application. After installation, `coreupdate` must ignore them during integrity checks and preserve them byte-for-byte. When `messages/` already exists, an update must not add, replace, or remove any catalogue within it.

The developer-owned root-layout template obtains locale and messages from `next-intl/server`; it must not import a catalogue directly. `ROOT_PROVIDERS.INTERNATIONALISATION` controls whether the template mounts `NextIntlClientProvider`. The protected `/api/intl` endpoint validates requested locales against the developer-owned configuration, stores the choice in an HTTP-only, same-site cookie, and writes the two-letter code to the authenticated user's `app.profiles.language_code` profile field.

## Marketing-site handoff and persistence

A separate marketing application may link to any SaaS route with `?lang=<code>`, for example `/login?lang=fr`. Treat this parameter as a transient handoff, not locale-based routing:

1. Accept it only when the exact lowercase code is in `SUPPORTED_LOCALES`.
2. Store an accepted value in `supacharger_locale` and in the signed-in profile.
3. If the visitor is signed out, retain a pending-profile marker and persist the cookie value immediately after authentication.
4. Redirect to the same pathname with only the `lang` parameter removed; preserve all other query parameters.
5. If a signed-in request has no valid locale cookie, restore a supported `app.profiles.language_code` value into the cookie.

The effective precedence is accepted `lang` handoff, explicit cookie preference, saved profile preference, then `DEFAULT_LOCALE`. Unknown, uppercase, malformed, or unsupported handoff values must not be stored. The database constraint intentionally permits any lowercase two-letter code so an application can add languages without another schema change; the application configuration remains the supported-locale allowlist.

## Upgrade consequence

Because application catalogues are not CLI-managed, a core release that adds or renames a message key must document the required catalogue edits. Update every supported application locale before using the new core UI. Do not hide missing keys by overwriting catalogues or accepting unvalidated cookie values.
