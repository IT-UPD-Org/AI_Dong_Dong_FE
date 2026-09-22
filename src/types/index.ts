// Tái xuất các kiểu từ api/types.ts để đảm bảo tương thích ngược với các file dùng '../types'
export type { MessageRole, ChatMessage } from '../api/types';

// Các kiểu dùng riêng trong mocks/data.ts — không trùng với api/types.ts
export interface Conversation {
  id: string;
  title: string;
  date: string;
}

export interface Contributor {
  id: string;
  name: string;
  role: string;
  contribution: string;
  team: string;
  initials: string;
  color: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  status: 'Ready' | 'Processing' | 'Needs review';
  progress: number;
  updated: string;
  size: string;
}
