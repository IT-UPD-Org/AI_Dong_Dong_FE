import { messages } from "../mocks/data";
import type { ChatMessage } from "../api/types";
import { chatApi } from "../api/chat.api";

export async function getConversationMessages(): Promise<ChatMessage[]> {
  return messages;
}

export async function streamChatMessage(
  content: string,
  onChunk: (text: string) => void,
  onFinish: (message: ChatMessage) => void
): Promise<void> {
  return chatApi.streamMessage({ message: content }, onChunk, onFinish);
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
