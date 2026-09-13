import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import ResetPasswordNewForm from '@/supacharger/components/forms/reset-password-new-form';

export const instant = false;

export default async function ResetPasswordFormPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.id || data.user.is_anonymous) redirect('/account/login');

  return <ResetPasswordNewForm />;
}
