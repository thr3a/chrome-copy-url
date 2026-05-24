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
  Tabs,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconGripVertical } from '@tabler/icons-react';
import '@mantine/core/styles.css';
import { useEffect, useRef, useState } from 'react';
import { validatePattern } from '../regex';
import { DEFAULT_BUTTONS, loadButtons, loadRules, saveButtons, saveRules } from '../storage';
import type { CopyButton, RegexRule } from '../types';

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

type SortableRuleRowProps = {
  rule: RegexRule;
  onChange: (id: string, field: keyof RegexRule, value: string | boolean) => void;
  onDeleteClick: (id: string) => void;
};

const SortableRuleRow = ({ rule, onChange, onDeleteClick }: SortableRuleRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rule.id });
  const [testOpen, setTestOpen] = useState(false);
  const [testUrl, setTestUrl] = useState('');

  const patternError = validatePattern(rule.pattern, rule.flags);

  const testResult = (() => {
    if (!testUrl || !rule.pattern || patternError) return null;
    try {
      const regex = new RegExp(rule.pattern, rule.flags);
      if (!regex.test(testUrl)) return { matched: false, result: '' };
      return { matched: true, result: testUrl.replace(new RegExp(rule.pattern, rule.flags), rule.replacement) };
    } catch {
      return null;
    }
  })();

  return (
    <>
      <Table.Tr ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
        <Table.Td ta='center'>
          <Center {...attributes} {...listeners} style={{ cursor: 'grab' }}>
            <IconGripVertical size={16} />
          </Center>
        </Table.Td>
        <Table.Td ta='center'>
          <Checkbox checked={rule.enabled} onChange={(e) => onChange(rule.id, 'enabled', e.target.checked)} />
        </Table.Td>
        <Table.Td>
          <TextInput value={rule.name} onChange={(e) => onChange(rule.id, 'name', e.target.value)} size='xs' />
        </Table.Td>
        <Table.Td>
          <TextInput
            value={rule.pattern}
            onChange={(e) => onChange(rule.id, 'pattern', e.target.value)}
            size='xs'
            style={{ fontFamily: 'monospace' }}
            error={patternError ?? undefined}
          />
        </Table.Td>
        <Table.Td>
          <TextInput
            value={rule.flags}
            onChange={(e) => onChange(rule.id, 'flags', e.target.value)}
            size='xs'
            w={60}
            style={{ fontFamily: 'monospace' }}
          />
        </Table.Td>
        <Table.Td>
          <TextInput
            value={rule.replacement}
            onChange={(e) => onChange(rule.id, 'replacement', e.target.value)}
            size='xs'
            style={{ fontFamily: 'monospace' }}
          />
        </Table.Td>
        <Table.Td ta='center'>
          <ActionIcon variant='subtle' onClick={() => setTestOpen((v) => !v)} aria-label='テスト'>
            ▶
          </ActionIcon>
        </Table.Td>
        <Table.Td ta='center'>
          <ActionIcon color='red' variant='subtle' onClick={() => onDeleteClick(rule.id)} aria-label='削除'>
            ✕
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
      {testOpen && (
        <Table.Tr>
          <Table.Td colSpan={8}>
            <Stack gap='xs' p='xs'>
              <TextInput
                label='テストURL'
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                size='xs'
                placeholder='https://example.com/...'
                style={{ fontFamily: 'monospace' }}
              />
              {testUrl && patternError && (
                <Text size='xs' c='red'>{patternError}</Text>
              )}
              {testUrl && !patternError && testResult && !testResult.matched && (
                <Text size='xs' c='orange'>マッチしません</Text>
              )}
              {testUrl && !patternError && testResult?.matched && (
                <Group gap='xs'>
                  <Text size='xs'>変換結果:</Text>
                  <Code style={{ fontFamily: 'monospace' }}>{testResult.result}</Code>
                </Group>
              )}
            </Stack>
          </Table.Td>
        </Table.Tr>
      )}
    </>
  );
};

export const OptionsPage = () => {
  const [buttons, setButtons] = useState<CopyButton[]>([]);
  const [deleteButtonOpened, { open: openDeleteButton, close: closeDeleteButton }] = useDisclosure(false);
  const [resetOpened, { open: openReset, close: closeReset }] = useDisclosure(false);
  const deleteButtonTargetId = useRef<string | null>(null);
  const buttonSensors = useSensors(useSensor(PointerSensor));

  const [rules, setRules] = useState<RegexRule[]>([]);
  const [deleteRuleOpened, { open: openDeleteRule, close: closeDeleteRule }] = useDisclosure(false);
  const deleteRuleTargetId = useRef<string | null>(null);
  const ruleSensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    loadButtons().then(setButtons);
    loadRules().then(setRules);
  }, []);

  const updateButtons = async (updated: CopyButton[]) => {
    setButtons(updated);
    await saveButtons(updated);
  };

  const handleButtonChange = (id: string, field: keyof CopyButton, value: string | boolean) => {
    updateButtons(buttons.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const handleButtonAdd = () => {
    const newButton: CopyButton = {
      id: crypto.randomUUID(),
      label: '新しいボタン',
      format: '[{title}]({url})',
      enabled: true
    };
    updateButtons([...buttons, newButton]);
  };

  const handleButtonDeleteClick = (id: string) => {
    deleteButtonTargetId.current = id;
    openDeleteButton();
  };

  const handleButtonDeleteConfirm = () => {
    if (deleteButtonTargetId.current) {
      updateButtons(buttons.filter((b) => b.id !== deleteButtonTargetId.current));
      deleteButtonTargetId.current = null;
    }
    closeDeleteButton();
  };

  const handleResetConfirm = () => {
    updateButtons([...DEFAULT_BUTTONS]);
    closeReset();
  };

  const handleButtonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = buttons.findIndex((b) => b.id === active.id);
      const newIndex = buttons.findIndex((b) => b.id === over.id);
      updateButtons(arrayMove(buttons, oldIndex, newIndex));
    }
  };

  const updateRules = async (updated: RegexRule[]) => {
    setRules(updated);
    await saveRules(updated);
  };

  const handleRuleChange = (id: string, field: keyof RegexRule, value: string | boolean) => {
    updateRules(rules.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleRuleAdd = () => {
    const newRule: RegexRule = {
      id: crypto.randomUUID(),
      name: '新しいルール',
      pattern: '',
      flags: '',
      replacement: '',
      enabled: true
    };
    updateRules([...rules, newRule]);
  };

  const handleRuleDeleteClick = (id: string) => {
    deleteRuleTargetId.current = id;
    openDeleteRule();
  };

  const handleRuleDeleteConfirm = () => {
    if (deleteRuleTargetId.current) {
      updateRules(rules.filter((r) => r.id !== deleteRuleTargetId.current));
      deleteRuleTargetId.current = null;
    }
    closeDeleteRule();
  };

  const handleRuleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rules.findIndex((r) => r.id === active.id);
      const newIndex = rules.findIndex((r) => r.id === over.id);
      updateRules(arrayMove(rules, oldIndex, newIndex));
    }
  };

  return (
    <MantineProvider
      theme={{
        defaultRadius: 'xs',
        fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif'
      }}
    >
      <Modal opened={deleteButtonOpened} onClose={closeDeleteButton} title='削除の確認' size='sm' centered>
        <Stack gap='md'>
          <Text size='sm'>このボタンを削除してもよいですか？</Text>
          <Group justify='flex-end'>
            <Button variant='default' size='sm' onClick={closeDeleteButton}>
              キャンセル
            </Button>
            <Button color='red' size='sm' onClick={handleButtonDeleteConfirm}>
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

      <Modal opened={deleteRuleOpened} onClose={closeDeleteRule} title='削除の確認' size='sm' centered>
        <Stack gap='md'>
          <Text size='sm'>このルールを削除してもよいですか？</Text>
          <Group justify='flex-end'>
            <Button variant='default' size='sm' onClick={closeDeleteRule}>
              キャンセル
            </Button>
            <Button color='red' size='sm' onClick={handleRuleDeleteConfirm}>
              削除する
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Box m='xl' maw={1200}>
        <Stack gap='md'>
          <Title order={3}>Link Ninja - 設定</Title>

          <Tabs defaultValue='copy-format'>
            <Tabs.List>
              <Tabs.Tab value='copy-format'>コピーフォーマット</Tabs.Tab>
              <Tabs.Tab value='regex-rules'>URL変換ルール</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value='copy-format' pt='md'>
              <Stack gap='md'>
                <DndContext sensors={buttonSensors} collisionDetection={closestCenter} onDragEnd={handleButtonDragEnd}>
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
                          <SortableRow key={b.id} button={b} onChange={handleButtonChange} onDeleteClick={handleButtonDeleteClick} />
                        ))}
                      </Table.Tbody>
                    </Table>
                  </SortableContext>
                </DndContext>

                <Group>
                  <Button onClick={handleButtonAdd} size='sm'>
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
            </Tabs.Panel>

            <Tabs.Panel value='regex-rules' pt='md'>
              <Stack gap='md'>
                <Text size='sm' c='dimmed'>
                  有効なルールを上から順に評価し、最初にマッチしたルールのみ適用します。
                </Text>

                <DndContext sensors={ruleSensors} collisionDetection={closestCenter} onDragEnd={handleRuleDragEnd}>
                  <SortableContext items={rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                    <Table withTableBorder withColumnBorders>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th w={40} />
                          <Table.Th w={60} ta='center'>
                            有効
                          </Table.Th>
                          <Table.Th w={160}>ルール名</Table.Th>
                          <Table.Th>パターン</Table.Th>
                          <Table.Th w={80}>フラグ</Table.Th>
                          <Table.Th>置換文字列</Table.Th>
                          <Table.Th w={60} ta='center'>
                            テスト
                          </Table.Th>
                          <Table.Th w={60} ta='center'>
                            削除
                          </Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {rules.map((r) => (
                          <SortableRuleRow key={r.id} rule={r} onChange={handleRuleChange} onDeleteClick={handleRuleDeleteClick} />
                        ))}
                      </Table.Tbody>
                    </Table>
                  </SortableContext>
                </DndContext>

                <Group>
                  <Button onClick={handleRuleAdd} size='sm'>
                    + 追加
                  </Button>
                </Group>

                <Box>
                  <Text size='sm' fw='bold' mb='xs'>
                    置換構文
                  </Text>
                  <Stack gap='xs'>
                    <Text size='sm'>
                      <Code>$1</Code>, <Code>$2</Code>, ... — キャプチャグループ
                    </Text>
                    <Text size='sm'>
                      <Code>$&</Code> — マッチした文字列全体
                    </Text>
                    <Text size='sm'>
                      <Code>$$</Code> — リテラルの $
                    </Text>
                  </Stack>
                </Box>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Box>
    </MantineProvider>
  );
};
