/** ==========
 *
 * Initialise RPC functions
 *
 * ========== */

/**
 * Checks a provided string against the encrypted password of the current user.
 *
 * @param password The password to check.
 * @returns A JSON object with a boolean value indicating whether the password is correct.
 */
CREATE OR REPLACE FUNCTION public.verify_user_password(password text)
RETURNS jsonb
SECURITY definer
AS $$
DECLARE
  user_id uuid := auth.uid();
  matched boolean;
BEGIN
  matched := EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
      AND crypt(password::text, encrypted_password) = encrypted_password
  );
  RETURN jsonb_build_object(
    'matched', matched
  );
END;
$$ LANGUAGE plpgsql;