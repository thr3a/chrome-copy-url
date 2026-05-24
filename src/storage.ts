import browser from 'webextension-polyfill';
import type { CopyButton, RegexRule } from './types';

export { applyRegexRules } from './regex';

const STORAGE_KEY = 'copyButtons';

export const DEFAULT_BUTTONS: CopyButton[] = [
  { id: 'default-markdown', label: 'Markdown', format: '[{title}]({url})', enabled: true },
  { id: 'default-title', label: 'タイトルのみ', format: '{title}', enabled: true }
];

export const loadButtons = async (): Promise<CopyButton[]> => {
  const result = await browser.storage.sync.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY];
  if (!stored || !Array.isArray(stored) || stored.length === 0) return DEFAULT_BUTTONS;
  return stored as CopyButton[];
};

export const saveButtons = async (buttons: CopyButton[]): Promise<void> => {
  await browser.storage.sync.set({ [STORAGE_KEY]: buttons });
};

export const applyTemplate = (format: string, title: string, url: string): string => {
  return format.replace(/\{title\}/g, title).replace(/\{url\}/g, url);
};

const RULES_KEY = 'regexRules';

export const loadRules = async (): Promise<RegexRule[]> => {
  const result = await browser.storage.sync.get(RULES_KEY);
  const stored = result[RULES_KEY];
  if (!stored || !Array.isArray(stored)) return [];
  // storage から取得した値は型情報がないため RegexRule[] として扱う
  return stored as RegexRule[];
};

export const saveRules = async (rules: RegexRule[]): Promise<void> => {
  await browser.storage.sync.set({ [RULES_KEY]: rules });
};

