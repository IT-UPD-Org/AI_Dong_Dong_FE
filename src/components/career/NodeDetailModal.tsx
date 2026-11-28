import React from "react";
import {
  GraduationCap,
  Code2,
  Briefcase,
  CheckCircle2,
  BookOpen,
  FolderGit2,
  AlertTriangle,
  Layers,
  Sparkles,
  X,
  Target,
  Trophy,
} from "lucide-react";
import { CareerNode } from "../../types/careerUniverse";
import { BACHELOR_STATS } from "../../data/careerUniverseData";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

interface NodeDetailModalProps {
  node: CareerNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NodeDetailModal({ node, isOpen, onClose }: NodeDetailModalProps) {
  const { language } = useLanguage();
  if (!node) return null;

  const isBachelor = node.type === "bachelor";
  const isDomain = node.type === "domain";
  const isOccupation = node.type === "occupation";
  const isSpecialization = node.type === "specialization";

  const nodeTitle = language === "vi" && node.vietnameseName ? node.vietnameseName : node.name;

  const layerLabel =
    node.layer === 1
      ? language === "vi" ? "Layer 1 • Cơ sở Học thuật" : "Layer 1 • Academic Foundation"
      : node.layer === 2
      ? language === "vi" ? "Layer 2 • Nhóm Nghề nghiệp" : "Layer 2 • Career Domain"
      : node.layer === 3
      ? language === "vi" ? "Layer 3 • Nghề nghiệp Cụ thể" : "Layer 3 • Specific Occupation"
      : language === "vi" ? "Layer 4 • Chuyên môn Sâu" : "Layer 4 • In-Depth Specialization";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-xl max-h-[88dvh] overflow-hidden flex flex-col p-0 rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header Bar */}
        <div className="flex shrink-0 items-start justify-between border-b border-border p-4 sm:p-5 pr-12 bg-background">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
              {isBachelor ? (
                <GraduationCap className="size-5 sm:size-6" />
              ) : isDomain ? (
                <Briefcase className="size-5 sm:size-6" />
              ) : isOccupation ? (
                <Code2 className="size-5 sm:size-6" />
              ) : (
                <Sparkles className="size-5 sm:size-6" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-mono text-[10px] uppercase font-semibold text-brand-text bg-brand-soft px-2 py-0.5 rounded-full">
                  {layerLabel}
                </span>
                {node.code && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    #{node.code}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-foreground mt-0.5 break-words">
                {nodeTitle}
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 text-xs [scrollbar-width:thin]">
          {/* A. Bachelor of IT Specific Information */}
          {isBachelor && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Trophy className="size-4 text-brand-bright" />
                  Tiến Độ Đào Tạo Chương Trình Cử Nhân
                </h3>
                {(() => {
                  const completed = Math.round(((node.academicFitScore ?? 0) * 52) / 100);
                  const remaining = Math.max(0, 52 - completed);
                  const progressPct = (node.academicFitScore ?? 0).toFixed(1);
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg bg-surface p-2.5 text-center border border-border">
                          <span className="text-[10px] text-muted-foreground block">Tổng số môn</span>
                          <span className="text-base font-extrabold text-foreground">52</span>
                        </div>
                        <div className="rounded-lg bg-brand-soft/40 p-2.5 text-center border border-brand/20">
                          <span className="text-[10px] text-brand-text block">Đã tích lũy</span>
                          <span className="text-base font-extrabold text-brand-text">{completed}</span>
                        </div>
                        <div className="rounded-lg bg-surface p-2.5 text-center border border-border">
                          <span className="text-[10px] text-muted-foreground block">Còn lại</span>
                          <span className="text-base font-extrabold text-foreground">{remaining}</span>
                        </div>
                        <div className="rounded-lg bg-surface p-2.5 text-center border border-border">
                          <span className="text-[10px] text-muted-foreground block">GPA ước tính</span>
                          <span className="text-base font-extrabold text-foreground">{completed > 0 ? "3.25" : "—"} / 4.0</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-muted-foreground">Tiến độ khung chương trình</span>
                          <span className="text-brand-text font-mono font-bold">{progressPct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-brand rounded-full transition-all duration-700"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Completed Courses List */}
              <div className="space-y-2">
                <span className="font-bold text-foreground block">Các môn cơ sở đã hoàn thành:</span>
                {(() => {
                  let storedCodes: string[] = [];
                  try {
                    const stored = localStorage.getItem("career_student_record");
                    if (stored) {
                      storedCodes = JSON.parse(stored).completedCourseCodes || [];
                    }
                  } catch {
                    // ignore
                  }

                  if (storedCodes.length === 0) {
                    return (
                      <p className="text-[11px] text-muted-foreground italic rounded-lg border border-border/60 bg-background/50 p-3">
                        Chưa có môn học nào được ghi nhận. Hãy tải lên bảng điểm Excel để đối chiếu tiến độ học tập.
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {storedCodes.map((code) => (
                        <div
                          key={code}
                          className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-[11px]"
                        >
                          <CheckCircle2 className="size-3.5 text-brand-bright shrink-0" />
                          <span className="font-mono font-semibold">{code}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* B. Career Feasibility / Competency Score (For Domain, Occupation, Specialization) */}
          {!isBachelor && (
            <div className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Target className="size-4 text-brand-bright" />
                  Đánh Giá Độ Phù Hợp Nghề Nghiệp (Feasibility)
                </span>
                {node.feasibilityScore !== null ? (
                  <span className="font-mono text-sm font-extrabold text-brand-text bg-brand-soft px-2.5 py-0.5 rounded-full">
                    {node.feasibilityScore}%
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">
                    Chờ dữ liệu bảng điểm
                  </span>
                )}
              </div>

              {node.feasibilityScore !== null && (
                <div className="space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-brand-bright rounded-full transition-all duration-500"
                      style={{ width: `${node.feasibilityScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                    <span>Học thuật: {node.academicFitScore ?? 0}%</span>
                    <span>Kỹ năng thực hành: {node.practicalSkillScore ?? 45}%</span>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-fg-secondary leading-relaxed">
                {node.description}
              </p>
            </div>
          )}

          {/* C. Technologies / Tech Stack */}
          {node.technologies && node.technologies.length > 0 && (
            <div className="space-y-2">
              <span className="font-bold text-foreground block">Công nghệ trọng tâm:</span>
              <div className="flex flex-wrap gap-1.5">
                {node.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-mono font-medium text-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* D. Skills (Core & Supporting) */}
          {node.skills && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {node.skills.core && node.skills.core.length > 0 && (
                <div className="rounded-xl border border-border bg-background p-3 space-y-2">
                  <span className="font-bold text-brand-text text-[11px] block">
                    Kỹ năng Cốt lõi (Core)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {node.skills.core.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-brand-soft text-brand-text px-2 py-0.5 text-[10px] font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {node.skills.supporting && node.skills.supporting.length > 0 && (
                <div className="rounded-xl border border-border bg-background p-3 space-y-2">
                  <span className="font-bold text-muted-foreground text-[11px] block">
                    Kỹ năng Bổ trợ
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {node.skills.supporting.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-muted text-fg-secondary px-2 py-0.5 text-[10px] font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* E. Relevant Academic Courses & Priority Courses */}
          {node.relevantCourses && node.relevantCourses.length > 0 && (
            <div className="space-y-2">
              <span className="font-bold text-foreground block flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-brand-text" />
                Môn học đào tạo liên quan:
              </span>
              <div className="divide-y divide-border rounded-xl border border-border bg-background overflow-hidden">
                {node.relevantCourses.map((c) => (
                  <div key={c.code} className="flex items-center justify-between p-2.5">
                    <div className="flex items-center gap-2">
                      {c.completed ? (
                        <CheckCircle2 className="size-4 text-brand-bright shrink-0" />
                      ) : (
                        <div className="size-4 rounded-full border border-dashed border-muted-foreground shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-foreground text-[11px]">
                          {c.code} - {c.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {c.credits} tín chỉ
                        </span>
                      </div>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded ${
                        c.completed
                          ? "bg-brand-soft text-brand-text"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.completed ? "Đã học" : "Chưa học"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* F. Recommended Projects */}
          {node.recommendedProjects && node.recommendedProjects.length > 0 && (
            <div className="space-y-2">
              <span className="font-bold text-foreground block flex items-center gap-1.5">
                <FolderGit2 className="size-3.5 text-brand-text" />
                Dự án thực hành đề xuất:
              </span>
              <div className="space-y-2">
                {node.recommendedProjects.map((p) => (
                  <div
                    key={p.title}
                    className="rounded-xl border border-border bg-background p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-foreground">{p.title}</h4>
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                        {p.difficulty}
                      </span>
                    </div>
                    <p className="text-[11px] text-fg-secondary leading-relaxed">
                      {p.description}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded bg-brand-soft/60 px-1.5 py-0.2 text-[9px] font-mono text-brand-text"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* G. Skill Gaps */}
          {node.skillGaps && node.skillGaps.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
              <span className="font-bold text-amber-700 dark:text-amber-400 text-xs flex items-center gap-1.5">
                <AlertTriangle className="size-3.5" />
                Lỗ hổng kỹ năng cần bổ sung (Skill Gaps):
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-fg-secondary">
                {node.skillGaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end border-t border-border px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-surface/50">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 sm:min-h-9 rounded-xl border border-border bg-background px-5 py-2 text-xs font-semibold text-foreground hover:bg-hover transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
