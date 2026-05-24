import { Box, Button, MantineProvider, Text } from '@mantine/core';
import '@mantine/core/styles.css';
import { useEventListener } from '@mantine/hooks';
import browser from 'webextension-polyfill';
import type { SendMessageWithValue } from '../types';

const sendPrompt = async (prompt: string): Promise<void> => {
  const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!currentTab?.id) {
    console.error('Could not find current tab');
    return;
  }

  const message: SendMessageWithValue<string> = {
    action: 'send_cs',
    value: prompt
  };
  await browser.tabs.sendMessage(currentTab.id, message);
};

export const Popup = () => {
  const clickHandler = async () => {
    await sendPrompt('popup');
  };
  const ref = useEventListener('click', clickHandler);

  return (
    <MantineProvider
      theme={{
        defaultRadius: 'xs',
        fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif'
      }}
    >
      <Box m={'md'}>
        <Text>Hello popup!</Text>
        <Button ref={ref}>クリック</Button>
      </Box>
    </MantineProvider>
  );
};

// const handleClick = async (): Promise<void> => {
//   await browser.tabs.create({ url: 'https://example.com/' });
// };
