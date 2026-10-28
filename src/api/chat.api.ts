import { apiClient } from './client';
import { streamSse, streamSseGet, type SseEvent } from './sse';
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
import type { ReplyStep } from '../lib/groupMessages';

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

export const HIDDEN_REPLY_NOTICE = 'Câu trả lời này đã bị ẩn vì vi phạm quy định sử dụng.';
const VIOLATION_FALLBACK = 'Tin nhắn của bạn không được gửi vì vi phạm quy định sử dụng.';

export function convertBEMessageToChatMessage(msg: BEMessage): ChatMessage {
  if (msg.type === 'agent' && msg.hidden) {
    return {
      id: String(msg.id),
      role: 'assistant',
      content: HIDDEN_REPLY_NOTICE,
      status: 'completed',
      hidden: true,
    };
  }
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

export function toConversation(c: ConversationSummary): Conversation {
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
  /** The current user's own conversations. Admins list everyone's with `adminApi.getAllChats`. */
  async getConversations(page = 1): Promise<Conversation[]> {
    const data = await apiClient<ConversationSummary[]>(`/api/chats?page=${page}`);
    return data.map(toConversation);
  },

  getConversation(conversationId: string): Promise<ConversationDetail> {
    return apiClient<ConversationDetail>(`/api/chats/${conversationId}`);
  },

  /** Stop the running reply; the partial reply is kept. 409 when nothing is running. */
  stopReply(conversationId: string): Promise<void> {
    return apiClient<void>(`/api/chats/${conversationId}/stop`, { method: 'POST' });
  },

  /** Delete a conversation, stopping its reply first if one is running. */
  deleteConversation(conversationId: string): Promise<void> {
    return apiClient<void>(`/api/chats/${conversationId}`, { method: 'DELETE' });
  },

  /**
   * Follow a queued or running reply from its start (`GET /resume`).
   * ChatPage calls it when the chat is opened with `async_status` other than `none`.
   */
  resumeReply(
    conversationId: string,
    onChunk: (chunk: ChatStreamChunk) => void,
    onFinish: (completeMessage: ChatMessage) => void,
    onError?: (error: Error) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    return readReply(streamSseGet(`/api/chats/${conversationId}/resume`, signal), onChunk, onFinish, onError);
  },

  /**
   * Send a message and stream the reply.
   *
   * Without a conversation id this creates one (`POST /api/chats/create`), otherwise it
   * appends to the existing conversation (`POST /api/chats/{id}/send`).
   */
  async streamMessage(
    payload: SendMessagePayload,
    onChunk: (chunk: ChatStreamChunk) => void,
    onFinish: (completeMessage: ChatMessage) => void,
    onError?: (error: Error) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const endpoint = payload.conversationId ? `/api/chats/${payload.conversationId}/send` : '/api/chats/create';
    const body = JSON.stringify({
      content: payload.message,
      model_type: payload.modelType || mapLevelToModelType(payload.modelLevel),
      files: payload.attachmentIds ?? [],
    });
    return readReply(streamSse(endpoint, body, signal), onChunk, onFinish, onError);
  },
};

/**
 * Turn a reply's SSE events into chunk/finish callbacks.
 *
 * Terminal events: `error` (agent failed), `stopped` (user stopped it; the
 * partial reply is kept), `violation` (moderation rejected the message; it
 * was not saved) and `run_in_progress` (another reply is already
 * running; the message was not saved). For `run_in_progress` the caller is
 * told via `runInProgress` and decides whether to call `resumeReply`; it is
 * never resumed automatically.
 */
async function readReply(
  events: AsyncGenerator<SseEvent>,
  onChunk: (chunk: ChatStreamChunk) => void,
  onFinish: (completeMessage: ChatMessage) => void,
  onError?: (error: Error) => void,
): Promise<void> {
  let fullText = '';
  let assistantId: string | undefined;
  let toolCalls: BEToolCall[] = [];
  // One entry per assistant message (tool round), in order, so the live view groups like the saved one.
  const steps: ReplyStep[] = [];
  const stepFor = (messageId: string | undefined): ReplyStep => {
    const id = messageId ?? 'pending';
    let step = steps.find((s) => s.id === id);
    if (!step) {
      step = { id, content: '', toolCalls: [] };
      steps.push(step);
    }
    return step;
  };
  let stopped = false;
  let hidden = false;

  try {
    onChunk({ status: 'thinking' });

    for await (const evt of events) {
      if (evt.event === 'conversation_created') {
        const data = evt.data as { id: string; title: string };
        onChunk({ conversationId: String(data.id), title: data.title });
        continue;
      }
      if (evt.event === 'user_message_id') {
        continue;
      }
      if (evt.event === 'run_in_progress') {
        onChunk({ status: 'idle', runInProgress: true });
        return;
      }
      if (evt.event === 'violation') {
        const detail = (evt.data as { detail?: string } | null)?.detail;
        onChunk({ status: 'idle', violation: detail || VIOLATION_FALLBACK });
        return;
      }
      if (evt.event === 'output_violation') {
        hidden = true;
        continue;
      }
      if (evt.event === 'stopped') {
        stopped = true;
        continue;
      }
      if (evt.event === 'error') {
        const detail = (evt.data as { detail?: string } | null)?.detail;
        throw new Error(detail || 'Trợ lý không thể trả lời. Vui lòng thử lại.');
      }

      const data = evt.data as StreamPayload;
      if (data?.message_id) assistantId = String(data.message_id);

      if (evt.event === 'content' && data.content) {
        fullText += data.content;
        stepFor(assistantId).content += data.content;
        onChunk({ delta: data.content, status: 'generating', messageId: assistantId, steps: steps.map((s) => ({ ...s })) });
      } else if (evt.event === 'tool_calls' && data.tool_calls) {
        toolCalls = [...toolCalls, ...data.tool_calls];
        stepFor(assistantId).toolCalls = data.tool_calls;
        onChunk({ status: 'searching', toolCalls, messageId: assistantId, steps: steps.map((s) => ({ ...s })) });
      }
    }

    onFinish({
      id: assistantId || crypto.randomUUID(),
      role: 'assistant',
      content: hidden ? HIDDEN_REPLY_NOTICE : fullText,
      status: stopped ? 'stopped' : 'completed',
      toolCalls: hidden || !toolCalls.length ? undefined : toolCalls,
      hidden: hidden || undefined,
      steps: hidden || steps.length < 2 ? undefined : steps,
    });
  } catch (err) {
    const error = err as Error;
    if (error.name === 'AbortError') return;
    onChunk({ status: 'error', error: error.message });
    onError?.(error);
  }
}
