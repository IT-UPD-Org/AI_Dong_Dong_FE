import { messages } from "../mocks/data";
import type { ChatMessage } from "../types";
export async function getConversationMessages(): Promise<ChatMessage[]> {
  return messages;
}
export async function sendChatMessage(content: string): Promise<ChatMessage> {
  await new Promise((r) => setTimeout(r, 700));
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: `Dựa trên kết quả tìm kiếm cho “${content}”. Tôi đã tìm thấy một số thông tin có thể giúp bạn. Hãy xem xét các nguồn dưới đây để biết thêm chi tiết.`,
    sources: ["University Knowledge Base"],
  };
}
