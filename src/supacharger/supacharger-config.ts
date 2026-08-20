/**
 * CLI-managed compatibility interface for Supacharger configuration.
 *
 * Application settings live outside the protected core at
 * `src/supacharger.config.ts`. Keep core imports pointed at this module so the
 * public configuration interface can evolve without moving developer values
 * back into CLI-managed files.
 */
export type { SupachargerConfig } from './supacharger-config-contract';
export { SC_CONFIG } from '@/supacharger.config';
