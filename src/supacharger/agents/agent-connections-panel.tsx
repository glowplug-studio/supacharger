'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Brain, LoaderCircle, Trash2, Unplug } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { AgentConnectionExtensionSummary } from '@/supacharger.adapters/agents/connection-summary';
import { showActionToast } from '@/supacharger/components/notifications/action-toast';

import { listAgentConnections, mutateAgentConnection } from './agent-connection-client';
import type { AgentConnection, AgentConnectionList } from './agent-connection-contract';

type AgentConnectionsPanelProps =
  | { scope: 'mine' }
  | { scope: 'organisation'; organisationId: string };

function connectionOwner(connection: AgentConnection, fallback: string) {
  const name = [connection.authorisedFirstName, connection.authorisedLastName].filter(Boolean).join(' ');
  return name || connection.authorisedUsername || fallback;
}

function ConnectionActionIcon({ action }: { action: 'delete' | 'revoke' }) {
  const Icon = action === 'delete' ? Trash2 : Unplug;
  return <Icon aria-hidden='true' className='sc-agent-action-icon' />;
}

export function AgentConnectionsPanel(props: AgentConnectionsPanelProps) {
  const t = useTranslations('AgentConnections');
  const scope = props.scope;
  const organisationId = props.scope === 'organisation' ? props.organisationId : null;
  const [result, setResult] = useState<AgentConnectionList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setResult(await listAgentConnections(
        createClient(),
        scope === 'organisation' && organisationId
          ? { scope, organisationId }
          : { scope: 'mine' },
      ));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('errors.load'));
    }
  }, [organisationId, scope, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function mutate(connection: AgentConnection, action: 'delete' | 'revoke') {
    setPendingId(connection.agentConnectionId);
    setError(null);
    const supabase = createClient();
    try {
      await mutateAgentConnection(supabase, action, connection.agentConnectionId);
      let message = t(action === 'delete' ? 'deleted' : 'revoked');
      if (action === 'revoke' && connection.isOwn) {
        const { error: grantError } = await supabase.auth.oauth.revokeGrant({
          clientId: connection.oauthClientId,
        });
        if (grantError) message = t('revokedGrantPending');
      }
      showActionToast('success', message);
      await load();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t(`errors.${action}`);
      setError(message);
      showActionToast('error', message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className='sc-agent-page' data-sc-agent-connections={scope}>
      <header className='sc-agent-page-header'>
        <span className='sc-agent-page-icon-frame'>
          <Brain aria-hidden='true' className='sc-agent-page-icon' />
        </span>
        <div className='sc-agent-page-heading'>
          <h2 className='sc-agent-page-title'>{t(`${scope}.title`)}</h2>
          <p className='sc-agent-page-description'>{t(`${scope}.description`)}</p>
        </div>
      </header>

      {!result && !error ? (
        <p className='sc-agent-loading' role='status'>
          <LoaderCircle aria-hidden='true' className='sc-agent-loading-ring' />
          {t('loading')}
        </p>
      ) : null}
      {error ? <p className='sc-agent-status' data-kind='error' role='alert'>{error}</p> : null}
      {result?.connections.length === 0 ? (
        <div className='sc-agent-empty'>
          <h3 className='sc-agent-empty-title'>{t('empty.title')}</h3>
          <p className='sc-agent-empty-description'>{t('empty.description')}</p>
        </div>
      ) : null}

      {result?.connections.length ? (
        <ul className='sc-agent-list'>
          {result.connections.map((connection) => {
            const revoked = Boolean(connection.revokedAt);
            const pending = pendingId === connection.agentConnectionId;
            return (
              <li className='sc-agent-card' data-revoked={revoked ? 'true' : 'false'} key={connection.agentConnectionId}>
                <div className='sc-agent-card-header'>
                  <div className='sc-agent-card-heading'>
                    <h3 className='sc-agent-card-title'>{connection.oauthClientName}</h3>
                    <p className='sc-agent-card-subtitle'>
                      {connection.organisationName} · {connectionOwner(connection, t('unknownUser'))}
                    </p>
                  </div>
                  <span className='sc-agent-state' data-state={revoked ? 'revoked' : 'active'}>
                    {t(revoked ? 'state.revoked' : 'state.active')}
                  </span>
                </div>
                <dl className='sc-agent-details'>
                  <div className='sc-agent-detail'>
                    <dt>{t('fields.scopes')}</dt>
                    <dd>{connection.oauthScopes.join(', ') || t('fields.noScopes')}</dd>
                  </div>
                  <div className='sc-agent-detail'>
                    <dt>{t('fields.connected')}</dt>
                    <dd>{new Date(connection.createdAt).toLocaleString()}</dd>
                  </div>
                  <div className='sc-agent-detail'>
                    <dt>{t('fields.lastUsed')}</dt>
                    <dd>{connection.lastUsedAt ? new Date(connection.lastUsedAt).toLocaleString() : t('fields.never')}</dd>
                  </div>
                </dl>
                <AgentConnectionExtensionSummary connection={connection} />
                <div className='sc-agent-actions'>
                  <button
                    className='sc-agent-button sc-agent-button-secondary'
                    disabled={pending}
                    onClick={() => void mutate(connection, revoked ? 'delete' : 'revoke')}
                    type='button'
                  >
                    {pending ? <LoaderCircle aria-hidden='true' className='sc-agent-button-loading-ring' /> : <ConnectionActionIcon action={revoked ? 'delete' : 'revoke'} />}
                    {t(revoked ? 'actions.delete' : 'actions.revoke')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
