import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { contributors } from "../mocks/data";
import type { Contributor } from "../types";

export function ContributorsPage() {
  const [selected, setSelected] = useState<Contributor | null>(null);

  return (
    <Dialog.Root
      open={selected !== null}
      onOpenChange={(open) => {
        if (!open) setSelected(null);
      }}
    >
    <section
      aria-labelledby="contributors-title"
      className="rounded-3xl bg-[#f5f6f3] px-5 py-7 md:px-8 md:py-9"
    >
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
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
        {contributors.map((contributor, index) => (
          <article
            key={contributor.id}
            className="group relative isolate min-w-0 rounded-2xl border-[0.5px] border-[#dfe3e0] bg-[#fbfbf9] shadow-[0_1px_2px_rgba(23,43,33,.05)] transition-[transform,box-shadow,border-color,background-color] duration-300 ease-[cubic-bezier(.22,.8,.25,1)] hover:border-[#b4cfc0] hover:bg-white hover:shadow-[0_20px_45px_-28px_rgba(23,43,33,.5)] motion-safe:hover:-translate-y-1 motion-reduce:animate-none motion-reduce:transition-none animate-in fade-in slide-in-from-bottom-3"
            style={{
              animationDelay: `${index * 55}ms`,
              animationFillMode: "both",
            }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-6 top-0 z-10 h-0.5 origin-left scale-x-0 rounded-full bg-[#8fbda4] transition-transform duration-500 ease-out group-hover:scale-x-100"
            />
            <div
              aria-hidden="true"
              className="relative h-20 overflow-hidden rounded-t-2xl bg-[#ecefec] transition-colors duration-500 ease-out group-hover:bg-[#d6e5dd]"
            >
              <div className="absolute -right-4 -top-12 size-40 rounded-full border-[22px] border-white/45 transition-transform duration-500 ease-[cubic-bezier(.22,.8,.25,1)] motion-safe:group-hover:translate-x-3 motion-safe:group-hover:translate-y-3 motion-safe:group-hover:scale-105 motion-reduce:transition-none" />
            </div>

            <div className="relative flex min-h-52 flex-col px-5 pb-4">
              <div
                aria-hidden="true"
                className="-mt-7 flex size-16 items-center justify-center rounded-full border-4 border-[#fbfbf9] bg-[#e1e5e2] text-base font-semibold text-[#172b21] shadow-sm transition-[transform,background-color,box-shadow] duration-300 ease-out group-hover:bg-[#b9d0c1] group-hover:shadow-md motion-safe:group-hover:-translate-y-1"
              >
                {contributor.initials}
              </div>

              <div className="mt-4 flex-1">
                <h2 className="break-words text-lg font-semibold tracking-tight text-[#172b21] transition-colors duration-300 group-hover:text-[#04714a]">
                  {contributor.name}
                </h2>
                <p className="mt-0.5 text-[13px] font-medium leading-5 text-black/55 transition-colors duration-300 group-hover:text-[#04714a]">
                  {contributor.role}
                </p>

                <div className="group/task relative mt-5 w-full">
                  <p className="mono mb-1 text-[10px] uppercase tracking-[.14em] text-black/35">
                    Task
                  </p>
                  <Dialog.Trigger
                    render={
                      <button
                        type="button"
                        aria-describedby={`contributor-preview-${contributor.id}`}
                        onClick={() => setSelected(contributor)}
                        className="flex w-full items-center justify-between gap-2 rounded-md text-left text-[13px] leading-6 text-black/60 transition-colors duration-200 hover:text-[#04714a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#04714a]"
                      />
                    }
                  >
                    <span className="truncate">{contributor.contribution}</span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 -translate-x-1 opacity-0 transition duration-200 group-hover/task:translate-x-0 group-hover/task:opacity-100"
                    >
                      ↗
                    </span>
                  </Dialog.Trigger>

                  <div
                    id={`contributor-preview-${contributor.id}`}
                    role="tooltip"
                    className="pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-20 w-60 translate-y-1 rounded-xl border-[0.5px] border-[#dfe3e0] bg-[#fbfbf9] p-4 opacity-0 shadow-[0_18px_38px_-22px_rgba(23,43,33,.45)] transition-[opacity,transform] duration-150 ease-out group-hover/task:translate-y-0 group-hover/task:opacity-100 group-focus-within/task:translate-y-0 group-focus-within/task:opacity-100 motion-reduce:transition-none"
                  >
                    <p className="text-xs font-semibold text-[#172b21]">Quick view</p>
                    <dl className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt className="text-black/45">Team</dt>
                        <dd className="font-medium">{contributor.team}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-black/45">Position</dt>
                        <dd className="font-medium">{contributor.role}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 border-t border-black/[.06] pt-3 text-[11px] text-[#04714a]">
                      Click to view full details
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-black/[.06] pt-3.5 text-xs font-medium text-black/50">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-[#d2d7d3] transition duration-300 group-hover:scale-125 group-hover:bg-[#9fc4b0]"
                />
                {contributor.team}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>

    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-40 bg-[#172b21]/25 opacity-100 backdrop-blur-[2px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
      <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border-[0.5px] border-[#bfd2c7] bg-[#fbfbf9] text-[#172b21] opacity-100 shadow-[0_32px_80px_-32px_rgba(23,43,33,.55)] outline-none transition-[opacity,scale] duration-300 ease-[cubic-bezier(.22,.8,.25,1)] data-ending-style:scale-[.97] data-ending-style:opacity-0 data-starting-style:scale-[.97] data-starting-style:opacity-0 motion-reduce:transition-none">
        {selected && (
          <>
            <div className="relative h-24 overflow-hidden bg-[#d6e5dd]">
              <span
                aria-hidden="true"
                className="absolute -right-5 -top-16 size-52 rounded-full border-[28px] border-white/30"
              />
              <Dialog.Close className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-white/80 text-xl text-[#172b21] shadow-sm transition-[transform,background-color] duration-200 hover:bg-white motion-safe:hover:scale-105">
                <span aria-hidden="true">×</span>
                <span className="sr-only">Close contributor details</span>
              </Dialog.Close>
            </div>

            <div className="relative px-7 pb-8">
              <span
                aria-hidden="true"
                className="-mt-9 flex size-[72px] items-center justify-center rounded-full border-[5px] border-[#fbfbf9] bg-[#b9d0c1] text-xl font-semibold shadow-sm"
              >
                {selected.initials}
              </span>
              <Dialog.Title className="mt-5 text-2xl font-semibold tracking-tight">
                {selected.name}
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-sm font-medium text-[#04714a]">
                {selected.role}
              </Dialog.Description>

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
      </Dialog.Popup>
    </Dialog.Portal>
    </Dialog.Root>
  );
}
