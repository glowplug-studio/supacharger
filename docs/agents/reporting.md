# Report creation and maintenance

Apply this policy whenever creating or editing a report, audit, investigation, review, plan, checklist or handoff, including files under `docs/reports/` and any `.agents/` directory.

- Place human-readable reports and review plans under `docs/reports/<topic>/`. Keep agent execution procedures in `.agents/instructions/`. Keep durable guidance in `docs/agents/`, not in report folders.
- Start every new report filename with its creation date: `YYYY-MM-DD-descriptive-name.md`. Keep that date unchanged on later edits. Use the creation date, not the latest edit date.
- Immediately below the title, record `Created` and `Last edited` with date, time, numeric UTC offset and IANA timezone. Example format: `2026-10-28T20:30:00+07:00 (Asia/Bangkok)`; this example is not a timestamp to copy.
- Use the user's current timezone when known; otherwise use UTC explicitly. Obtain the actual current time when writing. Preserve the original Created value and refresh Last edited every time the report is edited, including status-only changes.
- For an older report without reliable creation metadata, record the verified date with `time unknown`, or `unknown — not previously recorded` if neither is known. Never substitute filesystem birth time, clone time or the current time for an unverified creation time.
- When editing an older report, add missing metadata. Do not bulk rename unrelated historical reports. Rename an active undated report only with its known creation date and update its links in the same change.
- Established tool-addressed filenames, including the two `first-install-handhold-me*.md` installation records, retain their required names. Add timestamps when editing an authorised record; do not edit a protected reference in a consumer.
- Verify the saved header and links before reporting completion. These metadata requirements do not authorise commits, deployments or changes to protected content. Never include credentials in reports.
