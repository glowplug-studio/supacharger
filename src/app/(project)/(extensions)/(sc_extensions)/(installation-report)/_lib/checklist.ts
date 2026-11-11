import { readFileSync } from 'node:fs';
import path from 'node:path';

import 'server-only';

export interface InstallationChecklistItem {
  checked: boolean;
  label: string;
  status: 'done' | 'pending' | 'skipped';
}

export interface InstallationChecklistSection {
  checked: number;
  items: InstallationChecklistItem[];
  percentage: number;
  title: string;
  total: number;
}

export interface InstallationChecklistReport {
  checked: number;
  percentage: number;
  sections: InstallationChecklistSection[];
  status: string;
  title: string;
  total: number;
}

const checklistPath = path.join(process.cwd(), 'docs/reports/sc-install/first-install-handhold-me.md');

function plainText(value: string) {
  return value
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function readInstallationChecklist(): InstallationChecklistReport | null {
  if (process.env.NODE_ENV === 'production') return null;

  let markdown: string;
  try {
    markdown = readFileSync(checklistPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }

  const sections: Array<{ items: InstallationChecklistItem[]; title: string }> = [];
  let current: { items: InstallationChecklistItem[]; title: string } | null = null;
  let status = 'In progress';
  let title = 'Installation report';

  for (const line of markdown.split(/\r?\n/)) {
    const documentTitle = /^#\s+(.+)$/.exec(line);
    if (documentTitle) {
      title = plainText(documentTitle[1]);
      continue;
    }
    const statusLine = /^Status:\s*\*\*([^*]+)\*\*/.exec(line);
    if (statusLine) status = plainText(statusLine[1]);

    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      current = { items: [], title: plainText(heading[1]) };
      sections.push(current);
      continue;
    }
    const item = /^\s*-\s+\[([ xX-])]\s+(.+)$/.exec(line);
    if (item && current) {
      const marker = item[1].toLowerCase();
      const status = marker === 'x' ? 'done' : marker === '-' ? 'skipped' : 'pending';
      current.items.push({ checked: status !== 'pending', label: plainText(item[2]), status });
    }
  }

  const populated = sections
    .filter((section) => section.items.length)
    .map((section) => {
      const checked = section.items.filter((item) => item.checked).length;
      const total = section.items.length;
      return { ...section, checked, percentage: Math.round((checked / total) * 100), total };
    });
  const total = populated.reduce((sum, section) => sum + section.total, 0);
  const checked = populated.reduce((sum, section) => sum + section.checked, 0);

  return {
    checked,
    percentage: total ? Math.round((checked / total) * 100) : 0,
    sections: populated,
    status,
    title,
    total,
  };
}
