# Input validation

Use Zod to validate untrusted application input at the server boundary. Client-side validation improves feedback, but a caller can bypass or alter it and TypeScript types do not exist at runtime.

## Forms and server boundaries

- Parse every submitted form again in the Server Action, route handler, or other server-side JavaScript or TypeScript entry point before side effects, privileged calls, or persistence.
- Reuse a shared schema on the client and server when both layers intentionally accept the same input shape. The server parse remains authoritative even when the browser has already parsed the values.
- Parse raw `FormData`, JSON, query, and path values as `unknown`; normalise only as part of an explicit schema contract. Do not cast untrusted input into a trusted type.
- Return serialisable, safe field or form errors. Log diagnostic detail only through the application's protected server logging path; do not return raw Zod issues, stack traces, SQL errors, or Supabase internals by default.
- Test valid input, missing required values, wrong types, boundaries, malformed payloads, and rejection before side effects.

## Supabase Edge Functions

Validate structured body, query, path, header, and request-controlled option values with Zod when an Edge Function accepts them. Parse before selecting privileged behaviour, accessing a service client, or invoking an RPC. Keep the schema compatible with the checked-in Deno runtime and pin its dependency according to the repository's Edge Function conventions.

Zod validates declared data shapes; it does not prove that uploaded bytes match a claimed MIME type or that a URL, object path, or identifier is authorised. Apply size limits, content inspection, allow-lists, authentication, authorisation, and Storage policies separately.

## Supabase RPCs and PostgreSQL

PostgreSQL functions cannot execute Zod. When a Server Action, route handler, or Edge Function calls an RPC, validate its untrusted inputs with Zod before the call. The RPC must still enforce its own contract with PostgreSQL parameter types, domain or table constraints, explicit range and state checks, transaction invariants, authentication, authorisation, grants, and RLS as applicable.

Browser-callable RPCs are public server boundaries even when the normal UI validates first. Design and test them as though a caller constructed the request manually. For direct browser calls, client-side Zod may improve feedback but PostgreSQL remains responsible for rejecting invalid or unauthorised input.

## Schema ownership

Keep reusable schemas beside the domain or operation that owns the input contract, not inside a presentation component merely because a form first uses them. Do not force one schema across boundaries that intentionally accept different shapes; derive explicit client and server schemas from shared primitives when required.

Zod complements rather than replaces database constraints, RLS, grants, CSRF protections, rate limiting, file validation, or business-rule checks.
