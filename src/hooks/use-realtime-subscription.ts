import { useCallback,useEffect, useRef } from 'react';

import { 
  createRealtimeSubscription, 
  type RealtimeCallback, 
  type RealtimeSubscriptionOptions,
  removeRealtimeSubscription} from '@/supacharger/utils/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** ==========
 *
 * Generic Realtime Subscription Hook
 *
 * ========== */

export interface UseRealtimeSubscriptionOptions extends RealtimeSubscriptionOptions {
  enabled?: boolean;
}

export interface UseRealtimeSubscriptionReturn {
  isConnected: boolean;
  reconnect: () => void;
  disconnect: () => void;
}

export function useRealtimeSubscription(
  options: UseRealtimeSubscriptionOptions,
  onPayload: RealtimeCallback
): UseRealtimeSubscriptionReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(async () => {
    if (channelRef.current || !options.enabled) return;

    try {
      channelRef.current = await createRealtimeSubscription(options, onPayload);
      isConnectedRef.current = true;
    } catch (error) {
      console.error('Failed to create realtime subscription:', error);
      isConnectedRef.current = false;
    }
  }, [options, onPayload]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      removeRealtimeSubscription(channelRef.current);
      channelRef.current = null;
      isConnectedRef.current = false;
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Set up subscription on mount or when options change
  useEffect(() => {
    if (options.enabled !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, options.enabled]);

  return {
    isConnected: isConnectedRef.current,
    reconnect,
    disconnect
  };
}

/**
 * Simple hook for table change subscriptions with refresh callback
 */
export function useTableChangeSubscription(
  tableName: string,
  refreshCallback: () => void,
  options: {
    enabled?: boolean;
    filter?: string;
  } = {}
) {
  const subscriptionOptions: UseRealtimeSubscriptionOptions = {
    channelName: `${tableName}-changes`,
    table: tableName,
    filter: options.filter,
    enabled: options.enabled
  };

  return useRealtimeSubscription(subscriptionOptions, () => {
    refreshCallback();
  });
} 