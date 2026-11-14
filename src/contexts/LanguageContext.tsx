import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Language = "vi" | "en";

export interface Translations {
  [key: string]: string;
}

const translations: Record<Language, Translations> = {
  vi: {
    // Nav & Shell
    appName: "IT UPD GenAI",
    navChat: "Trò chuyện",
    navHistory: "Lịch sử",
    navKnowledge: "Kho tri thức",
    navDocuments: "Tài liệu",
    navContributors: "Người đóng góp",
    navAdmin: "Quản trị",
    navCareerUniverse: "Cây Nghề Nghiệp",
    navMore: "Thêm...",
    newChat: "Cuộc trò chuyện mới",
    recent: "Gần đây",
    noRecentChats: "Chưa có cuộc trò chuyện",
    searchHistoryPlaceholder: "Tìm kiếm lịch sử trò chuyện...",
    noSearchResults: "Không tìm thấy cuộc trò chuyện nào phù hợp",
    profile: "Hồ sơ cá nhân",
    settings: "Cài đặt",
    logout: "Đăng xuất",
    roleStudent: "Sinh viên",
    roleTeacher: "Giảng viên",
    roleAdmin: "Quản trị viên",
    deleteChatTitle: "Xoá cuộc trò chuyện",
    deleteChatConfirm:
      "Bạn có chắc chắn muốn xoá cuộc trò chuyện này không? Hành động này không thể hoàn tác.",
    delete: "Xoá",
    cancel: "Hủy",
    save: "Lưu",
    close: "Đóng",

    // Chat Page & Empty state
    askAnythingTitle: "Hãy hỏi bất cứ điều gì",
    askAnythingSubtitle:
      "Khám phá tri thức, giải đáp câu hỏi và hỗ trợ học tập thông minh cùng IT UPD GenAI.",
    inputPlaceholder: "Hãy hỏi bất cứ điều gì...",
    loadingConversation: "Đang tải cuộc trò chuyện...",
    loadError: "Không thể tải cuộc trò chuyện. Vui lòng thử lại.",
    replyRunningElsewhere:
      "Một câu trả lời khác đang chạy. Tin nhắn của bạn chưa được gửi.",
    followReply: "Theo dõi câu trả lời",
    stopReply: "Dừng trả lời",
    copySuccess: "Đã sao chép vào bộ nhớ tạm",
    copyError: "Không thể sao chép vào bộ nhớ tạm",
    editMessage: "Chỉnh sửa tin nhắn",
    saveAndResend: "Lưu & Gửi lại",
    uploadDoc: "Tải lên tài liệu",
    suggestDocs: "Gợi ý tài liệu",
    processingDocs: "Đang xử lý tài liệu, vui lòng đợi trước khi gửi.",
    docFailed:
      "Tài liệu xử lý không thành công. Hãy xóa tài liệu lỗi và thử tải lại.",
    voiceInput: "Nói để nhập",
    voiceStop: "Dừng ghi âm",
    voiceUnsupported: "Trình duyệt không hỗ trợ giọng nói",
    send: "Gửi",
    disclaimer:
      "IT UPD GenAI có thể đưa ra câu trả lời chưa chính xác. Hãy kiểm tra lại thông tin quan trọng.",
    attachedDoc: "Tài liệu đính kèm",
    sourceDoc: "Tài liệu nguồn",
    removeAttachment: "Xóa tài liệu đính kèm",
    regenerate: "Tạo lại câu trả lời",
    like: "Hài lòng",
    dislike: "Chưa hài lòng",
    report: "Báo cáo vấn đề",
    hiddenViolationNotice:
      "Câu trả lời này đã bị ẩn vì vi phạm quy định sử dụng.",

    // Effort Modal
    effortTitle: "Cấu hình Agent Effort",
    effortSubtitle: "Điều chỉnh mức độ suy luận và mô hình xử lý",
    effortInstant: "Instant (Nhanh)",
    effortInstantDesc: "Trả lời nhanh, súc tích",
    effortStandard: "Standard (Tiêu chuẩn)",
    effortStandardDesc: "Cân bằng tốc độ và chi tiết",
    effortDetail: "Detail (Chuyên sâu)",
    effortDetailDesc: "Phân tích sâu, đầy đủ với suy luận nâng cao",
    subAgentsLabel: "Sub-agents:",
    managerModelLabel: "Mô hình quản lý:",
    tokenMultiplierLabel: "Mức tiêu thụ:",

    // Settings Page
    preferences: "Cấu hình",
    settingsTitle: "Cài đặt",
    interfaceLanguage: "Ngôn ngữ giao diện",
    interfaceLanguageDesc: "Chọn ngôn ngữ hiển thị trên toàn bộ hệ thống.",
    vietnamese: "Tiếng Việt",
    english: "English",
    themeMode: "Giao diện",
    themeModeDesc: "Chọn chế độ màu sắc sáng hoặc tối.",
    themeLight: "Sáng",
    themeDark: "Tối",
    themeSystem: "Theo hệ thống",
    citations: "Trích dẫn nguồn",
    citationsDesc: "Hiển thị nguồn tham khảo bên dưới câu trả lời.",

    // Public Layout
    home: "Trang chủ",
    donate: "Đóng góp",
    approveAccount: "Cấp phép tài khoản",
    enterChat: "Vào phòng chat",
    login: "Đăng nhập",
    openMenu: "Mở menu",
    closeMenu: "Đóng menu",
  },
  en: {
    // Nav & Shell
    appName: "IT UPD GenAI",
    navChat: "Chat",
    navHistory: "History",
    navKnowledge: "Knowledge Base",
    navDocuments: "Documents",
    navContributors: "Contributors",
    navAdmin: "Admin",
    navCareerUniverse: "Career Tree",
    navMore: "More...",
    newChat: "New Chat",
    recent: "Recent",
    noRecentChats: "No recent chats",
    searchHistoryPlaceholder: "Search chat history...",
    noSearchResults: "No matching conversations found",
    profile: "Profile",
    settings: "Settings",
    logout: "Log out",
    roleStudent: "Student",
    roleTeacher: "Lecturer",
    roleAdmin: "Administrator",
    deleteChatTitle: "Delete Chat",
    deleteChatConfirm:
      "Are you sure you want to delete this conversation? This action cannot be undone.",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save",
    close: "Close",

    // Chat Page & Empty state
    askAnythingTitle: "Ask anything",
    askAnythingSubtitle:
      "Explore knowledge, get answers, and receive smart academic guidance with IT UPD GenAI.",
    inputPlaceholder: "Ask anything...",
    loadingConversation: "Loading conversation...",
    loadError: "Failed to load conversation. Please try again.",
    replyRunningElsewhere:
      "Another reply is in progress. Your message has not been sent.",
    followReply: "Follow reply",
    stopReply: "Stop generating",
    copySuccess: "Copied to clipboard",
    copyError: "Failed to copy to clipboard",
    editMessage: "Edit message",
    saveAndResend: "Save & Resend",
    uploadDoc: "Upload documents",
    suggestDocs: "Suggested documents",
    processingDocs: "Processing documents, please wait before sending.",
    docFailed: "Document processing failed. Please remove and re-upload.",
    voiceInput: "Voice input",
    voiceStop: "Stop recording",
    voiceUnsupported: "Browser does not support voice input",
    send: "Send",
    disclaimer:
      "IT UPD GenAI may provide inaccurate responses. Always verify important details.",
    attachedDoc: "Attached document",
    sourceDoc: "Source document",
    removeAttachment: "Remove attached file",
    regenerate: "Regenerate response",
    like: "Good response",
    dislike: "Bad response",
    report: "Report an issue",
    hiddenViolationNotice: "This response was hidden due to policy violation.",

    // Effort Modal
    effortTitle: "Configure Agent Effort",
    effortSubtitle: "Adjust reasoning depth and underlying models",
    effortInstant: "Instant",
    effortInstantDesc: "Fast and concise responses",
    effortStandard: "Standard",
    effortStandardDesc: "Balanced speed and detail",
    effortDetail: "Detail",
    effortDetailDesc: "In-depth analysis with advanced reasoning",
    subAgentsLabel: "Sub-agents:",
    managerModelLabel: "Manager Model:",
    tokenMultiplierLabel: "Token rate:",

    // Settings Page
    preferences: "Preferences",
    settingsTitle: "Settings",
    interfaceLanguage: "Interface Language",
    interfaceLanguageDesc: "Choose system-wide display language.",
    vietnamese: "Tiếng Việt",
    english: "English",
    themeMode: "Appearance",
    themeModeDesc: "Choose light or dark theme mode.",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System default",
    citations: "Source citations",
    citationsDesc: "Show reference citations under answers.",

    // Public Layout
    home: "Home",
    donate: "Contribute",
    approveAccount: "Account Approval",
    enterChat: "Go to Chat",
    login: "Sign in",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
};

interface LanguageContextType {
  language: Language;
  lang: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const LANGUAGE_STORAGE_KEY = "app_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === "vi" || saved === "en") return saved;
      return "vi";
    } catch {
      return "vi";
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "vi" ? "en" : "vi");
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    const text = translations[language]?.[key] ?? translations.vi[key];
    if (text !== undefined) return text;
    return fallback ?? key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, lang: language, setLanguage, toggleLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

const defaultLanguageContext: LanguageContextType = {
  language: "vi",
  lang: "vi",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, fallback?: string) =>
    translations.vi[key] ?? fallback ?? key,
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context ?? defaultLanguageContext;
}
