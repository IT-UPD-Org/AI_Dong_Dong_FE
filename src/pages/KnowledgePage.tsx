export function KnowledgePage() {
  return (
    <main>
      <p className="mono text-xs uppercase tracking-[.18em] text-[#04714a]">
        Explore the base
      </p>
      <h1 className="mt-3 text-5xl font-bold tracking-[-.07em]">Knowledge</h1>
      <p className="mt-4 max-w-xl text-black/55">
        Browse the living collection that helps IT UPD GenAIanswer with context.
      </p>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {["Academic life", "Campus & services", "Research & people"].map(
          (x, i) => (
            <div
              key={x}
              className="rounded-3xl border border-black/10 bg-white p-6"
            >
              <span className="mono text-xs text-[#00a86b]">0{i + 1}</span>
              <h2 className="mt-16 text-xl font-semibold">{x}</h2>
              <p className="mt-3 text-sm leading-6 text-black/50">
                Curated sources, policies, and helpful guides from the
                university.
              </p>
            </div>
          ),
        )}
      </div>
    </main>
  );
}
