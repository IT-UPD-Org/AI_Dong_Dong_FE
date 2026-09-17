export function SettingsPage() {
  return (
    <main>
      <p className="mono text-xs uppercase tracking-[.18em] text-[#04714a]">
        Preferences
      </p>
      <h1 className="mt-3 text-5xl font-bold tracking-[-.07em]">Settings</h1>
      <div className="mt-10 max-w-2xl divide-y divide-black/10 rounded-3xl border border-black/10 bg-white">
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="font-semibold">Response language</h2>
            <p className="mt-1 text-sm text-black/45">
              Choose how IT UPD GenAIspeaks with you.
            </p>
          </div>
          <select className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm">
            <option>English</option>
            <option>Tiếng Việt</option>
          </select>
        </div>
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="font-semibold">Source citations</h2>
            <p className="mt-1 text-sm text-black/45">
              Show references under answers.
            </p>
          </div>
          <input type="checkbox" defaultChecked className="accent-[#00a86b]" />
        </div>
      </div>
    </main>
  );
}
