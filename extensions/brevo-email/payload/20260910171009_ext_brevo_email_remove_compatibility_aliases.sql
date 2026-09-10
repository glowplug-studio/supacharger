begin;
set local lock_timeout='5s';
-- All current callers use ext_brevo_transactional_ names.
-- RESTRICT fails safely if a tracked dependency still uses an old entry point.
drop function brevo_email.dispatch(uuid[]) restrict;
drop function brevo_email.enqueue(jsonb) restrict;
drop function brevo_email.retry_pending() restrict;
drop function api_edge.brevo_email_enqueue(jsonb) restrict;
drop function api_edge.brevo_email_claim(uuid[]) restrict;
drop function api_edge.brevo_email_finish(uuid,uuid,boolean) restrict;
notify pgrst,'reload schema';
commit;
