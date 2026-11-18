import { useState } from "react";
import { toast } from "sonner";
import { chatApi } from "../api/chat.api";
import { ConfirmDialog } from "../components/ConfirmDialog";

interface PendingDelete {
  id: string;
  title: string;
}

/**
 * Delete a conversation after the user confirms in an in-page popup.
 *
 * Returns `requestDelete(id, title)` to open the popup and the `dialog` to
 * render. On success other views refresh via the `chats:updated` event and
 * `onDeleted` runs; failures are shown as a toast.
 */
export function useDeleteChat(onDeleted?: (id: string) => void) {
  const [pending, setPending] = useState<PendingDelete | null>(null);

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      title="Xoá cuộc trò chuyện?"
      description={pending ? `"${pending.title}" sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác.` : undefined}
      confirmLabel="Xoá"
      destructive
      onOpenChange={(open) => !open && setPending(null)}
      onConfirm={async () => {
        if (!pending) return;
        try {
          await chatApi.deleteConversation(pending.id);
        } catch {
          toast.error("Không thể xoá cuộc trò chuyện. Vui lòng thử lại.");
          return;
        }
        window.dispatchEvent(new CustomEvent("chats:updated"));
        onDeleted?.(pending.id);
      }}
    />
  );

  return {
    requestDelete: (id: string, title: string) => setPending({ id, title }),
    dialog,
  };
}
