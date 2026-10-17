import { chatApi, convertBEMessageToChatMessage } from "../api/chat.api";
import type { ChatMessage, ChatStreamChunk, Conversation, SendMessagePayload } from "../api/types";

export async function getConversations(page: number = 1): Promise<Conversation[]> {
  return await chatApi.getConversations(page);
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  if (!conversationId) return [];
  const conv = await chatApi.getConversation(conversationId);
  return conv.messages.map(convertBEMessageToChatMessage);
}

export async function streamChatMessage(
  payload: SendMessagePayload,
  onChunk: (chunk: ChatStreamChunk) => void,
  onFinish: (message: ChatMessage) => void,
  onError?: (error: Error) => void,
): Promise<void> {
  return await chatApi.streamMessage(payload, onChunk, onFinish, onError);
}
