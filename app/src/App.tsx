import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  loadSettings,
  resetSettings,
  saveSettings,
} from './lib/settings'

function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [settingsDraft, setSettingsDraft] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)

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
                  disabled={!canRun}
                  aria-disabled={!canRun}
                  title={canRun ? '判定→修正（未実装）' : '設定でAPIキーとモデルを入力してください'}
                >
                  判定→修正
                </button>
                <button
                  type="button"
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  disabled={!canRun}
                  aria-disabled={!canRun}
                  title={canRun ? '判定のみ（未実装）' : '設定でAPIキーとモデルを入力してください'}
                >
                  判定のみ
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
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-200">出力</h2>
              <button
                type="button"
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                disabled
                aria-disabled="true"
                title="次のステップで実装します"
              >
                コピー
              </button>
            </div>
            <div className="p-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-300">
                <p className="text-zinc-400">
                  ここに改稿結果が表示されます（まだ未実装）。
                </p>
              </div>

              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  診断
                </h3>
                <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-300">
                  <p className="text-zinc-400">ここにValidatorのJSON診断を表示します（まだ未実装）。</p>
                </div>
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
