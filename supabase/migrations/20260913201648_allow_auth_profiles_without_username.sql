-- Auth users created or invited administratively have no username metadata.
-- Profile creation stays mandatory; username requirements belong to onboarding.
begin;
alter table app.profiles alter column username drop not null;
commit;
