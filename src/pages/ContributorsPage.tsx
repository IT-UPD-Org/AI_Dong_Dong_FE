import { contributors } from "../mocks/data";
export function ContributorsPage() {
  return (
    <main>
      <p className="mono text-xs uppercase tracking-[.18em] text-[#04714a]">
        The people behind it
      </p>
      <h1 className="mt-3 text-5xl font-bold tracking-[-.07em]">
        Contributors
      </h1>
      <p className="mt-4 max-w-xl text-black/55">
        A shared project grows through many kinds of care.
      </p>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contributors.map((c) => (
          <article
            key={c.id}
            className="group rounded-3xl border border-black/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div
              className="flex size-16 items-center justify-center rounded-full text-sm font-bold text-black"
              style={{ background: c.color }}
            >
              {c.initials}
            </div>
            <h2 className="mt-8 font-semibold">{c.name}</h2>
            <p className="mt-1 text-sm text-[#04714a]">{c.role}</p>
            <p className="mt-5 text-sm leading-6 text-black/50">
              {c.contribution}
            </p>
            <span className="mt-8 inline-block rounded-full bg-[#f5f4ef] px-3 py-1 text-xs text-black/45">
              {c.team}
            </span>
          </article>
        ))}
      </div>
    </main>
  );
}
