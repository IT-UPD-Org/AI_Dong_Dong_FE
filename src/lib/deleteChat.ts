import { chatApi } from "../api/chat.api";

/**
 * Ask for confirmation, then delete a conversation (its running reply is
 * stopped first by the backend). Returns true when it was deleted.
 * Other views refresh their lists through the `chats:updated` event.
 */
export async function confirmAndDeleteChat(id: string, title: string): Promise<boolean> {
  if (!window.confirm(`Xoá cuộc trò chuyện "${title}"? Hành động này không thể hoàn tác.`)) return false;
  await chatApi.deleteConversation(id);
  window.dispatchEvent(new CustomEvent("chats:updated"));
  return true;
}
