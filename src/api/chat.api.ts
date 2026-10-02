import { getStoredToken } from './client';
import type { ChatMessage, SendMessagePayload, ChatStreamChunk } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const chatApi = {
  async streamMessage(
    payload: SendMessagePayload,
    onChunk: (chunk: ChatStreamChunk) => void,
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
      let currentStatus: any = 'generating';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.status) {
                currentStatus = parsed.status;
                onChunk({ status: parsed.status });
              } else {
                const textDelta = parsed.delta || parsed.content || '';
                fullText += textDelta;
                onChunk({ delta: textDelta, status: currentStatus });
              }
            } catch {
              fullText += dataStr;
              onChunk({ delta: dataStr, status: currentStatus });
            }
          } else if (line.trim()) {
            fullText += line;
            onChunk({ delta: line, status: currentStatus });
          }
        }
      }

      onFinish({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullText,
        sources: [],
        status: 'completed',
      });
    } catch (err: any) {
      console.warn('[chatApi] BE streaming chưa sẵn sàng, kích hoạt Mock Stream fallback:', err.message);
      await mockStreamResponse(payload.message, onChunk, onFinish);
    }
  },
};

async function mockStreamResponse(
  userPrompt: string,
  onChunk: (chunk: ChatStreamChunk) => void,
  onFinish: (completeMessage: ChatMessage) => void
) {
  // Simulate thinking -> searching (optional) -> generating -> token stream
  const needsSearch = /tìm|search|link|nguồn|internet|tra cứu/i.test(userPrompt);

  onChunk({ status: 'thinking' });
  await new Promise((r) => setTimeout(r, 1000));

  if (needsSearch) {
    onChunk({ status: 'searching' });
    await new Promise((r) => setTimeout(r, 1500));
  }

  onChunk({ status: 'generating' });
  await new Promise((r) => setTimeout(r, 800));

  const answerTemplate = `Chào bạn, mình là IT UPD GenAI. Về yêu cầu của bạn: "${userPrompt}":\n\n1. Mình đã tiếp nhận thông tin và xử lý.\n2. Cần thêm chi tiết, bạn cứ hỏi nhé.`;
  const words = answerTemplate.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    const word = (i === 0 ? '' : ' ') + words[i];
    accumulated += word;
    onChunk({ delta: word, status: 'generating' });
    await new Promise((r) => setTimeout(r, 30));
  }

  onFinish({
    id: crypto.randomUUID(),
    role: 'assistant',
    content: accumulated,
    sources: [],
    status: 'completed'
  });
}
