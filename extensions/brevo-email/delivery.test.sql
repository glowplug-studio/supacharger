begin;
create function pg_temp.assert(ok boolean, message text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception '%',message; end if; end; $$;
select pg_temp.assert(not has_function_privilege('anon','api_edge.ext_brevo_transactional_enqueue(jsonb)','execute'),'anon enqueue denied');
select pg_temp.assert(not has_function_privilege('authenticated','api_edge.ext_brevo_transactional_claim(uuid[])','execute'),'browser claim denied');
select pg_temp.assert(has_function_privilege('service_role','api_edge.ext_brevo_transactional_finish(uuid,uuid,boolean)','execute'),'service finish allowed');
select pg_temp.assert(not has_schema_privilege('service_role','brevo_email','usage'),'private storage denied');
select pg_temp.assert((select schedule='* * * * *' from cron.job where jobname='ext-brevo-email-retry'),'minute cron installed');

create temporary table fixture as select gen_random_uuid() as id from generate_series(1,45);
select brevo_email.ext_brevo_transactional_enqueue(jsonb_agg(jsonb_build_object('id',id,'template','WELCOME','to',jsonb_build_object('email','test@example.test'),'params',jsonb_build_object('title',id)))) from fixture;
select pg_temp.assert((select count(*)=45 from brevo_email.deliveries),'all notifications recorded');
select brevo_email.ext_brevo_transactional_enqueue(jsonb_agg(notification)) from brevo_email.deliveries;
select pg_temp.assert((select count(*)=45 from brevo_email.deliveries),'replay deduplicated');
create temporary table first_claim as select api_edge.ext_brevo_transactional_claim(array(select id from fixture limit 20)) as jobs;
select pg_temp.assert(jsonb_array_length(jobs)=20,'scoped immediate claim size') from first_claim;
create temporary table next_claim as select api_edge.ext_brevo_transactional_claim(null) as jobs;
select pg_temp.assert(jsonb_array_length(jobs)=20,'next batch disjoint') from next_claim;
select pg_temp.assert(not exists(select 1 from first_claim a,next_claim b,jsonb_array_elements(a.jobs) x,jsonb_array_elements(b.jobs) y where x.value->'notification'->>'id'=y.value->'notification'->>'id'),'leases disjoint');
select api_edge.ext_brevo_transactional_finish((j.value->'notification'->>'id')::uuid,(j.value->>'claim_token')::uuid,true) from first_claim,jsonb_array_elements(jobs) j;
select api_edge.ext_brevo_transactional_finish((j.value->'notification'->>'id')::uuid,(j.value->>'claim_token')::uuid,false) from next_claim,jsonb_array_elements(jobs) j;
select pg_temp.assert((select count(*)=20 from brevo_email.deliveries where sent_at is not null),'success recorded');
select pg_temp.assert((select count(*)=20 from brevo_email.deliveries where sent_at is null and next_attempt_at>now()),'failed rows backed off');
select pg_temp.assert(jsonb_array_length(api_edge.ext_brevo_transactional_claim(null))=5,'success and backoff excluded');
do $$ begin
  begin
    perform brevo_email.ext_brevo_transactional_enqueue(jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'template','WELCOME','to',jsonb_build_object('email','invalid'),'params','{}'::jsonb)));
    raise exception 'Expected invalid recipient rejection';
  exception when sqlstate '22023' then null; end;
  begin
    perform api_edge.ext_brevo_transactional_finish(gen_random_uuid(),gen_random_uuid(),true);
    raise exception 'Expected stale lease rejection';
  exception when sqlstate '22023' then null; end;
end; $$;

-- Observe immediate dispatch registration without network: use an administrator-only test stub.
create temporary table dispatched(ids uuid[]);
create or replace function brevo_email.ext_brevo_transactional_dispatch(delivery_ids uuid[] default null) returns void language plpgsql as $$ begin insert into pg_temp.dispatched values(delivery_ids); end; $$;
select brevo_email.ext_brevo_transactional_enqueue(jsonb_agg(jsonb_build_object('id',gen_random_uuid(),'template','WELCOME','to',jsonb_build_object('email','test@example.test'),'params','{}'::jsonb))) from generate_series(1,45);
select pg_temp.assert((select count(*)=3 and sum(cardinality(ids))=45 and max(cardinality(ids))=20 from dispatched),'all 45 sent to immediate dispatch in three batches without cron');
rollback;
