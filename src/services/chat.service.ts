import { messages } from '../mocks/data';
import type { ChatMessage } from '../types';
export async function getConversationMessages(): Promise<ChatMessage[]> { return messages; }
export async function sendChatMessage(content: string): Promise<ChatMessage> { await new Promise((r) => setTimeout(r, 700)); return { id: crypto.randomUUID(), role: 'assistant', content: `I’ll look into that for you. Based on the Đông Đông knowledge base, here is a starting point for “${content}”.`, sources: ['University Knowledge Base'] }; }
