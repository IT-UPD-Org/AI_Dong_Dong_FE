import { useEffect, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";

interface IssueImagePickerProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function IssueImagePicker({ file, onChange }: IssueImagePickerProps) {
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

  return (
    <div>
      <div className="h-[108px] overflow-hidden rounded-xl border border-dashed border-black/15 bg-white">
        {file && previewUrl ? (
          <div className="flex h-full items-center gap-3 p-2.5">
            <img
              src={previewUrl}
              alt="Ảnh lỗi đã chọn"
              className="size-[72px] shrink-0 rounded-lg border border-black/5 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[#172b21]">
                {file.name}
              </p>
              <p className="mt-1 text-[10px] text-black/40">
                {formatFileSize(file.size)}
              </p>
              <label className="mt-2 inline-flex cursor-pointer text-[11px] font-medium text-[#04714a] hover:underline">
                Chọn ảnh khác
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={selectImage}
                  className="sr-only"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={removeImage}
              aria-label="Xóa ảnh lỗi đã chọn"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-black/35 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 px-4 text-xs font-medium text-black/45 transition-colors hover:bg-[#f2f8f5] hover:text-[#04714a]">
            <ImagePlus size={18} />
            Đính kèm ảnh lỗi
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={selectImage}
              className="sr-only"
            />
          </label>
        )}
      </div>

      <div className="mt-1.5 min-h-4 text-[10px]">
        {error ? (
          <p role="alert" className="text-red-500">
            {error}
          </p>
        ) : (
          <p className="text-black/35">PNG, JPG hoặc WebP · Tối đa 5 MB</p>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
