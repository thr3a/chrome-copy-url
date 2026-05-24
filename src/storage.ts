import browser from 'webextension-polyfill';
import type { CopyButton } from './types';

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
