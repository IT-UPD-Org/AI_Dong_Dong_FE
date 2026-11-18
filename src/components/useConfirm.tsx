import { useRef, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

/**
 * Promise-based replacement for window.confirm, shown as an in-page popup.
 *
 *   const { confirm, dialog } = useConfirm();
 *   if (!(await confirm({ title: "Xoá?", destructive: true }))) return;
 *   ...
 *   return <>{...}{dialog}</>;
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const settle = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  };

  const confirm = (next: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      resolver.current?.(false);
      resolver.current = resolve;
      setOptions(next);
    });

  const dialog = (
    <ConfirmDialog
      open={options !== null}
      title={options?.title ?? ""}
      description={options?.description}
      confirmLabel={options?.confirmLabel}
      destructive={options?.destructive}
      onConfirm={() => settle(true)}
      onOpenChange={(open) => !open && settle(false)}
    />
  );

  return { confirm, dialog };
}
