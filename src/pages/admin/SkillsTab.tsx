import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Plus, RefreshCw, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { skillsApi, type Skill } from "../../api/skills.api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "./shared";

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type DialogMode = { type: "create" } | { type: "edit"; skill: Skill };

export function SkillsTab() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  // Dialog state
  const [dialogState, setDialogState] = useState<DialogMode | null>(null);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Generation guard against stale out-of-order responses
  const fetchGenerationRef = useRef(0);

  const loadSkills = useCallback(async () => {
    const generation = ++fetchGenerationRef.current;
    setLoading(true);
    try {
      const data = await skillsApi.getSkills(page, pageSize, activeQuery || undefined);
      if (generation === fetchGenerationRef.current) {
        setSkills(data);
        setError("");
      }
    } catch (err) {
      if (generation === fetchGenerationRef.current) {
        setError((err as Error).message || "Không thể tải danh sách skills.");
        setSkills([]);
      }
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [page, pageSize, activeQuery]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchQuery.trim().slice(0, 200));
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveQuery("");
    setPage(1);
  };

  const openCreateDialog = () => {
    setDialogState({ type: "create" });
    setSlug("");
    setName("");
    setDescription("");
    setInstructions("");
    setEnabled(true);
    setIsSlugTouched(false);
    setDialogError("");
    setSaving(false);
  };

  const openEditDialog = (skill: Skill) => {
    setDialogState({ type: "edit", skill });
    setSlug(skill.slug);
    setName(skill.name);
    setDescription(skill.description);
    setInstructions(skill.instructions);
    setEnabled(skill.enabled);
    setIsSlugTouched(true);
    setDialogError("");
    setSaving(false);
  };

  // Immediate reset helper for successful operations
  const resetDialog = () => {
    setDialogState(null);
    setDialogError("");
    setSaving(false);
  };

  // Guarded cancel handler for user interaction
  const handleUserCancelDialog = () => {
    if (saving) return;
    resetDialog();
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (dialogState?.type === "create" && !isSlugTouched) {
      setSlug(slugify(val));
    }
  };

  const handleSaveSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanSlug = slug.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanDesc = description.trim();
    const cleanInstructions = instructions.trim();

    // Client-side validations
    if (!cleanSlug) {
      setDialogError("Mã định danh (slug) không được để trống.");
      return;
    }
    if (cleanSlug.length > 80) {
      setDialogError("Mã định danh (slug) tối đa 80 ký tự.");
      return;
    }
    if (!SLUG_REGEX.test(cleanSlug)) {
      setDialogError("Mã định danh (slug) chỉ gồm chữ thường (a-z), số (0-9) và dấu gạch ngang (-). Không bắt đầu hoặc kết thúc bằng gạch ngang.");
      return;
    }
    if (!cleanName) {
      setDialogError("Tên kỹ năng không được để trống.");
      return;
    }
    if (cleanName.length > 200) {
      setDialogError("Tên kỹ năng tối đa 200 ký tự.");
      return;
    }
    if (!cleanDesc) {
      setDialogError("Mô tả kỹ năng không được để trống.");
      return;
    }
    if (cleanDesc.length > 1000) {
      setDialogError("Mô tả kỹ năng tối đa 1,000 ký tự.");
      return;
    }
    if (!cleanInstructions) {
      setDialogError("Hướng dẫn thực hiện không được để trống.");
      return;
    }
    if (cleanInstructions.length > 30000) {
      setDialogError("Hướng dẫn thực hiện tối đa 30,000 ký tự.");
      return;
    }

    setSaving(true);
    setDialogError("");
    try {
      if (dialogState?.type === "create") {
        await skillsApi.createSkill({
          slug: cleanSlug,
          name: cleanName,
          description: cleanDesc,
          instructions: cleanInstructions,
          enabled,
        });
        toast.success(`Đã tạo skill "${cleanName}" thành công.`);
      } else if (dialogState?.type === "edit") {
        await skillsApi.updateSkill(dialogState.skill.id, {
          slug: cleanSlug,
          name: cleanName,
          description: cleanDesc,
          instructions: cleanInstructions,
          enabled,
        });
        toast.success(`Đã cập nhật skill "${cleanName}".`);
      }
      resetDialog();
      loadSkills();
    } catch (err: any) {
      // Map 409 status code to clear duplicate slug notice; keep server error details for other codes
      if (err?.status === 409 || err?.data?.detail === "Skill slug already in use; choose another slug") {
        setDialogError("Mã định danh (slug) này đã được sử dụng. Vui lòng chọn một mã khác.");
      } else {
        setDialogError(err?.message || "Lỗi khi lưu skill.");
      }
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (skill: Skill) => {
    const nextState = !skill.enabled;
    setTogglingId(skill.id);
    try {
      const updated = await skillsApi.updateSkill(skill.id, { enabled: nextState });
      toast.success(nextState ? `Đã bật skill "${skill.name}"` : `Đã tắt skill "${skill.name}"`);
      // Update state with returned authoritative object from server
      setSkills((prev) =>
        prev.map((s) => (s.id === skill.id ? updated : s))
      );
    } catch (err) {
      toast.error((err as Error).message || "Không thể cập nhật trạng thái skill.");
    } finally {
      setTogglingId(null);
    }
  };

  const hasNext = skills.length >= pageSize;

  return (
    <section className="min-w-0 space-y-4">
      {/* Overview & Concept Explanation */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground">
                Kịch bản kỹ năng hệ thống (Skills / Playbooks)
              </h2>
              <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Các kịch bản hướng dẫn bằng văn bản do quản trị viên thiết lập. Khi được bật (<strong>Enabled</strong>), trợ lý Agent sẽ tự động tham chiếu và áp dụng kịch bản khi xử lý các yêu cầu tương ứng. Agent không thực thi mã lệnh tuỳ tiện.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreateDialog}
            className={`${primaryButtonClass} w-full sm:w-auto shrink-0`}
          >
            <Plus size={16} />
            <span>Thêm Skill</span>
          </button>
        </div>
      </div>

      {/* Search & Paging Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2 sm:max-w-md">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              maxLength={200}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm skill theo tên, slug, mô tả..."
              className={`${inputClass} min-h-10 pl-9 pr-10 text-xs sm:text-sm`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Xoá tìm kiếm"
                className="absolute right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-md text-sm text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
          <button type="submit" className={secondaryButtonClass}>
            <span>Tìm</span>
          </button>
        </form>

        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="min-h-10 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground outline-none cursor-pointer"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => loadSkills()}
            disabled={loading}
            title="Làm mới"
            aria-label="Làm mới"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-hover disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main List Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="animate-spin text-brand-text mb-3" size={28} />
          <p className="text-sm text-muted-foreground">Đang tải danh sách kỹ năng...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center">
          <p className="text-sm font-medium text-destructive mb-3">{error}</p>
          <button type="button" onClick={() => loadSkills()} className={secondaryButtonClass}>
            <RefreshCw size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      ) : skills.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-text mb-3">
            <Sparkles size={24} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {activeQuery ? "Không tìm thấy skill phù hợp" : "Chưa có skill nào"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {activeQuery
              ? "Hãy thử thay đổi từ khoá tìm kiếm."
              : "Thêm kỹ năng mới để định hướng cách Agent suy luận và trả lời theo quy chuẩn."}
          </p>
          {!activeQuery && (
            <button type="button" onClick={openCreateDialog} className={`${primaryButtonClass} mt-4`}>
              <Plus size={15} />
              <span>Tạo Skill đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="border-b border-border bg-surface/50">
                <TableHead className="py-3 px-4 text-xs font-semibold text-foreground">Tên & Mã định danh</TableHead>
                <TableHead className="py-3 px-3 text-xs font-semibold text-foreground">Mô tả</TableHead>
                <TableHead className="py-3 px-3 text-xs font-semibold text-foreground">Trạng thái</TableHead>
                <TableHead className="py-3 px-3 text-xs font-semibold text-foreground">Cập nhật lúc</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills.map((skill) => (
                <TableRow key={skill.id} className="border-b border-border-subtle hover:bg-hover transition-colors">
                  <TableCell className="py-3.5 px-4 max-w-xs whitespace-normal">
                    <div className="min-w-0">
                      <span className="font-semibold text-sm text-foreground block truncate" title={skill.name}>
                        {skill.name}
                      </span>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="font-mono text-[11px] bg-surface text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                          {skill.slug}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 px-3 max-w-md whitespace-normal">
                    <p className="text-xs text-muted-foreground line-clamp-2" title={skill.description}>
                      {skill.description}
                    </p>
                  </TableCell>
                  <TableCell className="py-3.5 px-3 whitespace-nowrap">
                    <button
                      type="button"
                      disabled={togglingId === skill.id}
                      onClick={() => handleToggleEnabled(skill)}
                      aria-label={skill.enabled ? "Bấm để tắt skill" : "Bấm để kích hoạt skill"}
                      title={skill.enabled ? "Bấm để tắt" : "Bấm để kích hoạt"}
                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        skill.enabled
                          ? "bg-brand-soft text-brand-text hover:opacity-80"
                          : "bg-surface text-muted-foreground border border-border hover:text-foreground"
                      }`}
                    >
                      {togglingId === skill.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <span className={`h-1.5 w-1.5 rounded-full ${skill.enabled ? "bg-brand-bright" : "bg-muted-foreground"}`} />
                      )}
                      <span>{skill.enabled ? "Đang bật" : "Đã tắt"}</span>
                    </button>
                  </TableCell>
                  <TableCell className="py-3.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(skill.updated_at)}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEditDialog(skill)}
                      title="Chỉnh sửa skill"
                      className="inline-flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-hover hover:text-brand-text transition-colors cursor-pointer"
                    >
                      <Pencil size={15} />
                      <span className="sr-only">Chỉnh sửa</span>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div>
          Hiển thị {skills.length} skills{activeQuery ? ` cho "${activeQuery}"` : ""}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="min-h-10 rounded-lg border border-border px-3.5 py-1.5 text-foreground hover:bg-hover disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Trước
          </button>
          <span className="px-1 text-foreground font-medium">Trang {page}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || loading}
            className="min-h-10 rounded-lg border border-border px-3.5 py-1.5 text-foreground hover:bg-hover disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Sau
          </button>
        </div>
      </div>

      {/* Add / Edit Skill Modal */}
      <Dialog
        open={dialogState !== null}
        onOpenChange={(open) => !saving && (open ? null : handleUserCancelDialog())}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6 bg-elevated border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {dialogState?.type === "create" ? "Thêm Skill mới" : "Chỉnh sửa Skill"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Định nghĩa kịch bản playbook bằng văn bản thuần. Agent sẽ tự động tham chiếu khi được kích hoạt.
            </DialogDescription>
          </DialogHeader>

          {dialogState && (
            <form onSubmit={handleSaveSubmit} className="mt-4 space-y-4">
              {dialogError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  {dialogError}
                </div>
              )}

              {/* Tên kỹ năng */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-foreground">
                    Tên kỹ năng <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {name.length}/200
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={200}
                  value={name}
                  disabled={saving}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ví dụ: Hướng dẫn đăng ký tín chỉ học phần"
                  className={inputClass}
                  required
                />
              </div>

              {/* Mã định danh (Slug) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-foreground">
                    Mã định danh (Slug) <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {slug.length}/80
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={80}
                  value={slug}
                  disabled={saving}
                  onChange={(e) => {
                    setIsSlugTouched(true);
                    setSlug(e.target.value.toLowerCase());
                  }}
                  placeholder="dang-ky-tin-chi"
                  className={`${inputClass} font-mono text-xs`}
                  required
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Chỉ gồm chữ thường không dấu, số và gạch ngang (ví dụ: <code>tra-cuu-hoc-phi</code>).
                </p>
              </div>

              {/* Mô tả */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-foreground">
                    Mô tả mục đích <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {description.length}/1,000
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={description}
                  disabled={saving}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả hoàn cảnh và mục đích khi Agent cần sử dụng kỹ năng này..."
                  className={inputClass}
                  required
                />
              </div>

              {/* Hướng dẫn chi tiết (Instructions) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-foreground">
                    Nội dung kịch bản / Hướng dẫn (Playbook Instructions) <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {instructions.length.toLocaleString()}/30,000
                  </span>
                </div>
                <textarea
                  rows={8}
                  maxLength={30000}
                  value={instructions}
                  disabled={saving}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={`Viết các chỉ dẫn rõ ràng cho Agent bằng văn bản thuần:\n- Khi sinh viên hỏi về việc đăng ký tín chỉ:\n  1. Nhắc nhở thời gian mở cổng hệ thống theo thông báo của phòng đào tạo.\n  2. Hướng dẫn các bước vào trang ctsv.pduni.edu.vn...`}
                  className={`${inputClass} font-mono text-xs leading-relaxed resize-y`}
                  required
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Nội dung được lưu trữ dưới dạng văn bản hướng dẫn và không thực thi mã lệnh.
                </p>
              </div>

              {/* Trạng thái Kích hoạt */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="skill-enabled-check"
                  checked={enabled}
                  disabled={saving}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand-bright cursor-pointer"
                />
                <label htmlFor="skill-enabled-check" className="text-xs text-foreground cursor-pointer select-none">
                  Kích hoạt skill này ngay (Agent có thể nạp vào ngữ cảnh theo nhu cầu)
                </label>
              </div>

              <DialogFooter className="mx-0 mb-0 mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-0 bg-transparent p-0">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleUserCancelDialog}
                  className={`${secondaryButtonClass} w-full sm:w-auto`}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`${primaryButtonClass} w-full sm:w-auto`}
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{dialogState?.type === "create" ? "Tạo Skill" : "Lưu thay đổi"}</span>
                  )}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
