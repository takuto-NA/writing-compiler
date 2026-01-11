import { z } from 'zod'

const Level = z.enum(['error', 'warning', 'info'])
const ExpectedSlot = z.enum(['reference', 'definition', 'baseline', 'evidence', 'relation', 'subject'])

export const ValidatorJsonSchema = z.object({
  version: z.string(),
  pass: z.boolean(),
  summary: z.object({
    error_count: z.number().int().nonnegative(),
    warning_count: z.number().int().nonnegative(),
    info_count: z.number().int().nonnegative(),
    unresolved_links: z.number().int().nonnegative(),
  }),
  diagnostics: z.array(
    z.object({
      level: Level,
      rule_id: z.string(),
      sentence_index: z.number().int().nonnegative(),
      span: z.object({
        start: z.number().int().nonnegative(),
        end: z.number().int().nonnegative(),
      }),
      evidence: z.string(),
      message: z.string(),
      expected_slots: z.array(ExpectedSlot),
      candidates: z.array(z.string()).optional(),
    }),
  ),
})

export type ValidatorJson = z.infer<typeof ValidatorJsonSchema>

export function tryParseJsonLoose(text: string): unknown {
  // 1) plain JSON
  try {
    return JSON.parse(text)
  } catch {
    // continue
  }

  // 2) extract first {...} block (handles code fences / prefixed text)
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1)
    return JSON.parse(slice)
  }

  throw new Error('JSON parse failed')
}

