import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { hasRecoveryAuthenticationMethod } from '@/supacharger/auth/recovery-session';
import ResetPasswordNewForm from '@/supacharger/components/forms/reset-password-new-form';

export const instant = false;

export default async function ResetPasswordFormPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !hasRecoveryAuthenticationMethod(data?.claims)) redirect('/account/login');

  return <ResetPasswordNewForm />;
}
