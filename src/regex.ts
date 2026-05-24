import type { RegexRule } from './types';

// 有効なルールを上から評価し、最初にマッチしたもの1件のみ適用する
export const applyRegexRules = (url: string, rules: RegexRule[]): string => {
  for (const rule of rules) {
    if (!rule.enabled || !rule.pattern) continue;
    try {
      const regex = new RegExp(rule.pattern, rule.flags);
      if (regex.test(url)) {
        // test() で消費されるので RegExp を再生成
        return url.replace(new RegExp(rule.pattern, rule.flags), rule.replacement);
      }
    } catch {
      // パターン不正は無視して次のルールへ
    }
  }
  return url;
};

// catch の e は unknown 型のため Error として扱うために as を使用
export const validatePattern = (pattern: string, flags: string): string | null => {
  if (!pattern) return null;
  try {
    new RegExp(pattern, flags);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
};
