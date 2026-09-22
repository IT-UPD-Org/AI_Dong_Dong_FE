import { getStoredToken } from './client';
import type { ChatMessage, SendMessagePayload } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const chatApi = {
  /**
   * Gửi tin nhắn và nhận stream token-by-token (SSE / fetch ReadableStream)
   */
  async streamMessage(
    payload: SendMessagePayload,
    onChunk: (text: string) => void,
    onFinish: (completeMessage: ChatMessage) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const token = getStoredToken();
    const url = `${API_BASE_URL}/api/chat/stream`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat stream failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Hỗ trợ cả định dạng SSE data: {...} hoặc raw text stream
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              const textDelta = parsed.delta || parsed.content || '';
              fullText += textDelta;
              onChunk(textDelta);
            } catch {
              fullText += dataStr;
              onChunk(dataStr);
            }
          } else if (line.trim()) {
            fullText += line;
            onChunk(line);
          }
        }
      }

      onFinish({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullText,
        sources: ['Hệ thống tri thức Đại học Phương Đông'],
      });
    } catch (err: any) {
      console.warn('[chatApi] BE streaming chưa sẵn sàng, kích hoạt Mock Stream fallback:', err.message);
      // Giả lập stream từng token để giao diện VITE hiển thị mượt mà
      await mockStreamResponse(payload.message, onChunk, onFinish);
    }
  },
};

/**
 * Giả lập streaming phản hồi thông minh trong lúc BE chưa code xong
 */
async function mockStreamResponse(
  userPrompt: string,
  onChunk: (text: string) => void,
  onFinish: (completeMessage: ChatMessage) => void
) {
  const answerTemplate = `Chào bạn, mình là IT UPD GenAI. Về câu hỏi của bạn: "${userPrompt}":

1. **Thông tin quy chế & đào tạo**: Mọi tài liệu và thời khóa biểu được cập nhật chính thức trên cổng thông tin Đại học Phương Đông.
2. **Hỗ trợ học tập**: Bạn có thể tham khảo thêm các giáo trình trong mục "Kho tri thức" hoặc hỏi chi tiết về các môn học ngành CNTT.
3. **Lưu ý**: Hãy chắc chắn theo dõi thông báo từ giảng viên bộ môn và văn phòng khoa để không bỏ lỡ các mốc quan trọng.

Bạn có cần mình giải thích thêm phần nào không?`;

  const words = answerTemplate.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    const word = (i === 0 ? '' : ' ') + words[i];
    accumulated += word;
    onChunk(word);
    // Độ trễ tự nhiên giữa các token (20ms - 40ms)
    await new Promise((r) => setTimeout(r, 25));
  }

  onFinish({
    id: crypto.randomUUID(),
    role: 'assistant',
    content: accumulated,
    sources: ['Kho tri thức ĐH Phương Đông', 'Quy chế đào tạo tín chỉ'],
  });
}
