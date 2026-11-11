import { contributors } from "../mocks/data";

export function ContributorsPage() {
  return (
    <main className="px-4 py-6 text-foreground sm:px-6 sm:py-8">
      <p className="mono text-xs uppercase tracking-[.18em] text-brand-text">
        The people behind it
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-.07em] sm:text-5xl">
        Contributors
      </h1>
      <p className="mt-4 max-w-xl text-fg-secondary">
        A shared project grows through many kinds of care.
      </p>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contributors.map((c) => (
          <article
            key={c.id}
            className="group rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div
              className="flex size-16 items-center justify-center rounded-full text-sm font-bold text-[#11130f]"
              style={{ background: c.color }}
            >
              {c.initials}
            </div>
            <h2 className="mt-8 font-semibold text-foreground">{c.name}</h2>
            <p className="mt-1 text-sm text-brand-text">{c.role}</p>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              {c.contribution}
            </p>
            <span className="mt-8 inline-block rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {c.team}
            </span>
          </article>
        ))}
      </div>
    </main>
  );
}
