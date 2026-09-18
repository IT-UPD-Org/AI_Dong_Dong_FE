import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  AgentLevel,
  AGENT_LEVEL_CONFIGS,
  AgentEffortModal,
} from "./AgentEffortModal";

interface ModifiedPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: FormEvent) => void;
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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      onSubmit();
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
        onSubmit={onSubmit}
        className="shrink-0 border-t border-black/10 bg-white px-3 py-2"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col">
          {/* Ô nhập — chứa nút Effort, Mic, Textarea, Send */}
          <div className="flex items-end gap-1.5 rounded-2xl border border-black/10 bg-white p-1.5 shadow-sm">
            {/* Nút Effort lồng trong Input Bar */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              title={`Cấu hình Effort (${currentConfig.label})`}
              className="flex h-8 shrink-0 items-center gap-1 rounded-xl bg-black/5 px-2.5 text-xs font-semibold text-[#04714a] transition-colors hover:bg-black/10"
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
              className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30 ${
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
              disabled={loading || !value.trim()}
              title="Gửi"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#04714a] text-white transition-opacity disabled:opacity-30"
            >
              <SendIcon />
            </button>
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
