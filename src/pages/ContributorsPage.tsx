import { contributors } from "../mocks/data";

export function ContributorsPage() {
  return (
    <section aria-labelledby="contributors-title" className="pb-12 pt-3 md:pt-6">
      <header className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mono text-xs uppercase tracking-[.16em] text-[#04714a]">
            The people behind it
          </p>
          <h1
            id="contributors-title"
            className="mt-3 text-4xl font-bold tracking-[-.055em] text-[#172b21] md:text-6xl"
          >
            Contributors<span aria-hidden="true" className="text-[#00a86b]">.</span>
          </h1>
        </div>
        <p className="max-w-xs text-base leading-7 text-black/55">
          A shared project grows through many kinds of care.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {contributors.map((contributor) => (
          <article
            key={contributor.id}
            className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition-[translate,box-shadow,border-color] duration-300 hover:border-[#04714a]/25 hover:shadow-xl hover:shadow-[#172b21]/10 motion-safe:hover:-translate-y-1 motion-reduce:transition-none"
          >
            <div
              aria-hidden="true"
              className="relative h-24 shrink-0 overflow-hidden"
              style={{ backgroundColor: contributor.color }}
            >
              <div className="absolute -right-5 -top-12 size-44 rounded-full border-[24px] border-white/20 transition-transform duration-500 motion-safe:group-hover:translate-x-3 motion-safe:group-hover:translate-y-2 motion-reduce:transition-none" />
            </div>

            <div className="relative flex flex-1 flex-col px-6 pb-5">
              <div
                aria-hidden="true"
                className="-mt-9 flex size-[72px] shrink-0 items-center justify-center rounded-full border-[5px] border-white text-xl font-semibold text-[#172b21] shadow-sm"
                style={{ backgroundColor: contributor.color }}
              >
                {contributor.initials}
              </div>

              <div className="mb-6 mt-5 flex-1">
                <h2 className="break-words text-xl font-semibold tracking-tight text-[#172b21]">
                  {contributor.name}
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-[#04714a]">
                  {contributor.role}
                </p>
                <p className="mt-4 text-sm leading-6 text-black/60">
                  {contributor.contribution}
                </p>
              </div>

              <div className="flex items-center gap-2 border-t border-black/[.07] pt-4 text-xs font-medium text-black/55">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: contributor.color }}
                />
                {contributor.team}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
