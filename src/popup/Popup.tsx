import { Box, Button, MantineProvider, Stack } from '@mantine/core';
import '@mantine/core/styles.css';
import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { applyTemplate, loadButtons } from '../storage';
import type { CopyButton } from '../types';

type CopyState = Record<string, 'idle' | 'copied'>;

const FEEDBACK_DURATION_MS = 2000;

export const Popup = () => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [buttons, setButtons] = useState<CopyButton[]>([]);
  const [copyState, setCopyState] = useState<CopyState>({});

  useEffect(() => {
    const init = async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      setUrl(tab.url ?? '');
      setTitle(tab.title ?? '');
      const btns = await loadButtons();
      setButtons(btns);
    };
    init();
  }, []);

  const handleCopy = async (btn: CopyButton) => {
    const text = applyTemplate(btn.format, title, url);
    await navigator.clipboard.writeText(text);
    setCopyState((prev) => ({ ...prev, [btn.id]: 'copied' }));
    setTimeout(() => {
      setCopyState((prev) => ({ ...prev, [btn.id]: 'idle' }));
    }, FEEDBACK_DURATION_MS);
  };

  const enabledButtons = buttons.filter((b) => b.enabled);

  return (
    <MantineProvider
      theme={{
        defaultRadius: 'xs',
        fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif'
      }}
    >
      <Box m='md' w={320}>
        <Stack>
          {enabledButtons.map((btn) => (
            <Button
              key={btn.id}
              onClick={() => handleCopy(btn)}
              color={copyState[btn.id] === 'copied' ? 'green' : undefined}
            >
              {copyState[btn.id] === 'copied' ? 'コピーしました！' : btn.label}
            </Button>
          ))}
        </Stack>
      </Box>
    </MantineProvider>
  );
};
