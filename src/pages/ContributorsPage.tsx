import { useRef, useState } from "react";
import { contributors } from "../mocks/data";
import type { Contributor } from "../types";

export function ContributorsPage() {
  const [selected, setSelected] = useState<Contributor | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openDetails(contributor: Contributor) {
    setSelected(contributor);
    requestAnimationFrame(() => dialogRef.current?.showModal());
  }

  return (
    <section
      aria-labelledby="contributors-title"
      className="rounded-3xl bg-[#f5f6f3] px-5 py-7 md:px-8 md:py-9"
    >
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="mono text-[11px] uppercase tracking-[.16em] text-[#04714a]">
              The people behind it
            </p>
            <span aria-hidden="true" className="h-px w-8 bg-[#04714a]/25" />
            <p className="mono text-[10px] uppercase tracking-[.14em] text-black/40">
              {contributors.length} contributors
            </p>
          </div>
          <h1
            id="contributors-title"
            className="mt-2 text-4xl font-bold tracking-[-.05em] text-[#172b21] md:text-5xl"
          >
            Contributors<span aria-hidden="true" className="text-[#00a86b]">.</span>
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-black/50 lg:pb-1 lg:text-right">
          A shared project grows through many kinds of care.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {contributors.map((contributor) => (
          <article
            key={contributor.id}
            className="group relative isolate min-w-0 rounded-2xl border border-black/[.06] bg-[#f9f9f6] shadow-sm transition duration-300 hover:border-black/10 hover:shadow-lg motion-safe:hover:-translate-y-1 motion-reduce:transition-none"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl bg-[#e8f2ed] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-5 top-0 z-20 h-px origin-left scale-x-0 bg-[#69a888] transition-transform duration-500 ease-out group-hover:scale-x-100"
            />

            <div
              aria-hidden="true"
              className="relative z-10 h-16 overflow-hidden rounded-t-2xl bg-[#e7ebe7] transition-colors duration-500 group-hover:bg-[#dcebe3]"
            >
              <span className="absolute -right-5 -top-12 size-36 rounded-full border-[20px] border-white/35 transition duration-500 ease-out motion-safe:group-hover:translate-x-2 motion-safe:group-hover:translate-y-2 motion-safe:group-hover:scale-105" />
            </div>

            <div className="relative z-10 flex min-h-44 flex-col px-5 pb-4">
              <div
                aria-hidden="true"
                className="-mt-6 flex size-14 items-center justify-center rounded-full border-4 border-[#f9f9f6] bg-[#c9ded2] text-sm font-semibold text-[#172b21] shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:border-[#e8f2ed] group-hover:shadow-md"
              >
                {contributor.initials}
              </div>

              <div className="mt-3 flex-1">
                <h2 className="break-words text-base font-semibold tracking-tight text-[#172b21] transition-colors duration-300 group-hover:text-[#04714a]">
                  {contributor.name}
                </h2>
                <p className="mt-1 text-xs font-medium leading-5 text-[#04714a]">
                  {contributor.role}
                </p>
              </div>

              <div className="group/task relative mt-5 border-t border-black/[.06] pt-3.5">
                <p className="mono mb-1 text-[9px] uppercase tracking-[.14em] text-black/35">
                  Task
                </p>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-describedby={`contributor-preview-${contributor.id}`}
                  onClick={() => openDetails(contributor)}
                  className="flex w-full items-center justify-between gap-3 rounded-md text-left text-[13px] leading-6 text-black/60 transition-colors hover:text-[#04714a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#04714a]"
                >
                  <span className="truncate">{contributor.contribution}</span>
                  <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full border border-black/[.06] bg-white/70 text-xs opacity-0 transition duration-200 group-hover/task:bg-[#04714a] group-hover/task:text-white group-hover/task:opacity-100">
                    ↗
                  </span>
                </button>

                <div
                  id={`contributor-preview-${contributor.id}`}
                  role="tooltip"
                  className="pointer-events-none absolute bottom-[calc(100%+10px)] left-0 z-30 w-64 translate-y-1 rounded-xl border border-black/[.06] bg-[#fdfdfb] p-4 opacity-0 shadow-xl transition duration-150 group-hover/task:translate-y-0 group-hover/task:opacity-100"
                >
                  <p className="text-sm font-semibold text-[#172b21]">{contributor.name}</p>
                  <p className="mt-0.5 text-xs text-[#04714a]">{contributor.role}</p>
                  <div className="mt-3 space-y-2 border-t border-black/[.06] pt-3 text-xs">
                    <p className="flex justify-between gap-3">
                      <span className="text-black/45">Team</span>
                      <span className="font-medium">{contributor.team}</span>
                    </p>
                    <p className="flex justify-between gap-3">
                      <span className="text-black/45">Task</span>
                      <span className="text-right font-medium">{contributor.contribution}</span>
                    </p>
                  </div>
                  <p className="mt-3 border-t border-black/[.06] pt-3 text-[11px] text-[#04714a]">
                    Click to view full details
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="contributor-name"
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-3xl border border-black/[.08] bg-[#fbfbf9] p-0 text-[#172b21] shadow-2xl backdrop:bg-[#172b21]/30 backdrop:backdrop-blur-sm"
      >
        {selected && (
          <>
            <div className="relative h-24 overflow-hidden bg-[#dfece5]">
              <span aria-hidden="true" className="absolute -right-5 -top-16 size-52 rounded-full border-[28px] border-white/20" />
              <button
                type="button"
                autoFocus
                aria-label="Close contributor details"
                onClick={() => dialogRef.current?.close()}
                className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-white/70 text-xl backdrop-blur transition hover:bg-white"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="relative px-7 pb-8">
              <span
                aria-hidden="true"
                className="-mt-9 flex size-[72px] items-center justify-center rounded-full border-[5px] border-[#fbfbf9] bg-[#c9ded2] text-xl font-semibold shadow-sm"
              >
                {selected.initials}
              </span>
              <h2 id="contributor-name" className="mt-5 text-2xl font-semibold tracking-tight">
                {selected.name}
              </h2>
              <p className="mt-1.5 text-sm font-medium text-[#04714a]">{selected.role}</p>

              <dl className="mt-7 grid gap-5 border-t border-black/[.07] pt-6 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-black/45">Team</dt>
                  <dd className="mt-1.5 font-medium">{selected.team}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/45">Task</dt>
                  <dd className="mt-1.5 leading-6">{selected.contribution}</dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
