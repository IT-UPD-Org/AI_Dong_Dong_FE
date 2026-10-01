import { messages } from "../mocks/data";
import type { ChatMessage, ChatStreamChunk, SendMessagePayload } from "../api/types";
import { chatApi } from "../api/chat.api";

export async function getConversationMessages(): Promise<ChatMessage[]> {
  return messages;
}

export async function streamChatMessage(
  payload: SendMessagePayload,
  onChunk: (chunk: ChatStreamChunk) => void,
  onFinish: (message: ChatMessage) => void
): Promise<void> {
  return chatApi.streamMessage(payload, onChunk, onFinish);
}

export async function sendChatMessage(content: string): Promise<ChatMessage> {
  return new Promise((resolve) => {
    chatApi.streamMessage(
      { message: content },
      () => {},
      (msg) => resolve(msg)
    );
  });
}
