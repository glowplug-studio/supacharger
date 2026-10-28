# Core signed image processor deployment

Created: 2026-10-28T23:22:43+07:00 (Asia/Bangkok)
Last edited: 2026-10-28T23:22:43+07:00 (Asia/Bangkok)

Deployed process-image-upload-v2 to Core project lubojzqjhvjoextyhfqn after CLI authorisation. The Edge signing secret matches the existing local server value previously configured in Vercel. No secret is recorded here.

Verification: ACTIVE, version 1, verify_jwt true. Hosted CORS preflight returned 204; unauthenticated POST returned 401. No legacy process-image-upload appeared in this project's function listing. No function was deleted. No database migration or implementation change was required for this deployment.

All four requested projects now have v2 deployed: Core, Wakekeeper, Specdrive and SnapScreen. Production Next.js releases and successful authenticated upload/save/reload verification remain pending. Legacy retirement in the consumers remains conditional on verifying migrated clients. Unrelated profile-media work and config changes were excluded.
