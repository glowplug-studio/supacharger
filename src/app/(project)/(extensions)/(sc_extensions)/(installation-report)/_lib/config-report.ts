import 'server-only';

export interface InstallationConfigReportItem {
  booleanValue?: boolean;
  label: string;
  value: string;
}

function formatValue(value: unknown) {
  if (value === null) return 'Not set';
  if (value === undefined) return 'Automatic';
  if (typeof value === 'string') return value || 'Default';
  return String(value);
}

export function createInstallationConfigReport(config: object): InstallationConfigReportItem[] {
  const items: InstallationConfigReportItem[] = [];

  function visit(value: unknown, path: string) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        items.push({ label: path, value: 'None' });
        return;
      }
      if (value.every((entry) => entry === null || ['boolean', 'number', 'string'].includes(typeof entry))) {
        items.push({ label: path, value: value.map(formatValue).join(', ') });
        return;
      }
      value.forEach((entry, index) => visit(entry, `${path}.${index + 1}`));
      return;
    }

    if (value !== null && typeof value === 'object') {
      Object.entries(value).forEach(([key, entry]) => visit(entry, path ? `${path}.${key}` : key));
      return;
    }

    items.push({
      ...(typeof value === 'boolean' ? { booleanValue: value } : {}),
      label: path,
      value: typeof value === 'boolean' ? (value ? 'On' : 'Off') : formatValue(value),
    });
  }

  visit(config, '');
  return items;
}
