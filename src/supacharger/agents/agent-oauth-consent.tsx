'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Brain, ExternalLink, LoaderCircle, ShieldCheck } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import type { Json } from '@/lib/supabase/types';
import { AgentConsentExtension } from '@/supacharger.adapters/agents/consent';
import { organisationListSchema, type OrganisationSummary } from '@/supacharger/organisations/organisation-contract';
import type { OAuthAuthorizationDetails } from '@supabase/supabase-js';

import { createAgentConnection, mutateAgentConnection } from './agent-connection-client';
import type { AgentConsentExtensionState } from './agent-connection-contract';

const EMPTY_EXTENSION: AgentConsentExtensionState = { payload: {}, valid: false };

export function AgentOAuthConsent({ authorizationId }: { authorizationId: string }) {
  const t = useTranslations('AgentConnections.consent');
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [organisations, setOrganisations] = useState<OrganisationSummary[]>([]);
  const [organisationId, setOrganisationId] = useState('');
  const [extension, setExtension] = useState<AgentConsentExtensionState>(EMPTY_EXTENSION);
  const [loading, setLoading] = useState(Boolean(authorizationId));
  const [pending, setPending] = useState<'approve' | 'deny' | null>(null);
  const [error, setError] = useState<string | null>(authorizationId ? null : t('errors.missingId'));

  useEffect(() => {
    if (!authorizationId) return;
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        const next = `/auth/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
        window.location.replace(`/account/login?next=${encodeURIComponent(next)}`);
        return;
      }
      const [authorisation, organisationResult] = await Promise.all([
        supabase.auth.oauth.getAuthorizationDetails(authorizationId),
        supabase.schema('api').rpc('organisations', {
          input_payload: { action: 'list' } as Json,
        }),
      ]);
      if (cancelled) return;
      if (authorisation.error || !authorisation.data) {
        setError(authorisation.error?.message ?? t('errors.invalid'));
        setLoading(false);
        return;
      }
      if (!('authorization_id' in authorisation.data)) {
        window.location.assign(authorisation.data.redirect_url);
        return;
      }
      if (organisationResult.error) {
        setError(organisationResult.error.message);
        setLoading(false);
        return;
      }
      const list = organisationListSchema.parse(organisationResult.data);
      setDetails(authorisation.data);
      setOrganisations(list.organisations);
      setOrganisationId(list.activeOrganisationId ?? list.organisations[0]?.id ?? '');
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authorizationId, t]);

  const updateExtension = useCallback((state: AgentConsentExtensionState) => {
    setExtension(state);
  }, []);

  async function deny() {
    if (!details || pending) return;
    setPending('deny');
    setError(null);
    const { data, error: denyError } = await createClient().auth.oauth.denyAuthorization(
      details.authorization_id,
      { skipBrowserRedirect: true },
    );
    if (denyError || !data?.redirect_url) {
      setError(denyError?.message ?? t('errors.deny'));
      setPending(null);
      return;
    }
    window.location.assign(data.redirect_url);
  }

  async function approve() {
    if (!details || !organisationId || !extension.valid || pending) return;
    setPending('approve');
    setError(null);
    const supabase = createClient();
    let connectionId: string | null = null;
    try {
      const connection = await createAgentConnection(supabase, {
        extension: extension.payload,
        oauthClientId: details.client.id,
        oauthClientName: details.client.name || t('unnamedClient'),
        oauthScopes: details.scope.split(/\s+/).filter(Boolean),
        organisationId,
      });
      connectionId = connection.agentConnectionId;
      const { data, error: approveError } = await supabase.auth.oauth.approveAuthorization(
        details.authorization_id,
        { skipBrowserRedirect: true },
      );
      if (approveError || !data?.redirect_url) {
        throw approveError ?? new Error(t('errors.noRedirect'));
      }
      window.location.assign(data.redirect_url);
    } catch (caught) {
      if (connectionId) {
        await mutateAgentConnection(supabase, 'revoke', connectionId).catch(() => undefined);
        await mutateAgentConnection(supabase, 'delete', connectionId).catch(() => undefined);
      }
      setError(caught instanceof Error ? caught.message : t('errors.approve'));
      setPending(null);
    }
  }

  if (loading) {
    return (
      <div className='sc-agent-consent sc-agent-consent-loading'>
        <LoaderCircle aria-hidden='true' className='sc-agent-loading-ring' />
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <main className='sc-agent-consent' data-sc-agent-consent>
      <header className='sc-agent-consent-header'>
        <span className='sc-agent-consent-icon-frame'>
          <Brain aria-hidden='true' className='sc-agent-consent-icon' />
        </span>
        <div className='sc-agent-consent-heading'>
          <h1 className='sc-agent-consent-title'>{t('title', { client: details?.client.name || t('unnamedClient') })}</h1>
          <p className='sc-agent-consent-description'>{t('description')}</p>
        </div>
      </header>

      <section className='sc-agent-consent-notice'>
        <ShieldCheck aria-hidden='true' className='sc-agent-consent-notice-icon' />
        <div>
          <h2 className='sc-agent-consent-notice-title'>{t('notice.title')}</h2>
          <p className='sc-agent-consent-notice-description'>{t('notice.description')}</p>
        </div>
      </section>

      {organisations.length ? (
        <label className='sc-agent-field'>
          <span className='sc-agent-field-label'>{t('organisation.label')}</span>
          <span className='sc-agent-field-help'>{t('organisation.help')}</span>
          <select
            className='sc-agent-select'
            disabled={Boolean(pending)}
            onChange={(event) => {
              setOrganisationId(event.target.value);
              setExtension(EMPTY_EXTENSION);
            }}
            value={organisationId}
          >
            {organisations.map((organisation) => (
              <option key={organisation.id} value={organisation.id}>{organisation.name}</option>
            ))}
          </select>
        </label>
      ) : (
        <p className='sc-agent-empty-description'>{t('organisation.empty')}</p>
      )}

      {organisationId ? (
        <AgentConsentExtension
          disabled={Boolean(pending)}
          key={organisationId}
          onChange={updateExtension}
          organisationId={organisationId}
        />
      ) : null}

      {details ? (
        <dl className='sc-agent-consent-request'>
          <div className='sc-agent-consent-request-row'>
            <dt>{t('requestedScopes')}</dt>
            <dd>{details.scope || t('noScopes')}</dd>
          </div>
          <div className='sc-agent-consent-request-row'>
            <dt><ExternalLink aria-hidden='true' className='sc-agent-consent-request-icon' />{t('returnsTo')}</dt>
            <dd>{details.redirect_uri}</dd>
          </div>
        </dl>
      ) : null}

      {error ? <p className='sc-agent-status' data-kind='error' role='alert'>{error}</p> : null}
      <div className='sc-agent-consent-actions'>
        <button
          className='sc-agent-button sc-agent-button-secondary'
          disabled={!details || Boolean(pending)}
          onClick={() => void deny()}
          type='button'
        >
          {pending === 'deny' ? <LoaderCircle aria-hidden='true' className='sc-agent-button-loading-ring' /> : null}
          {t('deny')}
        </button>
        <button
          className='sc-agent-button sc-agent-button-primary'
          disabled={!details || !organisationId || !extension.valid || Boolean(pending)}
          onClick={() => void approve()}
          type='button'
        >
          {pending === 'approve' ? <LoaderCircle aria-hidden='true' className='sc-agent-button-loading-ring' /> : null}
          {t('approve')}
        </button>
      </div>
    </main>
  );
}
