function App() {
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
              disabled
              aria-disabled="true"
              title="次のステップで実装します"
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
                  disabled
                  aria-disabled="true"
                  title="次のステップで実装します"
                >
                  判定→修正
                </button>
                <button
                  type="button"
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  disabled
                  aria-disabled="true"
                  title="次のステップで実装します"
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
                このアプリはGitHub Pages上で動きます。LLMキーは端末ローカルに保存（IndexedDB）できる設計にします。
              </p>
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
    </div>
  )
}

export default App
