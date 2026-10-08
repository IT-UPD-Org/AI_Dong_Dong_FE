import { afterEach, describe, expect, it, vi } from "vitest";
import { readServerEvents } from "../api/sse";
import { chatApi } from "../api/chat.api";

function stream(text: string, byteByByte = false) {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      if (byteByByte) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
      } else controller.enqueue(bytes);
      controller.close();
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe("SSE response handling", () => {
  it("preserves Vietnamese UTF-8, split CRLF and multiline data", async () => {
    const events = [];
    const body = stream(": ping\r\nevent: token\r\ndata: Xin chào\r\ndata: sinh viên\r\n\r\n", true);
    for await (const event of readServerEvents(body)) events.push(event);
    expect(events).toEqual([{ event: "token", data: "Xin chào\nsinh viên" }]);
  });

  it("reads the last event when the connection ends without a blank line", async () => {
    const events = [];
    for await (const event of readServerEvents(stream('data: {"delta":"cuối"}'))) events.push(event);
    expect(events).toEqual([{ event: "message", data: '{"delta":"cuối"}' }]);
  });

  it("aborts a pending read and cancels the underlying stream", async () => {
    const cancel = vi.fn();
    const controller = new AbortController();
    const events = readServerEvents(new ReadableStream({ cancel }), controller.signal);
    const next = events.next();
    controller.abort();
    await expect(next).rejects.toMatchObject({ name: "AbortError" });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("uses the complete agent message instead of retaining a partial delta", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stream(
      'event: conversation_created\ndata: {"id":12,"title":"Bài tập"}\n\n' +
      'data: {"delta":"Một phần"}\n\n' +
      'data: {"root":{"type":"agent","id":34,"content":"Câu trả lời đầy đủ","complete":true}}\n\n' +
      'data: [DONE]\n\n' +
      'data: {"delta":"không được đọc"}\n\n', true), { status: 200 })));
    const onChunk = vi.fn();
    const onFinish = vi.fn();
    await chatApi.streamMessage({ message: "Giải bài tập" }, onChunk, onFinish);
    expect(onChunk).toHaveBeenCalledWith(expect.objectContaining({ conversationId: "12" }));
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({
      id: "34", content: "Câu trả lời đầy đủ", status: "completed",
    }));
    expect(onChunk).not.toHaveBeenCalledWith(expect.objectContaining({ delta: "không được đọc" }));
  });

  it("does not replace a 401 response with a mock answer", async () => {
    localStorage.setItem("access_token", "expired");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    const onFinish = vi.fn();
    const onError = vi.fn();
    await expect(chatApi.streamMessage({ message: "Chào" }, vi.fn(), onFinish, onError))
      .rejects.toMatchObject({ status: 401 });
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(onError).toHaveBeenCalledOnce();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("does not append mock text after an interrupted real answer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stream(
      'data: {"delta":"Đang trả lời"}\n\nevent: error\ndata: {"error":"Máy chủ lỗi"}\n\n',
    ))));
    const onFinish = vi.fn();
    await expect(chatApi.streamMessage({ message: "Chào" }, vi.fn(), onFinish))
      .rejects.toThrow("Máy chủ lỗi");
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("propagates cancellation without generating a fallback answer", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(controller.signal.reason));
    const onFinish = vi.fn();
    await expect(chatApi.streamMessage({ message: "Chào" }, vi.fn(), onFinish, undefined, controller.signal))
      .rejects.toMatchObject({ name: "AbortError" });
    expect(onFinish).not.toHaveBeenCalled();
  });
});
