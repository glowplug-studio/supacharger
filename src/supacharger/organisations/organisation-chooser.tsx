'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { showActionToast } from '@/supacharger/components/notifications/action-toast';
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
  return (await response.json()) as OrganisationMutationResponse;
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

  function announce(kind: 'error' | 'success', text: string) {
    setMessage({ kind, text });
    showActionToast(kind, text);
  }

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
      announce('error', result.message);
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
    if (!(await checkHandle(normalisedHandle))) {
      announce('error', t('errors.handleUnavailable'));
      setBusy(null);
      return;
    }
    const result = await mutateOrganisation({ action: 'create', handle: normalisedHandle, name });
    if (!result.ok) {
      announce('error', result.message);
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
      announce('error', result.message);
    } else {
      announce('success', t('chooser.accessRequested'));
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
      announce('error', result.message);
      setBusy(null);
      return;
    }
    const accepted = result.organisation as unknown as OrganisationSummary;
    setOrganisations((current) => [...current.filter((item) => item.id !== accepted.id), accepted]);
    announce('success', t('chooser.invitationAccepted'));
    setBusy(null);
    router.replace(organisationSettingsPath(accepted.handle));
    router.refresh();
  }

  return (
    <div className='sc-organisation-chooser' data-sc-organisation-chooser>
      {inviteToken ? (
        <section className='sc-organisation-panel sc-organisation-invitation' data-sc-organisation-invitation>
          <h2 className='sc-organisation-panel-title'>{t('chooser.invitationTitle')}</h2>
          <p className='sc-organisation-panel-description'>{t('chooser.invitationDescription')}</p>
          <Button className='sc-organisation-panel-action' disabled={busy !== null} onClick={acceptInvitation}>
            {busy === 'invite' ? t('common.working') : t('chooser.acceptInvitation')}
          </Button>
        </section>
      ) : null}

      {message ? (
        <p
          className='sc-organisation-status'
          data-kind={message.kind}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      ) : null}

      <section className='sc-organisation-memberships' aria-labelledby='organisation-memberships-title'>
        <div className='sc-organisation-section-header'>
          <h2 className='sc-organisation-section-title' id='organisation-memberships-title'>
            {t('chooser.membershipsTitle')}
          </h2>
          <p className='sc-organisation-section-description'>{t('chooser.membershipsDescription')}</p>
        </div>
        {organisations.length === 0 ? (
          <div className='sc-organisation-empty'>
            <p className='sc-organisation-empty-title'>{t('chooser.emptyTitle')}</p>
            <p className='sc-organisation-empty-description'>{t('chooser.emptyDescription')}</p>
          </div>
        ) : (
          <ul className='sc-organisation-card-list'>
            {organisations.map((organisation) => (
              <li className='sc-organisation-card' key={organisation.id}>
                <div className='sc-organisation-card-header'>
                  <div className='sc-organisation-card-identity'>
                    <p className='sc-organisation-card-title'>{organisation.name}</p>
                    <p className='sc-organisation-card-handle'>/{organisation.handle}</p>
                    <p className='sc-organisation-card-meta'>
                      {t(`roles.${organisation.role}`)} ·{' '}
                      {t('chooser.memberCount', { count: organisation.member_count })}
                    </p>
                  </div>
                  {organisation.is_active ? (
                    <span className='sc-organisation-active-badge'>{t('chooser.active')}</span>
                  ) : null}
                </div>
                <Button
                  className='sc-organisation-card-action'
                  disabled={busy !== null}
                  onClick={() => switchOrganisation(organisation)}
                  variant={organisation.is_active ? 'outline' : 'default'}
                >
                  {busy === `switch-${organisation.id}`
                    ? t('common.working')
                    : organisation.is_active
                      ? t('chooser.openSettings')
                      : t('chooser.select')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className='sc-organisation-action-grid'>
        <section className='sc-organisation-panel'>
          <h2 className='sc-organisation-panel-title'>{t('chooser.createTitle')}</h2>
          <p className='sc-organisation-panel-description'>{t('chooser.createDescription')}</p>
          <form className='sc-organisation-form' onSubmit={createOrganisation}>
            <div className='sc-organisation-field'>
              <Label htmlFor='organisation-name'>{t('profile.name')}</Label>
              <Input
                id='organisation-name'
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </div>
            <div className='sc-organisation-field'>
              <Label htmlFor='organisation-handle'>{t('profile.handle')}</Label>
              <Input
                aria-describedby='organisation-handle-status'
                autoCapitalize='none'
                id='organisation-handle'
                maxLength={64}
                onBlur={(event) => void checkHandle(event.target.value)}
                onChange={(event) => {
                  setHandle(event.target.value);
                  setHandleStatus(null);
                }}
                pattern='[a-z0-9][a-z0-9-]*[a-z0-9]'
                required
                value={handle}
              />
              <p
                className='sc-organisation-field-help'
                data-state={handleStatus ?? 'idle'}
                id='organisation-handle-status'
                role={handleStatus ? 'status' : undefined}
              >
                {handleStatus === 'available'
                  ? t('profile.handleAvailable')
                  : handleStatus === 'unavailable'
                    ? t('profile.handleUnavailable')
                    : t('profile.handleHelp')}
              </p>
            </div>
            <Button disabled={busy !== null} type='submit'>
              {busy === 'create' ? t('common.working') : t('chooser.create')}
            </Button>
          </form>
        </section>

        <section className='sc-organisation-panel'>
          <h2 className='sc-organisation-panel-title'>{t('chooser.requestTitle')}</h2>
          <p className='sc-organisation-panel-description'>{t('chooser.requestDescription')}</p>
          <form className='sc-organisation-form' onSubmit={requestAccess}>
            <div className='sc-organisation-field'>
              <Label htmlFor='organisation-request-handle'>{t('profile.handle')}</Label>
              <Input
                autoCapitalize='none'
                id='organisation-request-handle'
                onChange={(event) => setJoinHandle(event.target.value)}
                required
                value={joinHandle}
              />
            </div>
            <Button disabled={busy !== null} type='submit' variant='outline'>
              {busy === 'request' ? t('common.working') : t('chooser.request')}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
