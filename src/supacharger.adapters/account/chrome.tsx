import { AuthenticatedAppShell } from '@/app/(project)/authenticated-app-shell';

/** Developer-owned site chrome around managed account content. */
export function AccountChrome({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
