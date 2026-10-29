import { SC_CONFIG } from '@/supacharger/supacharger-config';

import { type ResourceKind,resourceName } from './namespace.cjs';

/** Resolve application-owned resources from the developer-owned installation setting. */
export function schemaName<Name extends string>(name: Name) {
  return resourceName(SC_CONFIG.PROJECT_NAMESPACE, name, 'schema');
}

export function supabaseResourceName(name: string, kind: Exclude<ResourceKind, 'schema'>) {
  return resourceName(SC_CONFIG.PROJECT_NAMESPACE, name, kind);
}
