import { apiClient } from "./client";

export type ApprovalRequestType =
  | "account_request"
  | "storage_increase"
  | "bug_report";

export type StudentStatus = "student" | "alumni_other";

export interface ApprovalSubmitPayload {
  request_type: ApprovalRequestType;
  full_name: string;
  date_of_birth: string;
  student_status: StudentStatus;
  student_id?: string;
  class_code?: string;
  major?: string;
  faculty?: string;
  phone_number?: string;
  description?: string;
  storage_mb?: number;
  bug_title?: string;
  bug_description?: string;
  affected_page?: string;
  file?: File | null;
}

export interface ApprovalSubmitResponse {
  success: boolean;
  message: string;
  request_code: string;
  request_type: string;
  email_sent: boolean;
  status: string;
  created_at: string;
}

export const approvalApi = {
  async submit(payload: ApprovalSubmitPayload): Promise<ApprovalSubmitResponse> {
    const formData = new FormData();
    formData.append("request_type", payload.request_type);
    formData.append("full_name", payload.full_name.trim());
    formData.append("date_of_birth", payload.date_of_birth);
    formData.append("student_status", payload.student_status);

    if (payload.student_status === "student") {
      if (payload.student_id) formData.append("student_id", payload.student_id.trim());
      if (payload.class_code) formData.append("class_code", payload.class_code.trim());
      if (payload.major) formData.append("major", payload.major.trim());
      if (payload.faculty) formData.append("faculty", payload.faculty.trim());
    } else if (payload.student_status === "alumni_other") {
      if (payload.phone_number) formData.append("phone_number", payload.phone_number.trim());
    }

    if (payload.description) {
      formData.append("description", payload.description.trim());
    }

    if (payload.request_type === "storage_increase" && payload.storage_mb) {
      formData.append("storage_mb", String(payload.storage_mb));
    }

    if (payload.request_type === "bug_report") {
      if (payload.bug_title) formData.append("bug_title", payload.bug_title.trim());
      if (payload.bug_description) formData.append("bug_description", payload.bug_description.trim());
      if (payload.affected_page) formData.append("affected_page", payload.affected_page.trim());
    }

    if (payload.file) {
      formData.append("file", payload.file);
    }

    return apiClient<ApprovalSubmitResponse>("/api/approve/submit", {
      method: "POST",
      body: formData,
    });
  },
};
