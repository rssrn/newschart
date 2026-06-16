export type CalloutSource = 'GOOGLE_GEMINI' | 'PERPLEXITY' | 'OPENAI' | 'NEW_YORK_TIMES';

export interface SourceMeta {
  letter: string;
  label: string;
  shortLabel: string;
  color: string;
}

export const SOURCE_META: Record<CalloutSource, SourceMeta> = {
  GOOGLE_GEMINI: { letter: 'G', label: 'Google Gemini', shortLabel: 'Gemini', color: '#34d399' },
  PERPLEXITY: { letter: 'P', label: 'Perplexity Sonar', shortLabel: 'Perplexity', color: '#f472b6' },
  OPENAI: { letter: 'O', label: 'OpenAI ChatGPT', shortLabel: 'ChatGPT', color: '#a78bfa' },
  NEW_YORK_TIMES: { letter: 'N', label: 'New York Times', shortLabel: 'NYT', color: '#fbbf24' },
};

export const SOURCE_ORDER: CalloutSource[] = ['GOOGLE_GEMINI', 'PERPLEXITY', 'OPENAI', 'NEW_YORK_TIMES'];

export function formatSourceShort(source: string): string {
  return SOURCE_META[source as CalloutSource]?.shortLabel ?? source;
}
