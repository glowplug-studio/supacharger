import type { ProjectRequestGuard } from '@/supacharger/request-guard-contract';

// Developer-owned: return a response to stop rendering, or null to continue.
export const resolveProjectRequest: ProjectRequestGuard = async () => null;
