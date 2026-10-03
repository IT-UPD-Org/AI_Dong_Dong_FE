import { buildApiUrl, getStoredToken } from './client';
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
  const content = (item as any).content || '';
  const isComplete = (item as any).complete ?? true;
  const id: string = 'id' in item && item.id ? String(item.id) : crypto.randomUUID();

  return {
    id,
    role,
    content,
    status: role === 'assistant' ? (isComplete ? 'completed' : 'generating') : 'idle',
    toolCalls: (item as any).tool_calls,
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
    const token = getStoredToken();
    const url = buildApiUrl(`/chats/${conversationId}`);

    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch conversation ${conversationId}: ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn(`[chatApi] Không thể tải chi tiết cuộc trò chuyện ${conversationId}:`, err);
      return null;
    }
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
    onError?: (error: Error) => void
  ): Promise<void> {
    const token = getStoredToken();
    const modelType = payload.modelType || mapLevelToModelType(payload.modelLevel);
    const hasConversation = !!payload.conversationId;

    const endpoint = hasConversation
      ? `/chats/${payload.conversationId}/send`
      : '/chats/create';
    const url = buildApiUrl(endpoint);

    try {
      const response = await fetch(url, {
        method: 'POST',
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
        throw new Error(`Chat stream failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let currentEvent = '';
      let assistantMsgId: string = crypto.randomUUID();
      let conversationId = payload.conversationId;
      let conversationTitle = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            currentEvent = '';
            continue;
          }

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace('event:', '').trim();
            continue;
          }

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace('data:', '').trim();
            if (dataStr === '[DONE]') break;

            let parsed: any = null;
            try {
              parsed = JSON.parse(dataStr);
            } catch {
              parsed = dataStr;
            }

            // Xử lý các loại SSE event từ BE
            if (currentEvent === 'conversation_created' || (parsed && parsed.id && parsed.title)) {
              conversationId = String(parsed.id);
              conversationTitle = parsed.title || 'Cuộc trò chuyện mới';
              if (parsed.message_id) {
                assistantMsgId = String(parsed.message_id);
              }
              onChunk({
                conversationId,
                title: conversationTitle,
                status: 'generating',
              });
            } else if (currentEvent === 'user_message_id' || (parsed && parsed.id && !parsed.title && !parsed.root)) {
              // Message id từ user
              if (parsed.id) {
                // Keep track
              }
            } else if (currentEvent === 'content' || (parsed && (parsed.type === 'content' || parsed.root?.type === 'content'))) {
              const contentData = parsed.root || parsed;
              const delta = contentData.content || '';
              fullText += delta;
              if (contentData.message_id) {
                assistantMsgId = String(contentData.message_id);
              }
              onChunk({
                delta,
                status: 'generating',
                conversationId,
              });
            } else if (currentEvent === 'tool_calls' || (parsed && (parsed.type === 'tool_calls' || parsed.root?.type === 'tool_calls'))) {
              onChunk({
                status: 'searching',
                conversationId,
              });
            } else if (currentEvent === 'agent' || (parsed && (parsed.type === 'agent' || parsed.root?.type === 'agent'))) {
              const agentData = parsed.root || parsed;
              if (agentData.content) {
                // Agent message có thể mang toàn bộ content
                if (!fullText) {
                  fullText = agentData.content;
                }
              }
              if (agentData.id) {
                assistantMsgId = String(agentData.id);
              }
              if (agentData.complete) {
                onChunk({
                  status: 'completed',
                  conversationId,
                });
              }
            } else if (parsed && typeof parsed === 'object') {
              // Fallback parsed status/content
              if (parsed.status) {
                onChunk({ status: parsed.status, conversationId });
              }
              const delta = parsed.delta || parsed.content || '';
              if (delta) {
                fullText += delta;
                onChunk({ delta, status: 'generating', conversationId });
              }
            } else if (typeof parsed === 'string' && parsed) {
              fullText += parsed;
              onChunk({ delta: parsed, status: 'generating', conversationId });
            }
          }
        }
      }

      onFinish({
        id: assistantMsgId,
        role: 'assistant',
        content: fullText,
        sources: [],
        status: 'completed',
      });
    } catch (err: any) {
      console.warn('[chatApi] BE streaming chưa kết nối được hoặc trả về lỗi, kích hoạt Mock Stream fallback:', err.message);
      if (onError) {
        onError(err);
      }
      await mockStreamResponse(payload.message, onChunk, onFinish);
    }
  },
};

async function mockStreamResponse(
  userPrompt: string,
  onChunk: (chunk: ChatStreamChunk) => void,
  onFinish: (completeMessage: ChatMessage) => void
) {
  const needsSearch = /tìm|search|link|nguồn|internet|tra cứu/i.test(userPrompt);

  onChunk({ status: 'thinking' });
  await new Promise((r) => setTimeout(r, 600));

  if (needsSearch) {
    onChunk({ status: 'searching' });
    await new Promise((r) => setTimeout(r, 800));
  }

  onChunk({ status: 'generating' });
  await new Promise((r) => setTimeout(r, 400));

  const answerTemplate = `Chào bạn, mình là trợ lý ảo IT UPD GenAI của Trường Đại học Phương Đông.\n\nVề câu hỏi của bạn: "${userPrompt}":\n\n- Mình đã tiếp nhận và đang đồng bộ dữ liệu với máy chủ.\n- Bạn có thể đặt thêm câu hỏi về môn học, tài liệu hoặc thông tin đào tạo nhé!`;
  const words = answerTemplate.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    const word = (i === 0 ? '' : ' ') + words[i];
    accumulated += word;
    onChunk({ delta: word, status: 'generating' });
    await new Promise((r) => setTimeout(r, 20));
  }

  onFinish({
    id: crypto.randomUUID(),
    role: 'assistant',
    content: accumulated,
    sources: [],
    status: 'completed',
  });
}
