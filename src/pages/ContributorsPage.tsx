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
      className="relative isolate overflow-hidden rounded-3xl bg-[#f5f6f3] px-5 py-7 md:px-8 md:py-9"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-32 -z-10 size-80 rounded-full bg-[#cfe3d8]/45 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 size-72 rounded-full bg-[#e0eee7]/70 blur-3xl"
      />

      <header className="mb-8 flex animate-in flex-col gap-5 fade-in slide-in-from-bottom-2 duration-700 lg:flex-row lg:items-end lg:justify-between motion-reduce:animate-none">
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
            onPointerMove={(event) => {
              if (event.pointerType === "touch") return;

              const card = event.currentTarget;
              const bounds = card.getBoundingClientRect();
              const x = (event.clientX - bounds.left) / bounds.width;
              const y = (event.clientY - bounds.top) / bounds.height;

              card.style.setProperty("--tilt-x", `${(0.5 - y) * 4.5}deg`);
              card.style.setProperty("--tilt-y", `${(x - 0.5) * 6}deg`);
              card.style.setProperty("--mouse-x", `${x * 100}%`);
              card.style.setProperty("--mouse-y", `${y * 100}%`);
              card.style.setProperty("--orb-x", `${(x - 0.5) * 8}px`);
              card.style.setProperty("--orb-y", `${(y - 0.5) * 7}px`);
              card.style.setProperty("--orb-back-x", `${(0.5 - x) * 6}px`);
              card.style.setProperty("--orb-back-y", `${(0.5 - y) * 5}px`);
            }}
            onPointerLeave={(event) => {
              const card = event.currentTarget;
              [
                "--tilt-x",
                "--tilt-y",
                "--mouse-x",
                "--mouse-y",
                "--orb-x",
                "--orb-y",
                "--orb-back-x",
                "--orb-back-y",
              ].forEach((property) => card.style.removeProperty(property));
            }}
            className="group relative isolate min-w-0 rounded-2xl border-[0.5px] border-[#dfe3e0] bg-[#fbfbf9] shadow-[0_1px_2px_rgba(23,43,33,.05)] [--card-scale:1] [--lift:0px] [--tilt-x:0deg] [--tilt-y:0deg] [transform-style:preserve-3d] transform-[perspective(1000px)_rotateX(var(--tilt-x))_rotateY(var(--tilt-y))_translateY(var(--lift))_scale(var(--card-scale))] transition-[transform,box-shadow,border-color,background-color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] will-change-transform hover:[--card-scale:1.012] hover:[--lift:-7px] hover:border-[#8fbea5] hover:bg-white hover:shadow-[0_34px_70px_-30px_rgba(4,113,74,.5)] motion-reduce:animate-none motion-reduce:transform-none motion-reduce:transition-none animate-in fade-in slide-in-from-bottom-3"
            style={{
              animationDelay: `${index * 55}ms`,
              animationFillMode: "both",
            }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-[radial-gradient(circle_at_88%_2%,rgba(0,168,107,.15),transparent_44%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 mix-blend-screen transition-opacity duration-600 group-hover:opacity-100 motion-reduce:hidden"
              style={{
                background:
                  "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 20%), rgba(255,255,255,.8), rgba(255,255,255,.18) 17%, transparent 38%)",
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-y-1/2 -left-1/2 z-20 w-1/3 -translate-x-[180%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/55 to-transparent blur-sm transition-transform duration-[1600ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-[650%] motion-reduce:hidden"
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-6 top-0 z-10 h-0.5 origin-left scale-x-0 rounded-full bg-[#72ad8e] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100"
            />
            <div
              aria-hidden="true"
              className="relative h-20 overflow-hidden rounded-t-2xl bg-[#ecefec] [transform:translateZ(8px)] transition-colors duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:bg-[#cfe3d8]"
            >
              <div className="absolute -right-4 -top-12 size-40 rounded-full border-[22px] border-white/45 [transform:translate3d(var(--orb-x,0px),var(--orb-y,0px),0)_scale(var(--orb-scale,1))] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:[--orb-scale:1.1] motion-reduce:transition-none" />
              <div className="absolute -right-12 -top-20 size-44 rounded-full border border-[#04714a]/10 opacity-0 [transform:translate3d(var(--orb-back-x,0px),var(--orb-back-y,0px),0)] transition-[opacity,transform] duration-1000 ease-[cubic-bezier(.16,1,.3,1)] group-hover:opacity-100 motion-reduce:transition-none" />
              <span className="absolute bottom-4 right-6 size-2 rounded-full bg-[#04714a]/0 transition-[background-color,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:bg-[#04714a]/25 motion-safe:group-hover:scale-150" />
            </div>

            <div className="relative flex min-h-52 flex-col px-5 pb-4 [transform:translateZ(22px)]">
              <div
                aria-hidden="true"
                className="-mt-7 flex size-16 items-center justify-center rounded-full border-4 border-[#fbfbf9] bg-[#e1e5e2] text-base font-semibold text-[#172b21] shadow-sm ring-0 ring-[#9fc4b0]/20 [transform:translateZ(30px)] transition-[transform,background-color,box-shadow,ring-width] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:bg-[#b9d0c1] group-hover:shadow-[0_12px_28px_-12px_rgba(4,113,74,.72)] group-hover:ring-8 motion-safe:group-hover:[transform:translateZ(38px)_translateY(-3px)_scale(1.04)_rotate(-1deg)] motion-reduce:transition-none"
              >
                {contributor.initials}
              </div>

              <div className="mt-4 flex-1">
                <h2 className="break-words text-lg font-semibold tracking-tight text-[#172b21] transition-colors duration-500 group-hover:text-[#04714a]">
                  {contributor.name}
                </h2>
                <p className="mt-0.5 text-[13px] font-medium leading-5 text-black/55 transition-colors duration-500 group-hover:text-[#04714a]">
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
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] leading-6 text-black/60 transition-[color,background-color,transform] duration-[350ms] ease-[cubic-bezier(.16,1,.3,1)] hover:bg-[#e8f2ed] hover:text-[#04714a] focus-visible:bg-[#e8f2ed] focus-visible:text-[#04714a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04714a] motion-safe:hover:translate-x-0.5"
                      />
                    }
                  >
                    <span className="truncate">{contributor.contribution}</span>
                    <span
                      aria-hidden="true"
                      className="flex size-6 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-[#cfe3d8] opacity-0 transition duration-[350ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover/task:translate-x-0 group-hover/task:opacity-100 group-focus-within/task:translate-x-0 group-focus-within/task:opacity-100"
                    >
                      ↗
                    </span>
                  </Dialog.Trigger>

                  <div
                    id={`contributor-preview-${contributor.id}`}
                    role="tooltip"
                    className="pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-20 w-60 translate-y-2 scale-[.97] rounded-xl border-[0.5px] border-[#bfd2c7] bg-[#fbfbf9] p-4 opacity-0 shadow-[0_20px_45px_-22px_rgba(4,113,74,.38)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover/task:translate-y-0 group-hover/task:scale-100 group-hover/task:opacity-100 group-focus-within/task:translate-y-0 group-focus-within/task:scale-100 group-focus-within/task:opacity-100 motion-reduce:transition-none"
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

              <div className="mt-5 flex items-center gap-2 border-t border-black/[.06] pt-3.5 text-xs font-medium text-black/50 transition-colors duration-500 group-hover:text-[#315d48]">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-[#d2d7d3] transition duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-150 group-hover:bg-[#72ad8e] group-hover:shadow-[0_0_0_4px_rgba(114,173,142,.14)]"
                />
                {contributor.team}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>

    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-40 bg-[#172b21]/25 opacity-100 backdrop-blur-[2px] transition-opacity duration-[350ms] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
      <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border-[0.5px] border-[#bfd2c7] bg-[#fbfbf9] text-[#172b21] opacity-100 shadow-[0_32px_80px_-32px_rgba(23,43,33,.55)] outline-none transition-[opacity,scale] duration-[450ms] ease-[cubic-bezier(.16,1,.3,1)] data-ending-style:scale-[.94] data-ending-style:opacity-0 data-starting-style:scale-[.94] data-starting-style:opacity-0 motion-reduce:transition-none">
        {selected && (
          <>
            <div className="relative h-24 overflow-hidden bg-gradient-to-br from-[#c7dfd2] to-[#e8f2ed]">
              <span
                aria-hidden="true"
                className="absolute -right-5 -top-16 size-52 rounded-full border-[28px] border-white/35"
              />
              <span
                aria-hidden="true"
                className="absolute right-28 top-8 size-16 rounded-full border border-[#04714a]/10"
              />
              <Dialog.Close className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-white/80 text-xl text-[#172b21] shadow-sm transition-[transform,background-color] duration-[350ms] ease-[cubic-bezier(.16,1,.3,1)] hover:bg-white motion-safe:hover:scale-105">
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
