export type ResourceKind = 'schema' | 'bucket' | 'function' | 'secret' | 'job' | 'role';
export type SchemaName<Name extends string> = `sc_${Name}` | `sc_${string}_${Name}`;
export function namespacePrefix(namespace: string): string;
export function resourceName<Name extends string>(namespace: string, logicalName: Name, kind?: 'schema'): SchemaName<Name>;
export function resourceName(namespace: string, logicalName: string, kind: Exclude<ResourceKind, 'schema'>): string;
