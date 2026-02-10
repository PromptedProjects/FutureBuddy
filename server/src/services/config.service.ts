import { getConfigValue, setConfigValue, getAllConfig, deleteConfigValue } from '../storage/repositories/config.repository.js';

/** Known config keys with defaults */
const DEFAULTS: Record<string, string> = {
  'device.name': 'FutureBox',
  'ai.system_prompt': '',
  'ai.default_model': '',
  'notifications.quiet_hours_start': '',
  'notifications.quiet_hours_end': '',
  'actions.timeout_hours': '24',
};

export function getConfig(key: string): string {
  return getConfigValue(key) ?? DEFAULTS[key] ?? '';
}

export function setConfig(key: string, value: string): void {
  setConfigValue(key, value);
}

export function getFullConfig(): Record<string, string> {
  const stored = getAllConfig();
  const result: Record<string, string> = { ...DEFAULTS };
  for (const row of stored) {
    result[row.key] = row.value;
  }
  return result;
}

export function removeConfig(key: string): boolean {
  return deleteConfigValue(key);
}
