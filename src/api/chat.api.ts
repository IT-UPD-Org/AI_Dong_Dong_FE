import { ApiError, apiClient, buildApiUrl, getStoredToken, removeStoredToken } from './client';
import { readServerEvents } from './sse';
import type {
  AgentLevel,
  BEMessage,
  ChatMessage,
  ChatStreamChunk,
  ChatConversationModel,
  Conversation,
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
  const item = 'root' in msg ? msg.root : msg;
  const role = item.type === 'agent' ? 'assistant' : item.type === 'system' ? 'system' : 'user';
  const content = item.content || '';
  const isComplete = item.type !== 'agent' || item.complete;
  const id: string = 'id' in item && item.id ? String(item.id) : crypto.randomUUID();

  return {
    id,
    role,
    content,
    status: role === 'assistant' ? (isComplete ? 'completed' : 'generating') : 'idle',
    toolCalls: item.type === 'agent' ? item.tool_calls : undefined,
  };
}

export const chatApi = {
  /**
   * Lấy danh sách các cuộc trò chuyện của user từ BE
   */
  async getConversations(page: number = 1, allChats: boolean = false): Promise<Conversation[]> {
    const token = getStoredToken();
    const url = buildApiUrl(`/chats?page=${page}&all_chats=${allChats}`);

    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch chats: ${res.status}`);
      }

      const data: ChatConversationModel[] = await res.json();
      return data.map((c) => ({
        id: String(c.id),
        title: c.title || 'Cuộc trò chuyện mới',
        messageCount: c.messages?.length || 0,
      }));
    } catch (err) {
      console.warn('[chatApi] Fallback: Không thể tải danh sách chats từ BE, trả về mảng rỗng:', err);
      return [];
    }
  },

  /**
   * Lấy chi tiết một cuộc trò chuyện bao gồm toàn bộ tin nhắn
   */
  async getConversation(conversationId: string): Promise<ChatConversationModel | null> {
    return apiClient<ChatConversationModel>(`/chats/${conversationId}`);
  },

  /**
   * Stream tin nhắn qua SSE:
   * - Nếu chưa có conversationId: Gọi POST /chats/create
   * - Nếu đã có conversationId: Gọi POST /chats/{conversationId}/send
   */
  async streamMessage(
    payload: SendMessagePayload,
    onChunk: (chunk: ChatStreamChunk) => void,
    onFinish: (completeMessage: ChatMessage) => void,
    onError?: (error: Error) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const token = getStoredToken();
    const modelType = payload.modelType || mapLevelToModelType(payload.modelLevel);
    const hasConversation = !!payload.conversationId;

    const endpoint = hasConversation
      ? `/chats/${payload.conversationId}/send`
      : '/chats/create';
    const url = buildApiUrl(endpoint);
    let receivedData = false;

    try {
      const response = await fetch(url, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: payload.message,
          model_type: modelType,
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 401 && token && getStoredToken() === token) {
          removeStoredToken();
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        throw new ApiError('Không thể gửi câu hỏi. Vui lòng thử lại.', response.status);
      }

      let fullText = '';
      let assistantMsgId: string = crypto.randomUUID();
      let conversationId = payload.conversationId;

      for await (const { event, data } of readServerEvents(response.body, signal)) {
        if (data === '[DONE]' || event === 'done') break;
        receivedData = true;
        let parsed: unknown;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        const outer = typeof parsed === 'object' && parsed !== null
          ? parsed as Record<string, unknown> : {};
        const item = typeof outer.root === 'object' && outer.root !== null
          ? outer.root as Record<string, unknown> : outer;
        const kind = event === 'message' ? item.type : event;

        if (kind === 'error' || outer.error || outer.status === 'error') {
          throw new Error(typeof outer.error === 'string' ? outer.error : 'Máy chủ không thể hoàn tất câu trả lời.');
        }
        if (kind === 'conversation_created' || (outer.id && outer.title)) {
          conversationId = String(outer.id);
          if (outer.message_id) assistantMsgId = String(outer.message_id);
          onChunk({
            conversationId,
            title: typeof outer.title === 'string' ? outer.title : 'Cuộc trò chuyện mới',
            status: 'generating',
          });
          continue;
        }
        if (kind === 'user_message_id') continue;
        if (kind === 'tool_calls') {
          onChunk({ status: 'searching', conversationId });
          continue;
        }
        if (kind === 'agent') {
          if (typeof item.content === 'string') fullText = item.content;
          if (item.id) assistantMsgId = String(item.id);
          if (item.complete) onChunk({ status: 'completed', conversationId });
          continue;
        }
        const statuses = ['idle', 'thinking', 'searching', 'generating', 'completed', 'error'] as const;
        const status = statuses.find((value) => value === outer.status);
        if (status) onChunk({ status, conversationId });
        const delta = typeof parsed === 'string' ? parsed : item.delta ?? item.content;
        if (typeof delta === 'string' && delta) {
          fullText += delta;
          if (item.message_id) assistantMsgId = String(item.message_id);
          onChunk({ delta, status: 'generating', conversationId });
        }
      }
      signal?.throwIfAborted();

      onFinish({
        id: assistantMsgId,
        role: 'assistant',
        content: fullText,
        sources: [],
        status: 'completed',
      });
    } catch (error: unknown) {
      if (signal?.aborted) throw signal.reason;
      const err = error instanceof Error ? error : new Error('Không thể kết nối máy chủ.');
      const mayUseMock = import.meta.env.DEV && import.meta.env.VITE_MS_AUTH_MODE !== 'real'
        && !receivedData && (!(err instanceof ApiError) || err.status === 0 || err.status === 404 || err.status >= 500);
      if (mayUseMock) {
        console.warn('[chatApi] Máy chủ chưa sẵn sàng, đang dùng câu trả lời mô phỏng.');
        await mockStreamResponse(payload.message, onChunk, onFinish, signal);
        return;
      }
      onError?.(err);
      throw err;
    }
  },
};

async function mockStreamResponse(
  userPrompt: string,
  onChunk: (chunk: ChatStreamChunk) => void,
  onFinish: (completeMessage: ChatMessage) => void,
  signal?: AbortSignal,
) {
  const needsSearch = /tìm|search|link|nguồn|internet|tra cứu/i.test(userPrompt);

  onChunk({ status: 'thinking' });
  await waitForMock(600, signal);

  if (needsSearch) {
    onChunk({ status: 'searching' });
    await waitForMock(800, signal);
  }

  onChunk({ status: 'generating' });
  await waitForMock(400, signal);

  const answerTemplate = `Chào bạn, mình là trợ lý ảo IT UPD GenAI của Trường Đại học Phương Đông.\n\nVề câu hỏi của bạn: "${userPrompt}":\n\n- Mình đã tiếp nhận và đang đồng bộ dữ liệu với máy chủ.\n- Bạn có thể đặt thêm câu hỏi về môn học, tài liệu hoặc thông tin đào tạo nhé!`;
  const words = answerTemplate.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    const word = (i === 0 ? '' : ' ') + words[i];
    accumulated += word;
    onChunk({ delta: word, status: 'generating' });
    await waitForMock(20, signal);
  }

  onFinish({
    id: crypto.randomUUID(),
    role: 'assistant',
    content: accumulated,
    sources: [],
    status: 'completed',
  });
}

function waitForMock(milliseconds: number, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancel);
      resolve();
    }, milliseconds);
    function cancel() {
      clearTimeout(timer);
      reject(signal?.reason);
    }
    signal?.addEventListener('abort', cancel, { once: true });
  });
}
