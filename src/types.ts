export type CopyButton = {
  id: string;
  label: string;
  format: string;
  enabled: boolean;
};

export type RegexRule = {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  replacement: string;
  enabled: boolean;
};
