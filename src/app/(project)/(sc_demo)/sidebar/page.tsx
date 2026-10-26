import type { Metadata } from 'next';

import { SCDashboardSidebar } from '@/components/sc_demo/sc_dashboard-sidebar';

export const metadata: Metadata = {
  title: 'Sidebar Nav',
  description: 'Track performance, review active work, and keep the team moving from one focused workspace.',
};

export default function SidebarDemoPage() {
  return <SCDashboardSidebar />;
}
