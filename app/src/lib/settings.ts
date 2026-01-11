import { del, get, set } from 'idb-keyval'

export type AppSettings = {
  baseUrl: string
  modelValidator: string
  modelRewriter: string
  /**
   * Whether API key should be persisted to IndexedDB.
   * If false, apiKey is kept only in memory for the current session.
   */
  persistApiKey: boolean
  apiKey?: string
}

const SETTINGS_KEY = 'writing-compiler:settings:v1'

export const DEFAULT_SETTINGS: AppSettings = {
  baseUrl: 'https://api.groq.com/openai/v1',
  modelValidator: 'llama-3.1-70b-versatile',
  modelRewriter: 'llama-3.1-70b-versatile',
  persistApiKey: false,
  apiKey: '',
}

export async function loadSettings(): Promise<AppSettings> {
  const raw = await get<AppSettings | undefined>(SETTINGS_KEY)
  if (!raw) return { ...DEFAULT_SETTINGS }
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    apiKey: raw.persistApiKey ? raw.apiKey ?? '' : '',
  }
}

export async function saveSettings(next: AppSettings): Promise<void> {
  if (!next.persistApiKey) {
    // Don’t store secrets when disabled.
    await set(SETTINGS_KEY, { ...next, apiKey: '' })
    return
  }
  await set(SETTINGS_KEY, { ...next })
}

export async function clearPersistedApiKey(): Promise<void> {
  const raw = await get<AppSettings | undefined>(SETTINGS_KEY)
  if (!raw) return
  await set(SETTINGS_KEY, { ...raw, apiKey: '' })
}

export async function resetSettings(): Promise<void> {
  await del(SETTINGS_KEY)
}

