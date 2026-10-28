import type { BEToolCall, ChatMessage } from "../api/types";

/** One step of an assistant reply: what it said, then the tools it called. */
export interface ReplyStep {
  id: string;
  content: string;
  toolCalls: BEToolCall[];
}

/**
 * What the chat renders: a user/system message as is, or one assistant reply
 * built from the consecutive assistant messages the agent wrote while it
 * called tools (each tool round is saved as its own message).
 */
export type ChatItem =
  | { kind: "message"; message: ChatMessage; index: number }
  | {
      kind: "reply";
      /** The last message of the reply: its id, status and actions stand for the whole reply. */
      message: ChatMessage;
      /** Index of the last message in `msgs`, used for regenerate. */
      index: number;
      /** Index of the first message, so regenerate replaces the whole reply. */
      firstIndex: number;
      steps: ReplyStep[];
    };

export function groupMessages(msgs: ChatMessage[]): ChatItem[] {
  const items: ChatItem[] = [];
  msgs.forEach((message, index) => {
    if (message.role !== "assistant") {
      items.push({ kind: "message", message, index });
      return;
    }
    // A live reply carries its own steps; a saved one is one step per message.
    const own: ReplyStep[] = message.steps ?? [{ id: message.id, content: message.content, toolCalls: message.toolCalls ?? [] }];
    const last = items[items.length - 1];
    if (last?.kind === "reply" && !last.message.hidden && !message.hidden) {
      last.steps.push(...own);
      last.message = message;
      last.index = index;
      return;
    }
    items.push({ kind: "reply", message, index, firstIndex: index, steps: [...own] });
  });
  return items;
}

/** The reply's text as one document, for copying. */
export function replyText(steps: ReplyStep[]): string {
  return steps
    .map((step) => step.content.trim())
    .filter(Boolean)
    .join("\n\n");
}
