'use client';

import { LoginUserForm } from '@/supacharger/components/forms/login-user-form';
import { TurnstileGate } from '@/supacharger/components/forms/turnstile-gate';

export function CreateAccountForm() {
  return <TurnstileGate><LoginUserForm initialMode='signup' /></TurnstileGate>;
}
