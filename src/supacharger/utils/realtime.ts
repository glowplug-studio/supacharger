import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** ==========
 *
 * Supacharger Realtime Utilities
 *
 * ========== */

// Generic interfaces for realtime functionality
export interface RealtimeSubscriptionOptions {
  channelName: string;
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, any>;
  old: Record<string, any>;
  table: string;
  schema: string;
  commit_timestamp: string;
}

export type RealtimeCallback = (payload: RealtimePayload) => void;

/**
 * Create a realtime subscription to a database table
 * @param options - Subscription options
 * @param onPayload - Callback function for handling changes
 * @returns Promise with the realtime channel
 */
export async function createRealtimeSubscription(
  options: RealtimeSubscriptionOptions,
  onPayload: RealtimeCallback
): Promise<RealtimeChannel> {
  const supabase = createClient();
  
  const channel = supabase
    .channel(options.channelName)
    .on(
      'postgres_changes' as any,
      {
        event: options.event || '*',
        schema: options.schema || 'public',
        table: options.table,
        filter: options.filter
      },
      (payload: any) => {
        console.log(`Realtime ${options.table} change received:`, payload);
        onPayload(payload as RealtimePayload);
      }
    )
    .subscribe((status) => {
      console.log(`${options.table} realtime subscription status:`, status);
      if (status === 'SUBSCRIBED') {
        console.log(`Successfully subscribed to ${options.table} changes`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`${options.table} realtime subscription error`);
      }
    });

  return channel;
}

/**
 * Remove a realtime subscription
 * @param channel - The realtime channel to remove
 */
export function removeRealtimeSubscription(channel: RealtimeChannel): void {
  const supabase = createClient();
  console.log('Cleaning up realtime subscription');
  supabase.removeChannel(channel);
}

/**
 * Create a realtime subscription with automatic cleanup
 * @param options - Subscription options
 * @param onPayload - Callback function for handling changes
 * @returns Cleanup function
 */
export async function createRealtimeSubscriptionWithCleanup(
  options: RealtimeSubscriptionOptions,
  onPayload: RealtimeCallback
): Promise<() => void> {
  const channel = await createRealtimeSubscription(options, onPayload);
  
  return () => {
    removeRealtimeSubscription(channel);
  };
}

/**
 * Subscribe to table changes with a refresh callback
 * @param tableName - The table to subscribe to
 * @param refreshCallback - Function to call when data changes
 * @param filter - Optional filter for the subscription
 * @returns Cleanup function
 */
export async function subscribeToTableChanges(
  tableName: string,
  refreshCallback: () => void,
  filter?: string
): Promise<() => void> {
  const options: RealtimeSubscriptionOptions = {
    channelName: `${tableName}-changes`,
    table: tableName,
    filter
  };

  return createRealtimeSubscriptionWithCleanup(options, () => {
    refreshCallback();
  });
} 