import { apiClient } from './client';
import { streamSse } from './sse';
import type {
  AgentLevel,
  BEMessage,
  BEToolCall,
  ChatMessage,
  ChatStreamChunk,
  Conversation,
  ConversationDetail,
  ConversationSummary,
  ModelTypeEnum,
  SendMessagePayload,
} from './types';

export function mapLevelToModelType(level?: AgentLevel): ModelTypeEnum {
  switch (level) {
    case 'L1':
      return 'instant';
    case 'L3':
      return 'detailed';
    case 'L2':
    default:
      return 'standard';
  }
}

export function convertBEMessageToChatMessage(msg: BEMessage): ChatMessage {
  if (msg.type === 'agent') {
    return {
      id: String(msg.id),
      role: 'assistant',
      content: msg.content || '',
      status: msg.complete ? 'completed' : 'generating',
      toolCalls: msg.tool_calls,
    };
  }
  if (msg.type === 'user') {
    return {
      id: String(msg.id),
      role: 'user',
      content: msg.content,
      status: 'idle',
      files: msg.files?.map(String),
    };
  }
  return { id: crypto.randomUUID(), role: 'system', content: msg.content, status: 'idle' };
}

function toConversation(c: ConversationSummary): Conversation {
  return {
    id: String(c.id),
    title: c.title || 'Cuộc trò chuyện mới',
    disabled: c.disabled,
    asyncStatus: c.async_status,
  };
}

/** Payload of the backend's `content` and `tool_calls` stream events. */
interface StreamPayload {
  type: 'content' | 'tool_calls';
  id: string;
  message_id: string;
  content?: string;
  tool_calls?: BEToolCall[];
}

export const chatApi = {
  async getConversations(page = 1, allChats = false): Promise<Conversation[]> {
    const data = await apiClient<ConversationSummary[]>(`/chats?page=${page}&all_chats=${allChats}`);
    return data.map(toConversation);
  },

  getConversation(conversationId: string): Promise<ConversationDetail> {
    return apiClient<ConversationDetail>(`/chats/${conversationId}`);
  },

  /**
   * Send a message and stream the reply.
   *
   * Without a conversation id this creates one (`POST /chats/create`), otherwise it
   * appends to the existing conversation (`POST /chats/{id}/send`).
   */
  async streamMessage(
    payload: SendMessagePayload,
    onChunk: (chunk: ChatStreamChunk) => void,
    onFinish: (completeMessage: ChatMessage) => void,
    onError?: (error: Error) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const endpoint = payload.conversationId ? `/chats/${payload.conversationId}/send` : '/chats/create';
    const body = JSON.stringify({
      content: payload.message,
      model_type: payload.modelType || mapLevelToModelType(payload.modelLevel),
      files: payload.attachmentIds ?? [],
    });

    let fullText = '';
    let assistantId: string | undefined;
    let toolCalls: BEToolCall[] = [];

    try {
      onChunk({ status: 'thinking' });

      for await (const evt of streamSse(endpoint, body, signal)) {
        if (evt.event === 'conversation_created') {
          const data = evt.data as { id: string; title: string };
          onChunk({ conversationId: String(data.id), title: data.title });
          continue;
        }
        if (evt.event === 'user_message_id') {
          continue;
        }

        const data = evt.data as StreamPayload;
        if (data?.message_id) assistantId = String(data.message_id);

        if (evt.event === 'content' && data.content) {
          fullText += data.content;
          onChunk({ delta: data.content, status: 'generating', messageId: assistantId });
        } else if (evt.event === 'tool_calls' && data.tool_calls) {
          toolCalls = [...toolCalls, ...data.tool_calls];
          onChunk({ status: 'searching', toolCalls, messageId: assistantId });
        }
      }

      onFinish({
        id: assistantId || crypto.randomUUID(),
        role: 'assistant',
        content: fullText,
        status: 'completed',
        toolCalls: toolCalls.length ? toolCalls : undefined,
      });
    } catch (err) {
      const error = err as Error;
      if (error.name === 'AbortError') return;
      onChunk({ status: 'error', error: error.message });
      onError?.(error);
    }
  },
};
