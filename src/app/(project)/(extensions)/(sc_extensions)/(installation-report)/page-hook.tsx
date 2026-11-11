import { getTranslations } from 'next-intl/server';

import { SC_CONFIG } from '@/supacharger/supacharger-config';

import { InstallationReportPopover } from './_components/installation-report-popover';
import { readInstallationChecklist } from './_lib/checklist';
import { createInstallationConfigReport } from './_lib/config-report';

export default async function InstallationReportPageHook() {
  const report = readInstallationChecklist();
  if (!report) return null;
  const t = await getTranslations('Clipboard');
  return (
    <InstallationReportPopover
      copyMessages={{ clickToCopy: t('clickToCopy'), copied: t('copied'), failed: t('failed') }}
      configReport={createInstallationConfigReport(SC_CONFIG)}
      initialReport={report}
    />
  );
}
