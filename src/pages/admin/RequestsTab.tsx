import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  adminApi,
  type AdminAccountRequest,
  type AdminStorageRequest,
  type RequestKind,
} from "../../api/admin.api";

type AnyRequest = AdminAccountRequest | AdminStorageRequest;
import type { RequestStatus } from "../../api/approval.api";
import { ListState, Pager, usePagedList } from "./shared";

const PAGE_SIZE = 20;
const STATUS_LABEL: Record<RequestStatus, string> = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };
const STATUS_STYLE: Record<RequestStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-green-200 bg-green-50 text-green-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};
const KIND_LABEL: Record<RequestKind, string> = { account: "Cấp quyền truy cập", storage: "Tăng dung lượng" };

function AccountDetails({ request }: { request: AdminAccountRequest }) {
  const rows: [string, string | null][] = [
    ["Họ tên", request.full_name],
    ["Ngày sinh", request.date_of_birth],
    ["Vai trò", request.student_status === "student" ? "Sinh viên" : "Giảng viên"],
    ["Mã SV", request.student_id],
    ["Lớp", request.class_code],
    ["Ngành", request.major],
    ["Khoa", request.faculty],
    ["SĐT", request.phone_number],
  ];
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-black/45">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function RequestList({ kind, status }: { kind: RequestKind; status: RequestStatus | null }) {
  const load = useCallback(
    (page: number): Promise<AnyRequest[]> =>
      kind === "account" ? adminApi.getAccountRequests(status, page) : adminApi.getStorageRequests(status, page),
    [kind, status],
  );
  const list = usePagedList(load, PAGE_SIZE);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function review(request: AnyRequest, approve: boolean) {
    setBusyId(request.id);
    try {
      const note = notes[request.id];
      const updated: AnyRequest =
        kind === "account"
          ? await adminApi.reviewAccountRequest(request.id, approve, note)
          : await adminApi.reviewStorageRequest(request.id, approve, note);
      list.setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(approve ? `Đã duyệt yêu cầu của ${request.user_name}.` : `Đã từ chối yêu cầu của ${request.user_name}.`);
    } catch (err) {
      toast.error((err as Error).message);
      void list.reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <ListState loading={list.loading} error={list.error} empty={list.items.length === 0} emptyText="Không có yêu cầu nào.">
        <ul className="space-y-3">
          {list.items.map((request) => (
            <li key={request.id} className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{request.user_name}</p>
                  <p className="text-sm text-black/55">{request.user_email}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-black/45">
                  {new Date(request.created_at).toLocaleString("vi-VN")}
                  <span className={`rounded-full border px-2.5 py-0.5 font-semibold ${STATUS_STYLE[request.status]}`}>
                    {STATUS_LABEL[request.status]}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {"storage_mb" in request ? (
                  <p className="text-sm">
                    Xin <strong>{request.storage_mb} MB</strong>
                  </p>
                ) : (
                  <AccountDetails request={request} />
                )}
                <p className="whitespace-pre-wrap rounded-xl bg-black/[0.03] p-3 text-sm text-black/75">{request.reason}</p>
                {request.admin_note && request.status !== "pending" && (
                  <p className="text-xs text-black/55">Ghi chú: {request.admin_note}</p>
                )}
              </div>

              {request.status === "pending" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    value={notes[request.id] ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [request.id]: e.target.value }))}
                    placeholder="Ghi chú cho người dùng (tuỳ chọn)"
                    maxLength={1000}
                    className="min-w-0 flex-1 rounded-lg border border-black/15 px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busyId === request.id}
                    onClick={() => review(request, true)}
                    className="rounded-lg bg-[#04714a] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#03593a] disabled:opacity-50 cursor-pointer"
                  >
                    Duyệt
                  </button>
                  <button
                    type="button"
                    disabled={busyId === request.id}
                    onClick={() => review(request, false)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                  >
                    Từ chối
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </ListState>
      <Pager page={list.page} hasNext={list.hasNext} onChange={list.setPage} />
    </>
  );
}

export function RequestsTab() {
  const [kind, setKind] = useState<RequestKind>("account");
  const [status, setStatus] = useState<RequestStatus | null>("pending");

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(Object.keys(KIND_LABEL) as RequestKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full border px-3 py-1 text-sm font-medium cursor-pointer ${
              kind === k ? "border-[#04714a] bg-[#e8f7ef] text-[#04714a]" : "border-black/15 text-black/60"
            }`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
        <select
          value={status ?? "all"}
          onChange={(e) => setStatus(e.target.value === "all" ? null : (e.target.value as RequestStatus))}
          className="ml-auto rounded-md border border-black/15 bg-white px-2 py-1 text-sm"
          aria-label="Lọc theo trạng thái"
        >
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
          <option value="all">Tất cả</option>
        </select>
      </div>
      {/* Keyed so changing the filter starts again from page 1. */}
      <RequestList key={`${kind}-${status}`} kind={kind} status={status} />
    </section>
  );
}
