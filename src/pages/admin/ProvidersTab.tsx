import { FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_PAGE_SIZE, adminApi } from "../../api/admin.api";
import type { JsonSchemaProperty, ProviderInfo, ProviderTypeResponse } from "../../api/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ListState, Pager, inputClass, primaryButtonClass, secondaryButtonClass, usePagedList } from "./shared";

const SECRET_FIELD = /key|secret|token|password/i;

type FormState = { mode: "create" } | { mode: "edit"; provider: ProviderInfo };

export function ProvidersTab() {
  const load = useCallback((page: number) => adminApi.getProviders(page), []);
  const list = usePagedList(load, ADMIN_PAGE_SIZE);
  const [types, setTypes] = useState<ProviderTypeResponse[]>([]);
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    adminApi
      .getProviderTypes()
      .then(setTypes)
      .catch((err: Error) => toast.error(`Không tải được loại provider: ${err.message}`));
  }, []);

  async function remove(provider: ProviderInfo) {
    if (!confirm(`Xoá provider "${provider.provider_name}"?`)) return;
    try {
      await adminApi.deleteProvider(provider.id);
      toast.success("Đã xoá provider.");
      list.reload();
    } catch (err) {
      // 409 when a model still uses this provider.
      toast.error((err as Error).message);
    }
  }

  const typeName = (id: string) => types.find((t) => t.provider_id === id)?.provider_name ?? id;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-black/55">Kết nối tới các dịch vụ AI. Mỗi model thuộc về một provider.</p>
        <button
          type="button"
          className={primaryButtonClass}
          disabled={types.length === 0}
          onClick={() => setForm({ mode: "create" })}
        >
          <Plus size={16} /> Thêm provider
        </button>
      </div>

      <ListState loading={list.loading} error={list.error} empty={list.items.length === 0} emptyText="Chưa có provider.">
        <div className="rounded-2xl border border-black/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.provider_name}</TableCell>
                  <TableCell>{typeName(provider.provider_type)}</TableCell>
                  <TableCell className="font-mono text-xs text-black/50">{provider.id}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="Sửa"
                        onClick={() => setForm({ mode: "edit", provider })}
                        className="rounded-lg p-2 text-black/50 hover:bg-black/5 hover:text-black cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        title="Xoá"
                        onClick={() => remove(provider)}
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
            <ProviderForm
              key={form.mode === "edit" ? form.provider.id : "create"}
              state={form}
              types={types}
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

function stringify(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function ProviderForm({
  state,
  types,
  onDone,
}: {
  state: FormState;
  types: ProviderTypeResponse[];
  onDone: () => void;
}) {
  const editing = state.mode === "edit" ? state.provider : null;
  const [providerType, setProviderType] = useState(editing?.provider_type ?? types[0]?.provider_id ?? "");
  const [name, setName] = useState(editing?.provider_name ?? "");
  const [config, setConfig] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(editing?.config ?? {}).map(([k, v]) => [k, stringify(v)])),
  );
  const [saving, setSaving] = useState(false);

  const schema = types.find((t) => t.provider_id === providerType)?.config_schema;
  const properties: Record<string, JsonSchemaProperty> = schema?.properties ?? {};
  const required = new Set(schema?.required ?? []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    // Send only fields with a value so schema defaults (e.g. api_base) apply.
    const cleanConfig = Object.fromEntries(
      Object.entries(config).filter(([key, value]) => key in properties && value.trim() !== ""),
    );
    setSaving(true);
    try {
      if (editing) {
        await adminApi.updateProvider(editing.id, { provider_name: name, config: cleanConfig });
        toast.success("Đã cập nhật provider.");
      } else {
        await adminApi.createProvider({ provider_type: providerType, provider_name: name, config: cleanConfig });
        toast.success("Đã thêm provider.");
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
        <DialogTitle>{editing ? "Sửa provider" : "Thêm provider"}</DialogTitle>
      </DialogHeader>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Loại provider</span>
        <select
          className={inputClass}
          value={providerType}
          disabled={!!editing}
          onChange={(e) => {
            setProviderType(e.target.value);
            setConfig({});
          }}
        >
          {types.map((t) => (
            <option key={t.provider_id} value={t.provider_id}>
              {t.provider_name}
            </option>
          ))}
        </select>
        {editing && <span className="text-xs text-black/45">Không thể đổi loại sau khi tạo.</span>}
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Tên hiển thị</span>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
      </label>

      {Object.entries(properties).map(([key, prop]) => (
        <label key={key} className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">
            {prop.title || key}
            {required.has(key) && <span className="text-red-600"> *</span>}
          </span>
          <input
            className={`${inputClass} font-mono`}
            type={SECRET_FIELD.test(key) ? "password" : "text"}
            autoComplete="off"
            value={config[key] ?? ""}
            placeholder={prop.default !== undefined ? `Mặc định: ${stringify(prop.default)}` : undefined}
            required={required.has(key)}
            onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.value }))}
          />
          {prop.description && <span className="text-xs text-black/45">{prop.description}</span>}
        </label>
      ))}

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
