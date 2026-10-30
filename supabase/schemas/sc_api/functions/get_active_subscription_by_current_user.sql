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

GRANT EXECUTE ON FUNCTION "sc_api"."get_active_subscription_by_current_user"() TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."get_active_subscription_by_current_user"() FROM PUBLIC;
