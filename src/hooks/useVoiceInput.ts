import { useEffect, useRef, useState } from "react";

interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognizer {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognizer;
  webkitSpeechRecognition?: new () => SpeechRecognizer;
};

export function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognizer | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setSupported(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(
        event.results,
        (result) => result[0]?.transcript ?? "",
      ).join(" ");
      onResultRef.current(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError("Không thể ghi âm. Hãy kiểm tra quyền micro hoặc nhập câu hỏi bằng bàn phím.");
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      try { recognition.stop(); } catch { /* Already stopped. */ }
      recognitionRef.current = null;
    };
  }, []);

  function toggle() {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    setError("");
    try {
      if (listening) {
        recognition.stop();
        setListening(false);
      } else {
        recognition.start();
        setListening(true);
      }
    } catch {
      setListening(false);
      setError("Không thể bắt đầu ghi âm. Vui lòng thử lại hoặc nhập câu hỏi bằng bàn phím.");
    }
  }

  return { listening, supported, toggle, error };
}
