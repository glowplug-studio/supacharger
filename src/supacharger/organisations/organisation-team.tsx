'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { showActionToast } from '@/supacharger/components/notifications/action-toast';
import { Button } from '@/supacharger/components/primitives/button';
import { Input } from '@/supacharger/components/primitives/input';
import { Label } from '@/supacharger/components/primitives/label';

import type {
  OrganisationDetails,
  OrganisationMember,
  OrganisationMutationResponse,
} from './organisation-contract';

async function mutate(body: Record<string, unknown>) {
  const response = await fetch('/api/organisations', {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return await response.json() as OrganisationMutationResponse;
}

export function OrganisationTeam({ initialOrganisation }: { initialOrganisation: OrganisationDetails }) {
  const t = useTranslations('Organisations');
  const [organisation, setOrganisation] = useState(initialOrganisation);
  const [busy, setBusy] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const canManage = organisation.role === 'owner' || organisation.role === 'admin';

  function applyResult(result: OrganisationMutationResponse, successMessage: string) {
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.message });
      showActionToast('error', result.message);
      return false;
    }
    setOrganisation(result.organisation as unknown as OrganisationDetails);
    setMessage({ kind: 'success', text: successMessage });
    showActionToast('success', successMessage);
    return true;
  }

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setBusy('invite');
    setMessage(null);
    setInviteLink(null);
    const result = await mutate({ action: 'invites.create', email, handle: organisation.handle, role: inviteRole });
    if (applyResult(result, t('team.invitationCreated')) && result.ok && typeof result.organisation.inviteToken === 'string') {
      setInviteLink(`${window.location.origin}/account/organisation?invite=${encodeURIComponent(result.organisation.inviteToken)}`);
      setEmail('');
    }
    setBusy(null);
  }

  async function updateMember(member: OrganisationMember, action: 'remove' | 'role', role?: 'owner' | 'admin' | 'member') {
    const key = `${action}-${member.user_id}`;
    setBusy(key);
    setMessage(null);
    const result = await mutate(action === 'remove'
      ? { action: 'members.remove', handle: organisation.handle, userId: member.user_id }
      : { action: 'members.updateRole', handle: organisation.handle, role, userId: member.user_id });
    applyResult(result, action === 'remove' ? t('team.memberRemoved') : t('team.roleUpdated'));
    setBusy(null);
  }

  async function revokeInvitation(invitationId: string) {
    setBusy(`invite-${invitationId}`);
    setMessage(null);
    const result = await mutate({ action: 'invites.revoke', handle: organisation.handle, invitationId });
    applyResult(result, t('team.invitationRevoked'));
    setBusy(null);
  }

  async function reviewRequest(requestId: string, decision: 'approve' | 'reject') {
    setBusy(`request-${requestId}`);
    setMessage(null);
    const result = await mutate({ action: `access.${decision}`, handle: organisation.handle, requestId });
    applyResult(result, decision === 'approve' ? t('team.requestApproved') : t('team.requestRejected'));
    setBusy(null);
  }

  return (
    <div className='space-y-6' data-sc-organisation-team>
      <header>
        <h2 className='text-2xl font-semibold tracking-tight'>{t('team.title')}</h2>
        <p className='text-muted-foreground mt-1 text-sm'>{canManage ? t('team.descriptionManager') : t('team.descriptionMember')}</p>
      </header>
      {message ? <p className={message.kind === 'error' ? 'text-destructive text-sm' : 'text-sm text-emerald-600'} role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</p> : null}

      <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
        <h3 className='font-semibold'>{t('team.membersTitle')}</h3>
        <ul className='mt-4 divide-y'>
          {organisation.members.map((member) => (
            <li className='flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between' key={member.user_id}>
              <div className='min-w-0'>
                <p className='truncate font-medium'>{memberName(member, t('team.unnamedMember'))}</p>
                <p className='text-muted-foreground truncate text-sm'>{member.username ? `@${member.username}` : member.user_id}</p>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                {canManage ? (
                  <select
                    aria-label={t('team.roleFor', { name: memberName(member, t('team.unnamedMember')) })}
                    className='border-input bg-background min-h-9 rounded-md border px-2 text-sm'
                    disabled={busy !== null || (organisation.role !== 'owner' && member.role !== 'member')}
                    onChange={(event) => void updateMember(member, 'role', event.target.value as 'owner' | 'admin' | 'member')}
                    value={member.role}
                  >
                    <option value='member'>{t('roles.member')}</option>
                    {organisation.role === 'owner' ? <option value='admin'>{t('roles.admin')}</option> : null}
                    {organisation.role === 'owner' ? <option value='owner'>{t('roles.owner')}</option> : null}
                  </select>
                ) : <span className='text-muted-foreground text-sm'>{t(`roles.${member.role}`)}</span>}
                {canManage ? <Button disabled={busy !== null} onClick={() => void updateMember(member, 'remove')} size='sm' type='button' variant='outline'>{busy === `remove-${member.user_id}` ? t('common.working') : t('team.remove')}</Button> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {canManage ? (
        <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
          <h3 className='font-semibold'>{t('team.inviteTitle')}</h3>
          <p className='text-muted-foreground mt-1 text-sm'>{t('team.inviteDescription')}</p>
          <form className='mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto]' onSubmit={invite}>
            <div className='space-y-2'>
              <Label className='sr-only' htmlFor='organisation-invite-email'>{t('team.email')}</Label>
              <Input id='organisation-invite-email' onChange={(event) => setEmail(event.target.value)} placeholder={t('team.email')} required type='email' value={email} />
            </div>
            <select aria-label={t('team.inviteRole')} className='border-input bg-background min-h-10 rounded-md border px-3 text-sm' onChange={(event) => setInviteRole(event.target.value as 'admin' | 'member')} value={inviteRole}>
              <option value='member'>{t('roles.member')}</option>
              {organisation.role === 'owner' ? <option value='admin'>{t('roles.admin')}</option> : null}
            </select>
            <Button disabled={busy !== null} type='submit'>{busy === 'invite' ? t('common.working') : t('team.invite')}</Button>
          </form>
          {inviteLink ? (
            <div className='bg-muted mt-4 rounded-lg p-4' role='status'>
              <p className='text-sm font-medium'>{t('team.copyInviteOnce')}</p>
              <div className='mt-2 flex gap-2'>
                <Input aria-label={t('team.inviteLink')} readOnly value={inviteLink} />
                <Button onClick={() => void navigator.clipboard.writeText(inviteLink)} type='button' variant='outline'>{t('team.copy')}</Button>
              </div>
            </div>
          ) : null}
          {organisation.invitations.length > 0 ? (
            <ul className='mt-5 divide-y'>
              {organisation.invitations.map((invitation) => (
                <li className='flex items-center justify-between gap-3 py-3' key={invitation.id}>
                  <div className='min-w-0'><p className='truncate text-sm font-medium'>{invitation.email}</p><p className='text-muted-foreground text-xs'>{t(`roles.${invitation.role}`)} · {t('team.expires', { date: formatOrganisationDate(invitation.expires_at) })}</p></div>
                  <Button disabled={busy !== null} onClick={() => void revokeInvitation(invitation.id)} size='sm' type='button' variant='outline'>{t('team.revoke')}</Button>
                </li>
              ))}
            </ul>
          ) : <p className='text-muted-foreground mt-4 text-sm'>{t('team.noInvitations')}</p>}
        </section>
      ) : null}

      {canManage ? (
        <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
          <h3 className='font-semibold'>{t('team.requestsTitle')}</h3>
          <p className='text-muted-foreground mt-1 text-sm'>{t('team.requestsDescription')}</p>
          {organisation.access_requests.length === 0 ? <p className='text-muted-foreground mt-4 text-sm'>{t('team.noRequests')}</p> : (
            <ul className='mt-4 divide-y'>
              {organisation.access_requests.map((request) => (
                <li className='flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between' key={request.id}>
                  <div><p className='font-medium'>{[request.first_name, request.last_name].filter(Boolean).join(' ') || request.username || t('team.unnamedMember')}</p><p className='text-muted-foreground text-xs'>{t('team.requestedOn', { date: formatOrganisationDate(request.created_at) })}</p></div>
                  <div className='flex gap-2'><Button disabled={busy !== null} onClick={() => void reviewRequest(request.id, 'approve')} size='sm'>{t('team.approve')}</Button><Button disabled={busy !== null} onClick={() => void reviewRequest(request.id, 'reject')} size='sm' variant='outline'>{t('team.reject')}</Button></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

function memberName(member: OrganisationMember, fallback: string) {
  return [member.first_name, member.last_name].filter(Boolean).join(' ') || member.username || fallback;
}

function formatOrganisationDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
}
