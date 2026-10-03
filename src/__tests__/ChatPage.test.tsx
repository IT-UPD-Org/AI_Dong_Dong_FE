import type { ComponentProps } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { ChatPage } from "../pages/ChatPage";
import { AppShell } from "../components/layout/AppShell";
import { ModifiedPromptInput } from "../components/chat/ModifiedPromptInput";
import { getConversationMessages, streamChatMessage } from "../services/chat.service";
import type { ChatMessage, ChatStreamChunk } from "../api/types";

vi.mock("../services/chat.service", () => ({ getConversationMessages: vi.fn(), streamChatMessage: vi.fn() }));
vi.mock("../api/chat.api", () => ({ chatApi: { getConversations: vi.fn().mockResolvedValue([]) } }));
vi.mock("../contexts/AuthContext", () => ({ useAuth: () => ({
  user: { id: "1", email: "student@example.com", role: "student", name: "Sinh viên" }, logout: vi.fn(),
}) }));
vi.mock("../components/layout/DocumentProcessingNotifications", () => ({ DocumentProcessingNotifications: () => null }));
vi.mock("../components/chat/ModifiedPromptInput", () => ({
  ModifiedPromptInput: (props: ComponentProps<typeof ModifiedPromptInput>) => <form onSubmit={props.onSubmit}>
    <textarea aria-label="Câu hỏi" value={props.value} disabled={props.loading}
      onChange={(event) => props.onChange(event.target.value)} />
    <button disabled={props.loading}>Gửi câu hỏi</button>
  </form>,
}));
vi.mock("../components/chat/useConversationNav", () => ({ useConversationNav: () => ({
  scrollRef: null, bottomRef: null, registerMessageRef: () => undefined,
  showJumpToLatest: false, navItems: [], activeId: null, handleScroll: vi.fn(),
  scrollToBottom: vi.fn(), scrollToMessage: vi.fn(), markNearBottom: vi.fn(),
}) }));
vi.mock("../components/chat/MessageBubble", () => ({
  MessageBubble: ({ message }: { message: ChatMessage }) => <p>{message.content}</p>,
}));

let onChunk: (chunk: ChatStreamChunk) => void;
let onFinish: (message: ChatMessage) => void;
let finishStream: () => void;
let streamSignal: AbortSignal | undefined;

function Navigation() {
  const navigate = useNavigate();
  return <button onClick={() => navigate("/chat?id=other")}>Mở chat khác</button>;
}
function openChat(path = "/chat") {
  return render(<MemoryRouter initialEntries={[path]}>
    <Navigation />
    <Routes><Route element={<AppShell />}><Route path="/chat" element={<ChatPage />} /></Route></Routes>
  </MemoryRouter>);
}
function sendQuestion() {
  fireEvent.change(screen.getByLabelText("Câu hỏi"), { target: { value: "Câu hỏi đầu tiên" } });
  fireEvent.click(screen.getByText("Gửi câu hỏi"));
}
async function completeAnswer(content = "Câu trả lời đầy đủ", id = "answer-1") {
  await act(async () => {
    onFinish({ id, role: "assistant", content, status: "completed" });
    finishStream();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getConversationMessages).mockResolvedValue([]);
  vi.mocked(streamChatMessage).mockImplementation((_payload, chunk, finish, _error, signal) => {
    onChunk = chunk;
    onFinish = finish;
    streamSignal = signal;
    return new Promise<void>((resolve) => { finishStream = resolve; });
  });
});
afterEach(cleanup);

describe("chat navigation and feedback", () => {
  it("keeps the live answer when the server assigns a conversation ID", async () => {
    openChat();
    sendQuestion();
    act(() => onChunk({ conversationId: "created", title: "Bài tập", delta: "Một phần" }));
    expect(screen.getByText("Một phần")).toBeInTheDocument();
    expect(getConversationMessages).not.toHaveBeenCalled();
    expect(streamSignal?.aborted).toBe(false);
    await completeAnswer();
    expect(screen.getByText("Câu trả lời đầy đủ")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Phản hồi về câu trả lời" })).toBeInTheDocument();
  });

  it("aborts the old stream and ignores its callbacks after switching chats", async () => {
    vi.mocked(getConversationMessages).mockResolvedValue([
      { id: "other-answer", role: "assistant", content: "Nội dung chat khác", status: "completed" },
    ]);
    openChat();
    sendQuestion();
    fireEvent.click(screen.getByText("Mở chat khác"));
    await screen.findByText("Nội dung chat khác");
    expect(streamSignal?.aborted).toBe(true);
    act(() => onChunk({ conversationId: "stale", delta: "Dữ liệu cũ" }));
    await completeAnswer("Câu trả lời cũ");
    expect(screen.queryByText("Câu trả lời cũ")).not.toBeInTheDocument();
    expect(screen.getByText("Nội dung chat khác")).toBeInTheDocument();
    expect(getConversationMessages).toHaveBeenCalledExactlyOnceWith("other");
    expect(screen.getByText("Gửi câu hỏi")).toBeEnabled();
  });

  it("starts a clean chat when New chat is pressed on the current chat page", async () => {
    openChat();
    sendQuestion();
    await completeAnswer();
    fireEvent.click(screen.getAllByRole("button", { name: "Cuộc trò chuyện mới" })[0]);
    expect(screen.queryByText("Câu trả lời đầy đủ")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Phản hồi về câu trả lời" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Câu hỏi")).toHaveValue("");
    expect(screen.getByText("Gửi câu hỏi")).toBeEnabled();
  });

  it("allows feedback to close and reappear only below the newest answer", async () => {
    openChat();
    sendQuestion();
    await completeAnswer();
    fireEvent.click(screen.getByLabelText("Đóng phần phản hồi"));
    expect(screen.queryByRole("region", { name: "Phản hồi về câu trả lời" })).not.toBeInTheDocument();
    sendQuestion();
    await completeAnswer("Câu trả lời thứ hai", "answer-2");
    const panel = screen.getByRole("region", { name: "Phản hồi về câu trả lời" });
    expect(screen.getAllByRole("region", { name: "Phản hồi về câu trả lời" })).toHaveLength(1);
    expect(screen.getByText("Câu trả lời thứ hai").compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Góp ý" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Báo lỗi" })).toBeInTheDocument();
  });

  it("shows a failed stream without leaving the composer permanently disabled", async () => {
    vi.mocked(streamChatMessage).mockRejectedValue(new Error("Network offline"));
    openChat();
    sendQuestion();
    await screen.findByRole("alert");
    await waitFor(() => expect(screen.getByText("Gửi câu hỏi")).toBeEnabled());
    expect(screen.queryByRole("region", { name: "Phản hồi về câu trả lời" })).not.toBeInTheDocument();
  });

  it("ignores old history that finishes after navigating to a new chat", async () => {
    let finish!: (messages: ChatMessage[]) => void;
    vi.mocked(getConversationMessages).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    openChat("/chat?id=old");
    expect(screen.getByText("Gửi câu hỏi")).toBeDisabled();
    fireEvent.click(screen.getAllByRole("button", { name: "Cuộc trò chuyện mới" })[1]);
    await act(async () => { finish([{ id: "old", role: "user", content: "Lịch sử cũ" }]); });
    expect(screen.queryByText("Lịch sử cũ")).not.toBeInTheDocument();
    expect(screen.getByText("Gửi câu hỏi")).toBeEnabled();
  });
});
