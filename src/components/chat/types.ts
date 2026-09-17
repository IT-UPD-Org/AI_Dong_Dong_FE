export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  sources?: string[];
}
