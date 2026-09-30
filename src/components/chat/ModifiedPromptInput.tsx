import { FormEvent, KeyboardEvent, useEffect, useRef, useState, ChangeEvent } from "react";
import { Plus, Paperclip, FileText, X } from "lucide-react";
import {
  AgentLevel,
  AGENT_LEVEL_CONFIGS,
  AgentEffortModal,
} from "./AgentEffortModal";

interface ModifiedPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: FormEvent, files?: File[]) => void;
  loading?: boolean;
  level: AgentLevel;
  onLevelChange: (level: AgentLevel) => void;
  placeholder?: string;
  onVoiceResult?: (text: string) => void;
}

function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
      }
    };
  }, [onResult]);

  function toggle() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  return { listening, supported, toggle };
}

export function ModifiedPromptInput({
  value,
  onChange,
  onSubmit,
  loading = false,
  level,
  onLevelChange,
  placeholder = "Hãy hỏi bất cứ điều gì...",
  onVoiceResult,
}: ModifiedPromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        plusButtonRef.current &&
        !plusButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleFormSubmit(e?: FormEvent) {
    e?.preventDefault();
    if ((!value.trim() && files.length === 0) || loading) return;
    const currentFiles = [...files];
    setFiles([]);
    onSubmit(e, currentFiles);
  }

  function appendVoiceText(text: string) {
    if (!text.trim()) return;
    onChange(value ? `${value} ${text}` : text);
  }

  const { listening, supported, toggle } = useVoiceInput(
    onVoiceResult ?? appendVoiceText,
  );

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit();
    }
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const currentConfig = AGENT_LEVEL_CONFIGS[level];

  return (
    <>
      <form
        onSubmit={handleFormSubmit}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) {
            setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
          }
        }}
        className="shrink-0 border-t border-black/10 bg-white px-3 py-2"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col">
          {/* Ô nhập — chứa chip tệp đính kèm, nút +, Effort, Mic, Textarea, Send */}
          <div className="relative flex flex-col gap-1.5 rounded-2xl border border-black/10 bg-white p-1.5 shadow-sm transition-all focus-within:border-[#04714a]/40 focus-within:shadow-[0_0_0_2px_rgba(4,113,74,0.06)]">
            {/* Popup Menu đồng bộ phong cách trang web IT UPD */}
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute bottom-full left-0 mb-3 z-50 w-48 rounded-2xl bg-white text-[#11130f] p-1.5 shadow-[0_12px_36px_rgba(0,40,25,0.12)] border border-black/10 animate-in fade-in-0 zoom-in-95 duration-150 select-none"
              >
                {/* Tải tệp lên */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#11130f] hover:bg-[#e8f7ef] hover:text-[#04714a] transition-colors cursor-pointer text-left"
                >
                  <Paperclip size={16} className="text-[#04714a] shrink-0 transition-transform group-hover:scale-110" />
                  <span>Tải tệp lên</span>
                </button>
              </div>
            )}

            {/* Danh sách tệp đính kèm */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-2 pt-1 pb-1">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-[#f8faf9] px-2.5 py-1 text-xs text-[#11130f] transition-all"
                  >
                    <FileText size={13} className="shrink-0 text-[#04714a]" />
                    <span className="max-w-[140px] truncate font-medium">{file.name}</span>
                    <span className="text-[10px] text-black/40 font-mono">
                      ({formatFileSize(file.size)})
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      title="Gỡ tệp"
                      className="cursor-pointer rounded-full p-0.5 text-black/40 transition-colors hover:bg-black/10 hover:text-black/80"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-1.5 w-full">
              {/* Nút Dấu cộng (+) mở menu lựa chọn — nằm bên trái nút Standard */}
              <button
                ref={plusButtonRef}
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                disabled={loading}
                title={isMenuOpen ? "Đóng menu" : "Thêm tệp hoặc công cụ"}
                className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 cursor-pointer disabled:opacity-30 ${
                  isMenuOpen
                    ? "bg-[#e8f7ef] text-[#04714a] rotate-45"
                    : "text-black/50 hover:bg-[#e8f7ef] hover:text-[#04714a]"
                }`}
              >
                <Plus size={18} strokeWidth={2.2} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
                className="hidden"
              />

              {/* Nút Effort lồng trong Input Bar */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                title={`Cấu hình Effort (${currentConfig.label})`}
                className="flex h-8 shrink-0 items-center gap-1 rounded-xl bg-black/5 px-2.5 text-xs font-semibold text-[#04714a] transition-colors hover:bg-black/10 cursor-pointer"
              >
                <SlidersIcon />
                <span>{currentConfig.label}</span>
              </button>

              {/* Nút Giọng nói */}
              <button
                type="button"
                onClick={toggle}
                disabled={!supported || loading}
                title={
                  supported
                    ? listening
                      ? "Dừng ghi âm"
                      : "Nói để nhập"
                    : "Trình duyệt không hỗ trợ giọng nói"
                }
                className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30 cursor-pointer ${
                  listening
                    ? "bg-red-500 text-white"
                    : "text-black/40 hover:bg-black/5 hover:text-black/70"
                }`}
              >
                <MicIcon />
              </button>

              {/* Input Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="max-h-[120px] flex-1 resize-none bg-transparent py-1.5 text-sm text-[#11130f] outline-none placeholder:text-black/35"
              />

              {/* Nút Gửi */}
              <button
                type="submit"
                disabled={loading || (!value.trim() && files.length === 0)}
                title="Gửi"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#04714a] text-white transition-opacity disabled:opacity-30 cursor-pointer"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal giữ nguyên */}
      <AgentEffortModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        level={level}
        onLevelChange={onLevelChange}
      />
    </>
  );
}

function SlidersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}
export type { AgentLevel };
