type AuthUserConfirmation = {
  confirmed_at?: string | null;
  email?: string | null;
  email_confirmed_at?: string | null;
};

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hasVerifiedSessionForEmail(user: AuthUserConfirmation | null, requestedEmail: string) {
  return Boolean(
    (user?.email_confirmed_at || user?.confirmed_at) &&
    user.email &&
    normaliseEmail(user.email) === normaliseEmail(requestedEmail),
  );
}
