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
              where si.subscription_id = s.subscription_id
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

GRANT EXECUTE ON FUNCTION "sc_api"."get_billing_overview_by_current_user"() TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."get_billing_overview_by_current_user"() FROM PUBLIC;
