import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ActionIcon,
  Box,
  Button,
  Center,
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
import { IconGripVertical } from '@tabler/icons-react';
import '@mantine/core/styles.css';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_BUTTONS, loadButtons, saveButtons } from '../storage';
import type { CopyButton } from '../types';

type SortableRowProps = {
  button: CopyButton;
  onChange: (id: string, field: keyof CopyButton, value: string | boolean) => void;
  onDeleteClick: (id: string) => void;
};

const SortableRow = ({ button, onChange, onDeleteClick }: SortableRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: button.id });

  return (
    <Table.Tr ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <Table.Td ta='center'>
        <Center {...attributes} {...listeners} style={{ cursor: 'grab' }}>
          <IconGripVertical size={16} />
        </Center>
      </Table.Td>
      <Table.Td>
        <TextInput value={button.label} onChange={(e) => onChange(button.id, 'label', e.target.value)} size='xs' />
      </Table.Td>
      <Table.Td>
        <TextInput
          value={button.format}
          onChange={(e) => onChange(button.id, 'format', e.target.value)}
          size='xs'
          style={{ fontFamily: 'monospace' }}
        />
      </Table.Td>
      <Table.Td ta='center'>
        <Checkbox checked={button.enabled} onChange={(e) => onChange(button.id, 'enabled', e.target.checked)} />
      </Table.Td>
      <Table.Td ta='center'>
        <ActionIcon color='red' variant='subtle' onClick={() => onDeleteClick(button.id)} aria-label='削除'>
          ✕
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
};

export const OptionsPage = () => {
  const [buttons, setButtons] = useState<CopyButton[]>([]);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [resetOpened, { open: openReset, close: closeReset }] = useDisclosure(false);
  const deleteTargetId = useRef<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = buttons.findIndex((b) => b.id === active.id);
      const newIndex = buttons.findIndex((b) => b.id === over.id);
      update(arrayMove(buttons, oldIndex, newIndex));
    }
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

      <Box m='xl' maw={800}>
        <Stack gap='md'>
          <Title order={3}>Link Ninja - 設定</Title>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={buttons.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <Table withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={40} />
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
                    <SortableRow key={b.id} button={b} onChange={handleChange} onDeleteClick={handleDeleteClick} />
                  ))}
                </Table.Tbody>
              </Table>
            </SortableContext>
          </DndContext>

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
