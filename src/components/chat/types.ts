export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  sources?: string[];
  attachments?: { name: string; size: string; type?: string }[];
}
