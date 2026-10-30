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

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_set_catalogue_item_inactive"(text, text) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_set_catalogue_item_inactive"(text, text) FROM PUBLIC;
