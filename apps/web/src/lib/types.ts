export type User = { id: string; name: string; email: string; createdAt: string };
export type ProjectMeta = { id: string; name: string; updatedAt: string };
export type ProjectFull = { id: string; name: string; doc: any; updatedAt: string };
export type Provider =
  | 'openai' | 'anthropic' | 'google' | 'groq' | 'mistral' | 'deepseek' | 'openrouter' | 'custom';
export type Settings = { provider: Provider; model: string; baseUrl?: string; hasKey: boolean };
export type ChatMsg = { role: 'user' | 'assistant' | 'system'; content: string };

export const PROVIDERS: { id: Provider; label: string; defaultModel: string; custom?: boolean }[] = [
  { id: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
  { id: 'anthropic', label: 'Anthropic (Claude)', defaultModel: 'claude-3-5-sonnet-latest' },
  { id: 'google', label: 'Google (Gemini)', defaultModel: 'gemini-1.5-flash' },
  { id: 'groq', label: 'Groq', defaultModel: 'llama-3.3-70b-versatile' },
  { id: 'mistral', label: 'Mistral', defaultModel: 'mistral-large-latest' },
  { id: 'deepseek', label: 'DeepSeek', defaultModel: 'deepseek-chat' },
  { id: 'openrouter', label: 'OpenRouter', defaultModel: 'openai/gpt-4o-mini' },
  { id: 'custom', label: 'Personalizado (OpenAI-compat)', defaultModel: '', custom: true },
];
