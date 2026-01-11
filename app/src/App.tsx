import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  loadSettings,
  resetSettings,
  saveSettings,
} from './lib/settings'
import { chatCompletions, pickAssistantText } from './lib/llm/openaiCompat'
import { buildRewriterPrompt, buildValidatorPrompt } from './lib/compiler/prompts'
import { tryParseJsonLoose, ValidatorJsonSchema, type ValidatorJson } from './lib/compiler/validatorSchema'

function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [settingsDraft, setSettingsDraft] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  const [inputText, setInputText] = useState('')
  const [validatorJson, setValidatorJson] = useState<ValidatorJson | null>(null)
  const [validatorRaw, setValidatorRaw] = useState<string | null>(null)
  const [outputText, setOutputText] = useState<string>('')
  const [runError, setRunError] = useState<string | null>(null)
  const [isRunningValidator, setIsRunningValidator] = useState(false)
  const [isRunningRewriter, setIsRunningRewriter] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const loaded = await loadSettings()
        if (cancelled) return
        setSettings(loaded)
        setSettingsDraft(loaded)
        setIsSettingsLoaded(true)
      } catch (e) {
        if (cancelled) return
        setIsSettingsLoaded(true)
        setSettingsError(e instanceof Error ? e.message : '設定の読み込みに失敗しました')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const canRun = useMemo(() => {
    return Boolean(settings.apiKey && settings.baseUrl && settings.modelValidator && settings.modelRewriter)
  }, [settings.apiKey, settings.baseUrl, settings.modelValidator, settings.modelRewriter])

  async function runValidator(): Promise<ValidatorJson> {
    setRunError(null)
    setIsRunningValidator(true)
    try {
      const prompt = buildValidatorPrompt(inputText)
      const resp = await chatCompletions({
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey ?? '',
        request: {
          model: settings.modelValidator,
          temperature: 0,
          messages: [
            { role: 'system', content: 'You are a strict JSON-only validator. Output JSON only.' },
            { role: 'user', content: prompt },
          ],
        },
      })
      const raw = pickAssistantText(resp)
      setValidatorRaw(raw)
      const parsed = tryParseJsonLoose(raw)
      const json = ValidatorJsonSchema.parse(parsed)
      setValidatorJson(json)
      return json
    } catch (e) {
      setValidatorJson(null)
      const msg = e instanceof Error ? e.message : '判定に失敗しました'
      setRunError(msg)
      throw e
    } finally {
      setIsRunningValidator(false)
    }
  }

  async function runRewriter(vj: ValidatorJson): Promise<string> {
    setRunError(null)
    setIsRunningRewriter(true)
    try {
      const prompt = buildRewriterPrompt(inputText, JSON.stringify(vj))
      const resp = await chatCompletions({
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey ?? '',
        request: {
          model: settings.modelRewriter,
          temperature: 0,
          messages: [
            { role: 'system', content: 'Output only the rewritten text. No explanations.' },
            { role: 'user', content: prompt },
          ],
        },
      })
      const out = pickAssistantText(resp)
      setOutputText(out)
      return out
    } catch (e) {
      const msg = e instanceof Error ? e.message : '修正に失敗しました'
      setRunError(msg)
      throw e
    } finally {
      setIsRunningRewriter(false)
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="min-w-0">
            <div className="text-sm text-zinc-400">writing-compiler</div>
            <h1 className="truncate text-lg font-semibold">文章コンパイラ</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              onClick={() => {
                setSettingsDraft(settings)
                setIsSettingsOpen(true)
                setSettingsError(null)
              }}
            >
              設定
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-200">入力</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  disabled={!canRun || isRunningValidator || isRunningRewriter || !inputText.trim()}
                  aria-disabled={!canRun}
                  title={canRun ? '判定→修正' : '設定でAPIキーとモデルを入力してください'}
                  onClick={async () => {
                    const vj = await runValidator()
                    await runRewriter(vj)
                  }}
                >
                  {isRunningValidator || isRunningRewriter ? '実行中…' : '判定→修正'}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  disabled={!canRun || isRunningValidator || isRunningRewriter || !inputText.trim()}
                  aria-disabled={!canRun}
                  title={canRun ? '判定のみ' : '設定でAPIキーとモデルを入力してください'}
                  onClick={async () => {
                    await runValidator()
                  }}
                >
                  {isRunningValidator ? '判定中…' : '判定のみ'}
                </button>
              </div>
            </div>
            <div className="p-4">
              <label className="sr-only" htmlFor="inputText">
                入力テキスト
              </label>
              <textarea
                id="inputText"
                className="h-[45vh] w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 lg:h-[60vh]"
                placeholder="ここに文章を貼り付けてください…"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                {isSettingsLoaded ? (
                  settings.persistApiKey ? (
                    <>
                      APIキーはこの端末のIndexedDBに保存されています（必要なら設定でOFFにできます）。
                    </>
                  ) : (
                    <>APIキーはこのセッション内のみ保持します（保存するには設定でON）。</>
                  )
                ) : (
                  <>設定を読み込み中…</>
                )}
              </p>
              {settingsError ? (
                <p className="mt-2 text-xs text-rose-300">{settingsError}</p>
              ) : null}
              {runError ? <p className="mt-2 text-xs text-rose-300">{runError}</p> : null}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-200">出力</h2>
              <button
                type="button"
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                disabled={!outputText}
                aria-disabled={!outputText}
                title={outputText ? 'コピー' : '出力がありません'}
                onClick={async () => {
                  await navigator.clipboard.writeText(outputText)
                }}
              >
                コピー
              </button>
            </div>
            <div className="p-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-300">
                {outputText ? (
                  <pre className="whitespace-pre-wrap break-words">{outputText}</pre>
                ) : (
                  <p className="text-zinc-400">ここに改稿結果が表示されます。</p>
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  診断
                </h3>
                {validatorJson ? (
                  <div className="mt-2 space-y-3">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-300">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                        <span>pass: {String(validatorJson.pass)}</span>
                        <span>error: {validatorJson.summary.error_count}</span>
                        <span>warning: {validatorJson.summary.warning_count}</span>
                        <span>info: {validatorJson.summary.info_count}</span>
                        <span>unresolved: {validatorJson.summary.unresolved_links}</span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-zinc-950">
                      <ul className="divide-y divide-zinc-800">
                        {validatorJson.diagnostics.length === 0 ? (
                          <li className="px-3 py-3 text-sm text-zinc-400">diagnostics: 0</li>
                        ) : (
                          validatorJson.diagnostics.map((d, idx) => {
                            const badge =
                              d.level === 'error'
                                ? 'bg-rose-600/20 text-rose-200 ring-1 ring-rose-500/30'
                                : d.level === 'warning'
                                  ? 'bg-amber-600/20 text-amber-200 ring-1 ring-amber-500/30'
                                  : 'bg-sky-600/20 text-sky-200 ring-1 ring-sky-500/30'
                            return (
                              <li key={idx} className="px-3 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`inline-flex rounded-md px-2 py-0.5 text-xs ${badge}`}>
                                    {d.level}
                                  </span>
                                  <span className="text-xs text-zinc-400">{d.rule_id}</span>
                                  <span className="text-xs text-zinc-400">sent#{d.sentence_index}</span>
                                  <span className="text-xs text-zinc-400">
                                    span {d.span.start}-{d.span.end}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm text-zinc-200">{d.message}</div>
                                <div className="mt-1 text-xs text-zinc-400">
                                  evidence: <span className="text-zinc-300">{d.evidence}</span>
                                </div>
                              </li>
                            )
                          })
                        )}
                      </ul>
                    </div>

                    {validatorRaw ? (
                      <details className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-300">
                        <summary className="cursor-pointer text-xs text-zinc-400">raw JSON</summary>
                        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-zinc-300">
                          {validatorRaw}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-300">
                    <p className="text-zinc-400">まだ判定していません。</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {isSettingsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="設定"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsSettingsOpen(false)
          }}
        >
          <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-200">設定</h2>
              <button
                type="button"
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                onClick={() => setIsSettingsOpen(false)}
              >
                閉じる
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300" htmlFor="baseUrl">
                    Base URL（OpenAI互換）
                  </label>
                  <input
                    id="baseUrl"
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    value={settingsDraft.baseUrl}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, baseUrl: e.target.value }))}
                    placeholder="https://api.groq.com/openai/v1"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300" htmlFor="modelValidator">
                    Model（Validator）
                  </label>
                  <input
                    id="modelValidator"
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    value={settingsDraft.modelValidator}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, modelValidator: e.target.value }))}
                    placeholder="例: llama-3.1-70b-versatile"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300" htmlFor="modelRewriter">
                    Model（Rewriter）
                  </label>
                  <input
                    id="modelRewriter"
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    value={settingsDraft.modelRewriter}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, modelRewriter: e.target.value }))}
                    placeholder="例: llama-3.1-70b-versatile"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-zinc-300" htmlFor="apiKey">
                      API Key（Groq）
                    </label>
                    <p className="mt-1 text-xs text-zinc-400">
                      GitHub Pagesで動くため、キーはブラウザから直接送信されます。保存する場合は端末ローカル（IndexedDB）です。
                    </p>
                  </div>
                  <label className="flex shrink-0 items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-indigo-600"
                      checked={settingsDraft.persistApiKey}
                      onChange={(e) =>
                        setSettingsDraft((s) => ({ ...s, persistApiKey: e.target.checked }))
                      }
                    />
                    この端末に保存
                  </label>
                </div>

                <input
                  id="apiKey"
                  className="mt-3 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  value={settingsDraft.apiKey ?? ''}
                  onChange={(e) => setSettingsDraft((s) => ({ ...s, apiKey: e.target.value }))}
                  placeholder="gsk_..."
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  onClick={async () => {
                    await resetSettings()
                    const fresh = await loadSettings()
                    setSettings(fresh)
                    setSettingsDraft(fresh)
                    setSettingsError(null)
                  }}
                >
                  設定をリセット
                </button>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    onClick={() => {
                      setSettingsDraft(settings)
                      setIsSettingsOpen(false)
                      setSettingsError(null)
                    }}
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    onClick={async () => {
                      try {
                        setSettingsError(null)
                        await saveSettings(settingsDraft)
                        // Keep in-memory key even if not persisted, so user can run immediately.
                        const applied: AppSettings = {
                          ...settingsDraft,
                          apiKey: settingsDraft.apiKey ?? '',
                        }
                        setSettings(applied)
                        setIsSettingsOpen(false)
                      } catch (e) {
                        setSettingsError(e instanceof Error ? e.message : '保存に失敗しました')
                      }
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>

              {settingsError ? <p className="text-xs text-rose-300">{settingsError}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
