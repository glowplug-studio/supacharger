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
  CONSTRAINT "auth_session_transfers_token_hash_format_check" CHECK ((token_hash ~ '^[0-9a-f]{64}$'::text)),
  CONSTRAINT "auth_session_transfers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."auth_session_transfers"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX auth_session_transfers_expires_at_idx ON sc_app.auth_session_transfers USING btree (expires_at);

CREATE INDEX auth_session_transfers_source_session_id_idx ON sc_app.auth_session_transfers USING btree (source_session_id);

CREATE UNIQUE INDEX auth_session_transfers_token_hash_key ON sc_app.auth_session_transfers USING btree (token_hash);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."auth_session_transfers" TO "postgres";

COMMENT ON COLUMN "sc_app"."auth_session_transfers"."source_session_id" IS 'Supabase Auth session that issued the grant; create and claim require the matching auth.sessions row.';

COMMENT ON COLUMN "sc_app"."auth_session_transfers"."token_hash" IS 'Lowercase hexadecimal SHA-256 digest of the user-visible random grant.';

COMMENT ON TABLE "sc_app"."auth_session_transfers" IS 'Private short-lived, single-use browser session-transfer grants. Only SHA-256 grant digests are stored.';
