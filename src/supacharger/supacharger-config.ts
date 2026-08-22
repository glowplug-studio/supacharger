/**
 * CLI-managed compatibility interface for Supacharger configuration.
 * Developer-owned settings live at `src/supacharger.config.ts`.
 */
export type {
  EmailOtpLength,
  EmailPasswordlessMode,
  SignUpEmailVerificationMode,
  SupachargerConfig,
  SupachargerOAuthProvider,
} from './supacharger-config-contract';
export { SC_CONFIG } from '@/supacharger.config';
