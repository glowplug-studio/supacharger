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

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_upsert_product"(jsonb) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_upsert_product"(jsonb) FROM PUBLIC;
