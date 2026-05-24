import type { Runtime } from 'webextension-polyfill';
import browser from 'webextension-polyfill';
import type { SendMessageWithValue } from './types';

console.log('content script');

browser.runtime.onMessage.addListener((msg: unknown, _sender: Runtime.MessageSender) => {
  const request = msg as SendMessageWithValue<unknown>;
  console.log('action', request.action, 'value', request.value);
});
