CREATE TABLE "sc_app"."billing_account_members" (
  "billing_account_id" uuid                     NOT NULL,
  "user_id"            uuid                     NOT NULL,
  "role"               text                     NOT NULL DEFAULT 'member'::text,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "billing_account_members_pkey" PRIMARY KEY (billing_account_id, user_id),
  CONSTRAINT "billing_account_members_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'billing_admin'::text, 'member'::text]))),
  CONSTRAINT "billing_account_members_billing_account_id_fkey" FOREIGN KEY (billing_account_id) REFERENCES sc_app.billing_accounts(id) ON DELETE CASCADE,
  CONSTRAINT "billing_account_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES sc_app.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."billing_account_members"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX billing_account_members_user_idx ON sc_app.billing_account_members USING btree (user_id, billing_account_id);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."billing_account_members" TO "postgres", "service_role";
