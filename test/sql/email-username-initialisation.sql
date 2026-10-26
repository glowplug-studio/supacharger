-- Local aligned database only; fixtures and all writes are rolled back.
begin;
insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at) values
('4dfd1513-9bfb-44c8-9c18-7ea43ac90301','Jo.Hn+tag-12@example.invalid','{}',now(),now()),
('4dfd1513-9bfb-44c8-9c18-7ea43ac90302','johnTAG12@other.invalid','{}',now(),now()),
('4dfd1513-9bfb-44c8-9c18-7ea43ac90303','a@example.invalid','{}',now(),now()),
('4dfd1513-9bfb-44c8-9c18-7ea43ac90304','abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuv@example.invalid','{}',now(),now());
select set_config('request.jwt.claims','{"sub":"4dfd1513-9bfb-44c8-9c18-7ea43ac90301","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 if api.initialise_account_username_by_current_user() is distinct from 'johntag12' then raise exception 'Sanitisation failed'; end if;
 if api.initialise_account_username_by_current_user() is distinct from 'johntag12' then raise exception 'Repeated allocation changed username'; end if;
end; $$;
reset role;
update app.profiles set username='Chosen_Name' where id='4dfd1513-9bfb-44c8-9c18-7ea43ac90301';
set local role authenticated;
do $$ begin
 if api.initialise_account_username_by_current_user() is distinct from 'Chosen_Name' then raise exception 'Manual username overwritten'; end if;
end; $$;
reset role;
-- Restore the collision fixture without changing the user's initialisation marker.
update app.profiles set username='johntag12' where id='4dfd1513-9bfb-44c8-9c18-7ea43ac90301';
select set_config('request.jwt.claims','{"sub":"4dfd1513-9bfb-44c8-9c18-7ea43ac90302","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 if api.initialise_account_username_by_current_user() is distinct from 'johntag121' then raise exception 'Collision suffix missing'; end if;
end; $$;
reset role;
select set_config('request.jwt.claims','{"sub":"4dfd1513-9bfb-44c8-9c18-7ea43ac90303","role":"authenticated"}',true);
set local role authenticated;
do $$ declare result text; begin
 result:=api.initialise_account_username_by_current_user();
 if result !~ '^user[0-9]*$' then raise exception 'Short prefix fallback failed'; end if;
end; $$;
reset role;
select set_config('request.jwt.claims','{"sub":"4dfd1513-9bfb-44c8-9c18-7ea43ac90304","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 if char_length(api.initialise_account_username_by_current_user()) <> 40 then raise exception 'Length cap failed'; end if;
end; $$;
reset role;
update app.profiles set username=null where id='4dfd1513-9bfb-44c8-9c18-7ea43ac90304';
set local role authenticated;
do $$ begin
 if api.initialise_account_username_by_current_user() is not null then raise exception 'Removed username restored'; end if;
end; $$;
reset role;
select set_config('request.jwt.claims','{"sub":"4dfd1513-9bfb-44c8-9c18-7ea43ac90304","role":"authenticated","is_anonymous":true}',true);
set local role authenticated;
do $$ begin
 begin perform api.initialise_account_username_by_current_user(); raise exception 'Anonymous allocation allowed';
 exception when insufficient_privilege then null; end;
end; $$;
rollback;
