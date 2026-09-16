export type MessageRole = 'user' | 'assistant';
export interface ChatMessage { id: string; role: MessageRole; content: string; sources?: string[]; }
export interface Conversation { id: string; title: string; date: string; }
export interface Contributor { id: string; name: string; role: string; contribution: string; team: string; initials: string; color: string; }
export interface DocumentItem { id: string; name: string; type: string; status: 'Ready' | 'Processing' | 'Needs review'; progress: number; updated: string; size: string; }
