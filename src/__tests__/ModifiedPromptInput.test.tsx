import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Document } from "../api/types";
import { documentApi } from "../api/document.api";
import { ModifiedPromptInput } from "../components/chat/ModifiedPromptInput";

vi.mock("../api/document.api", () => ({
  documentApi: { subscribe: vi.fn(), listDocuments: vi.fn(), uploadDocument: vi.fn() },
}));
vi.mock("../hooks/useVoiceInput", () => ({
  useVoiceInput: () => ({ listening: false, supported: false, toggle: vi.fn(), error: "" }),
}));

let notify: (doc: Document) => void;
const submit = vi.fn();
const changedIds = vi.fn();

function documentFor(file: File, status: Document["status"] = "ready"): Document {
  return { document_id: file.name, user_id: "student", filename: file.name,
    mime_type: file.type, size_bytes: file.size, created_at: "2026-10-03", status };
}

function Composer() {
  const [value, setValue] = useState("Câu hỏi");
  const [ids, setIds] = useState<string[]>([]);
  return <ModifiedPromptInput value={value} onChange={setValue}
    onSubmit={() => { submit(ids); setIds([]); setValue(""); }} level="L2" onLevelChange={() => {}}
    attachmentIds={ids} onAttachmentChange={(next) => { changedIds(next); setIds(next); }} />;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(documentApi.listDocuments).mockResolvedValue([]);
  vi.mocked(documentApi.subscribe).mockImplementation((callback) => {
    notify = callback;
    return vi.fn();
  });
  vi.mocked(documentApi.uploadDocument).mockImplementation(async (file) => documentFor(file));
});
afterEach(cleanup);

describe("chat attachments", () => {
  it("attaches files selected in the popup to the submitted question", async () => {
    render(<Composer />);
    fireEvent.click(screen.getByTitle("Tải lên tài liệu"));
    fireEvent.change(screen.getByLabelText("Chọn tài liệu đính kèm"), {
      target: { files: [new File(["bài tập"], "lesson.docx")] },
    });
    await screen.findByText("lesson.docx");
    await waitFor(() => expect(screen.getByTitle("Gửi")).toBeEnabled());
    fireEvent.click(screen.getByTitle("Gửi"));
    expect(submit).toHaveBeenCalledWith(["lesson.docx"]);
    expect(screen.queryByText("lesson.docx")).not.toBeInTheDocument();
  });

  it("preserves both IDs when several files are pasted together", async () => {
    render(<Composer />);
    fireEvent.paste(screen.getByLabelText("Nội dung câu hỏi"), {
      clipboardData: { files: [new File(["a"], "one.pdf"), new File(["b"], "two.docx")] },
    });
    await screen.findByText("two.docx");
    expect(changedIds).toHaveBeenLastCalledWith(["one.pdf", "two.docx"]);
    expect(screen.getByText("one.pdf")).toBeInTheDocument();
  });

  it("does not change the draft or upload files when the picker is cancelled", () => {
    render(<Composer />);
    fireEvent.click(screen.getByTitle("Tải lên tài liệu"));
    fireEvent.change(screen.getByLabelText("Chọn tài liệu đính kèm"), { target: { files: [] } });
    fireEvent.click(screen.getByLabelText("Đóng tải tài liệu"));
    expect(documentApi.uploadDocument).not.toHaveBeenCalled();
    expect(changedIds).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nội dung câu hỏi")).toHaveValue("Câu hỏi");
  });

  it("blocks submission until the selected document becomes ready", async () => {
    const file = new File(["a"], "processing.pdf");
    vi.mocked(documentApi.uploadDocument).mockResolvedValue(documentFor(file, "processing"));
    render(<Composer />);
    fireEvent.paste(screen.getByLabelText("Nội dung câu hỏi"), { clipboardData: { files: [file] } });
    await screen.findByText("processing.pdf");
    expect(screen.getByTitle("Gửi")).toBeDisabled();
    fireEvent.keyDown(screen.getByLabelText("Nội dung câu hỏi"), { key: "Enter" });
    expect(submit).not.toHaveBeenCalled();
    act(() => notify(documentFor(file)));
    await waitFor(() => expect(screen.getByTitle("Gửi")).toBeEnabled());
    fireEvent.click(screen.getByTitle("Gửi"));
    expect(submit).toHaveBeenCalledWith(["processing.pdf"]);
  });

  it("does not submit while an IME is composing Vietnamese text", () => {
    render(<Composer />);
    fireEvent.keyDown(screen.getByLabelText("Nội dung câu hỏi"), { key: "Enter", isComposing: true });
    expect(submit).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByLabelText("Nội dung câu hỏi"), { key: "Enter" });
    expect(submit).toHaveBeenCalledOnce();
  });

  it("blocks a failed document and lets the student remove it to continue", async () => {
    const file = new File(["a"], "failed.pdf");
    vi.mocked(documentApi.uploadDocument).mockResolvedValue(documentFor(file, "error"));
    render(<Composer />);
    fireEvent.paste(screen.getByLabelText("Nội dung câu hỏi"), { clipboardData: { files: [file] } });
    await screen.findByRole("alert");
    expect(screen.getByTitle("Gửi")).toBeDisabled();
    await waitFor(() => expect(screen.getByTitle("Xóa tài liệu đính kèm")).toBeEnabled());
    fireEvent.click(screen.getByTitle("Xóa tài liệu đính kèm"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTitle("Gửi")).toBeEnabled();
    expect(changedIds).toHaveBeenLastCalledWith([]);
  });

  it("ignores an upload that finishes after leaving the chat", async () => {
    let finish!: (doc: Document) => void;
    vi.mocked(documentApi.uploadDocument).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const view = render(<Composer />);
    const file = new File(["a"], "old-chat.pdf");
    fireEvent.paste(screen.getByLabelText("Nội dung câu hỏi"), { clipboardData: { files: [file] } });
    view.unmount();
    await act(async () => { finish(documentFor(file)); });
    expect(changedIds).not.toHaveBeenCalled();
  });
});
