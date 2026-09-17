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
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mono text-[11px] uppercase tracking-[.16em] text-[#04714a]">
            The people behind it
          </p>
          <h1
            id="contributors-title"
            className="mt-2 text-4xl font-bold tracking-[-.05em] text-[#172b21] md:text-5xl"
          >
            Contributors<span aria-hidden="true" className="text-[#00a86b]">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 lg:pb-1">
          <span className="whitespace-nowrap rounded-full border border-black/[.06] bg-white/70 px-3 py-1.5 text-xs font-medium text-black/50">
            {contributors.length} contributors
          </span>
          <p className="max-w-xs text-sm leading-6 text-black/50">
            A shared project grows through many kinds of care.
          </p>
        </div>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {contributors.map((contributor) => (
          <article
            key={contributor.id}
            className="group min-w-0 rounded-2xl border border-black/[.07] bg-[#fbfbf9] shadow-sm transition duration-300 hover:border-[#04714a]/20 hover:shadow-lg motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none"
          >
            <div
              aria-hidden="true"
              className="relative h-20 overflow-hidden rounded-t-2xl bg-[#e9ece7]"
            >
              <span className="absolute -right-4 -top-12 size-40 rounded-full border-[22px] border-white/35 transition-transform duration-500 motion-safe:group-hover:translate-x-2 motion-safe:group-hover:translate-y-2" />
            </div>

            <div className="relative flex min-h-52 flex-col px-5 pb-4">
              <div
                aria-hidden="true"
                className="-mt-7 flex size-16 items-center justify-center rounded-full border-4 border-[#fbfbf9] text-base font-semibold text-[#172b21] shadow-sm"
                style={{ backgroundColor: contributor.color }}
              >
                {contributor.initials}
              </div>

              <div className="mt-4 flex-1">
                <h2 className="break-words text-lg font-semibold tracking-tight text-[#172b21]">
                  {contributor.name}
                </h2>
                <p className="mt-0.5 text-[13px] font-medium leading-5 text-[#04714a]">
                  {contributor.role}
                </p>

                <div className="group/task relative mt-5 w-full">
                  <p className="mono mb-1 text-[10px] uppercase tracking-[.14em] text-black/35">
                    Task
                  </p>
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-describedby={`contributor-preview-${contributor.id}`}
                    onClick={() => openDetails(contributor)}
                    className="flex w-full items-center justify-between gap-2 rounded-md text-left text-[13px] leading-6 text-black/60 transition-colors hover:text-[#04714a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#04714a]"
                  >
                    <span className="truncate">{contributor.contribution}</span>
                    <span aria-hidden="true" className="shrink-0 opacity-0 transition-opacity group-hover/task:opacity-100">
                      ↗
                    </span>
                  </button>

                  <div
                    id={`contributor-preview-${contributor.id}`}
                    role="tooltip"
                    className="pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-20 w-60 translate-y-1 rounded-xl border border-black/[.07] bg-white p-4 opacity-0 shadow-lg transition duration-150 group-hover/task:translate-y-0 group-hover/task:opacity-100"
                  >
                    <p className="text-xs font-semibold text-[#172b21]">Quick view</p>
                    <div className="mt-3 space-y-2 text-xs">
                      <p className="flex justify-between gap-3">
                        <span className="text-black/45">Team</span>
                        <span className="font-medium">{contributor.team}</span>
                      </p>
                      <p className="flex justify-between gap-3">
                        <span className="text-black/45">Position</span>
                        <span className="font-medium">{contributor.role}</span>
                      </p>
                    </div>
                    <p className="mt-3 border-t border-black/[.06] pt-3 text-[11px] text-[#04714a]">
                      Click to view full details
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 flex items-center gap-2 border-t border-black/[.06] pt-3.5 text-xs font-medium text-black/50">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: contributor.color }}
                />
                {contributor.team}
              </p>
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
            <div
              className="relative h-24 overflow-hidden"
              style={{ backgroundColor: selected.color }}
            >
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
                className="-mt-9 flex size-[72px] items-center justify-center rounded-full border-[5px] border-white text-xl font-semibold shadow-sm"
                style={{ backgroundColor: selected.color }}
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
