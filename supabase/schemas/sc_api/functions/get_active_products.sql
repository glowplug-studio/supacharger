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

GRANT EXECUTE ON FUNCTION "sc_api"."get_active_products"() TO "anon", "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."get_active_products"() FROM PUBLIC;
