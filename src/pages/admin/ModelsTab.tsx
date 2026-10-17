import { FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_PAGE_SIZE, adminApi } from "../../api/admin.api";
import type { ModelInfo, ModelInput, ModelTypeEnum, ProviderInfo } from "../../api/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ListState, Pager, inputClass, primaryButtonClass, secondaryButtonClass, usePagedList } from "./shared";

const MODEL_TYPES: { value: ModelTypeEnum; label: string }[] = [
  { value: "instant", label: "Instant (L1)" },
  { value: "standard", label: "Standard (L2)" },
  { value: "detailed", label: "Detailed (L3)" },
];

type FormState = { mode: "create" } | { mode: "edit"; model: ModelInfo };

/** Load every provider for the picker; the endpoint pages by 10. */
async function loadAllProviders(): Promise<ProviderInfo[]> {
  const all: ProviderInfo[] = [];
  for (let page = 1; ; page++) {
    const batch = await adminApi.getProviders(page);
    all.push(...batch);
    if (batch.length < ADMIN_PAGE_SIZE) return all;
  }
}

export function ModelsTab() {
  const load = useCallback((page: number) => adminApi.getModels(page), []);
  const list = usePagedList(load, ADMIN_PAGE_SIZE);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    loadAllProviders()
      .then(setProviders)
      .catch((err: Error) => toast.error(`Không tải được provider: ${err.message}`));
  }, []);

  async function remove(model: ModelInfo) {
    if (!confirm(`Xoá model "${model.model_name}"?`)) return;
    try {
      await adminApi.deleteModel(model.id);
      toast.success("Đã xoá model.");
      list.reload();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const providerName = (id: string) => providers.find((p) => p.id === id)?.provider_name ?? id;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-black/55">
          Mỗi mức độ (L1–L3) chọn ngẫu nhiên một model cùng loại để trả lời.
        </p>
        <button
          type="button"
          className={primaryButtonClass}
          disabled={providers.length === 0}
          title={providers.length === 0 ? "Cần tạo provider trước" : undefined}
          onClick={() => setForm({ mode: "create" })}
        >
          <Plus size={16} /> Thêm model
        </button>
      </div>

      <ListState loading={list.loading} error={list.error} empty={list.items.length === 0} emptyText="Chưa có model.">
        <div className="rounded-2xl border border-black/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Model ID</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.model_name}</TableCell>
                  <TableCell className="font-mono text-xs">{model.model_id}</TableCell>
                  <TableCell>{MODEL_TYPES.find((t) => t.value === model.model_type)?.label ?? model.model_type}</TableCell>
                  <TableCell>{providerName(model.provider_id)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="Sửa"
                        onClick={() => setForm({ mode: "edit", model })}
                        className="rounded-lg p-2 text-black/50 hover:bg-black/5 hover:text-black cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        title="Xoá"
                        onClick={() => remove(model)}
                        className="rounded-lg p-2 text-black/50 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ListState>
      <Pager page={list.page} hasNext={list.hasNext} onChange={list.setPage} />

      <Dialog open={form !== null} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="sm:max-w-lg">
          {form && (
            <ModelForm
              key={form.mode === "edit" ? form.model.id : "create"}
              state={form}
              providers={providers}
              onDone={() => {
                setForm(null);
                list.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ModelForm({
  state,
  providers,
  onDone,
}: {
  state: FormState;
  providers: ProviderInfo[];
  onDone: () => void;
}) {
  const editing = state.mode === "edit" ? state.model : null;
  const [values, setValues] = useState<ModelInput>({
    model_id: editing?.model_id ?? "",
    model_name: editing?.model_name ?? "",
    model_type: editing?.model_type ?? "standard",
    provider_id: editing?.provider_id ?? providers[0]?.id ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ModelInput>(key: K, value: ModelInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminApi.updateModel(editing.id, values);
        toast.success("Đã cập nhật model.");
      } else {
        await adminApi.createModel(values);
        toast.success("Đã thêm model.");
      }
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{editing ? "Sửa model" : "Thêm model"}</DialogTitle>
      </DialogHeader>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Tên hiển thị</span>
        <input
          className={inputClass}
          value={values.model_name}
          onChange={(e) => set("model_name", e.target.value)}
          required
          maxLength={200}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Model ID</span>
        <input
          className={`${inputClass} font-mono`}
          value={values.model_id}
          placeholder="vd: gpt-4o-mini"
          onChange={(e) => set("model_id", e.target.value)}
          required
          maxLength={200}
        />
        <span className="text-xs text-black/45">Tên model gửi tới API của provider.</span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Loại</span>
        <select
          className={inputClass}
          value={values.model_type}
          onChange={(e) => set("model_type", e.target.value as ModelTypeEnum)}
        >
          {MODEL_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Provider</span>
        <select
          className={inputClass}
          value={values.provider_id}
          onChange={(e) => set("provider_id", e.target.value)}
          required
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.provider_name}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-2 flex justify-end gap-2">
        <button type="button" className={secondaryButtonClass} onClick={onDone}>
          Huỷ
        </button>
        <button type="submit" className={primaryButtonClass} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </form>
  );
}
