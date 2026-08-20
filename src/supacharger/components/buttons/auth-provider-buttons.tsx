import FacebookLogo from '@/assets/images/socialAuthIcons/FacebookLogo.svg';
import GoogleLogo from '@/assets/images/socialAuthIcons/GoogleLogo.svg';
import { Button } from '@/components/ui/button';
import { signInWithOAuth, type SupabaseOAuthProvider } from '@/lib/supabase/supacharger/supabase-auth';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export default function AuthProviderButtons() {
  const providers = [
    { key: 'google', enabled: SC_CONFIG.AUTH_PROVDERS_ENABLED.google, label: 'Google', Logo: GoogleLogo },
    { key: 'facebook', enabled: SC_CONFIG.AUTH_PROVDERS_ENABLED.facebook, label: 'Facebook', Logo: FacebookLogo },
  ];
  const enabledProviders = providers.filter((provider) => provider.enabled);

  if (enabledProviders.length === 0) return null;

  return (
    <div className='grid w-full grid-cols-1 gap-3'>
      {enabledProviders.map(({ key, label, Logo }) => (
        <Button
          type='button'
          variant='ghost'
          className='sc-auth-surface-button grid w-full grid-cols-[1.75rem_1fr_1.75rem]'
          key={key}
          onClick={() => signInWithOAuth(key as SupabaseOAuthProvider)}
        >
          <Logo className='h-5 w-5 justify-self-start' />
          <span className='justify-self-center'>{label}</span>
          <span aria-hidden='true' />
        </Button>
      ))}
    </div>
  );
}
