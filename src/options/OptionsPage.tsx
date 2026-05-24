import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Code,
  Group,
  MantineProvider,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import '@mantine/core/styles.css';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_BUTTONS, loadButtons, saveButtons } from '../storage';
import type { CopyButton } from '../types';

export const OptionsPage = () => {
  const [buttons, setButtons] = useState<CopyButton[]>([]);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [resetOpened, { open: openReset, close: closeReset }] = useDisclosure(false);
  const deleteTargetId = useRef<string | null>(null);

  useEffect(() => {
    loadButtons().then(setButtons);
  }, []);

  const update = async (updated: CopyButton[]) => {
    setButtons(updated);
    await saveButtons(updated);
  };

  const handleChange = (id: string, field: keyof CopyButton, value: string | boolean) => {
    update(buttons.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const handleAdd = () => {
    const newButton: CopyButton = {
      id: crypto.randomUUID(),
      label: '新しいボタン',
      format: '[{title}]({url})',
      enabled: true
    };
    update([...buttons, newButton]);
  };

  const handleDeleteClick = (id: string) => {
    deleteTargetId.current = id;
    openDelete();
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId.current) {
      update(buttons.filter((b) => b.id !== deleteTargetId.current));
      deleteTargetId.current = null;
    }
    closeDelete();
  };

  const handleResetConfirm = () => {
    update([...DEFAULT_BUTTONS]);
    closeReset();
  };

  return (
    <MantineProvider
      theme={{
        defaultRadius: 'xs',
        fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif'
      }}
    >
      <Modal opened={deleteOpened} onClose={closeDelete} title='削除の確認' size='sm' centered>
        <Stack gap='md'>
          <Text size='sm'>このボタンを削除してもよいですか？</Text>
          <Group justify='flex-end'>
            <Button variant='default' size='sm' onClick={closeDelete}>
              キャンセル
            </Button>
            <Button color='red' size='sm' onClick={handleDeleteConfirm}>
              削除する
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={resetOpened} onClose={closeReset} title='リセットの確認' size='sm' centered>
        <Stack gap='md'>
          <Text size='sm'>すべての設定をデフォルトに戻しますか？現在の設定は失われます。</Text>
          <Group justify='flex-end'>
            <Button variant='default' size='sm' onClick={closeReset}>
              キャンセル
            </Button>
            <Button color='orange' size='sm' onClick={handleResetConfirm}>
              リセットする
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Box m='xl' maw={760}>
        <Stack gap='md'>
          <Title order={3}>Link Ninja - 設定</Title>

          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={180}>ラベル</Table.Th>
                <Table.Th>フォーマット</Table.Th>
                <Table.Th w={60} ta='center'>
                  有効
                </Table.Th>
                <Table.Th w={60} ta='center'>
                  削除
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {buttons.map((b) => (
                <Table.Tr key={b.id}>
                  <Table.Td>
                    <TextInput
                      value={b.label}
                      onChange={(e) => handleChange(b.id, 'label', e.target.value)}
                      size='xs'
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      value={b.format}
                      onChange={(e) => handleChange(b.id, 'format', e.target.value)}
                      size='xs'
                      style={{ fontFamily: 'monospace' }}
                    />
                  </Table.Td>
                  <Table.Td ta='center'>
                    <Checkbox checked={b.enabled} onChange={(e) => handleChange(b.id, 'enabled', e.target.checked)} />
                  </Table.Td>
                  <Table.Td ta='center'>
                    <ActionIcon color='red' variant='subtle' onClick={() => handleDeleteClick(b.id)} aria-label='削除'>
                      ✕
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Group>
            <Button onClick={handleAdd} size='sm'>
              + 追加
            </Button>
            <Button variant='subtle' color='gray' size='sm' onClick={openReset}>
              デフォルトに戻す
            </Button>
          </Group>

          <Box>
            <Text size='sm' fw='bold' mb='xs'>
              使えるテンプレート文字列
            </Text>
            <Stack gap='xs'>
              <Text size='sm'>
                <Code>{'{title}'}</Code> — ページのタイトル
              </Text>
              <Text size='sm'>
                <Code>{'{url}'}</Code> — ページのURL
              </Text>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </MantineProvider>
  );
};
