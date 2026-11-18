import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";

interface IssueImagePickerProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function IssueImagePicker({ file, onChange }: IssueImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError("Chỉ hỗ trợ ảnh PNG, JPG hoặc WebP.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Ảnh phải có dung lượng nhỏ hơn 5 MB.");
      return;
    }

    setError("");
    onChange(selectedFile);
  }

  function removeImage() {
    setError("");
    onChange(null);
  }

  function openImagePicker() {
    inputRef.current?.click();
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={selectImage}
        tabIndex={-1}
        className="hidden"
      />

      <div className="h-[108px] overflow-hidden rounded-xl border border-dashed border-border bg-field">
        {file && previewUrl ? (
          <div className="flex h-full items-center gap-3 p-2.5">
            <img
              src={previewUrl}
              alt="Ảnh lỗi đã chọn"
              className="size-[72px] shrink-0 rounded-lg border border-border-subtle object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {file.name}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
              <button
                type="button"
                onClick={openImagePicker}
                className="mt-2 inline-flex text-[11px] font-medium text-brand-text hover:underline"
              >
                Chọn ảnh khác
              </button>
            </div>
            <button
              type="button"
              onClick={removeImage}
              aria-label="Xóa ảnh lỗi đã chọn"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={openImagePicker}
            className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand-text"
          >
            <ImagePlus size={18} />
            Đính kèm ảnh lỗi
          </button>
        )}
      </div>

      <div className="mt-1.5 min-h-4 text-[10px]">
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : (
          <p className="text-muted-foreground">PNG, JPG hoặc WebP · Tối đa 5 MB</p>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
