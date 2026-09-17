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
    <section aria-labelledby="contributors-title" className="min-h-full rounded-3xl bg-[#f3f4f5] px-5 py-7 sm:p-8 lg:p-10">
      <header className="mb-8 border-b border-black/[.06] pb-7">
        <p className="text-xs font-medium text-[#65736c]">The people behind it</p>
        <h1 id="contributors-title" className="mt-2 text-3xl font-semibold tracking-[-.04em] text-[#25332c]">
          Contributors
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#707873]">
          A shared project grows through many kinds of care.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {contributors.map((contributor) => (
          <li key={contributor.id}>
            <article className="flex h-full min-w-0 flex-col rounded-2xl border border-black/[.06] bg-[#fafafa] p-6 shadow-[0_4px_16px_-6px_rgba(24,39,30,0.12)] transition-[translate,box-shadow,border-color] duration-200 hover:border-[#b9c8be] hover:shadow-[0_12px_28px_-10px_rgba(24,39,30,0.2)] motion-safe:hover:-translate-y-1 motion-reduce:transition-none">
              <h2 className="break-words text-base font-semibold tracking-tight text-[#25332c]">
                {contributor.name}
              </h2>
              <p className="mt-1.5 text-xs font-medium leading-5 text-[#527061]">
                {contributor.role}
              </p>

              <div className="group/task relative mt-6 border-t border-black/[.05] pt-4">
                <button
                  type="button"
                  aria-describedby={`contributor-preview-${contributor.id}`}
                  onClick={(event) => openDetails(contributor, event.currentTarget)}
                  className="w-full rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#04714a]"
                >
                  <span className="text-[10px] font-medium uppercase tracking-[.12em] text-[#8a918d]">
                    Task
                  </span>
                  <span className="mt-1.5 flex items-center justify-between gap-3 text-[13px] leading-6 text-[#626c66] transition-colors group-hover/task:text-[#04714a]">
                    {contributor.contribution}
                    <span aria-hidden="true" className="text-base transition-transform group-hover/task:translate-x-0.5">↗</span>
                  </span>
                </button>

                <div
                  id={`contributor-preview-${contributor.id}`}
                  role="tooltip"
                  className="pointer-events-none absolute bottom-[calc(100%+12px)] left-0 z-20 w-56 translate-y-1 rounded-xl border border-black/[.07] bg-white p-4 opacity-0 shadow-[0_16px_40px_-14px_rgba(20,35,26,0.3)] transition-[opacity,translate] duration-150 group-hover/task:translate-y-0 group-hover/task:opacity-100 group-focus-within/task:translate-y-0 group-focus-within/task:opacity-100 motion-reduce:transition-none"
                >
                  <p className="text-xs font-semibold text-[#25332c]">Quick view</p>
                  <dl className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#8a918d]">Team</dt>
                      <dd className="text-right font-medium text-[#4e5b54]">{contributor.team}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#8a918d]">Position</dt>
                      <dd className="text-right font-medium text-[#4e5b54]">{contributor.role}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 border-t border-black/[.06] pt-3 text-[11px] text-[#04714a]">
                    Click to view full details
                  </p>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-labelledby="contributor-name"
        onClose={closeDetails}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border border-black/[.08] bg-[#f7f8f7] p-0 text-[#25332c] shadow-[0_24px_80px_-16px_rgba(20,35,26,0.3)] backdrop:bg-[#1b2922]/25 backdrop:backdrop-blur-sm open:animate-in open:fade-in-0 open:zoom-in-95 open:duration-200 motion-reduce:animate-none"
      >
        {selected && (
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-2xl border border-[#d9e2dc] bg-[#e8eeea] text-lg font-semibold text-[#426451]">
                {selected.initials}
              </span>
              <button
                type="button"
                autoFocus
                aria-label="Close contributor details"
                onClick={() => dialogRef.current?.close()}
                className="flex size-9 items-center justify-center rounded-full text-[#67736c] transition-colors hover:bg-black/5 hover:text-[#25332c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04714a]"
              >
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </div>

            <h2 id="contributor-name" className="break-words text-2xl font-semibold tracking-tight">
              {selected.name}
            </h2>
            <p className="mt-2 text-sm text-[#527061]">{selected.role}</p>

            <dl className="mt-7 space-y-5 border-t border-black/[.07] pt-6 text-sm">
              <div>
                <dt className="text-xs text-[#707873]">Team</dt>
                <dd className="mt-1.5 font-medium">{selected.team}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#707873]">Task</dt>
                <dd className="mt-1.5 leading-6">{selected.contribution}</dd>
              </div>
            </dl>
          </div>
        )}
      </dialog>
    </section>
  );
}
