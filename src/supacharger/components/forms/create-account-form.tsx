'use client';

import { LoginUserForm } from '@/supacharger/components/forms/login-user-form';

export function CreateAccountForm() {
  return <LoginUserForm initialMode='signup' />;
}
