import { useEffect, useRef, useState } from "react";
import { contributors } from "../mocks/data";
import type { Contributor } from "../types";

export function ContributorsPage() {
  const [selected, setSelected] = useState<Contributor | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function openDetails(contributor: Contributor, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setSelected(contributor);
  }

  function closeDetails() {
    setSelected(null);
    triggerRef.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (selected && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [selected]);

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
            className="group min-w-0 rounded-2xl border border-black/10 bg-white shadow-sm transition-[translate,box-shadow,border-color] duration-300 hover:border-[#04714a]/25 hover:shadow-xl hover:shadow-[#172b21]/10 motion-safe:hover:-translate-y-1 motion-reduce:transition-none"
          >
            <div
              aria-hidden="true"
              className="relative h-24 overflow-hidden rounded-t-2xl"
              style={{ backgroundColor: contributor.color }}
            >
              <div className="absolute -right-5 -top-12 size-44 rounded-full border-[24px] border-white/20 transition-transform duration-500 motion-safe:group-hover:translate-x-3 motion-safe:group-hover:translate-y-2 motion-reduce:transition-none" />
            </div>

            <div className="relative flex min-h-64 flex-col px-6 pb-5">
              <div
                aria-hidden="true"
                className="-mt-9 flex size-[72px] items-center justify-center rounded-full border-[5px] border-white text-xl font-semibold text-[#172b21] shadow-sm"
                style={{ backgroundColor: contributor.color }}
              >
                {contributor.initials}
              </div>

              <div className="mt-5 flex-1">
                <h2 className="break-words text-xl font-semibold tracking-tight text-[#172b21]">
                  {contributor.name}
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-[#04714a]">
                  {contributor.role}
                </p>

                <div className="group/task relative mt-4 w-fit max-w-full">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-describedby={`contributor-preview-${contributor.id}`}
                    onClick={(event) => openDetails(contributor, event.currentTarget)}
                    className="flex max-w-full items-center gap-2 rounded-md text-left text-sm leading-6 text-black/60 transition-colors hover:text-[#04714a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#04714a]"
                  >
                    <span className="truncate">{contributor.contribution}</span>
                    <span aria-hidden="true" className="shrink-0 -translate-x-1 opacity-0 transition-[translate,opacity] group-hover/task:translate-x-0 group-hover/task:opacity-100 group-focus-within/task:translate-x-0 group-focus-within/task:opacity-100">
                      ↗
                    </span>
                  </button>

                  <div
                    id={`contributor-preview-${contributor.id}`}
                    role="tooltip"
                    className="pointer-events-none absolute bottom-[calc(100%+10px)] left-0 z-20 w-60 translate-y-1 rounded-xl border border-black/[.07] bg-white p-4 opacity-0 shadow-[0_16px_40px_-14px_rgba(20,35,26,0.3)] transition-[opacity,translate] duration-150 group-hover/task:translate-y-0 group-hover/task:opacity-100 group-focus-within/task:translate-y-0 group-focus-within/task:opacity-100 motion-reduce:transition-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: contributor.color }} />
                      <p className="text-xs font-semibold text-[#172b21]">Quick view</p>
                    </div>
                    <dl className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt className="text-black/45">Team</dt>
                        <dd className="text-right font-medium text-[#46554b]">{contributor.team}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-black/45">Position</dt>
                        <dd className="text-right font-medium text-[#46554b]">{contributor.role}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 border-t border-black/[.06] pt-3 text-[11px] text-[#04714a]">
                      Click to view full details
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-black/[.07] pt-4 text-xs font-medium text-black/55">
                <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: contributor.color }} />
                {contributor.team}
              </div>
            </div>
          </article>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="contributor-name"
        onClose={closeDetails}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-3xl border border-black/10 bg-white p-0 text-[#172b21] shadow-[0_28px_90px_-18px_rgba(20,35,26,0.38)] backdrop:bg-[#172b21]/30 backdrop:backdrop-blur-sm open:animate-in open:fade-in-0 open:zoom-in-95 open:duration-200 motion-reduce:animate-none"
      >
        {selected && (
          <div>
            <div className="relative h-24 overflow-hidden" style={{ backgroundColor: selected.color }}>
              <div className="absolute -right-5 -top-16 size-52 rounded-full border-[28px] border-white/20" />
              <button
                type="button"
                autoFocus
                aria-label="Close contributor details"
                onClick={() => dialogRef.current?.close()}
                className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-white/70 text-[#172b21] backdrop-blur transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span aria-hidden="true" className="text-xl leading-none">×</span>
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
              <h2 id="contributor-name" className="mt-5 break-words text-2xl font-semibold tracking-tight">
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
          </div>
        )}
      </dialog>
    </section>
  );
}
