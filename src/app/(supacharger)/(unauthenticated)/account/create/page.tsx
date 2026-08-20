import { AuthEntry } from '@/supacharger/components/forms/auth-entry';

export default function CreateAccountPage() {
  return (
    <main id='sc_account-create-page' className='w-full max-w-md'>
      <AuthEntry initialMode='signup' />
    </main>
  );
}
