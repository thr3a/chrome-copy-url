import { Box, Button, MantineProvider, Stack } from '@mantine/core';
import '@mantine/core/styles.css';
import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

type CopyButtonState = 'idle' | 'copied';

const FEEDBACK_DURATION_MS = 2000;

export const Popup = () => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [markdownState, setMarkdownState] = useState<CopyButtonState>('idle');
  const [titleState, setTitleState] = useState<CopyButtonState>('idle');

  useEffect(() => {
    const fetchTab = async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      setUrl(tab.url ?? '');
      setTitle(tab.title ?? '');
    };
    fetchTab();
  }, []);

  const copyWithFeedback = async (text: string, setState: (s: CopyButtonState) => void) => {
    await navigator.clipboard.writeText(text);
    setState('copied');
    setTimeout(() => setState('idle'), FEEDBACK_DURATION_MS);
  };

  return (
    <MantineProvider
      theme={{
        defaultRadius: 'xs',
        fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif'
      }}
    >
      <Box m='md' w={320}>
        <Stack>
          <Button
            onClick={() => copyWithFeedback(`[${title}](${url})`, setMarkdownState)}
            color={markdownState === 'copied' ? 'green' : undefined}
          >
            {markdownState === 'copied' ? 'コピーしました！' : 'markdown'}
          </Button>
          <Button
            onClick={() => copyWithFeedback(title, setTitleState)}
            color={titleState === 'copied' ? 'green' : undefined}
          >
            {titleState === 'copied' ? 'コピーしました！' : 'タイトルのみ'}
          </Button>
        </Stack>
      </Box>
    </MantineProvider>
  );
};
