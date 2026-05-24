import { describe, expect, it } from 'vitest';
import { applyRegexRules, validatePattern } from './regex';
import type { RegexRule } from './types';

const rule = (overrides: Partial<RegexRule> = {}): RegexRule => ({
  id: 'test',
  name: 'テスト',
  pattern: '',
  flags: '',
  replacement: '',
  enabled: true,
  ...overrides,
});

// --- applyRegexRules ---

describe('applyRegexRules', () => {
  it('ルールが空のとき元のURLをそのまま返す', () => {
    expect(applyRegexRules('https://example.com/', [])).toBe('https://example.com/');
  });

  it('マッチしないルールは無視して元のURLを返す', () => {
    const rules = [rule({ pattern: 'https://other\\.com', replacement: 'https://replaced.com' })];
    expect(applyRegexRules('https://example.com/', rules)).toBe('https://example.com/');
  });

  it('マッチしたルールの置換を適用する', () => {
    const rules = [rule({ pattern: 'example\\.com', replacement: 'replaced.com' })];
    expect(applyRegexRules('https://example.com/', rules)).toBe('https://replaced.com/');
  });

  it('キャプチャグループ $1 を使った置換ができる（plan.mdの変換例）', () => {
    const rules = [
      rule({
        pattern: 'https://finance\\.yahoo\\.co\\.jp/quote/(\\d+)\\.T',
        replacement: 'https://money.note.com/companies/$1',
      }),
    ];
    expect(applyRegexRules('https://finance.yahoo.co.jp/quote/6902.T', rules)).toBe(
      'https://money.note.com/companies/6902',
    );
  });

  it('複数のキャプチャグループ $1 $2 を使った置換ができる', () => {
    const rules = [
      rule({
        pattern: '(\\w+)\\.(\\w+)',
        replacement: '$2.$1',
      }),
    ];
    expect(applyRegexRules('foo.bar', rules)).toBe('bar.foo');
  });

  it('enabled: false のルールはスキップする', () => {
    const rules = [rule({ pattern: 'example', replacement: 'replaced', enabled: false })];
    expect(applyRegexRules('https://example.com/', rules)).toBe('https://example.com/');
  });

  it('pattern が空文字のルールはスキップする', () => {
    const rules = [rule({ pattern: '', replacement: 'replaced' })];
    expect(applyRegexRules('https://example.com/', rules)).toBe('https://example.com/');
  });

  it('不正な正規表現パターンはスキップして次のルールを評価する', () => {
    const rules = [
      rule({ pattern: '[invalid', replacement: 'bad' }),
      rule({ pattern: 'example', replacement: 'replaced' }),
    ];
    expect(applyRegexRules('https://example.com/', rules)).toBe('https://replaced.com/');
  });

  it('最初にマッチしたルールのみ適用し、以降のルールは評価しない', () => {
    const rules = [
      rule({ pattern: 'example', replacement: 'first' }),
      rule({ pattern: 'example', replacement: 'second' }),
    ];
    expect(applyRegexRules('https://example.com/', rules)).toBe('https://first.com/');
  });

  it('g フラグで全箇所を置換する', () => {
    const rules = [rule({ pattern: 'a', flags: 'g', replacement: 'x' })];
    expect(applyRegexRules('banana', rules)).toBe('bxnxnx');
  });

  it('g フラグなしでは最初の1箇所のみ置換する', () => {
    const rules = [rule({ pattern: 'a', flags: '', replacement: 'x' })];
    expect(applyRegexRules('banana', rules)).toBe('bxnana');
  });

  it('i フラグで大文字小文字を区別しない', () => {
    const rules = [rule({ pattern: 'EXAMPLE', flags: 'i', replacement: 'replaced' })];
    expect(applyRegexRules('https://example.com/', rules)).toBe('https://replaced.com/');
  });

  it('$& でマッチ全体を参照できる', () => {
    const rules = [rule({ pattern: '\\d+', replacement: '[$&]' })];
    expect(applyRegexRules('item42end', rules)).toBe('item[42]end');
  });

  it('複数ルールの中でdisabledをスキップして有効なルールを適用する', () => {
    const rules = [
      rule({ pattern: 'example', replacement: 'first', enabled: false }),
      rule({ pattern: 'example', replacement: 'second', enabled: true }),
    ];
    expect(applyRegexRules('https://example.com/', rules)).toBe('https://second.com/');
  });
});

// --- validatePattern ---

describe('validatePattern', () => {
  it('pattern が空文字のとき null を返す', () => {
    expect(validatePattern('', '')).toBeNull();
  });

  it('有効な正規表現のとき null を返す', () => {
    expect(validatePattern('https://example\\.com', '')).toBeNull();
  });

  it('キャプチャグループを含む有効なパターンのとき null を返す', () => {
    expect(validatePattern('(\\d+)\\.T', '')).toBeNull();
  });

  it('不正な正規表現のときエラーメッセージ文字列を返す', () => {
    const result = validatePattern('[invalid', '');
    expect(typeof result).toBe('string');
    expect(result).not.toBeNull();
  });

  it('有効なフラグ (gi) のとき null を返す', () => {
    expect(validatePattern('abc', 'gi')).toBeNull();
  });

  it('不正なフラグのときエラーメッセージ文字列を返す', () => {
    const result = validatePattern('abc', 'z');
    expect(typeof result).toBe('string');
    expect(result).not.toBeNull();
  });
});
