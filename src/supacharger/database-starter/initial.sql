-- Generated from supabase/schemas. Fresh installations only; never apply to an existing database.
SET local check_function_bodies = off;

CREATE SCHEMA "sc_api_edge";

CREATE SCHEMA "sc_api";

CREATE SCHEMA "sc_app";

CREATE SCHEMA "sc_internal";

CREATE SCHEMA "sc_services";

CREATE TABLE "sc_app"."auth_session_transfers" (
  "auth_session_transfer_id" uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"                  uuid                     NOT NULL,
  "source_session_id"        uuid                     NOT NULL,
  "token_hash"               text                     NOT NULL,
  "next_path"                text                     NOT NULL,
  "expires_at"               timestamp with time zone NOT NULL,
  "consumed_at"              timestamp with time zone,
  "created_at"               timestamp with time zone NOT NULL DEFAULT statement_timestamp(),
  CONSTRAINT "auth_session_transfers_expiry_limit_check" CHECK ((expires_at <= (created_at + '00:05:00'::interval))),
  CONSTRAINT "auth_session_transfers_expiry_order_check" CHECK ((expires_at > created_at)),
  CONSTRAINT "auth_session_transfers_next_path_check"
    CHECK ((("left"(next_path, 1) = '/'::text) AND ("left"(next_path, 2) <> '//'::text) AND (strpos(next_path, '\'::text) = 0) AND (next_path !~ '[[:cntrl:]]'::text))),
  CONSTRAINT "auth_session_transfers_pkey" PRIMARY KEY (auth_session_transfer_id),
  CONSTRAINT "auth_session_transfers_token_hash_format_check" CHECK ((token_hash ~ '^[0-9a-f]{64}$'::text))
);

ALTER TABLE "sc_app"."auth_session_transfers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."billing_account_members" (
  "billing_account_id" uuid                     NOT NULL,
  "user_id"            uuid                     NOT NULL,
  "role"               text                     NOT NULL DEFAULT 'member'::text,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "billing_account_members_pkey" PRIMARY KEY (billing_account_id, user_id),
  CONSTRAINT "billing_account_members_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'billing_admin'::text, 'member'::text])))
);

ALTER TABLE "sc_app"."billing_account_members"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."billing_accounts" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "subject_type" text                     NOT NULL,
  "subject_id"   uuid                     NOT NULL,
  "display_name" text,
  "metadata"     jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"   timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "billing_accounts_pkey" PRIMARY KEY (id),
  CONSTRAINT "billing_accounts_subject_type_check" CHECK ((subject_type = ANY (ARRAY['user'::text, 'organisation'::text, 'team'::text, 'tenant'::text, 'custom'::text]))),
  CONSTRAINT "billing_accounts_subject_type_subject_id_key" UNIQUE (subject_type, subject_id)
);

ALTER TABLE "sc_app"."billing_accounts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."billing_features" (
  "lookup_key"  text                     NOT NULL,
  "name"        text                     NOT NULL,
  "description" text,
  "metadata"    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "billing_features_lookup_key_check" CHECK ((lookup_key ~ '^[A-Za-z0-9_.:-]{1,80}$'::text)),
  CONSTRAINT "billing_features_pkey" PRIMARY KEY (lookup_key)
);

ALTER TABLE "sc_app"."billing_features"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."customers" (
  "id"                 uuid                     NOT NULL,
  "stripe_customer_id" text                     NOT NULL,
  "billing_address"    jsonb,
  "payment_method"     jsonb,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "customers_pkey" PRIMARY KEY (id),
  CONSTRAINT "customers_stripe_customer_id_key" UNIQUE (stripe_customer_id)
);

ALTER TABLE "sc_app"."customers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."entitlement_grants" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "billing_account_id" uuid                     NOT NULL,
  "feature_lookup_key" text                     NOT NULL,
  "source"             text                     NOT NULL,
  "source_reference"   text,
  "active"             boolean                  NOT NULL DEFAULT true,
  "starts_at"          timestamp with time zone,
  "ends_at"            timestamp with time zone,
  "metadata"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "entitlement_grants_pkey" PRIMARY KEY (id),
  CONSTRAINT "entitlement_grants_source_check" CHECK ((source = ANY (ARRAY['stripe_entitlement'::text, 'subscription'::text, 'manual'::text, 'promotion'::text])))
);

ALTER TABLE "sc_app"."entitlement_grants"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."organisation_access_requests" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organisation_id" uuid                     NOT NULL,
  "requested_by"    uuid                     NOT NULL,
  "reviewed_by"     uuid,
  "reviewed_at"     timestamp with time zone,
  "created_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "organisation_access_requests_pkey" PRIMARY KEY (id)
);

ALTER TABLE "sc_app"."organisation_access_requests"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."organisation_invitations" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organisation_id" uuid                     NOT NULL,
  "email"           text                     NOT NULL,
  "token_hash"      text                     NOT NULL,
  "invited_by"      uuid                     NOT NULL,
  "accepted_by"     uuid,
  "accepted_at"     timestamp with time zone,
  "revoked_at"      timestamp with time zone,
  "expires_at"      timestamp with time zone NOT NULL DEFAULT (timezone('utc'::text, now()) + '14 days'::interval),
  "created_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "organisation_invitations_acceptance" CHECK ((((accepted_at IS NULL) AND (accepted_by IS NULL)) OR ((accepted_at IS NOT NULL) AND (accepted_by IS NOT NULL)))),
  CONSTRAINT "organisation_invitations_email_normalised" CHECK (((email = lower(btrim(email))) AND (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'::text))),
  CONSTRAINT "organisation_invitations_pkey" PRIMARY KEY (id),
  CONSTRAINT "organisation_invitations_token_hash" CHECK ((token_hash ~ '^[0-9a-f]{64}$'::text))
);

ALTER TABLE "sc_app"."organisation_invitations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."organisation_members" (
  "organisation_id" uuid                     NOT NULL,
  "user_id"         uuid                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "organisation_members_pkey" PRIMARY KEY (organisation_id, user_id)
);

ALTER TABLE "sc_app"."organisation_members"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."organisations" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"              text                     NOT NULL,
  "handle"            text                     NOT NULL,
  "created_by"        uuid                     NOT NULL,
  "created_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "bio"               text,
  "colour_hex"        text                     NOT NULL DEFAULT '#2563EB'::text,
  "avatar_path"       text,
  "header_image_path" text,
  CONSTRAINT "organisations_avatar_path_folder" CHECK (((avatar_path IS NULL) OR (avatar_path ~~ ((id)::text || '/logos/%'::text)))),
  CONSTRAINT "organisations_bio_length" CHECK (((bio IS NULL) OR (char_length(bio) <= 300))),
  CONSTRAINT "organisations_colour_hex" CHECK ((colour_hex ~ '^#[0-9A-Fa-f]{6}$'::text)),
  CONSTRAINT "organisations_handle_normalised" CHECK (((handle = lower(btrim(handle))) AND (handle ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'::text))),
  CONSTRAINT "organisations_header_image_path_folder" CHECK (((header_image_path IS NULL) OR (header_image_path ~~ ((id)::text || '/headers/%'::text)))),
  CONSTRAINT "organisations_name_not_blank" CHECK ((btrim(name) <> ''::text)),
  CONSTRAINT "organisations_pkey" PRIMARY KEY (id)
);

ALTER TABLE "sc_app"."organisations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."prices" (
  "id"                text    NOT NULL,
  "product_id"        text,
  "active"            boolean,
  "description"       text,
  "unit_amount"       bigint,
  "currency"          text,
  "interval_count"    integer,
  "trial_period_days" integer,
  "metadata"          jsonb,
  CONSTRAINT "prices_currency_check" CHECK (((currency IS NULL) OR (char_length(currency) = 3))),
  CONSTRAINT "prices_pkey" PRIMARY KEY (id)
);

ALTER TABLE "sc_app"."prices"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."product_features" (
  "product_id"         text                     NOT NULL,
  "feature_lookup_key" text                     NOT NULL,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "product_features_pkey" PRIMARY KEY (product_id, feature_lookup_key)
);

ALTER TABLE "sc_app"."product_features"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."products" (
  "id"          text    NOT NULL,
  "active"      boolean,
  "name"        text,
  "description" text,
  "image"       text,
  "metadata"    jsonb,
  CONSTRAINT "products_pkey" PRIMARY KEY (id)
);

ALTER TABLE "sc_app"."products"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."profile_username_initialisations" (
  "profile_username_initialisation_id" uuid                     NOT NULL,
  "created_at"                         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profile_username_initialisations_pkey" PRIMARY KEY (profile_username_initialisation_id)
);

ALTER TABLE "sc_app"."profile_username_initialisations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."profiles" (
  "id"                uuid                     NOT NULL,
  "first_name"        text                     NOT NULL DEFAULT ''::text,
  "last_name"         text                     NOT NULL DEFAULT ''::text,
  "username"          text,
  "email"             text,
  "avatar_path"       text,
  "header_image_path" text,
  "language_code"     text,
  "created_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "profile_is_public" boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "profiles_avatar_path_owner" CHECK (((avatar_path IS NULL) OR (avatar_path ~~ ((id)::text || '/avatar-%'::text)))),
  CONSTRAINT "profiles_first_name_check" CHECK ((char_length(first_name) <= 100)),
  CONSTRAINT "profiles_header_image_path_owner" CHECK (((header_image_path IS NULL) OR (header_image_path ~~ ((id)::text || '/headers/header-%'::text)))),
  CONSTRAINT "profiles_language_code_check" CHECK (((language_code IS NULL) OR (language_code ~ '^[a-z]{2}$'::text))),
  CONSTRAINT "profiles_last_name_check" CHECK ((char_length(last_name) <= 100)),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_username_format" CHECK (((username IS NULL) OR (username ~ '^[A-Za-z0-9_-]{3,40}$'::text)))
);

ALTER TABLE "sc_app"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."social_profile_imports" (
  "social_profile_import_id" uuid                     NOT NULL,
  "profile_updated_at"       timestamp with time zone,
  "created_at"               timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at"             timestamp with time zone,
  CONSTRAINT "social_profile_imports_pkey" PRIMARY KEY (social_profile_import_id)
);

ALTER TABLE "sc_app"."social_profile_imports"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."stripe_customer_mappings" (
  "stripe_customer_mapping_id" uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "billing_account_id"         uuid                     NOT NULL,
  "stripe_customer_id"         text                     NOT NULL,
  "stripe_account_id"          text                     NOT NULL DEFAULT 'platform'::text,
  "livemode"                   boolean,
  "billing_address"            jsonb,
  "payment_method"             jsonb,
  "created_at"                 timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"                 timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "stripe_customer_mappings_account_mode_key" UNIQUE (billing_account_id, stripe_account_id, livemode),
  CONSTRAINT "stripe_customer_mappings_external_customer_key" UNIQUE (stripe_customer_id, stripe_account_id),
  CONSTRAINT "stripe_customer_mappings_pkey" PRIMARY KEY (stripe_customer_mapping_id)
);

ALTER TABLE "sc_app"."stripe_customer_mappings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."stripe_event_payloads" (
  "event_id"   text                     NOT NULL,
  "payload"    jsonb                    NOT NULL,
  "expires_at" timestamp with time zone NOT NULL DEFAULT (timezone('utc'::text, now()) + '30 days'::interval),
  CONSTRAINT "stripe_event_payloads_pkey" PRIMARY KEY (event_id)
);

ALTER TABLE "sc_app"."stripe_event_payloads"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."stripe_events" (
  "event_id"              text                     NOT NULL,
  "event_type"            text                     NOT NULL,
  "object_id"             text,
  "api_version"           text,
  "livemode"              boolean                  NOT NULL,
  "status"                text                     NOT NULL DEFAULT 'pending'::text,
  "attempt_count"         integer                  NOT NULL DEFAULT 0,
  "received_at"           timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "processing_started_at" timestamp with time zone,
  "processed_at"          timestamp with time zone,
  "next_attempt_at"       timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "last_error"            text,
  CONSTRAINT "stripe_events_attempt_count_check" CHECK ((attempt_count >= 0)),
  CONSTRAINT "stripe_events_pkey" PRIMARY KEY (event_id),
  CONSTRAINT "stripe_events_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'processed'::text, 'failed'::text])))
);

ALTER TABLE "sc_app"."stripe_events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."subscription_items" (
  "id"                   text                     NOT NULL,
  "subscription_id"      text                     NOT NULL,
  "price_id"             text                     NOT NULL,
  "quantity"             integer,
  "metadata"             jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "current_period_start" timestamp with time zone NOT NULL,
  "current_period_end"   timestamp with time zone NOT NULL,
  "created_at"           timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "subscription_items_pkey" PRIMARY KEY (id)
);

ALTER TABLE "sc_app"."subscription_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."subscriptions" (
  "id"                    text                     NOT NULL,
  "user_id"               uuid,
  "metadata"              jsonb,
  "price_id"              text,
  "quantity"              integer,
  "cancel_at_period_end"  boolean,
  "created"               timestamp with time zone NOT NULL,
  "current_period_start"  timestamp with time zone NOT NULL,
  "current_period_end"    timestamp with time zone NOT NULL,
  "ended_at"              timestamp with time zone,
  "cancel_at"             timestamp with time zone,
  "canceled_at"           timestamp with time zone,
  "trial_start"           timestamp with time zone,
  "trial_end"             timestamp with time zone,
  "billing_account_id"    uuid                     NOT NULL,
  "stripe_customer_id"    text,
  "livemode"              boolean,
  "collection_method"     text,
  "currency"              text,
  "billing_mode"          text,
  "latest_invoice_id"     text,
  "automatic_tax_enabled" boolean,
  "last_synced_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "subscriptions_billing_mode_check" CHECK (((billing_mode IS NULL) OR (billing_mode = ANY (ARRAY['classic'::text, 'flexible'::text])))),
  CONSTRAINT "subscriptions_currency_check" CHECK (((currency IS NULL) OR (char_length(currency) = 3))),
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "sc_app"."subscriptions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."user_roles" (
  "user_id"    uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "user_roles_pkey" PRIMARY KEY (user_id)
);

ALTER TABLE "sc_app"."user_roles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_app"."user_session_contexts" (
  "session_id"             uuid                     NOT NULL,
  "user_id"                uuid                     NOT NULL,
  "active_organisation_id" uuid                     NOT NULL,
  "context_version"        bigint                   NOT NULL DEFAULT 1,
  "created_at"             timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "user_session_contexts_pkey" PRIMARY KEY (session_id)
);

ALTER TABLE "sc_app"."user_session_contexts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sc_internal"."profile_media_settings" (
  "profile_media_setting_id" boolean NOT NULL DEFAULT true,
  "supabase_url"             text    NOT NULL,
  CONSTRAINT "profile_media_settings_pkey" PRIMARY KEY (profile_media_setting_id),
  CONSTRAINT "profile_media_settings_profile_media_setting_id_check" CHECK (profile_media_setting_id),
  CONSTRAINT "profile_media_settings_supabase_url_check" CHECK ((supabase_url ~ '^https?://[^/]+$'::text))
);

CREATE TABLE "sc_services"."bindings" (
  "binding_id"       uuid         NOT NULL DEFAULT gen_random_uuid(),
  "service_name"     text         NOT NULL,
  "operation"        text         NOT NULL,
  "implementation"   text         NOT NULL,
  "contract_version" integer      NOT NULL,
  "handler"          regprocedure NOT NULL,
  CONSTRAINT "bindings_contract_version_check" CHECK ((contract_version = 1)),
  CONSTRAINT "bindings_implementation_check" CHECK ((implementation ~ '^supacharger-ext-[a-z][a-z0-9-]*$'::text)),
  CONSTRAINT "bindings_operation_check" CHECK ((operation ~ '^[a-z][a-z0-9_]{0,63}$'::text)),
  CONSTRAINT "bindings_pkey" PRIMARY KEY (binding_id),
  CONSTRAINT "bindings_service_name_check" CHECK ((service_name ~ '^[a-z][a-z0-9_]{0,63}$'::text)),
  CONSTRAINT "bindings_service_name_operation_key" UNIQUE (service_name, operation)
);

ALTER TABLE "sc_services"."bindings"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "sc_app"."application_role" AS ENUM (
  'user',
  'admin'
);

ALTER TABLE "sc_app"."user_roles"
  ADD COLUMN "role" sc_app.application_role NOT NULL DEFAULT 'user'::sc_app.application_role;

CREATE TYPE "sc_app"."organisation_access_policy" AS ENUM (
  'closed',
  'request'
);

ALTER TABLE "sc_app"."organisations"
  ADD COLUMN "access_policy" sc_app.organisation_access_policy NOT NULL DEFAULT 'closed'::sc_app.organisation_access_policy;

CREATE TYPE "sc_app"."organisation_access_request_status" AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

ALTER TABLE "sc_app"."organisation_access_requests"
  ADD COLUMN "status" sc_app.organisation_access_request_status NOT NULL DEFAULT 'pending'::sc_app.organisation_access_request_status;

CREATE TYPE "sc_app"."organisation_role" AS ENUM (
  'owner',
  'admin',
  'member'
);

ALTER TABLE "sc_app"."organisation_invitations"
  ADD COLUMN "role" sc_app.organisation_role NOT NULL DEFAULT 'member'::sc_app.organisation_role;

ALTER TABLE "sc_app"."organisation_members"
  ADD COLUMN "role" sc_app.organisation_role NOT NULL DEFAULT 'member'::sc_app.organisation_role;

CREATE TYPE "sc_app"."pricing_plan_interval" AS ENUM (
  'day',
  'week',
  'month',
  'year'
);

ALTER TABLE "sc_app"."prices"
  ADD COLUMN "interval" sc_app.pricing_plan_interval;

CREATE TYPE "sc_app"."pricing_type" AS ENUM (
  'one_time',
  'recurring'
);

ALTER TABLE "sc_app"."prices"
  ADD COLUMN "type" sc_app.pricing_type;

CREATE TYPE "sc_app"."subscription_status" AS ENUM (
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused'
);

ALTER TABLE "sc_app"."subscriptions"
  ADD COLUMN "status" sc_app.subscription_status;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION sc_api.check_account_username_available (
  input_username text
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select btrim(coalesce(input_username, '')) ~ '^[A-Za-z0-9_-]{3,40}$'
    and not exists (
      select 1 from sc_app.profiles p
      where lower(p.username) = lower(btrim(input_username))
        and p.id <> (select auth.uid())
    );
$function$;

CREATE OR REPLACE FUNCTION sc_api.complete_social_avatar_by_current_user (
  input_avatar_path text DEFAULT NULL::text
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  actor uuid := auth.uid();
  profile sc_app.profiles%rowtype;
  imported sc_app.social_profile_imports%rowtype;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select p.* into profile from sc_app.profiles p where p.id = actor for update;
  select s.* into imported from sc_app.social_profile_imports s
  where s.social_profile_import_id = actor for update;
  if not found or imported.completed_at is not null then return false; end if;
  update sc_app.social_profile_imports set completed_at = now() where social_profile_import_id = actor;
  if input_avatar_path is null then return false; end if;
  if imported.created_at < now() - interval '5 minutes'
    or profile.avatar_path is not null
    or profile.updated_at is distinct from imported.profile_updated_at then return false; end if;
  if char_length(input_avatar_path) > 512
    or input_avatar_path not like actor::text || '/avatar-%'
    or input_avatar_path ~ '(^|/)\.\.?(/|$)'
    or not exists (select 1 from storage.objects o where o.bucket_id = 'sc_user-avatars'
      and o.name = input_avatar_path and o.owner_id = actor::text) then
    raise exception 'Invalid avatar path' using errcode = '22023';
  end if;
  update sc_app.profiles p set avatar_path = input_avatar_path where p.id = actor;
  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api.get_account_profile_by_current_user()
  RETURNS TABLE (
    id                uuid,
    first_name        text,
    last_name         text,
    username          text,
    email             text,
    avatar_path       text,
    header_image_path text,
    language_code     text,
    created_at        timestamp with time zone,
    updated_at        timestamp with time zone,
    profile_is_public boolean,
    extension         jsonb
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
      select p.id,p.first_name,p.last_name,p.username,p.email,p.avatar_path,
        p.header_image_path,p.language_code,p.created_at,p.updated_at,p.profile_is_public,
        sc_internal.get_account_profile_extension(p.id)
      from sc_app.profiles p where p.id=(select auth.uid())
        and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false);
    $function$;

CREATE OR REPLACE FUNCTION sc_api.get_account_summary_by_current_user()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  with current_identity as (
    select (select auth.uid()) as user_id,
      nullif((select auth.jwt()) ->> 'session_id', '')::uuid as session_id
  ), active_organisation as (
    select
      organisation.id,
      organisation.handle,
      organisation.name,
      member.role
    from current_identity identity
    join sc_app.user_session_contexts context
      on context.session_id = identity.session_id
     and context.user_id = identity.user_id
    join sc_app.organisations organisation
      on organisation.id = context.active_organisation_id
    join sc_app.organisation_members member
      on member.organisation_id = organisation.id
     and member.user_id = identity.user_id
  )
  select case
    when identity.user_id is null
      or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
      then null
    else jsonb_build_object(
      'user_id', profile.id,
      'email', profile.email,
      'first_name', profile.first_name,
      'last_name', profile.last_name,
      'username', profile.username,
      'avatar_path', profile.avatar_path,
      'active_organisation', (
        select jsonb_build_object(
          'id', organisation.id,
          'handle', organisation.handle,
          'name', organisation.name,
          'role', organisation.role,
          'avatar_path', null
        )
        from active_organisation organisation
      ),
      'organisation_count', (
        select count(*)
        from sc_app.organisation_members member
        where member.user_id = identity.user_id
      )
    )
  end
  from current_identity identity
  join sc_app.profiles profile on profile.id = identity.user_id;
$function$;

CREATE OR REPLACE FUNCTION sc_api.get_active_products()
  RETURNS TABLE (
    id          text,
    active      boolean,
    name        text,
    description text,
    image       text,
    metadata    jsonb,
    prices      jsonb
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select p.id, p.active, p.name, p.description, p.image, p.metadata,
    coalesce(jsonb_agg(to_jsonb(pr) order by pr.unit_amount)
      filter (where pr.id is not null and pr.active is true), '[]'::jsonb)
  from sc_app.products p
  left join sc_app.prices pr on pr.product_id = p.id
  where p.active is true
  group by p.id
  order by coalesce((p.metadata ->> 'index')::integer, 2147483647), p.name;
$function$;

CREATE OR REPLACE FUNCTION sc_api.get_active_subscription_by_current_user()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select to_jsonb(s) || jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(
        to_jsonb(si) || jsonb_build_object(
          'prices', to_jsonb(pr) || jsonb_build_object('products', to_jsonb(p))
        ) order by si.created_at, si.id
      )
      from sc_app.subscription_items si
      join sc_app.prices pr on pr.id = si.price_id
      left join sc_app.products p on p.id = pr.product_id
      where si.subscription_id = s.id
    ), '[]'::jsonb),
    -- Deprecated aliases retained for one release for existing consumers.
    'prices', to_jsonb(first_price) || jsonb_build_object('products', to_jsonb(first_product))
  )
  from sc_app.subscriptions s
  join sc_app.billing_account_members m on m.billing_account_id = s.billing_account_id
  left join sc_app.prices first_price on first_price.id = s.price_id
  left join sc_app.products first_product on first_product.id = first_price.product_id
  where m.user_id = (select auth.uid()) and s.status in ('trialing', 'active')
  order by s.current_period_end desc
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION sc_api.get_billing_overview_by_current_user()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select coalesce(jsonb_agg(
    to_jsonb(b) || jsonb_build_object(
      'member_role', m.role,
      'subscriptions', coalesce((
        select jsonb_agg(
          to_jsonb(s) || jsonb_build_object(
            'items', coalesce((
              select jsonb_agg(
                to_jsonb(si) || jsonb_build_object(
                  'price', to_jsonb(pr) || jsonb_build_object('product', to_jsonb(p))
                ) order by si.created_at, si.id
              )
              from sc_app.subscription_items si
              join sc_app.prices pr on pr.id = si.price_id
              left join sc_app.products p on p.id = pr.product_id
              where si.subscription_id = s.id
            ), '[]'::jsonb)
          ) order by s.created desc
        )
        from sc_app.subscriptions s where s.billing_account_id = b.id
      ), '[]'::jsonb),
      'entitlements', coalesce((
        select jsonb_agg(to_jsonb(e) order by e.feature_lookup_key)
        from sc_app.entitlement_grants e
        where e.billing_account_id = b.id
          and e.active is true
          and (e.starts_at is null or e.starts_at <= timezone('utc', now()))
          and (e.ends_at is null or e.ends_at > timezone('utc', now()))
      ), '[]'::jsonb)
    ) order by b.created_at
  ), '[]'::jsonb)
  from sc_app.billing_account_members m
  join sc_app.billing_accounts b on b.id = m.billing_account_id
  where m.user_id = (select auth.uid());
$function$;

CREATE OR REPLACE FUNCTION sc_api.get_profile_media_url (
  object_path text
)
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select s.supabase_url || '/functions/v1/sc_profile-media?path=' || object_path
  from sc_internal.profile_media_settings s
  where object_path ~ '^[0-9a-f-]{36}/(avatar-[A-Za-z0-9_-]+|headers/header-[A-Za-z0-9_-]+)\.(webp|png|jpe?g|avif)$';
$function$;

CREATE OR REPLACE FUNCTION sc_api.get_public_account_profile (
  identifier text
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
      select jsonb_build_object('user_id',p.id,'first_name',p.first_name,'last_name',p.last_name,
        'username',p.username,'avatar_path',p.avatar_path,'header_image_path',p.header_image_path)
      from sc_app.profiles p where p.profile_is_public
        and (p.id::text=identifier or lower(p.username)=lower(identifier)) limit 1;
    $function$;

CREATE OR REPLACE FUNCTION sc_api.get_user_profiles_by_identifiers (
  input_identifiers text[]
)
  RETURNS TABLE (
    user_id           uuid,
    first_name        text,
    last_name         text,
    username          text,
    avatar_path       text,
    header_image_path text
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  with requested as (
    select distinct lower(btrim(identifier)) as identifier
    from unnest(coalesce(input_identifiers, array[]::text[])) as identifier
    where btrim(identifier) <> ''
  )
  select p.id, p.first_name, p.last_name, p.username, p.avatar_path, p.header_image_path
  from sc_app.profiles p
  join requested r on lower(p.id::text) = r.identifier or lower(p.username) = r.identifier
  where (select auth.uid()) is not null
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  order by p.updated_at desc;
$function$;

CREATE OR REPLACE FUNCTION sc_api.has_billing_access_by_current_user (
  input_feature_lookup_key text DEFAULT NULL::text
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select case when $1 is null then exists (
    select 1
    from sc_app.billing_account_members as member
    join sc_app.subscriptions as subscription
      on subscription.billing_account_id = member.billing_account_id
    where member.user_id = (select auth.uid())
      and subscription.status in ('trialing', 'active')
  ) else exists (
    select 1
    from sc_app.billing_account_members as member
    join sc_app.entitlement_grants as entitlement
      on entitlement.billing_account_id = member.billing_account_id
    where member.user_id = (select auth.uid())
      and entitlement.feature_lookup_key = $1
      and entitlement.active is true
      and (entitlement.starts_at is null or entitlement.starts_at <= timezone('utc', now()))
      and (entitlement.ends_at is null or entitlement.ends_at > timezone('utc', now()))
  ) end;
$function$;

CREATE OR REPLACE FUNCTION sc_api.initialise_account_username_by_current_user()
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  actor uuid := auth.uid();
  existing_username text;
  account_email text;
  base_username text;
  candidate text;
  suffix text;
  attempt integer := 0;
  inserted_id uuid;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select p.username into existing_username from sc_app.profiles p where p.id = actor for update;
  if not found then return null; end if;
  if nullif(btrim(existing_username), '') is not null then return existing_username; end if;
  if exists(select 1 from sc_app.profile_username_initialisations i where i.profile_username_initialisation_id = actor) then return null; end if;
  select u.email into account_email from auth.users u where u.id = actor;
  if nullif(btrim(account_email), '') is null then return null; end if;
  base_username := left(regexp_replace(lower(split_part(account_email, '@', 1)), '[^a-z0-9]', '', 'g'), 40);
  if char_length(base_username) < 3 then base_username := 'user'; end if;
  insert into sc_app.profile_username_initialisations(profile_username_initialisation_id)
  values (actor) on conflict do nothing returning profile_username_initialisation_id into inserted_id;
  if inserted_id is null then return null; end if;

  -- The unique index is authoritative, including races against manual edits.
  loop
    suffix := case when attempt = 0 then '' else attempt::text end;
    candidate := left(base_username, 40 - char_length(suffix)) || suffix;
    if not exists(select 1 from sc_app.profiles p where lower(p.username) = candidate) then
      begin
        update sc_app.profiles p set username = candidate where p.id = actor;
        return candidate;
      exception when unique_violation then
        -- A concurrent allocator or editor claimed this candidate; try the next.
      end;
    end if;
    attempt := attempt + 1;
    if attempt > 10000 then
      raise exception 'Username allocation exhausted' using errcode = '54000';
    end if;
  end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api.initialise_social_profile_by_current_user()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  actor uuid := auth.uid();
  identity_metadata jsonb;
  identity_provider text;
  profile sc_app.profiles%rowtype;
  inserted_id uuid;
  first_name_value text;
  last_name_value text;
  full_name_value text;
  avatar_value text;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select i.identity_data, i.provider into identity_metadata, identity_provider
  from auth.identities i
  where i.user_id = actor and i.provider not in ('email', 'phone')
  order by i.last_sign_in_at desc nulls last, i.created_at, i.id limit 1;
  if not found then return null; end if;

  -- Serialise with profile edits, and never overwrite an existing import marker.
  select p.* into profile from sc_app.profiles p where p.id = actor for update;
  if not found then return null; end if;
  insert into sc_app.social_profile_imports(social_profile_import_id)
  values (actor) on conflict do nothing returning social_profile_import_id into inserted_id;
  if inserted_id is null then return null; end if;

  -- Older edited profiles have no reliable field provenance: leave them alone.
  if profile.updated_at is distinct from profile.created_at then
    update sc_app.social_profile_imports set completed_at = now() where social_profile_import_id = actor;
    return null;
  end if;

  select nullif(btrim(identity_metadata->>k), '') into first_name_value
  from unnest(array['first_name','given_name']) with ordinality as keys(k, n)
  where jsonb_typeof(identity_metadata->k) = 'string'
    and char_length(btrim(identity_metadata->>k)) between 1 and 100 order by n limit 1;
  select nullif(btrim(identity_metadata->>k), '') into last_name_value
  from unnest(array['last_name','family_name']) with ordinality as keys(k, n)
  where jsonb_typeof(identity_metadata->k) = 'string'
    and char_length(btrim(identity_metadata->>k)) between 1 and 100 order by n limit 1;
  select regexp_replace(btrim(identity_metadata->>k), '\s+', ' ', 'g') into full_name_value
  from unnest(array['full_name','name']) with ordinality as keys(k, n)
  where jsonb_typeof(identity_metadata->k) = 'string'
    and char_length(btrim(identity_metadata->>k)) between 1 and 201 order by n limit 1;
  -- Split only when neither structured name exists; never invent a surname.
  if first_name_value is null and last_name_value is null and full_name_value is not null then
    first_name_value := split_part(full_name_value, ' ', 1);
    last_name_value := nullif(btrim(substr(full_name_value, char_length(first_name_value) + 1)), '');
  end if;
  update sc_app.profiles p set
    first_name = case when nullif(btrim(p.first_name), '') is null and char_length(first_name_value) <= 100 then first_name_value else p.first_name end,
    last_name = case when nullif(btrim(p.last_name), '') is null and char_length(last_name_value) <= 100 then last_name_value else p.last_name end
  where p.id = actor returning p.* into profile;

  select identity_metadata->>k into avatar_value
  from unnest(array['avatar_url','picture']) with ordinality as keys(k, n)
  where jsonb_typeof(identity_metadata->k) = 'string'
    and char_length(identity_metadata->>k) between 1 and 2048 order by n limit 1;
  update sc_app.social_profile_imports set profile_updated_at = profile.updated_at,
    completed_at = case when profile.avatar_path is not null or avatar_value is null then now() else null end
  where social_profile_import_id = actor;
  if profile.avatar_path is not null or avatar_value is null then return null; end if;
  return jsonb_build_object('provider', identity_provider, 'avatar_url', avatar_value);
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api.is_profile_complete_by_current_user (
  input_username_required boolean DEFAULT false
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select coalesce((
    select nullif(btrim(p.first_name), '') is not null
      and nullif(btrim(p.last_name), '') is not null
      and (
        not input_username_required
        or nullif(btrim(p.username), '') is not null
      )
    from sc_app.profiles p
    where p.id = (select auth.uid())
      and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  ), false);
$function$;

CREATE OR REPLACE FUNCTION sc_api.organisations (
  input_payload jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  action text := coalesce(input_payload ->> 'action', 'list');
  current_user_id uuid := auth.uid();
  current_session_id uuid := nullif((select auth.jwt()) ->> 'session_id', '')::uuid;
  resolved_organisation_id uuid := nullif(coalesce(input_payload ->> 'organisationId', ''), '')::uuid;
  organisation_handle text := sc_app.normalise_organisation_handle(input_payload ->> 'handle');
  organisation_name text := btrim(coalesce(input_payload ->> 'name', input_payload ->> 'title', ''));
  requested_role_text text := lower(btrim(coalesce(input_payload ->> 'role', 'member')));
  requested_role sc_app.organisation_role;
  actor_role sc_app.organisation_role;
  target_role sc_app.organisation_role;
  target_user_id uuid := nullif(coalesce(input_payload ->> 'userId', ''), '')::uuid;
  invitation_id uuid := nullif(coalesce(input_payload ->> 'invitationId', ''), '')::uuid;
  access_request_id uuid := nullif(coalesce(input_payload ->> 'requestId', ''), '')::uuid;
  normalised_email text := lower(btrim(coalesce(input_payload ->> 'email', '')));
  invitation_token text;
  invitation_token_hash text;
  current_user_email text;
  context_result jsonb;
  invitation_record sc_app.organisation_invitations%rowtype;
begin
  if current_user_id is null
    or current_session_id is null
    or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) then
    raise exception 'Authentication with a session is required' using errcode = '42501';
  end if;

  if action = 'list' then
    return jsonb_build_object(
      'organisations', coalesce((
        select jsonb_agg(sc_api_edge.organisation_summary(organisation.id, current_user_id, current_session_id)
          order by lower(organisation.name))
        from sc_app.organisations organisation
        join sc_app.organisation_members member
          on member.organisation_id = organisation.id and member.user_id = current_user_id
      ), '[]'::jsonb),
      'activeOrganisationId', (
        select context.active_organisation_id
        from sc_app.user_session_contexts context
        where context.session_id = current_session_id and context.user_id = current_user_id
      )
    );
  end if;

  if action = 'handle.available' then
    return jsonb_build_object(
      'handle', organisation_handle,
      'available', organisation_handle ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'
        and not sc_app.organisation_handle_is_reserved(organisation_handle)
        and not exists (
          select 1 from sc_app.organisations organisation
          where organisation.handle = organisation_handle
        )
    );
  end if;

  if action = 'create' then
    if sc_app.organisation_handle_is_reserved(organisation_handle) then
      raise exception 'Organisation handle is reserved' using errcode = '23514';
    end if;
    if input_payload ? 'colourHex'
      and coalesce(input_payload ->> 'colourHex', '') !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception 'Organisation colour must be a six-digit hex value' using errcode = '22023';
    end if;
    context_result := sc_api_edge.create_organisation_context(
      current_user_id, current_session_id, organisation_name, organisation_handle
    );
    resolved_organisation_id := (context_result ->> 'id')::uuid;
    update sc_app.organisations organisation
    set colour_hex = coalesce(input_payload ->> 'colourHex', organisation.colour_hex)
    where organisation.id = resolved_organisation_id;
    perform sc_api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return sc_api_edge.organisation_summary(resolved_organisation_id, current_user_id, current_session_id)
      || jsonb_build_object('requiresSessionRefresh', true);
  end if;

  if action = 'invites.accept' then
    invitation_token := btrim(coalesce(input_payload ->> 'token', ''));
    if invitation_token = '' then
      raise exception 'Invitation token is required' using errcode = '22023';
    end if;
    invitation_token_hash := encode(extensions.digest(invitation_token, 'sha256'), 'hex');
    select lower(btrim(user_record.email)) into current_user_email
    from auth.users user_record where user_record.id = current_user_id;
    select invitation.* into invitation_record
    from sc_app.organisation_invitations invitation
    where invitation.token_hash = invitation_token_hash
      and invitation.email = current_user_email
      and invitation.accepted_at is null
      and invitation.revoked_at is null
      and invitation.expires_at > timezone('utc', now())
    for update;
    if not found then
      raise exception 'Invitation not found, expired, revoked, or already used' using errcode = 'P0002';
    end if;
    insert into sc_app.organisation_members (organisation_id, user_id, role)
    values (invitation_record.organisation_id, current_user_id, invitation_record.role)
    on conflict (organisation_id, user_id) do nothing;
    update sc_app.organisation_invitations invitation
    set accepted_by = current_user_id, accepted_at = timezone('utc', now())
    where invitation.id = invitation_record.id;
    perform sc_api_edge.bind_organisation_billing_account(invitation_record.organisation_id);
    context_result := sc_api_edge.select_organisation_context(
      current_user_id,
      current_session_id,
      (select organisation.handle from sc_app.organisations organisation
        where organisation.id = invitation_record.organisation_id)
    );
    return sc_api_edge.organisation_summary(
      invitation_record.organisation_id, current_user_id, current_session_id
    ) || jsonb_build_object('requiresSessionRefresh', true);
  end if;

  if action = 'access.request' then
    select organisation.id into resolved_organisation_id
    from sc_app.organisations organisation
    where organisation.handle = organisation_handle
      and organisation.access_policy = 'request';
    if resolved_organisation_id is null then
      raise exception 'Organisation is not accepting access requests' using errcode = 'P0002';
    end if;
    if sc_app.is_organisation_member(resolved_organisation_id, current_user_id) then
      raise exception 'You are already an organisation member' using errcode = '23514';
    end if;
    insert into sc_app.organisation_access_requests (organisation_id, requested_by)
    values (resolved_organisation_id, current_user_id)
    on conflict (organisation_id, requested_by) where status = 'pending'
    do update set updated_at = timezone('utc', now())
    returning id into access_request_id;
    return jsonb_build_object(
      'requestId', access_request_id,
      'status', 'pending',
      'organisation', (select jsonb_build_object('name', organisation.name, 'handle', organisation.handle)
        from sc_app.organisations organisation where organisation.id = resolved_organisation_id)
    );
  end if;

  if resolved_organisation_id is null then
    select organisation.id into resolved_organisation_id
    from sc_app.organisations organisation
    where organisation.handle = organisation_handle;
  end if;
  if resolved_organisation_id is null then
    raise exception 'Organisation not found' using errcode = 'P0002';
  end if;

  select member.role into actor_role
  from sc_app.organisation_members member
  where member.organisation_id = resolved_organisation_id and member.user_id = current_user_id;

  if action = 'switch' then
    if actor_role is null then
      raise exception 'Organisation membership not found' using errcode = '42501';
    end if;
    perform sc_api_edge.select_organisation_context(current_user_id, current_session_id,
      (select organisation.handle from sc_app.organisations organisation where organisation.id = resolved_organisation_id));
    return sc_api_edge.organisation_summary(resolved_organisation_id, current_user_id, current_session_id)
      || jsonb_build_object('requiresSessionRefresh', true);
  end if;

  if actor_role is null then
    raise exception 'Organisation membership not found' using errcode = '42501';
  end if;

  if action in ('read', 'members.list', 'invites.list', 'access.list') then
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if actor_role not in ('owner', 'admin') then
    raise exception 'Organisation manager access required' using errcode = '42501';
  end if;

  if action = 'update' then
    if input_payload ? 'name' or input_payload ? 'title' then
      if organisation_name = '' or char_length(organisation_name) > 100 then
        raise exception 'Organisation name must be 1-100 characters' using errcode = '22023';
      end if;
    end if;
    if input_payload ? 'handle' and organisation_handle !~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$' then
      raise exception 'Organisation handle must use 3-64 lowercase letters, numbers, and hyphens'
        using errcode = '22023';
    end if;
    if input_payload ? 'handle' and sc_app.organisation_handle_is_reserved(organisation_handle) then
      raise exception 'Organisation handle is reserved' using errcode = '23514';
    end if;
    if input_payload ? 'colourHex' and coalesce(input_payload ->> 'colourHex', '') !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception 'Organisation colour must be a six-digit hex value' using errcode = '22023';
    end if;
    if input_payload ? 'bio' and char_length(coalesce(input_payload ->> 'bio', '')) > 300 then
      raise exception 'Organisation bio must be at most 300 characters' using errcode = '22023';
    end if;
    if input_payload ? 'accessPolicy' and coalesce(input_payload ->> 'accessPolicy', '') not in ('closed', 'request') then
      raise exception 'Unsupported organisation access policy' using errcode = '22023';
    end if;
    if input_payload ? 'avatarPath'
      and nullif(btrim(coalesce(input_payload ->> 'avatarPath', '')), '') is not null
      and input_payload ->> 'avatarPath' not like (resolved_organisation_id::text || '/logos/%') then
      raise exception 'Organisation logo path is invalid' using errcode = '22023';
    end if;
    if input_payload ? 'headerImagePath'
      and nullif(btrim(coalesce(input_payload ->> 'headerImagePath', '')), '') is not null
      and input_payload ->> 'headerImagePath' not like (resolved_organisation_id::text || '/headers/%') then
      raise exception 'Organisation header path is invalid' using errcode = '22023';
    end if;
    update sc_app.organisations organisation set
      name = case when input_payload ? 'name' or input_payload ? 'title' then organisation_name else organisation.name end,
      handle = case when input_payload ? 'handle' then organisation_handle else organisation.handle end,
      bio = case when input_payload ? 'bio' then nullif(btrim(input_payload ->> 'bio'), '') else organisation.bio end,
      colour_hex = case when input_payload ? 'colourHex' then input_payload ->> 'colourHex' else organisation.colour_hex end,
      avatar_path = case when input_payload ? 'avatarPath' then nullif(btrim(input_payload ->> 'avatarPath'), '') else organisation.avatar_path end,
      header_image_path = case when input_payload ? 'headerImagePath' then nullif(btrim(input_payload ->> 'headerImagePath'), '') else organisation.header_image_path end,
      access_policy = case when input_payload ? 'accessPolicy' then (input_payload ->> 'accessPolicy')::sc_app.organisation_access_policy else organisation.access_policy end
    where organisation.id = resolved_organisation_id;
    update sc_app.user_session_contexts context
    set context_version = context.context_version + 1
    where context.active_organisation_id = resolved_organisation_id;
    perform sc_api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id)
      || jsonb_build_object('requiresSessionRefresh', true);
  end if;

  if requested_role_text not in ('owner', 'admin', 'member') then
    raise exception 'Unsupported organisation role' using errcode = '22023';
  end if;
  requested_role := requested_role_text::sc_app.organisation_role;

  if action = 'members.add' then
    if target_user_id is null then raise exception 'userId is required' using errcode = '22023'; end if;
    if requested_role = 'owner' or (requested_role = 'admin' and actor_role <> 'owner') then
      raise exception 'Only owners can add organisation administrators' using errcode = '42501';
    end if;
    if not exists (select 1 from sc_app.profiles profile where profile.id = target_user_id) then
      raise exception 'User not found' using errcode = 'P0002';
    end if;
    insert into sc_app.organisation_members (organisation_id, user_id, role)
    values (resolved_organisation_id, target_user_id, requested_role)
    on conflict (organisation_id, user_id) do nothing;
    perform sc_api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if action = 'members.updateRole' then
    if target_user_id is null then raise exception 'userId is required' using errcode = '22023'; end if;
    select member.role into target_role from sc_app.organisation_members member
    where member.organisation_id = resolved_organisation_id and member.user_id = target_user_id;
    if target_role is null then raise exception 'Member not found' using errcode = 'P0002'; end if;
    if actor_role <> 'owner' and (target_role <> 'member' or requested_role <> 'member') then
      raise exception 'Only owners can change administrator or owner roles' using errcode = '42501';
    end if;
    if target_role = 'owner' and requested_role <> 'owner' and (
      select count(*) from sc_app.organisation_members member
      where member.organisation_id = resolved_organisation_id and member.role = 'owner'
    ) <= 1 then
      raise exception 'Cannot demote the last owner' using errcode = '23514';
    end if;
    update sc_app.organisation_members member set role = requested_role
    where member.organisation_id = resolved_organisation_id and member.user_id = target_user_id;
    update sc_app.user_session_contexts context set context_version = context.context_version + 1
    where context.user_id = target_user_id and context.active_organisation_id = resolved_organisation_id;
    perform sc_api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if action = 'members.remove' then
    if target_user_id is null then raise exception 'userId is required' using errcode = '22023'; end if;
    select member.role into target_role from sc_app.organisation_members member
    where member.organisation_id = resolved_organisation_id and member.user_id = target_user_id;
    if target_role is null then raise exception 'Member not found' using errcode = 'P0002'; end if;
    if target_role = 'owner' and actor_role <> 'owner' then
      raise exception 'Only owners can remove owners' using errcode = '42501';
    end if;
    if target_role = 'owner' and (
      select count(*) from sc_app.organisation_members member
      where member.organisation_id = resolved_organisation_id and member.role = 'owner'
    ) <= 1 then
      raise exception 'Cannot remove the last owner' using errcode = '23514';
    end if;
    delete from sc_app.organisation_members member
    where member.organisation_id = resolved_organisation_id and member.user_id = target_user_id;
    delete from sc_app.user_session_contexts context
    where context.user_id = target_user_id and context.active_organisation_id = resolved_organisation_id;
    perform sc_api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if action = 'invites.create' then
    if normalised_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'A valid email is required' using errcode = '22023';
    end if;
    if requested_role = 'owner' or (requested_role = 'admin' and actor_role <> 'owner') then
      raise exception 'Only owners can invite organisation administrators' using errcode = '42501';
    end if;
    update sc_app.organisation_invitations invitation set revoked_at = timezone('utc', now())
    where invitation.organisation_id = resolved_organisation_id
      and invitation.email = normalised_email
      and invitation.accepted_at is null and invitation.revoked_at is null;
    invitation_token := encode(extensions.gen_random_bytes(32), 'hex');
    invitation_token_hash := encode(extensions.digest(invitation_token, 'sha256'), 'hex');
    insert into sc_app.organisation_invitations (
      organisation_id, email, role, token_hash, invited_by
    ) values (
      resolved_organisation_id, normalised_email, requested_role, invitation_token_hash, current_user_id
    ) returning id into invitation_id;
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id)
      || jsonb_build_object('invitationId', invitation_id, 'inviteToken', invitation_token);
  end if;

  if action = 'invites.revoke' then
    if invitation_id is null then raise exception 'invitationId is required' using errcode = '22023'; end if;
    update sc_app.organisation_invitations invitation set revoked_at = timezone('utc', now())
    where invitation.id = invitation_id and invitation.organisation_id = resolved_organisation_id
      and invitation.accepted_at is null and invitation.revoked_at is null;
    if not found then raise exception 'Pending invitation not found' using errcode = 'P0002'; end if;
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if action in ('access.approve', 'access.reject') then
    if access_request_id is null then raise exception 'requestId is required' using errcode = '22023'; end if;
    select request.requested_by into target_user_id
    from sc_app.organisation_access_requests request
    where request.id = access_request_id and request.organisation_id = resolved_organisation_id
      and request.status = 'pending' for update;
    if target_user_id is null then raise exception 'Pending access request not found' using errcode = 'P0002'; end if;
    if action = 'access.approve' then
      insert into sc_app.organisation_members (organisation_id, user_id, role)
      values (resolved_organisation_id, target_user_id, 'member')
      on conflict (organisation_id, user_id) do nothing;
    end if;
    update sc_app.organisation_access_requests request
    set status = case when action = 'access.approve' then 'approved' else 'rejected' end::sc_app.organisation_access_request_status,
        reviewed_by = current_user_id,
        reviewed_at = timezone('utc', now())
    where request.id = access_request_id;
    perform sc_api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  raise exception 'Unsupported organisation action' using errcode = '22023';
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api.update_account_avatar_by_current_user (
  input_avatar_path text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  user_id uuid := (select auth.uid());
  next_avatar_path text := nullif(btrim(coalesce(input_avatar_path, '')), '');
begin
  if user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if next_avatar_path is not null and next_avatar_path not like (user_id::text || '/avatar-%') then
    raise exception 'Avatar path must be inside your profile folder' using errcode = '23514';
  end if;
  update sc_app.profiles profile
  set avatar_path = next_avatar_path
  where profile.id = user_id;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api.update_account_header_image_by_current_user (
  input_header_image_path text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  user_id uuid := (select auth.uid());
  next_header_image_path text := nullif(btrim(coalesce(input_header_image_path, '')), '');
begin
  if user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if next_header_image_path is not null and next_header_image_path not like (user_id::text || '/headers/header-%') then
    raise exception 'Header path must be inside your profile header folder' using errcode = '23514';
  end if;
  update sc_app.profiles profile
  set header_image_path = next_header_image_path
  where profile.id = user_id;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api.update_account_language_by_current_user (
  input_language_code text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if input_language_code is not null and input_language_code !~ '^[a-z]{2}$' then
    raise exception 'Language code must be a lowercase ISO 639-1 code' using errcode = '22023';
  end if;
  update sc_app.profiles set language_code = input_language_code where id = v_user_id;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api.update_account_profile_by_current_user (
  request jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    declare
      actor uuid := (select auth.uid());
      fields jsonb := coalesce(request->'profile','{}'::jsonb);
      extension_values jsonb := coalesce(request->'extension','{}'::jsonb);
      field text;
      value text;
    begin
      if actor is null or coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false) then
        raise exception 'Account authentication required' using errcode='42501';
      end if;
      if request is null or jsonb_typeof(request)<>'object'
        or request - array['profile','extension'] <> '{}'::jsonb
        or jsonb_typeof(fields)<>'object' or jsonb_typeof(extension_values)<>'object'
        or fields - array['first_name','last_name','username','avatar_path','header_image_path','language_code','profile_is_public'] <> '{}'::jsonb then
        raise exception 'Invalid account profile request' using errcode='22023';
      end if;
      for field in select jsonb_object_keys(fields) loop
        if field='profile_is_public' then
          if jsonb_typeof(fields->field)<>'boolean' then
            raise exception 'Profile visibility must be boolean' using errcode='22023';
          end if;
        elsif field in ('first_name','last_name','language_code') then
          if jsonb_typeof(fields->field)<>'string' then
            raise exception 'Profile field must be a string' using errcode='22023';
          end if;
        elsif jsonb_typeof(fields->field) not in ('string','null') then
          raise exception 'Profile field must be a string or null' using errcode='22023';
        end if;
        value := nullif(btrim(fields->>field),'');
        if field in ('first_name','last_name') and (value is null or length(value)>100) then
          raise exception 'Names must contain 1 to 100 characters' using errcode='22023';
        elsif field='username' and value is not null and value !~ '^[A-Za-z0-9_-]{3,40}$' then
          raise exception 'Invalid username' using errcode='22023';
        elsif field='language_code' and (value is null or value !~ '^[a-z]{2}$') then
          raise exception 'Invalid language code' using errcode='22023';
        elsif field='avatar_path' and value is not null and
          (value not like actor::text || '/avatar-%' or value ~ '(\.\.|[?#])') then
          raise exception 'Invalid avatar path' using errcode='22023';
        elsif field='header_image_path' and value is not null and
          (value not like actor::text || '/headers/header-%' or value ~ '(\.\.|[?#])') then
          raise exception 'Invalid header path' using errcode='22023';
        end if;
      end loop;
      perform 1 from sc_app.profiles p where p.id=actor for update;
      if not found then raise exception 'Profile unavailable' using errcode='42501'; end if;
      if fields ? 'username' and exists(select 1 from sc_app.profiles p
        where lower(p.username)=lower(nullif(btrim(fields->>'username'),'')) and p.id<>actor) then
        raise exception 'Username is already in use' using errcode='23505';
      end if;
      update sc_app.profiles p set
        first_name=case when fields?'first_name' then btrim(fields->>'first_name') else p.first_name end,
        last_name=case when fields?'last_name' then btrim(fields->>'last_name') else p.last_name end,
        username=case when fields?'username' then nullif(btrim(fields->>'username'),'') else p.username end,
        avatar_path=case when fields?'avatar_path' then nullif(btrim(fields->>'avatar_path'),'') else p.avatar_path end,
        header_image_path=case when fields?'header_image_path' then nullif(btrim(fields->>'header_image_path'),'') else p.header_image_path end,
        language_code=case when fields?'language_code' then btrim(fields->>'language_code') else p.language_code end,
        profile_is_public=case when fields?'profile_is_public' then (fields->>'profile_is_public')::boolean else p.profile_is_public end,
        updated_at=now()
      where p.id=actor;
      perform sc_internal.update_account_profile_extension(actor,extension_values);
    end;
    $function$;

CREATE OR REPLACE FUNCTION sc_api_edge.accept_stripe_event (
  input_event_id    text,
  input_event_type  text,
  input_object_id   text,
  input_api_version text,
  input_livemode    boolean,
  input_payload     jsonb
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare inserted_count integer;
begin
  insert into sc_app.stripe_events (event_id, event_type, object_id, api_version, livemode)
  values (input_event_id, input_event_type, input_object_id, input_api_version, input_livemode)
  on conflict (event_id) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return false; end if;
  insert into sc_app.stripe_event_payloads (event_id, payload) values (input_event_id, input_payload);
  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_get_account_by_customer (
  input_stripe_customer_id text
)
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select c.billing_account_id
  from sc_app.stripe_customer_mappings c
  where c.stripe_customer_id = input_stripe_customer_id;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_get_customer (
  input_user_id uuid
)
  RETURNS TABLE (
    stripe_customer_id text
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select c.stripe_customer_id from sc_app.customers c where c.id = input_user_id;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_get_customer_for_account (
  input_billing_account_id uuid,
  input_livemode           boolean DEFAULT NULL::boolean
)
  RETURNS TABLE (
    stripe_customer_id text,
    livemode           boolean
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select c.stripe_customer_id, c.livemode
  from sc_app.stripe_customer_mappings c
  where c.billing_account_id = input_billing_account_id
    and (input_livemode is null or c.livemode = input_livemode or c.livemode is null)
  order by c.livemode nulls last
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_get_or_create_user_account (
  input_user_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_account_id uuid;
begin
  if not exists (select 1 from sc_app.profiles p where p.id = input_user_id) then
    raise exception 'Billing user does not exist' using errcode = '23503';
  end if;
  insert into sc_app.billing_accounts (id, subject_type, subject_id)
  values (input_user_id, 'user', input_user_id)
  on conflict (subject_type, subject_id) do update set updated_at = timezone('utc', now())
  returning id into v_account_id;
  insert into sc_app.billing_account_members (billing_account_id, user_id, role)
  values (v_account_id, input_user_id, 'owner')
  on conflict (billing_account_id, user_id) do nothing;
  return v_account_id;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_get_user_id (
  input_stripe_customer_id text
)
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select c.id from sc_app.customers c where c.stripe_customer_id = input_stripe_customer_id;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_list_customer_mappings()
  RETURNS TABLE (
    billing_account_id uuid,
    stripe_customer_id text,
    livemode           boolean
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select c.billing_account_id, c.stripe_customer_id, c.livemode
  from sc_app.stripe_customer_mappings c
  order by c.created_at;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_put_customer (
  input_user_id            uuid,
  input_stripe_customer_id text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_customer_id text;
begin
  insert into sc_app.customers (id, stripe_customer_id)
  values (input_user_id, input_stripe_customer_id)
  on conflict (id) do nothing;
  select c.stripe_customer_id into v_customer_id from sc_app.customers c where c.id = input_user_id;
  return v_customer_id;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_put_customer_for_account (
  input_billing_account_id uuid,
  input_stripe_customer_id text,
  input_livemode           boolean,
  input_stripe_account_id  text    DEFAULT 'platform'::text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_customer_id text;
begin
  insert into sc_app.stripe_customer_mappings (
    billing_account_id, stripe_customer_id, stripe_account_id, livemode
  ) values (
    input_billing_account_id, input_stripe_customer_id, input_stripe_account_id, input_livemode
  )
  on conflict (billing_account_id, stripe_account_id, livemode)
  do update set stripe_customer_id = excluded.stripe_customer_id,
    updated_at = timezone('utc', now())
  returning stripe_customer_id into v_customer_id;
  return v_customer_id;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_replace_stripe_entitlements (
  input_stripe_customer_id text,
  input_entitlements       jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_account_id uuid; v_entitlement jsonb;
begin
  select c.billing_account_id
  into v_account_id
  from sc_app.stripe_customer_mappings c
  where c.stripe_customer_id = input_stripe_customer_id;

  if v_account_id is null then
    raise exception 'Stripe customer mapping not found' using errcode = 'P0002';
  end if;

  update sc_app.entitlement_grants
  set active = false, updated_at = timezone('utc', now())
  where billing_account_id = v_account_id
    and source = 'stripe_entitlement';

  for v_entitlement in
    select value
    from jsonb_array_elements(coalesce(input_entitlements, '[]'::jsonb))
  loop
    insert into sc_app.billing_features (lookup_key, name)
    values (
      v_entitlement->>'lookup_key',
      coalesce(v_entitlement->>'lookup_key', '')
    )
    on conflict (lookup_key) do nothing;

    insert into sc_app.entitlement_grants (
      billing_account_id, feature_lookup_key, source, source_reference, active
    ) values (
      v_account_id,
      v_entitlement->>'lookup_key',
      'stripe_entitlement',
      v_entitlement->>'id',
      true
    )
    on conflict (
      billing_account_id, feature_lookup_key, source, (coalesce(source_reference, ''))
    )
    do update set active = true, updated_at = timezone('utc', now());
  end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_set_catalogue_item_inactive (
  input_kind text,
  input_id   text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if input_kind = 'product' then update sc_app.products set active = false where id = input_id;
  elsif input_kind = 'price' then update sc_app.prices set active = false where id = input_id;
  else raise exception 'Unsupported catalogue item kind' using errcode = '22023'; end if;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_update_payment_method (
  input_user_id         uuid,
  input_billing_address jsonb,
  input_payment_method  jsonb
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  update sc_app.customers set billing_address = input_billing_address, payment_method = input_payment_method
  where id = input_user_id;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_update_payment_method_for_account (
  input_billing_account_id uuid,
  input_billing_address    jsonb,
  input_payment_method     jsonb
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  update sc_app.stripe_customer_mappings
  set billing_address = input_billing_address,
      payment_method = input_payment_method,
      updated_at = timezone('utc', now())
  where billing_account_id = input_billing_account_id;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_upsert_price (
  input_price jsonb
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  insert into sc_app.prices (
    id, product_id, active, description, unit_amount, currency, type,
    interval, interval_count, trial_period_days, metadata
  ) values (
    input_price->>'id', input_price->>'product_id', (input_price->>'active')::boolean,
    input_price->>'description', (input_price->>'unit_amount')::bigint, input_price->>'currency',
    (input_price->>'type')::sc_app.pricing_type,
    nullif(input_price->>'interval', '')::sc_app.pricing_plan_interval,
    (input_price->>'interval_count')::integer, (input_price->>'trial_period_days')::integer,
    input_price->'metadata'
  ) on conflict (id) do update set product_id = excluded.product_id,
    active = excluded.active, description = excluded.description,
    unit_amount = excluded.unit_amount, currency = excluded.currency, type = excluded.type,
    interval = excluded.interval, interval_count = excluded.interval_count,
    trial_period_days = excluded.trial_period_days, metadata = excluded.metadata;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_upsert_product (
  input_product jsonb
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  insert into sc_app.products (id, active, name, description, image, metadata)
  values (input_product->>'id', (input_product->>'active')::boolean, input_product->>'name',
    input_product->>'description', input_product->>'image', input_product->'metadata')
  on conflict (id) do update set active = excluded.active, name = excluded.name,
    description = excluded.description, image = excluded.image, metadata = excluded.metadata;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_upsert_subscription (
  input_subscription jsonb
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  insert into sc_app.subscriptions (
    id, user_id, status, metadata, price_id, quantity, cancel_at_period_end,
    created, current_period_start, current_period_end, ended_at, cancel_at,
    canceled_at, trial_start, trial_end
  ) values (
    input_subscription->>'id', (input_subscription->>'user_id')::uuid,
    (input_subscription->>'status')::sc_app.subscription_status, input_subscription->'metadata',
    input_subscription->>'price_id', (input_subscription->>'quantity')::integer,
    (input_subscription->>'cancel_at_period_end')::boolean,
    (input_subscription->>'created')::timestamptz,
    (input_subscription->>'current_period_start')::timestamptz,
    (input_subscription->>'current_period_end')::timestamptz,
    (input_subscription->>'ended_at')::timestamptz, (input_subscription->>'cancel_at')::timestamptz,
    (input_subscription->>'canceled_at')::timestamptz,
    (input_subscription->>'trial_start')::timestamptz, (input_subscription->>'trial_end')::timestamptz
  ) on conflict (id) do update set user_id = excluded.user_id, status = excluded.status,
    metadata = excluded.metadata, price_id = excluded.price_id, quantity = excluded.quantity,
    cancel_at_period_end = excluded.cancel_at_period_end, created = excluded.created,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end, ended_at = excluded.ended_at,
    cancel_at = excluded.cancel_at, canceled_at = excluded.canceled_at,
    trial_start = excluded.trial_start, trial_end = excluded.trial_end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_upsert_subscription_v2 (
  input_subscription jsonb,
  input_items        jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_item jsonb;
begin
  insert into sc_app.subscriptions (
    id, user_id, billing_account_id, stripe_customer_id, status, metadata,
    price_id, quantity, cancel_at_period_end, created, current_period_start,
    current_period_end, ended_at, cancel_at, canceled_at, trial_start, trial_end,
    livemode, collection_method, currency, billing_mode, latest_invoice_id,
    automatic_tax_enabled, last_synced_at
  ) values (
    input_subscription->>'id', nullif(input_subscription->>'user_id', '')::uuid,
    (input_subscription->>'billing_account_id')::uuid,
    input_subscription->>'stripe_customer_id',
    (input_subscription->>'status')::sc_app.subscription_status,
    coalesce(input_subscription->'metadata', '{}'::jsonb),
    input_subscription->>'price_id', nullif(input_subscription->>'quantity', '')::integer,
    (input_subscription->>'cancel_at_period_end')::boolean,
    (input_subscription->>'created')::timestamptz,
    (input_subscription->>'current_period_start')::timestamptz,
    (input_subscription->>'current_period_end')::timestamptz,
    nullif(input_subscription->>'ended_at', '')::timestamptz,
    nullif(input_subscription->>'cancel_at', '')::timestamptz,
    nullif(input_subscription->>'canceled_at', '')::timestamptz,
    nullif(input_subscription->>'trial_start', '')::timestamptz,
    nullif(input_subscription->>'trial_end', '')::timestamptz,
    nullif(input_subscription->>'livemode', '')::boolean,
    input_subscription->>'collection_method', input_subscription->>'currency',
    input_subscription->>'billing_mode', input_subscription->>'latest_invoice_id',
    nullif(input_subscription->>'automatic_tax_enabled', '')::boolean,
    timezone('utc', now())
  ) on conflict (id) do update set
    user_id = excluded.user_id,
    billing_account_id = excluded.billing_account_id,
    stripe_customer_id = excluded.stripe_customer_id,
    status = excluded.status, metadata = excluded.metadata,
    price_id = excluded.price_id, quantity = excluded.quantity,
    cancel_at_period_end = excluded.cancel_at_period_end,
    created = excluded.created,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    ended_at = excluded.ended_at, cancel_at = excluded.cancel_at,
    canceled_at = excluded.canceled_at, trial_start = excluded.trial_start,
    trial_end = excluded.trial_end, livemode = excluded.livemode,
    collection_method = excluded.collection_method, currency = excluded.currency,
    billing_mode = excluded.billing_mode, latest_invoice_id = excluded.latest_invoice_id,
    automatic_tax_enabled = excluded.automatic_tax_enabled,
    last_synced_at = excluded.last_synced_at;

  delete from sc_app.subscription_items where subscription_id = input_subscription->>'id';
  for v_item in select value from jsonb_array_elements(coalesce(input_items, '[]'::jsonb)) loop
    insert into sc_app.subscription_items (
      id, subscription_id, price_id, quantity, metadata,
      current_period_start, current_period_end
    ) values (
      v_item->>'id', input_subscription->>'id', v_item->>'price_id',
      nullif(v_item->>'quantity', '')::integer,
      coalesce(v_item->'metadata', '{}'::jsonb),
      (v_item->>'current_period_start')::timestamptz,
      (v_item->>'current_period_end')::timestamptz
    );
  end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.billing_user_can_manage (
  input_billing_account_id uuid,
  input_user_id            uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1 from sc_app.billing_account_members m
    where m.billing_account_id = input_billing_account_id
      and m.user_id = input_user_id
      and m.role in ('owner', 'billing_admin')
  );
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.bind_organisation_billing_account (
  organisation_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  resolved_billing_account_id uuid;
begin
  insert into sc_app.billing_accounts (subject_type, subject_id, display_name)
  select 'organisation', organisation.id, organisation.name
  from sc_app.organisations organisation
  where organisation.id = $1
  on conflict (subject_type, subject_id) do update
    set display_name = excluded.display_name,
        updated_at = timezone('utc', now())
  returning id into resolved_billing_account_id;

  insert into sc_app.billing_account_members (billing_account_id, user_id, role)
  select resolved_billing_account_id, member.user_id,
    case member.role when 'owner' then 'owner' when 'admin' then 'billing_admin' else 'member' end
  from sc_app.organisation_members member
  where member.organisation_id = $1
  on conflict (billing_account_id, user_id) do update set role = excluded.role;

  delete from sc_app.billing_account_members billing_member
  where billing_member.billing_account_id = resolved_billing_account_id
    and not exists (
      select 1 from sc_app.organisation_members member
      where member.organisation_id = $1 and member.user_id = billing_member.user_id
    );

  return resolved_billing_account_id;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.claim_auth_session_transfer (
  token_hash text
)
  RETURNS TABLE (
    user_id   uuid,
    next_path text
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  update sc_app.auth_session_transfers as transfer
  set consumed_at = statement_timestamp()
  where transfer.token_hash = $1
    and $1 ~ '^[0-9a-f]{64}$'
    and transfer.consumed_at is null
    and transfer.expires_at > statement_timestamp()
    and exists (
      select 1
      from auth.sessions as auth_session
      where auth_session.id = transfer.source_session_id
        and auth_session.user_id = transfer.user_id
    )
  returning transfer.user_id, transfer.next_path;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.claim_stripe_event (
  input_event_id text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_payload jsonb;
begin
  update sc_app.stripe_events set status = 'processing', attempt_count = attempt_count + 1,
    processing_started_at = timezone('utc', now()), last_error = null
  where event_id = input_event_id and (
    (status in ('pending', 'failed') and next_attempt_at <= timezone('utc', now()))
    or (status = 'processing' and processing_started_at < timezone('utc', now()) - interval '5 minutes')
  );
  if not found then return null; end if;
  select payload into v_payload from sc_app.stripe_event_payloads where event_id = input_event_id;
  return v_payload;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.complete_stripe_event (
  input_event_id text,
  input_error    text                     DEFAULT NULL::text,
  input_retry_at timestamp with time zone DEFAULT NULL::timestamp WITH time zone
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if input_error is null then
    update sc_app.stripe_events set status = 'processed', processed_at = timezone('utc', now()),
      processing_started_at = null, last_error = null where event_id = input_event_id;
  else
    update sc_app.stripe_events set status = 'failed', processing_started_at = null,
      next_attempt_at = coalesce(input_retry_at, timezone('utc', now()) + interval '1 minute'),
      last_error = left(input_error, 1000) where event_id = input_event_id;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.create_auth_session_transfer (
  user_id              uuid,
  source_session_id    uuid,
  token_hash           text,
  next_path            text,
  requested_expires_at timestamp with time zone
)
  RETURNS TABLE (
    auth_session_transfer_id uuid,
    expires_at               timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  created_transfer_id uuid;
  created_transfer_expiry timestamptz;
  latest_created_at timestamptz;
begin
  if $1 is null or $2 is null or $3 is null or $4 is null or $5 is null then
    raise exception using errcode = '22004', message = 'auth_session_transfer_invalid';
  end if;
  if $3 !~ '^[0-9a-f]{64}$'
    or left($4, 1) <> '/'
    or left($4, 2) = '//'
    or strpos($4, E'\\') > 0
    or $4 ~ '[[:cntrl:]]'
    or $5 <= statement_timestamp()
    or $5 > statement_timestamp() + interval '5 minutes'
  then
    raise exception using errcode = '22023', message = 'auth_session_transfer_invalid';
  end if;

  if not exists (
    select 1
    from auth.sessions as auth_session
    where auth_session.id = $2 and auth_session.user_id = $1
  ) then
    raise exception using errcode = '28000', message = 'auth_session_transfer_source_session_invalid';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended($2::text, 0));

  select transfer.created_at
  into latest_created_at
  from sc_app.auth_session_transfers as transfer
  where transfer.source_session_id = $2
  order by transfer.created_at desc
  limit 1;

  if latest_created_at > statement_timestamp() - interval '10 seconds' then
    raise exception using errcode = 'P0001', message = 'auth_session_transfer_rate_limited';
  end if;

  delete from sc_app.auth_session_transfers as transfer
  where transfer.source_session_id = $2 and transfer.consumed_at is null;

  delete from sc_app.auth_session_transfers as transfer
  where transfer.expires_at < statement_timestamp() - interval '1 day'
     or transfer.consumed_at < statement_timestamp() - interval '1 day';

  insert into sc_app.auth_session_transfers as transfer (
    user_id,
    source_session_id,
    token_hash,
    next_path,
    expires_at
  ) values ($1, $2, $3, $4, $5)
  returning transfer.auth_session_transfer_id, transfer.expires_at
  into created_transfer_id, created_transfer_expiry;

  return query select created_transfer_id, created_transfer_expiry;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.create_organisation_context (
  input_user_id    uuid,
  input_session_id uuid,
  input_name       text,
  input_handle     text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_name text := btrim(coalesce(input_name, ''));
  v_handle text := sc_app.normalise_organisation_handle(input_handle);
  v_organisation_id uuid;
begin
  if input_user_id is null or input_session_id is null then
    raise exception 'User and session are required' using errcode = '22023';
  end if;
  if v_name = '' or v_handle !~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$' then
    raise exception 'Enter a name and a valid 3-64 character handle' using errcode = '22023';
  end if;

  insert into sc_app.organisations (name, handle, created_by)
  values (v_name, v_handle, input_user_id)
  returning id into v_organisation_id;

  insert into sc_app.organisation_members (organisation_id, user_id, role)
  values (v_organisation_id, input_user_id, 'owner');

  insert into sc_app.user_session_contexts (session_id, user_id, active_organisation_id)
  values (input_session_id, input_user_id, v_organisation_id)
  on conflict (session_id) do update
    set user_id = excluded.user_id,
        active_organisation_id = excluded.active_organisation_id,
        context_version = sc_app.user_session_contexts.context_version + 1;

  return jsonb_build_object('id', v_organisation_id, 'handle', v_handle);
end;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.list_claimable_stripe_events (
  result_limit integer DEFAULT 20
)
  RETURNS TABLE (
    event_id text
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select e.event_id from sc_app.stripe_events e
  where (e.status in ('pending', 'failed') and e.next_attempt_at <= timezone('utc', now()))
    or (e.status = 'processing' and e.processing_started_at < timezone('utc', now()) - interval '5 minutes')
  order by e.received_at limit least(greatest(coalesce(result_limit, 20), 1), 100);
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.organisation_details (
  organisation_id uuid,
  user_id         uuid,
  session_id      uuid
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select sc_api_edge.organisation_summary($1, $2, $3) || jsonb_build_object(
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', member.user_id,
        'role', member.role,
        'joined_at', member.created_at,
        'first_name', profile.first_name,
        'last_name', profile.last_name,
        'username', profile.username,
        'avatar_path', profile.avatar_path
      ) order by
        case member.role when 'owner' then 0 when 'admin' then 1 else 2 end,
        lower(coalesce(profile.first_name, '')),
        lower(coalesce(profile.last_name, '')))
      from sc_app.organisation_members member
      left join sc_app.profiles profile on profile.id = member.user_id
      where member.organisation_id = $1
    ), '[]'::jsonb),
    'invitations', case when sc_app.can_manage_organisation($1, $2) then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', invitation.id,
        'email', invitation.email,
        'role', invitation.role,
        'invited_by', invitation.invited_by,
        'expires_at', invitation.expires_at,
        'created_at', invitation.created_at
      ) order by invitation.created_at desc)
      from sc_app.organisation_invitations invitation
      where invitation.organisation_id = $1
        and invitation.accepted_at is null
        and invitation.revoked_at is null
    ), '[]'::jsonb) else '[]'::jsonb end,
    'access_requests', case when sc_app.can_manage_organisation($1, $2) then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', request.id,
        'user_id', request.requested_by,
        'status', request.status,
        'created_at', request.created_at,
        'first_name', profile.first_name,
        'last_name', profile.last_name,
        'username', profile.username,
        'avatar_path', profile.avatar_path
      ) order by request.created_at)
      from sc_app.organisation_access_requests request
      left join sc_app.profiles profile on profile.id = request.requested_by
      where request.organisation_id = $1 and request.status = 'pending'
    ), '[]'::jsonb) else '[]'::jsonb end
  );
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.organisation_summary (
  organisation_id uuid,
  user_id         uuid,
  session_id      uuid
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select jsonb_build_object(
    'id', organisation.id,
    'name', organisation.name,
    'handle', organisation.handle,
    'bio', organisation.bio,
    'colour_hex', organisation.colour_hex,
    'avatar_path', organisation.avatar_path,
    'header_image_path', organisation.header_image_path,
    'access_policy', organisation.access_policy,
    'role', member.role,
    'is_active', context.active_organisation_id is not null,
    'member_count', (
      select count(*) from sc_app.organisation_members count_member
      where count_member.organisation_id = organisation.id
    ),
    'created_at', organisation.created_at,
    'updated_at', organisation.updated_at
  )
  from sc_app.organisations organisation
  join sc_app.organisation_members member
    on member.organisation_id = organisation.id
   and member.user_id = $2
  left join sc_app.user_session_contexts context
    on context.session_id = $3
   and context.user_id = $2
   and context.active_organisation_id = organisation.id
  where organisation.id = $1;
$function$;

CREATE OR REPLACE FUNCTION sc_api_edge.select_organisation_context (
  input_user_id    uuid,
  input_session_id uuid,
  input_handle     text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_handle text := sc_app.normalise_organisation_handle(input_handle);
  v_organisation_id uuid;
begin
  select org.id into v_organisation_id
  from sc_app.organisations org
  join sc_app.organisation_members member
    on member.organisation_id = org.id
   and member.user_id = input_user_id
  where lower(org.handle) = v_handle;

  if v_organisation_id is null then
    raise exception 'Organisation membership not found' using errcode = '42501';
  end if;

  insert into sc_app.user_session_contexts (session_id, user_id, active_organisation_id)
  values (input_session_id, input_user_id, v_organisation_id)
  on conflict (session_id) do update
    set user_id = excluded.user_id,
        active_organisation_id = excluded.active_organisation_id,
        context_version = sc_app.user_session_contexts.context_version + 1;

  return jsonb_build_object('id', v_organisation_id, 'handle', v_handle);
end;
$function$;

CREATE OR REPLACE FUNCTION sc_app.can_manage_organisation (
  organisation_id uuid,
  user_id         uuid DEFAULT auth.uid()
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from sc_app.organisation_members member
    where member.organisation_id = $1
      and member.user_id = $2
      and member.role in ('owner', 'admin')
  );
$function$;

CREATE OR REPLACE FUNCTION sc_app.cancel_social_profile_import_on_edit()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into sc_app.social_profile_imports(social_profile_import_id, completed_at)
  values (new.id, now())
  on conflict (social_profile_import_id) do update set completed_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_app.custom_access_token_claims_extension (
  event            jsonb,
  canonical_claims jsonb
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$
  select '{}'::jsonb;
$function$;

CREATE OR REPLACE FUNCTION sc_app.custom_access_token_hook (
  event jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SET search_path TO ''
  AS $function$
declare
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  extension_claims jsonb;
  conflicting_claim text;
  assigned_role sc_app.application_role;
  v_session_id uuid := nullif(claims ->> 'session_id', '')::uuid;
  v_organisation_id uuid;
  v_context_version bigint;
  v_handle text;
  v_organisation_role sc_app.organisation_role;
begin
  select ur.role into assigned_role
  from sc_app.user_roles ur
  where ur.user_id = (event ->> 'user_id')::uuid;

  claims := jsonb_set(
    claims,
    '{user_role}',
    to_jsonb(coalesce(assigned_role, 'user'::sc_app.application_role)::text),
    true
  );

  if v_session_id is not null then
    select context.active_organisation_id, context.context_version, org.handle, member.role
    into v_organisation_id, v_context_version, v_handle, v_organisation_role
    from sc_app.user_session_contexts context
    join sc_app.organisations org on org.id = context.active_organisation_id
    join sc_app.organisation_members member
      on member.organisation_id = context.active_organisation_id
     and member.user_id = context.user_id
    where context.session_id = v_session_id
      and context.user_id = (event ->> 'user_id')::uuid;
  end if;

  if v_organisation_id is null then
    claims := claims
      - 'active_organisation_id'
      - 'active_organisation_handle'
      - 'active_organisation_role'
      - 'organisation_context_version';
  else
    claims := jsonb_set(claims, '{active_organisation_id}', to_jsonb(v_organisation_id::text), true);
    claims := jsonb_set(claims, '{active_organisation_handle}', to_jsonb(v_handle), true);
    claims := jsonb_set(claims, '{active_organisation_role}', to_jsonb(v_organisation_role::text), true);
    claims := jsonb_set(claims, '{organisation_context_version}', to_jsonb(v_context_version), true);
  end if;

  extension_claims := coalesce(sc_app.custom_access_token_claims_extension(event, claims), '{}'::jsonb);
  if jsonb_typeof(extension_claims) <> 'object' then
    raise exception 'custom_access_token_claims_extension must return a JSON object'
      using errcode = '22023';
  end if;

  select extension.key into conflicting_claim
  from jsonb_object_keys(extension_claims) as extension(key)
  where extension.key = any (array[
    'iss', 'aud', 'exp', 'iat', 'sub', 'role', 'aal', 'session_id',
    'email', 'phone', 'is_anonymous', 'jti', 'nbf', 'app_metadata',
    'user_metadata', 'amr', 'user_role', 'active_organisation_id',
    'active_organisation_handle', 'active_organisation_role',
    'organisation_context_version'
  ])
  limit 1;

  if conflicting_claim is not null then
    raise exception 'custom claim name "%" is reserved', conflicting_claim
      using errcode = '22023';
  end if;

  claims := claims || extension_claims;
  return jsonb_set(event, '{claims}', claims, true);
end;
$function$;

CREATE OR REPLACE FUNCTION sc_app.handle_auth_user_profile()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into sc_app.profiles (
    id, first_name, last_name, username, email, avatar_path
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'username', ''),
    new.email,
    case
      when new.raw_user_meta_data ->> 'avatar_path' like (new.id::text || '/avatar-%')
      then new.raw_user_meta_data ->> 'avatar_path'
      else null
    end
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_app.handle_auth_user_role()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into sc_app.user_roles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_app.is_organisation_member (
  organisation_id uuid,
  user_id         uuid DEFAULT auth.uid()
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from sc_app.organisation_members member
    where member.organisation_id = $1
      and member.user_id = $2
  );
$function$;

CREATE OR REPLACE FUNCTION sc_app.normalise_organisation_handle (
  p_value text
)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  SET search_path TO ''
  AS $function$
  select lower(regexp_replace(btrim(coalesce(p_value, '')), '[^a-zA-Z0-9-]+', '-', 'g'));
$function$;

CREATE OR REPLACE FUNCTION sc_app.organisation_handle_is_reserved (
  value text
)
  RETURNS boolean
  LANGUAGE sql
  IMMUTABLE
  SET search_path TO ''
  AS $function$
  select lower(btrim(coalesce($1, ''))) = any(array[
    'account', 'api', 'auth', 'en', 'fr', 'organisation', 'organisations',
    'pricing', 'settings', 'static', 'subscribe'
  ]::text[]);
$function$;

CREATE OR REPLACE FUNCTION sc_app.record_profile_username_edit()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into sc_app.profile_username_initialisations(profile_username_initialisation_id)
  values (new.id) on conflict do nothing;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_app.touch_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_internal.get_account_profile_extension (
  account_id uuid
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$ select '{}'::jsonb $function$;

CREATE OR REPLACE FUNCTION sc_internal.update_account_profile_extension (
  account_id uuid,
  extension  jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  if extension <> '{}'::jsonb then
    raise exception 'Unsupported profile extension fields' using errcode = '22023';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION sc_services.call (
  service_name text,
  operation    text,
  input        jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare handler record; result jsonb;
begin
  select p.*,n.nspname into handler from sc_services.bindings b
  join pg_proc p on p.oid=b.handler::oid join pg_namespace n on n.oid=p.pronamespace
  where b.service_name=call.service_name and b.operation=call.operation and b.contract_version=1;
  if not found then raise exception 'Required core service is unavailable' using errcode='55000'; end if;
  if handler.prokind<>'f' or handler.proretset or handler.pronargs<>1 or handler.proargtypes<>'3802'::oidvector
    or handler.prorettype<>'jsonb'::regtype or handler.provariadic<>0 or handler.pronargdefaults<>0
    or handler.nspname in ('public','api','api_edge','mcp_api','sc_api','sc_api_edge','sc_mcp_api') then
    raise exception 'Invalid core service binding' using errcode='55000'; end if;
  execute format('select %I.%I($1)',handler.nspname,handler.proname) into result using input;
  return result;
end;
$function$;

ALTER TABLE "sc_app"."auth_session_transfers"
  ADD CONSTRAINT "auth_session_transfers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."billing_account_members"
  ADD CONSTRAINT "billing_account_members_billing_account_id_fkey" FOREIGN KEY (billing_account_id) REFERENCES sc_app.billing_accounts(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."entitlement_grants"
  ADD CONSTRAINT "entitlement_grants_billing_account_id_fkey" FOREIGN KEY (billing_account_id) REFERENCES sc_app.billing_accounts(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."entitlement_grants"
  ADD CONSTRAINT "entitlement_grants_feature_lookup_key_fkey" FOREIGN KEY (feature_lookup_key) REFERENCES sc_app.billing_features(lookup_key) ON DELETE CASCADE;

ALTER TABLE "sc_app"."organisation_access_requests"
  ADD CONSTRAINT "organisation_access_requests_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."organisation_access_requests"
  ADD CONSTRAINT "organisation_access_requests_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);

ALTER TABLE "sc_app"."organisation_access_requests"
  ADD CONSTRAINT "organisation_access_requests_review"
    CHECK
    ((((status = 'pending'::sc_app.organisation_access_request_status) AND (reviewed_by IS NULL) AND (reviewed_at IS NULL)) OR ((status <>
    'pending'::sc_app.organisation_access_request_status) AND (reviewed_by IS NOT NULL) AND (reviewed_at IS NOT NULL))));

ALTER TABLE "sc_app"."organisation_invitations"
  ADD CONSTRAINT "organisation_invitations_accepted_by_fkey" FOREIGN KEY (accepted_by) REFERENCES auth.users(id);

ALTER TABLE "sc_app"."organisation_invitations"
  ADD CONSTRAINT "organisation_invitations_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id);

ALTER TABLE "sc_app"."organisation_invitations"
  ADD CONSTRAINT "organisation_invitations_non_owner_role" CHECK ((role <> 'owner'::sc_app.organisation_role));

ALTER TABLE "sc_app"."organisation_members"
  ADD CONSTRAINT "organisation_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."organisations"
  ADD CONSTRAINT "organisations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE "sc_app"."organisation_access_requests"
  ADD CONSTRAINT "organisation_access_requests_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES sc_app.organisations(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."organisation_invitations"
  ADD CONSTRAINT "organisation_invitations_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES sc_app.organisations(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."organisation_members"
  ADD CONSTRAINT "organisation_members_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES sc_app.organisations(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."product_features"
  ADD CONSTRAINT "product_features_feature_lookup_key_fkey" FOREIGN KEY (feature_lookup_key) REFERENCES sc_app.billing_features(lookup_key) ON DELETE CASCADE;

ALTER TABLE "sc_app"."prices"
  ADD CONSTRAINT "prices_product_id_fkey" FOREIGN KEY (product_id) REFERENCES sc_app.products(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."product_features"
  ADD CONSTRAINT "product_features_product_id_fkey" FOREIGN KEY (product_id) REFERENCES sc_app.products(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."profile_username_initialisations"
  ADD CONSTRAINT "profile_username_initialisati_profile_username_initialisat_fkey" FOREIGN KEY (profile_username_initialisation_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."billing_account_members"
  ADD CONSTRAINT "billing_account_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES sc_app.profiles(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."customers"
  ADD CONSTRAINT "customers_id_fkey" FOREIGN KEY (id) REFERENCES sc_app.profiles(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."social_profile_imports"
  ADD CONSTRAINT "social_profile_imports_social_profile_import_id_fkey" FOREIGN KEY (social_profile_import_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."stripe_customer_mappings"
  ADD CONSTRAINT "stripe_customer_mappings_billing_account_id_fkey" FOREIGN KEY (billing_account_id) REFERENCES sc_app.billing_accounts(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."stripe_event_payloads"
  ADD CONSTRAINT "stripe_event_payloads_event_id_fkey" FOREIGN KEY (event_id) REFERENCES sc_app.stripe_events(event_id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."subscription_items"
  ADD CONSTRAINT "subscription_items_price_id_fkey" FOREIGN KEY (price_id) REFERENCES sc_app.prices(id);

ALTER TABLE "sc_app"."subscriptions"
  ADD CONSTRAINT "subscriptions_billing_account_id_fkey" FOREIGN KEY (billing_account_id) REFERENCES sc_app.billing_accounts(id);

ALTER TABLE "sc_app"."subscription_items"
  ADD CONSTRAINT "subscription_items_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES sc_app.subscriptions(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."subscriptions"
  ADD CONSTRAINT "subscriptions_price_id_fkey" FOREIGN KEY (price_id) REFERENCES sc_app.prices(id);

ALTER TABLE "sc_app"."subscriptions"
  ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES sc_app.profiles(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."user_roles"
  ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."user_session_contexts"
  ADD CONSTRAINT "user_session_contexts_active_organisation_id_fkey" FOREIGN KEY (active_organisation_id) REFERENCES sc_app.organisations(id) ON DELETE CASCADE;

ALTER TABLE "sc_app"."user_session_contexts"
  ADD CONSTRAINT "user_session_contexts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX auth_session_transfers_expires_at_idx ON sc_app.auth_session_transfers USING btree (expires_at);

CREATE INDEX auth_session_transfers_source_session_id_idx ON sc_app.auth_session_transfers USING btree (source_session_id);

CREATE UNIQUE INDEX auth_session_transfers_token_hash_key ON sc_app.auth_session_transfers USING btree (token_hash);

CREATE INDEX billing_account_members_user_idx ON sc_app.billing_account_members USING btree (user_id, billing_account_id);

CREATE INDEX entitlement_grants_active_idx ON sc_app.entitlement_grants USING btree (billing_account_id, feature_lookup_key)
  WHERE (active IS TRUE);

CREATE UNIQUE INDEX entitlement_grants_source_key ON sc_app.entitlement_grants USING btree (billing_account_id, feature_lookup_key, source, COALESCE(source_reference, ''::text));

CREATE UNIQUE INDEX organisation_access_requests_pending_user_key ON sc_app.organisation_access_requests USING btree (organisation_id, requested_by)
  WHERE (status = 'pending'::sc_app.organisation_access_request_status);

CREATE INDEX organisation_access_requests_requester_idx ON sc_app.organisation_access_requests USING btree (requested_by, created_at DESC);

CREATE UNIQUE INDEX organisation_invitations_pending_email_key ON sc_app.organisation_invitations USING btree (organisation_id, lower(email))
  WHERE ((accepted_at IS NULL) AND (revoked_at IS NULL));

CREATE UNIQUE INDEX organisation_invitations_token_hash_key ON sc_app.organisation_invitations USING btree (token_hash);

CREATE INDEX organisation_members_user_id_idx ON sc_app.organisation_members USING btree (user_id);

CREATE UNIQUE INDEX organisations_handle_lower_key ON sc_app.organisations USING btree (lower(handle));

CREATE UNIQUE INDEX profiles_username_lower_key ON sc_app.profiles USING btree (lower(username))
  WHERE (username IS NOT NULL);

CREATE INDEX stripe_customer_mappings_billing_account_idx ON sc_app.stripe_customer_mappings USING btree (billing_account_id);

CREATE INDEX stripe_events_retryable_idx ON sc_app.stripe_events USING btree (next_attempt_at, received_at)
  WHERE (status = ANY (ARRAY['pending'::text, 'failed'::text]));

CREATE INDEX subscription_items_price_idx ON sc_app.subscription_items USING btree (price_id);

CREATE INDEX subscription_items_subscription_idx ON sc_app.subscription_items USING btree (subscription_id);

CREATE INDEX subscriptions_billing_account_idx ON sc_app.subscriptions USING btree (billing_account_id, status, current_period_end DESC);

CREATE INDEX user_session_contexts_user_id_idx ON sc_app.user_session_contexts USING btree (user_id);

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.handle_auth_user_profile();

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.handle_auth_user_role();

CREATE TRIGGER on_auth_user_email_updated_profile
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.handle_auth_user_profile();

CREATE TRIGGER customers_touch_updated_at
  BEFORE UPDATE ON sc_app.customers
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

CREATE TRIGGER organisation_access_requests_touch_updated_at
  BEFORE UPDATE ON sc_app.organisation_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

CREATE TRIGGER organisation_invitations_touch_updated_at
  BEFORE UPDATE ON sc_app.organisation_invitations
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

CREATE TRIGGER organisation_members_touch_updated_at
  BEFORE UPDATE ON sc_app.organisation_members
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

CREATE TRIGGER organisations_touch_updated_at
  BEFORE UPDATE ON sc_app.organisations
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

CREATE TRIGGER cancel_social_profile_import_on_edit
  BEFORE UPDATE OF first_name, last_name, avatar_path ON sc_app.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.cancel_social_profile_import_on_edit();

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON sc_app.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

CREATE TRIGGER record_profile_username_edit
  BEFORE UPDATE OF username ON sc_app.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.record_profile_username_edit();

CREATE TRIGGER user_session_contexts_touch_updated_at
  BEFORE UPDATE ON sc_app.user_session_contexts
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

CREATE POLICY "organisation_members_auth_hook_read" ON "sc_app"."organisation_members"
  FOR SELECT
  TO "supabase_auth_admin"
  USING (true);

CREATE POLICY "organisations_auth_hook_read" ON "sc_app"."organisations"
  FOR SELECT
  TO "supabase_auth_admin"
  USING (true);

CREATE POLICY "prices_read" ON "sc_app"."prices"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "products_read" ON "sc_app"."products"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "profiles_select_own" ON "sc_app"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id));

CREATE POLICY "profiles_update_own" ON "sc_app"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = id));

CREATE POLICY "subscriptions_select_own" ON "sc_app"."subscriptions"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "user_roles_auth_hook_read" ON "sc_app"."user_roles"
  FOR SELECT
  TO "supabase_auth_admin"
  USING (true);

CREATE POLICY "user_session_contexts_auth_hook_read" ON "sc_app"."user_session_contexts"
  FOR SELECT
  TO "supabase_auth_admin"
  USING (true);

CREATE POLICY "core_profile_media_public" ON "storage"."objects"
  FOR SELECT
  TO "anon"
  USING
    (((bucket_id = 'sc_user-avatars'::text) AND storage.allow_any_operation(ARRAY['object.get_authenticated'::text, 'object.get_authenticated_info'::text,
    'object.head_authenticated_info'::text]) AND
    ((name = (sc_api.get_public_account_profile(split_part(name, '/'::text, 1)) ->> 'avatar_path'::text)) OR (name = (sc_api.get_public_account_profile(split_part(name, '/'::text,
    1)) ->> 'header_image_path'::text)))));

CREATE POLICY "organisation_logos_delete_managers" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'sc_organisation-logos'::text) AND ((storage.foldername(name))[2] = ANY (ARRAY['logos'::text, 'headers'::text])) AND sc_app.can_manage_organisation(
CASE
    WHEN ((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN ((storage.foldername(name))[1])::uuid
    ELSE NULL::uuid
END, ( SELECT auth.uid() AS uid))));

CREATE POLICY "organisation_logos_insert_managers" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH
    CHECK
    (((bucket_id = 'sc_organisation-logos'::text) AND ((storage.foldername(name))[2] = ANY (ARRAY['logos'::text, 'headers'::text])) AND (array_length(storage.foldername(name), 1) =
    3) AND sc_app.can_manage_organisation(
CASE
    WHEN ((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN ((storage.foldername(name))[1])::uuid
    ELSE NULL::uuid
END, ( SELECT auth.uid() AS uid))));

CREATE POLICY "organisation_logos_select_members" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'sc_organisation-logos'::text) AND ((storage.foldername(name))[2] = ANY (ARRAY['logos'::text, 'headers'::text])) AND sc_app.is_organisation_member(
CASE
    WHEN ((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN ((storage.foldername(name))[1])::uuid
    ELSE NULL::uuid
END, ( SELECT auth.uid() AS uid))));

CREATE POLICY "organisation_logos_update_managers" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'sc_organisation-logos'::text) AND ((storage.foldername(name))[2] = ANY (ARRAY['logos'::text, 'headers'::text])) AND sc_app.can_manage_organisation(
CASE
    WHEN ((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN ((storage.foldername(name))[1])::uuid
    ELSE NULL::uuid
END, ( SELECT auth.uid() AS uid))))
  WITH
    CHECK
    (((bucket_id = 'sc_organisation-logos'::text) AND ((storage.foldername(name))[2] = ANY (ARRAY['logos'::text, 'headers'::text])) AND (array_length(storage.foldername(name), 1) =
    3) AND sc_app.can_manage_organisation(
CASE
    WHEN ((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN ((storage.foldername(name))[1])::uuid
    ELSE NULL::uuid
END, ( SELECT auth.uid() AS uid))));

CREATE POLICY "user_avatars_delete_own" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'sc_user-avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "user_avatars_insert_own" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH
    CHECK
    (((bucket_id = 'sc_user-avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) AND (COALESCE(((( SELECT auth.jwt() AS jwt) ->>
    'is_anonymous'::text))::boolean, false) = false)));

CREATE POLICY "user_avatars_select_authenticated" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'sc_user-avatars'::text) AND (COALESCE(((( SELECT auth.jwt() AS jwt) ->> 'is_anonymous'::text))::boolean, false) = false)));

CREATE POLICY "user_avatars_update_own" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'sc_user-avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)))
  WITH CHECK (((bucket_id = 'sc_user-avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

COMMENT ON COLUMN "sc_app"."auth_session_transfers"."source_session_id" IS 'Supabase Auth session that issued the grant; create and claim require the matching auth.sessions row.';

COMMENT ON COLUMN "sc_app"."auth_session_transfers"."token_hash" IS 'Lowercase hexadecimal SHA-256 digest of the user-visible random grant.';

COMMENT ON FUNCTION "sc_api"."get_account_summary_by_current_user"() IS 'Returns the authenticated account identity and active organisation summary in one query. Media values are storage paths and must be signed by a trusted application boundary.';

COMMENT ON FUNCTION "sc_api"."has_billing_access_by_current_user"(text) IS 'Returns whether the current authenticated user has active billing access, optionally scoped to a stable feature lookup key.';

COMMENT ON FUNCTION "sc_api"."organisations"(jsonb) IS 'Authenticated organisation management boundary. Identity and session come only from the verified JWT. Invitation tokens are stored as hashes and returned only when created.';

COMMENT ON FUNCTION "sc_api"."update_account_avatar_by_current_user"(text) IS 'Updates the authenticated account avatar path after validating Storage ownership.';

COMMENT ON FUNCTION "sc_api"."update_account_header_image_by_current_user"(text) IS 'Updates the authenticated account header image path after validating Storage ownership.';

COMMENT ON FUNCTION "sc_api_edge"."claim_auth_session_transfer"(text) IS 'Service-role-only atomic one-use claim. Returns only the expected Auth user and stored safe destination while the source session remains live.';

COMMENT ON FUNCTION "sc_api_edge"."create_auth_session_transfer"(uuid, uuid, text, text, timestamp with time zone) IS 'Service-role-only creation boundary. Validates a live source Auth session, rotates older grants, and enforces issuance and expiry limits.';

COMMENT ON FUNCTION "sc_app"."custom_access_token_claims_extension"(jsonb, jsonb) IS 'Developer extension seam for additional compact JWT claims. Return only product-owned claims; canonical and Supabase claims are reserved.';

COMMENT ON FUNCTION "sc_app"."custom_access_token_hook"(jsonb) IS 'Adds canonical role and active-organisation claims, then merges validated product claims from the developer extension seam.';

COMMENT ON TABLE "sc_app"."auth_session_transfers" IS 'Private short-lived, single-use browser session-transfer grants. Only SHA-256 grant digests are stored.';

COMMENT ON TABLE "sc_app"."user_roles" IS 'Authoritative global application role source for the custom access token hook.';

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "service_role";

REVOKE ALL ON FUNCTION "sc_api"."check_account_username_available"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."check_account_username_available"(text) TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."complete_social_avatar_by_current_user"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."complete_social_avatar_by_current_user"(text) TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."get_account_profile_by_current_user"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."get_account_profile_by_current_user"() TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."get_account_summary_by_current_user"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."get_account_summary_by_current_user"() TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."get_active_products"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."get_active_products"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."get_active_subscription_by_current_user"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."get_active_subscription_by_current_user"() TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."get_billing_overview_by_current_user"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."get_billing_overview_by_current_user"() TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."get_profile_media_url"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."get_profile_media_url"(text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."get_public_account_profile"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."get_public_account_profile"(text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."get_user_profiles_by_identifiers"(text[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."get_user_profiles_by_identifiers"(text[]) TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."has_billing_access_by_current_user"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."has_billing_access_by_current_user"(text) TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."initialise_account_username_by_current_user"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."initialise_account_username_by_current_user"() TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."initialise_social_profile_by_current_user"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."initialise_social_profile_by_current_user"() TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."is_profile_complete_by_current_user"(boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."is_profile_complete_by_current_user"(boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."organisations"(jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."organisations"(jsonb) TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."update_account_avatar_by_current_user"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."update_account_avatar_by_current_user"(text) TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."update_account_header_image_by_current_user"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."update_account_header_image_by_current_user"(text) TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."update_account_language_by_current_user"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."update_account_language_by_current_user"(text) TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api"."update_account_profile_by_current_user"(jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."update_account_profile_by_current_user"(jsonb) TO "authenticated";

REVOKE ALL ON FUNCTION "sc_api_edge"."accept_stripe_event"(text, text, text, text, boolean, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."accept_stripe_event"(text, text, text, text, boolean, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_get_account_by_customer"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_get_account_by_customer"(text) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_get_customer"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_get_customer"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_get_customer_for_account"(uuid, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_get_customer_for_account"(uuid, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_get_or_create_user_account"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_get_or_create_user_account"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_get_user_id"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_get_user_id"(text) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_list_customer_mappings"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_list_customer_mappings"() TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_put_customer"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_put_customer"(uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_put_customer_for_account"(uuid, text, boolean, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_put_customer_for_account"(uuid, text, boolean, text) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_replace_stripe_entitlements"(text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_replace_stripe_entitlements"(text, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_set_catalogue_item_inactive"(text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_set_catalogue_item_inactive"(text, text) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_update_payment_method"(uuid, jsonb, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_update_payment_method"(uuid, jsonb, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_update_payment_method_for_account"(uuid, jsonb, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_update_payment_method_for_account"(uuid, jsonb, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_upsert_price"(jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_upsert_price"(jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_upsert_product"(jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_upsert_product"(jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_upsert_subscription"(jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_upsert_subscription"(jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_upsert_subscription_v2"(jsonb, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_upsert_subscription_v2"(jsonb, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_user_can_manage"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_user_can_manage"(uuid, uuid) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."bind_organisation_billing_account"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."bind_organisation_billing_account"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."claim_auth_session_transfer"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."claim_auth_session_transfer"(text) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."claim_stripe_event"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."claim_stripe_event"(text) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."complete_stripe_event"(text, text, timestamp WITH time zone) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."complete_stripe_event"(text, text, timestamp WITH time zone) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."create_auth_session_transfer"(uuid, uuid, text, text, timestamp WITH time zone) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."create_auth_session_transfer"(uuid, uuid, text, text, timestamp WITH time zone) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."create_organisation_context"(uuid, uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."create_organisation_context"(uuid, uuid, text, text) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."list_claimable_stripe_events"(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."list_claimable_stripe_events"(integer) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."organisation_details"(uuid, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."organisation_details"(uuid, uuid, uuid) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."organisation_summary"(uuid, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."organisation_summary"(uuid, uuid, uuid) TO "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."select_organisation_context"(uuid, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."select_organisation_context"(uuid, uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "sc_app"."can_manage_organisation"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_app"."can_manage_organisation"(uuid, uuid) TO "authenticated", "service_role";

REVOKE ALL ON FUNCTION "sc_app"."cancel_social_profile_import_on_edit"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sc_app"."custom_access_token_claims_extension"(jsonb, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_app"."custom_access_token_claims_extension"(jsonb, jsonb) TO "supabase_auth_admin";

REVOKE ALL ON FUNCTION "sc_app"."custom_access_token_hook"(jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_app"."custom_access_token_hook"(jsonb) TO "supabase_auth_admin";

REVOKE ALL ON FUNCTION "sc_app"."handle_auth_user_profile"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sc_app"."handle_auth_user_role"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sc_app"."is_organisation_member"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_app"."is_organisation_member"(uuid, uuid) TO "authenticated", "service_role";

REVOKE ALL ON FUNCTION "sc_app"."normalise_organisation_handle"(text) FROM PUBLIC;

REVOKE ALL ON FUNCTION "sc_app"."organisation_handle_is_reserved"(text) FROM PUBLIC;

REVOKE ALL ON FUNCTION "sc_app"."record_profile_username_edit"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sc_internal"."get_account_profile_extension"(uuid) FROM PUBLIC;

REVOKE ALL ON FUNCTION "sc_internal"."update_account_profile_extension"(uuid, jsonb) FROM PUBLIC;

REVOKE ALL ON FUNCTION "sc_services"."call"(text, text, jsonb) FROM PUBLIC;

GRANT USAGE ON SCHEMA "sc_api" TO "anon", "authenticated", "service_role";

GRANT USAGE ON SCHEMA "sc_api_edge" TO "service_role";

GRANT USAGE ON SCHEMA "sc_app" TO "supabase_auth_admin";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."billing_account_members" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."billing_accounts" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."billing_features" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."customers" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."entitlement_grants" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."organisation_access_requests" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."organisation_invitations" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."organisation_members" TO "service_role";

GRANT SELECT ON TABLE "sc_app"."organisation_members" TO "supabase_auth_admin";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."organisations" TO "service_role";

GRANT SELECT ON TABLE "sc_app"."organisations" TO "supabase_auth_admin";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."prices" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."product_features" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."products" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."profiles" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."stripe_customer_mappings" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."stripe_event_payloads" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."stripe_events" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."subscription_items" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."subscriptions" TO "service_role";

GRANT SELECT ON TABLE "sc_app"."user_roles" TO "supabase_auth_admin";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."user_session_contexts" TO "service_role";

GRANT SELECT ON TABLE "sc_app"."user_session_contexts" TO "supabase_auth_admin";
