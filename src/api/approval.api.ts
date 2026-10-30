import * as Sentry from "@sentry/react";
import { apiClient } from "./client";

export type RequestStatus = "pending" | "approved" | "rejected";
export type StudentStatus = "student" | "teacher";

/** Sizes a user may ask for, in MB (236 MB is everyone's default). */
export const STORAGE_REQUEST_SIZES_MB = [512, 1080] as const;
export type StorageRequestSize = (typeof STORAGE_REQUEST_SIZES_MB)[number];

interface RequestBase {
  id: string;
  status: RequestStatus;
  created_at: string;
  reviewed_at: string | null;
  admin_note: string | null;
}

export interface AccountRequestInput {
  full_name: string;
  date_of_birth: string;
  student_status: StudentStatus;
  student_id?: string;
  class_code?: string;
  major?: string;
  faculty?: string;
  phone_number?: string;
  reason: string;
}

export interface AccountRequest extends RequestBase, Required<Omit<AccountRequestInput, "student_id" | "class_code" | "major" | "faculty" | "phone_number">> {
  student_id: string | null;
  class_code: string | null;
  major: string | null;
  faculty: string | null;
  phone_number: string | null;
}

export interface StorageRequest extends RequestBase {
  storage_mb: number;
  reason: string;
}

export interface BugReportInput {
  title: string;
  description: string;
  affectedPage?: string;
}

const withStringId = <T extends { id: string | number }>(item: T): T => ({ ...item, id: String(item.id) });

export const requestApi = {
  /** The signed-in user's access requests, newest first. */
  async listAccount(): Promise<AccountRequest[]> {
    return (await apiClient<AccountRequest[]>("/api/request/account")).map(withStringId);
  },

  /** Ask for access (INACTIVE accounts only); the account becomes PENDING. */
  async createAccount(input: AccountRequestInput): Promise<AccountRequest> {
    return withStringId(
      await apiClient<AccountRequest>("/api/request/account", { method: "POST", body: JSON.stringify(input) }),
    );
  },

  /** The user's storage requests, newest first (active users only). */
  async listStorage(): Promise<StorageRequest[]> {
    return (await apiClient<StorageRequest[]>("/api/request/storage")).map(withStringId);
  },

  async createStorage(storage_mb: StorageRequestSize, reason: string): Promise<StorageRequest> {
    return withStringId(
      await apiClient<StorageRequest>("/api/request/storage", {
        method: "POST",
        body: JSON.stringify({ storage_mb, reason }),
      }),
    );
  },

  /**
   * Report a bug through Sentry user feedback, attached to a new event so the
   * report carries the page, browser, session replay and signed-in user.
   */
  reportBug(input: BugReportInput): string {
    const eventId = Sentry.captureMessage(`Bug report: ${input.title}`, {
      level: "info",
      tags: { kind: "bug_report", affected_page: input.affectedPage || "unspecified" },
    });
    Sentry.captureFeedback({
      message: [input.title, input.affectedPage ? `Trang: ${input.affectedPage}` : "", input.description]
        .filter(Boolean)
        .join("\n\n"),
      url: window.location.href,
      associatedEventId: eventId,
    });
    return eventId;
  },
};
