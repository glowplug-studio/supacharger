import { PropsWithChildren } from "react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";

import { SCMarketingMenu } from '@/components/sc_demo/sc_header-marketing';
import { SC_CONFIG } from "@/supacharger/supacharger-config";

export const metadata: Metadata = {
  title: SC_CONFIG.SITE_TITLE,
  description:
    "Start your next project without reinventing the wheel. REPLACE_ME",
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
    <div id="marketing-root-layout">
      <SCMarketingMenu></SCMarketingMenu>
    <main className="relative flex-1">
      <div className="relative h-full">{children}</div>
    </main>
    </div>
    </>
  );
}
