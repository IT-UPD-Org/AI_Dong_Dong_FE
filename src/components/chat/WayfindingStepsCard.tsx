import { AlertCircle, ArrowUpRight, Building2, Flag, Footprints, HelpCircle, MapPin, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import type { WayfindingCandidate, WayfindingRoutePayload, WayfindingStepKind } from "../../api/types";

interface WayfindingStepsCardProps {
  wayfinding: WayfindingRoutePayload;
  onSelectCandidate?: (candidate: WayfindingCandidate) => void;
}

const STEP_META: Record<
  WayfindingStepKind,
  { badge: string; Icon: typeof MapPin; badgeClass: string }
> = {
  start: {
    badge: "Xuất phát",
    Icon: MapPin,
    badgeClass: "bg-brand-soft text-brand-text",
  },
  corridor: {
    badge: "Hành lang",
    Icon: Footprints,
    badgeClass: "bg-muted text-fg-secondary",
  },
  stair: {
    badge: "Cầu thang",
    Icon: Navigation,
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  transfer: {
    badge: "Chuyển khu",
    Icon: Building2,
    badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  arrive: {
    badge: "Đích",
    Icon: Flag,
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
};

function formatRoomSummary(code: string | null, name: string): string {
  if (code && !name.includes(code)) return `${code} – ${name}`;
  return name;
}

/**
 * Renders structured deterministic wayfinding output (ordered route steps,
 * ambiguous candidate choices, or clear error notices) inside a chat reply.
 */
export function WayfindingStepsCard({ wayfinding, onSelectCandidate }: WayfindingStepsCardProps) {
  if (wayfinding.status === "not_wayfinding") return null;

  if (wayfinding.status === "ambiguous" && wayfinding.candidates.length > 0) {
    return (
      <div
        data-testid="wayfinding-ambiguous-card"
        className="mt-2.5 w-full max-w-full rounded-2xl border border-border bg-surface p-3.5 text-sm shadow-xs"
      >
        <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
          <HelpCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <span>Cần làm rõ phòng bạn muốn tới</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {wayfinding.candidates.map((candidate) => {
            const label = formatRoomSummary(candidate.code, candidate.name);
            const locationText = `${candidate.floor_name}, ${candidate.area_name}`;
            if (onSelectCandidate) {
              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => onSelectCandidate(candidate)}
                  className="flex min-w-0 max-w-full flex-col items-start rounded-xl border border-border bg-elevated px-3 py-2 text-left text-xs transition-colors hover:border-brand hover:bg-brand-soft cursor-pointer"
                >
                  <span className="font-semibold text-foreground [overflow-wrap:anywhere]">{label}</span>
                  <span className="text-[11px] text-muted-foreground">{locationText}</span>
                </button>
              );
            }
            return (
              <div
                key={candidate.id}
                className="flex min-w-0 max-w-full flex-col rounded-xl border border-border bg-elevated px-3 py-2 text-xs"
              >
                <span className="font-semibold text-foreground [overflow-wrap:anywhere]">{label}</span>
                <span className="text-[11px] text-muted-foreground">{locationText}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (wayfinding.status === "no_path" || wayfinding.status === "not_found") {
    return (
      <div
        data-testid="wayfinding-error-card"
        className="mt-2.5 flex w-full max-w-full items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-xs sm:text-sm text-foreground"
      >
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
          <p className="font-semibold">Không thể tạo lộ trình từ dữ liệu hiện tại</p>
          {wayfinding.error_message && (
            <p className="mt-0.5 text-xs text-fg-secondary">{wayfinding.error_message}</p>
          )}
        </div>
      </div>
    );
  }

  if (wayfinding.status !== "ok" || wayfinding.steps.length === 0) {
    return null;
  }

  const dest = wayfinding.destination;
  const start = wayfinding.start;

  return (
    <section
      data-testid="wayfinding-steps-card"
      aria-label="Lộ trình chỉ đường theo từng bước"
      className="mt-2.5 w-full max-w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-elevated/60 px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
            <Navigation size={14} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground sm:text-sm">
              Lộ trình từng bước ({wayfinding.steps.length} bước)
            </p>
            {start && dest && (
              <p className="text-[11px] text-muted-foreground [overflow-wrap:anywhere]">
                {formatRoomSummary(start.code, start.name)} ({start.floor_name}) →{" "}
                {formatRoomSummary(dest.code, dest.name)} ({dest.floor_name}, {dest.area_name})
              </p>
            )}
          </div>
        </div>

        {dest?.id && (
          <Link
            to={`/map?room=${encodeURIComponent(dest.id)}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-brand-text transition-colors hover:bg-brand-soft"
          >
            <span>Xem bản đồ</span>
            <ArrowUpRight size={12} aria-hidden />
          </Link>
        )}
      </div>

      {wayfinding.start_assumed && start && (
        <div className="border-b border-border-subtle bg-muted/50 px-3.5 py-1.5 text-[11px] text-muted-foreground">
          Điểm xuất phát mặc định: <strong className="text-foreground">{start.name}</strong> ({start.floor_name},{" "}
          {start.area_name})
        </div>
      )}

      <ol className="divide-y divide-border-subtle">
        {wayfinding.steps.map((step) => {
          const meta = STEP_META[step.kind] ?? STEP_META.corridor;
          const Icon = meta.Icon;
          return (
            <li key={`${step.step_index}-${step.node_id}`} className="flex items-start gap-2.5 px-3.5 py-2.5">
              <span
                aria-hidden
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-text"
              >
                {step.step_index}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}
                  >
                    <Icon size={11} aria-hidden />
                    {meta.badge}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {step.area_name} • {step.floor_name}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-foreground sm:text-[13px] [overflow-wrap:anywhere]">
                  {step.instruction}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
