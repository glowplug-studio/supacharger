'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/supacharger/components/primitives/button';
import { Input } from '@/supacharger/components/primitives/input';
import { Label } from '@/supacharger/components/primitives/label';

import type { OrganisationMutationResponse, OrganisationSummary } from './organisation-contract';
import { organisationSettingsPath } from './organisation-routes';

type OrganisationChooserProps = {
  initialOrganisations: OrganisationSummary[];
  inviteToken: string | null;
  nextPath: string | null;
};

async function mutateOrganisation(body: Record<string, unknown>) {
  const response = await fetch('/api/organisations', {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return await response.json() as OrganisationMutationResponse;
}

export function OrganisationChooser({ initialOrganisations, inviteToken, nextPath }: OrganisationChooserProps) {
  const router = useRouter();
  const t = useTranslations('Organisations');
  const [organisations, setOrganisations] = useState(initialOrganisations);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [joinHandle, setJoinHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<'available' | 'unavailable' | null>(null);

  async function checkHandle(value: string) {
    const normalised = value.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(normalised)) {
      setHandleStatus('unavailable');
      return false;
    }
    const result = await mutateOrganisation({ action: 'handle.available', handle: normalised });
    const available = result.ok && result.organisation.available === true;
    setHandleStatus(available ? 'available' : 'unavailable');
    return available;
  }

  async function switchOrganisation(organisation: OrganisationSummary) {
    setBusy(`switch-${organisation.id}`);
    setMessage(null);
    const result = await mutateOrganisation({ action: 'switch', handle: organisation.handle });
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.message });
      setBusy(null);
      return;
    }
    router.push(nextPath || organisationSettingsPath(organisation.handle));
    router.refresh();
  }

  async function createOrganisation(event: React.FormEvent) {
    event.preventDefault();
    setBusy('create');
    setMessage(null);
    const normalisedHandle = handle.trim().toLowerCase();
    if (!await checkHandle(normalisedHandle)) {
      setMessage({ kind: 'error', text: t('errors.handleUnavailable') });
      setBusy(null);
      return;
    }
    const result = await mutateOrganisation({ action: 'create', handle: normalisedHandle, name });
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.message });
      setBusy(null);
      return;
    }
    router.push(organisationSettingsPath(String(result.organisation.handle || normalisedHandle)));
    router.refresh();
  }

  async function requestAccess(event: React.FormEvent) {
    event.preventDefault();
    setBusy('request');
    setMessage(null);
    const result = await mutateOrganisation({ action: 'access.request', handle: joinHandle.trim().toLowerCase() });
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.message });
    } else {
      setMessage({ kind: 'success', text: t('chooser.accessRequested') });
      setJoinHandle('');
    }
    setBusy(null);
  }

  async function acceptInvitation() {
    if (!inviteToken) return;
    setBusy('invite');
    setMessage(null);
    const result = await mutateOrganisation({ action: 'invites.accept', token: inviteToken });
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.message });
      setBusy(null);
      return;
    }
    const accepted = result.organisation as unknown as OrganisationSummary;
    setOrganisations((current) => [...current.filter((item) => item.id !== accepted.id), accepted]);
    setMessage({ kind: 'success', text: t('chooser.invitationAccepted') });
    setBusy(null);
    router.replace(organisationSettingsPath(accepted.handle));
    router.refresh();
  }

  return (
    <div className='space-y-6' data-sc-organisation-chooser>
      {inviteToken ? (
        <section className='border-primary/30 bg-primary/5 rounded-xl border p-5' data-sc-organisation-invitation>
          <h2 className='font-semibold'>{t('chooser.invitationTitle')}</h2>
          <p className='text-muted-foreground mt-1 text-sm'>{t('chooser.invitationDescription')}</p>
          <Button className='mt-4' disabled={busy !== null} onClick={acceptInvitation}>
            {busy === 'invite' ? t('common.working') : t('chooser.acceptInvitation')}
          </Button>
        </section>
      ) : null}

      {message ? (
        <p className={message.kind === 'error' ? 'text-destructive text-sm' : 'text-sm text-emerald-600'} role={message.kind === 'error' ? 'alert' : 'status'}>
          {message.text}
        </p>
      ) : null}

      <section className='space-y-4' aria-labelledby='organisation-memberships-title'>
        <div>
          <h2 className='text-xl font-semibold' id='organisation-memberships-title'>{t('chooser.membershipsTitle')}</h2>
          <p className='text-muted-foreground mt-1 text-sm'>{t('chooser.membershipsDescription')}</p>
        </div>
        {organisations.length === 0 ? (
          <div className='border-border bg-card rounded-xl border border-dashed p-6 text-center'>
            <p className='font-medium'>{t('chooser.emptyTitle')}</p>
            <p className='text-muted-foreground mt-1 text-sm'>{t('chooser.emptyDescription')}</p>
          </div>
        ) : (
          <ul className='grid gap-3 sm:grid-cols-2'>
            {organisations.map((organisation) => (
              <li className='border-border bg-card rounded-xl border p-5 shadow-sm' key={organisation.id}>
                <div className='flex items-start justify-between gap-4'>
                  <div className='min-w-0'>
                    <p className='truncate font-semibold'>{organisation.name}</p>
                    <p className='text-muted-foreground truncate text-sm'>/{organisation.handle}</p>
                    <p className='text-muted-foreground mt-2 text-xs'>{t(`roles.${organisation.role}`)} · {t('chooser.memberCount', { count: organisation.member_count })}</p>
                  </div>
                  {organisation.is_active ? <span className='bg-primary/10 text-primary rounded-full px-2 py-1 text-xs'>{t('chooser.active')}</span> : null}
                </div>
                <Button className='mt-4 w-full' disabled={busy !== null} onClick={() => switchOrganisation(organisation)} variant={organisation.is_active ? 'outline' : 'default'}>
                  {busy === `switch-${organisation.id}` ? t('common.working') : organisation.is_active ? t('chooser.openSettings') : t('chooser.select')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className='grid gap-6 lg:grid-cols-2'>
        <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
          <h2 className='text-lg font-semibold'>{t('chooser.createTitle')}</h2>
          <p className='text-muted-foreground mt-1 text-sm'>{t('chooser.createDescription')}</p>
          <form className='mt-5 space-y-4' onSubmit={createOrganisation}>
            <div className='space-y-2'>
              <Label htmlFor='organisation-name'>{t('profile.name')}</Label>
              <Input id='organisation-name' maxLength={100} onChange={(event) => setName(event.target.value)} required value={name} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='organisation-handle'>{t('profile.handle')}</Label>
              <Input
                aria-describedby='organisation-handle-status'
                autoCapitalize='none'
                id='organisation-handle'
                maxLength={64}
                onBlur={(event) => void checkHandle(event.target.value)}
                onChange={(event) => { setHandle(event.target.value); setHandleStatus(null); }}
                pattern='[a-z0-9][a-z0-9-]*[a-z0-9]'
                required
                value={handle}
              />
              <p className={handleStatus === 'unavailable' ? 'text-destructive text-sm' : 'text-muted-foreground text-sm'} id='organisation-handle-status' role={handleStatus ? 'status' : undefined}>
                {handleStatus === 'available' ? t('profile.handleAvailable') : handleStatus === 'unavailable' ? t('profile.handleUnavailable') : t('profile.handleHelp')}
              </p>
            </div>
            <Button disabled={busy !== null} type='submit'>{busy === 'create' ? t('common.working') : t('chooser.create')}</Button>
          </form>
        </section>

        <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
          <h2 className='text-lg font-semibold'>{t('chooser.requestTitle')}</h2>
          <p className='text-muted-foreground mt-1 text-sm'>{t('chooser.requestDescription')}</p>
          <form className='mt-5 space-y-4' onSubmit={requestAccess}>
            <div className='space-y-2'>
              <Label htmlFor='organisation-request-handle'>{t('profile.handle')}</Label>
              <Input autoCapitalize='none' id='organisation-request-handle' onChange={(event) => setJoinHandle(event.target.value)} required value={joinHandle} />
            </div>
            <Button disabled={busy !== null} type='submit' variant='outline'>{busy === 'request' ? t('common.working') : t('chooser.request')}</Button>
          </form>
        </section>
      </div>
    </div>
  );
}
