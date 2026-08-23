import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SCDashboardSidebar } from '@/components/sc_demo/sc_dashboard-sidebar';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('DashboardDemo');
  return { title: t('sidebarNav'), description: t('description') };
}

export default function SidebarDemoPage() {
  return <SCDashboardSidebar />;
}
