import type { Database as LogicalDatabase } from '@/lib/supabase/types';

import type { SchemaName } from './namespace.cjs';

/** Generated row contracts retain logical keys; runtime clients use resolved schema names. */
export type Database = {
  [Name in keyof LogicalDatabase as Name extends 'public' | '__InternalSupabase'
    ? Name
    : Name extends string ? SchemaName<Name> : never]: LogicalDatabase[Name];
};
