import { chatApi, convertBEMessageToChatMessage } from "../api/chat.api";
import type { AsyncStatus, ChatMessage, ChatStreamChunk, Conversation, SendMessagePayload } from "../api/types";

export async function getConversations(page: number = 1): Promise<Conversation[]> {
  return await chatApi.getConversations(page);
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  return (await getConversationState(conversationId)).messages;
}

/** A conversation's messages plus whether a reply is still queued or being written. */
export async function getConversationState(
  conversationId: string,
): Promise<{ messages: ChatMessage[]; asyncStatus: AsyncStatus }> {
  if (!conversationId) return { messages: [], asyncStatus: "none" };
  const conv = await chatApi.getConversation(conversationId);
  return { messages: conv.messages.map(convertBEMessageToChatMessage), asyncStatus: conv.async_status ?? "none" };
}

export async function streamChatMessage(
  payload: SendMessagePayload,
  onChunk: (chunk: ChatStreamChunk) => void,
  onFinish: (message: ChatMessage) => void,
  onError?: (error: Error) => void,
  signal?: AbortSignal,
): Promise<void> {
  return await chatApi.streamMessage(payload, onChunk, onFinish, onError, signal);
}
