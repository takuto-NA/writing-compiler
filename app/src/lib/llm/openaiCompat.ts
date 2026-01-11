export type OpenAICompatChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }

export type OpenAICompatChatCompletionsRequest = {
  model: string
  messages: OpenAICompatChatMessage[]
  temperature?: number
}

export type OpenAICompatChatCompletionsResponse = {
  id: string
  choices: Array<{
    index: number
    message: { role: 'assistant'; content: string | null }
    finish_reason?: string
  }>
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

export class LlmHttpError extends Error {
  status: number
  bodyText?: string
  constructor(message: string, status: number, bodyText?: string) {
    super(message)
    this.name = 'LlmHttpError'
    this.status = status
    this.bodyText = bodyText
  }
}

export async function chatCompletions(args: {
  baseUrl: string
  apiKey: string
  request: OpenAICompatChatCompletionsRequest
  signal?: AbortSignal
}): Promise<OpenAICompatChatCompletionsResponse> {
  const url = `${normalizeBaseUrl(args.baseUrl)}/chat/completions`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify(args.request),
    signal: args.signal,
  })

  if (!res.ok) {
    const bodyText = await res.text().catch(() => undefined)
    throw new LlmHttpError(`LLM request failed: ${res.status} ${res.statusText}`, res.status, bodyText)
  }

  return (await res.json()) as OpenAICompatChatCompletionsResponse
}

export function pickAssistantText(resp: OpenAICompatChatCompletionsResponse): string {
  const content = resp.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM returned empty content')
  return content
}

