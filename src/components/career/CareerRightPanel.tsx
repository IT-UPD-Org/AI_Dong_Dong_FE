import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  Search,
  X,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import {
  CAREER_UNIVERSE_CATALOG,
  FACULTIES_DATA,
} from "../../data/careerUniverseData";
import { SelectedCareerState } from "../../types/careerUniverse";
import { StudentAcademicRecord } from "../../services/careerScoring.service";
import { documentApi, STORAGE_QUOTA_BYTES } from "../../api/document.api";
import type { Document } from "../../api/types";
import { fetchFileArrayBuffer } from "../../lib/filePreviewUtils";
import { CareerCustomSelect } from "./CareerCustomSelect";
import { useLanguage } from "../../contexts/LanguageContext";

interface CareerRightPanelProps {
  isOpen: boolean;
  isDesktop?: boolean;
  onToggleOpen: () => void;
  onClose?: () => void;
  selectedState: SelectedCareerState;
  onSelectDomain: (domainId: string) => void;
  onSelectOccupation: (occupationId: string | null) => void;
  onSelectSpecialization: (specializationId: string | null) => void;
  onSelectFaculty?: (facultyId: string) => void;
  onSelectMajor?: (majorId: string) => void;
  onUpdateStudentRecord?: (record: StudentAcademicRecord) => void;
}

const SUPPORTED_EXTENSIONS = ["pdf", "docx", "xlsx", "xls", "jpg", "jpeg", "png"];
const MAX_FILE_SIZE = STORAGE_QUOTA_BYTES; // 236 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(filename: string, fileType?: Document["file_type"]) {
  if (fileType === "image") {
    return <ImageIcon className="size-5 text-blue-600 dark:text-blue-400" />;
  }
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "xlsx" || ext === "xls" || ext === "csv") {
    return <FileSpreadsheet className="size-5 text-emerald-600 dark:text-emerald-400" />;
  }
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp" || ext === "gif") {
    return <ImageIcon className="size-5 text-blue-600 dark:text-blue-400" />;
  }
  return <FileText className="size-5 text-brand-text" />;
}

function getFileExtensionBadge(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return (parts.pop() || "").toUpperCase().slice(0, 6);
}

export function CareerRightPanel({
  isOpen,
  isDesktop = true,
  onToggleOpen,
  onClose,
  selectedState,
  onSelectDomain,
  onSelectOccupation,
  onSelectSpecialization,
  onSelectFaculty,
  onSelectMajor,
  onUpdateStudentRecord,
}: CareerRightPanelProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();

  const handleCloseDrawer = useCallback(() => {
    if (onClose) onClose();
    else if (isOpen) onToggleOpen();
  }, [onClose, isOpen, onToggleOpen]);

  // Close mobile/tablet slide-over drawer with Escape key
  useEffect(() => {
    if (isDesktop || !isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseDrawer();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDesktop, isOpen, handleCloseDrawer]);

  // Faculty & Major state (Default: cns-tt, cntt)
  const [localFacultyId, setLocalFacultyId] = useState("cns-tt");
  const [localMajorId, setLocalMajorId] = useState("cntt");
  const currentFacultyId = selectedState.facultyId ?? localFacultyId;
  const currentMajorId = selectedState.majorId ?? localMajorId;

  const currentFaculty =
    FACULTIES_DATA.find((f) => f.id === currentFacultyId) || FACULTIES_DATA[0];
  const currentMajors = currentFaculty?.majors || [];
  const currentMajor =
    currentMajors.find((m) => m.id === currentMajorId) || currentMajors[0];

  const handleFacultyChange = (newFacultyId: string) => {
    setLocalFacultyId(newFacultyId);
    onSelectFaculty?.(newFacultyId);

    const faculty = FACULTIES_DATA.find((f) => f.id === newFacultyId);
    const availableMajor =
      faculty?.majors.find((m) => m.isAvailable) || faculty?.majors[0];
    if (availableMajor) {
      setLocalMajorId(availableMajor.id);
      onSelectMajor?.(availableMajor.id);
    }
  };

  const handleMajorChange = (newMajorId: string) => {
    setLocalMajorId(newMajorId);
    onSelectMajor?.(newMajorId);
  };

  // File Upload & Existing Document States
  const [fileTab, setFileTab] = useState<"upload" | "existing">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedExistingDoc, setSelectedExistingDoc] = useState<Document | null>(null);
  const [existingDocs, setExistingDocs] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [hasLoadedDocs, setHasLoadedDocs] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [isParsingExistingDoc, setIsParsingExistingDoc] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const parseRequestIdRef = useRef(0);

  // Drag-and-drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const loadExistingDocs = useCallback(async () => {
    setIsLoadingDocs(true);
    setDocsError(null);
    try {
      const docs = await documentApi.listDocuments(1, 100);
      setExistingDocs(docs);
      setHasLoadedDocs(true);
    } catch (err: unknown) {
      setExistingDocs([]);
      setDocsError(
        err instanceof Error && err.message
          ? err.message
          : language === "vi"
            ? "Không thể tải danh sách tài liệu."
            : "Failed to load documents."
      );
    } finally {
      setIsLoadingDocs(false);
    }
  }, [language]);

  // Load existing documents when switching to the 'existing' tab
  useEffect(() => {
    if (fileTab === "existing" && !hasLoadedDocs) {
      void loadExistingDocs();
    }
  }, [fileTab, hasLoadedDocs, loadExistingDocs]);

  const filteredExistingDocs = useMemo(() => {
    const q = docSearchQuery.trim().toLowerCase();
    if (!q) return existingDocs;
    return existingDocs.filter((doc) => {
      const title = (doc.title || "").toLowerCase();
      const filename = (doc.filename || "").toLowerCase();
      return title.includes(q) || filename.includes(q);
    });
  }, [existingDocs, docSearchQuery]);

  const extractCourseCodesFromArrayBuffer = (buffer: ArrayBuffer): string[] => {
    try {
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 }) as string[][];
      const codes = new Set<string>();
      for (const row of json) {
        for (const cell of row) {
          if (cell !== null && cell !== undefined) {
            const text = String(cell);
            const matches = text.match(/\bIT\d{3}\b/gi);
            if (matches) {
              matches.forEach((m) => codes.add(m.toUpperCase()));
            }
          }
        }
      }
      return Array.from(codes);
    } catch {
      return [];
    }
  };

  const parseExcelCourseCodes = async (file: File): Promise<string[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as ArrayBuffer;
        if (data) {
          resolve(extractCourseCodesFromArrayBuffer(data));
        } else {
          resolve([]);
        }
      };
      reader.onerror = () => resolve([]);
      reader.readAsArrayBuffer(file);
    });
  };

  const validateAndSetFile = (file: File) => {
    setFileError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setFileError(
        language === "vi"
          ? `Định dạng file .${ext} không được hỗ trợ. Vui lòng chọn PDF, DOCX, XLSX, XLS, JPG hoặc PNG.`
          : `File format .${ext} is not supported. Please select PDF, DOCX, XLSX, XLS, JPG, or PNG.`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        language === "vi"
          ? "Kích thước file vượt quá giới hạn 236 MB."
          : "File size exceeds the 236 MB limit."
      );
      return;
    }

    parseRequestIdRef.current += 1;
    setIsParsingExistingDoc(false);
    setSelectedFile(file);
    setSelectedExistingDoc(null);
    setUploadedDocId(null);

    // If Excel, immediately parse and update career tree scores
    if (ext === "xlsx" || ext === "xls") {
      parseExcelCourseCodes(file).then((codes) => {
        if (codes.length > 0) {
          const record: StudentAcademicRecord = {
            totalCompletedCourses: codes.length,
            completedCourseCodes: codes,
            gpa: null,
            transcriptUploadedAt: new Date().toISOString(),
          };
          try {
            localStorage.setItem("career_student_record", JSON.stringify(record));
          } catch {
            // ignore
          }
          onUpdateStudentRecord?.(record);
        }
      });
    }
  };

  const handleSelectExistingDoc = async (doc: Document) => {
    const requestId = ++parseRequestIdRef.current;
    setSelectedExistingDoc(doc);
    setSelectedFile(null);
    setUploadedDocId(doc.document_id);
    setFileError(null);
    setUploadProgress("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const ext = doc.filename.split(".").pop()?.toLowerCase();
    if ((ext === "xlsx" || ext === "xls") && doc.file_url) {
      setIsParsingExistingDoc(true);
      try {
        const buf = await fetchFileArrayBuffer(doc.file_url);
        if (parseRequestIdRef.current !== requestId) return;
        const codes = extractCourseCodesFromArrayBuffer(buf);
        if (codes.length > 0) {
          const record: StudentAcademicRecord = {
            totalCompletedCourses: codes.length,
            completedCourseCodes: codes,
            gpa: null,
            transcriptUploadedAt: new Date().toISOString(),
          };
          try {
            localStorage.setItem("career_student_record", JSON.stringify(record));
          } catch {
            // ignore
          }
          onUpdateStudentRecord?.(record);
        }
      } catch {
        // ignore fetch error; user can still send the document to AI analysis
      } finally {
        if (parseRequestIdRef.current === requestId) {
          setIsParsingExistingDoc(false);
        }
      }
    } else {
      setIsParsingExistingDoc(false);
    }
  };

  const handleRemoveExistingDoc = () => {
    parseRequestIdRef.current += 1;
    setSelectedExistingDoc(null);
    setUploadedDocId(null);
    setFileError(null);
    setIsParsingExistingDoc(false);
    setUploadProgress("");
    try {
      localStorage.removeItem("career_student_record");
    } catch {
      // ignore
    }
    onUpdateStudentRecord?.({
      totalCompletedCourses: 0,
      completedCourseCodes: [],
      gpa: 0,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleRemoveFile = () => {
    parseRequestIdRef.current += 1;
    setIsParsingExistingDoc(false);
    setSelectedFile(null);
    setFileError(null);
    setUploadedDocId(null);
    setIsUploading(false);
    setUploadProgress("");
    try {
      localStorage.removeItem("career_student_record");
    } catch {
      // ignore
    }
    onUpdateStudentRecord?.({
      totalCompletedCourses: 0,
      completedCourseCodes: [],
      gpa: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyzeTranscript = async () => {
    if (!selectedFile && !selectedExistingDoc) return;

    try {
      setFileError(null);
      setIsUploading(true);

      let docId = uploadedDocId;

      if (selectedFile) {
        // Parse Excel if needed before uploading
        const ext = selectedFile.name.split(".").pop()?.toLowerCase();
        if (ext === "xlsx" || ext === "xls") {
          setUploadProgress(
            language === "vi" ? "Đang đọc bảng điểm Excel..." : "Reading Excel transcript..."
          );
          const parsedCourseCodes = await parseExcelCourseCodes(selectedFile);
          if (parsedCourseCodes.length > 0) {
            const record: StudentAcademicRecord = {
              totalCompletedCourses: parsedCourseCodes.length,
              completedCourseCodes: parsedCourseCodes,
              gpa: null,
              transcriptUploadedAt: new Date().toISOString(),
            };
            try {
              localStorage.setItem("career_student_record", JSON.stringify(record));
            } catch {
              // ignore
            }
            onUpdateStudentRecord?.(record);
          }
        }

        setUploadProgress(
          language === "vi" ? "Đang tải lên bảng điểm..." : "Uploading transcript..."
        );
        const uploadedDoc = await documentApi.uploadDocument(
          selectedFile,
          `Bảng điểm - ${selectedFile.name}`
        );
        docId = uploadedDoc.document_id;
        setUploadedDocId(uploadedDoc.document_id);
      } else if (selectedExistingDoc) {
        docId = selectedExistingDoc.document_id;
      }

      setUploadProgress(
        language === "vi" ? "Chuyển tiếp đến Đông Đông AI..." : "Forwarding to Dong Dong AI..."
      );

      const activeFileName = selectedFile?.name || selectedExistingDoc?.filename || "bảng điểm";
      const facultyName = currentFaculty.name;
      const majorName = currentMajor.name;
      const analysisPrompt =
        language === "vi"
          ? `Vui lòng phân tích bảng điểm này (${activeFileName}) của sinh viên ${facultyName} - Ngành ${majorName}, xác định các môn học tôi đã hoàn thành, tính toán tiến độ học tập và đánh giá độ phù hợp với các định hướng nghề nghiệp CNTT.`
          : `Please analyze this transcript (${activeFileName}) for a student of ${facultyName} - Major ${majorName}, determine completed courses, calculate academic progress, and evaluate fit with IT career paths.`;

      navigate("/chat", {
        state: {
          initialPrompt: analysisPrompt,
          initialAttachmentIds: docId ? [docId] : [],
          newChatKey: crypto.randomUUID(),
        },
      });
    } catch (err: any) {
      setFileError(
        err?.message ||
          (language === "vi"
            ? "Không thể tải lên bảng điểm để phân tích. Vui lòng thử lại."
            : "Failed to upload transcript for analysis. Please try again.")
      );
    } finally {
      setIsUploading(false);
    }
  };


  // Find currently active domain and occupation objects
  const activeDomain = CAREER_UNIVERSE_CATALOG.find(
    (d) => d.id === selectedState.domainId
  );
  const activeOccupation = activeDomain?.occupations.find(
    (o) => o.id === selectedState.occupationId
  );

  const panelBody = (
    <>
      {/* Panel Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:py-3.5 bg-surface/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-extrabold text-sm text-foreground truncate">
            Định Hướng Nghề Nghiệp
          </span>
        </div>
        <button
          type="button"
          onClick={isDesktop ? onToggleOpen : handleCloseDrawer}
          aria-label={isDesktop ? "Thu gọn bảng điều khiển" : "Đóng bảng điều khiển"}
          title={isDesktop ? "Thu gọn bảng điều khiển" : "Đóng bảng điều khiển"}
          className="flex min-h-11 min-w-11 lg:min-h-8 lg:min-w-8 lg:size-8 items-center justify-center rounded-xl lg:rounded-lg text-muted-foreground hover:bg-hover hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          {isDesktop ? <ChevronRight className="size-4" /> : <X className="size-4" />}
        </button>
      </div>

      {/* Panel Content Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-5 [scrollbar-width:thin]">
          {/* ======================================================== */}
          {/* SECTION A: ACADEMIC TRANSCRIPT UPLOAD (ALWAYS FIRST!)    */}
          {/* ======================================================== */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                {language === "vi" ? "Bảng Điểm Học Tập" : "Academic Transcript"}
              </label>
              <span className="font-mono text-[10px] text-muted-foreground">
                {fileTab === "existing" && hasLoadedDocs
                  ? language === "vi"
                    ? `${existingDocs.length} tài liệu`
                    : `${existingDocs.length} docs`
                  : language === "vi"
                    ? "Tối đa 236 MB"
                    : "Max 236 MB"}
              </span>
            </div>

            {/* Source Mode Switcher: Upload new vs Select from uploaded Documents */}
            <div
              role="tablist"
              aria-label={language === "vi" ? "Nguồn bảng điểm" : "Transcript source"}
              className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1 border border-border/60"
            >
              <button
                type="button"
                role="tab"
                aria-selected={fileTab === "upload"}
                disabled={isUploading}
                onClick={() => {
                  setFileTab("upload");
                  setFileError(null);
                }}
                className={`relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                  fileTab === "upload"
                    ? "bg-background text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UploadCloud className="size-3.5 shrink-0" />
                <span className="truncate">
                  {language === "vi" ? "Tải file mới" : "Upload new"}
                </span>
                {selectedFile && fileTab !== "upload" && (
                  <span
                    className="size-1.5 rounded-full bg-brand-bright shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={fileTab === "existing"}
                disabled={isUploading}
                title={
                  language === "vi"
                    ? "Chọn file đã tải lên sẵn trong mục Tài liệu"
                    : "Choose a file already uploaded in Documents"
                }
                onClick={() => {
                  setFileTab("existing");
                  setFileError(null);
                }}
                className={`relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                  fileTab === "existing"
                    ? "bg-background text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderOpen className="size-3.5 shrink-0" />
                <span className="truncate">
                  {language === "vi" ? "Từ Tài liệu" : "From Documents"}
                </span>
                {selectedExistingDoc && fileTab !== "existing" && (
                  <span
                    className="size-1.5 rounded-full bg-brand-bright shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />

            {fileTab === "upload" ? (
              /* TAB 1: UPLOAD NEW FILE */
              !selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
                    isDraggingOver
                      ? "border-brand bg-brand-soft/50"
                      : "border-border hover:border-brand-bright hover:bg-hover/30"
                  }`}
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-brand-text mb-2">
                    <UploadCloud className="size-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    Upload bảng điểm của bạn
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Kéo thả hoặc nhấn để chọn file
                  </p>
                  <p className="mt-2 text-[9px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    PDF, DOCX, XLSX, XLS, JPG, PNG – Tối đa 236 MB
                  </p>
                </div>
              ) : (
                /* State 2a: Local File Selected Card */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`rounded-xl border bg-surface p-3 space-y-3 transition-colors ${
                    isDraggingOver
                      ? "border-brand bg-brand-soft/50 ring-2 ring-brand/30"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
                      {getFileIcon(selectedFile.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </span>
                        {uploadProgress && (
                          <span className="text-[10px] text-brand-text font-medium truncate">
                            • {uploadProgress}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-1 text-[10px] text-brand-text hover:underline cursor-pointer disabled:opacity-50 mt-0.5"
                      >
                        <RefreshCw className="size-2.5" />
                        <span>{language === "vi" ? "Chọn file khác" : "Choose another file"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress bar if uploading */}
                  {isUploading && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-brand-bright animate-pulse w-3/4" />
                    </div>
                  )}

                  {/* Action Buttons: [Xóa] & [Phân tích] */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      <span>{language === "vi" ? "Xóa" : "Remove"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAnalyzeTranscript}
                      disabled={isUploading}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-brand py-1.5 text-xs font-medium text-brand-foreground hover:bg-brand-hover shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isUploading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="size-3.5 text-brand-bright" />
                      )}
                      <span>
                        {isUploading
                          ? language === "vi"
                            ? "Đang xử lý..."
                            : "Processing..."
                          : language === "vi"
                            ? "Phân tích"
                            : "Analyze"}
                      </span>
                    </button>
                  </div>
                </div>
              )
            ) : selectedExistingDoc ? (
              /* State 2b: Existing Document Selected Card */
              <div className="rounded-xl border border-brand/40 bg-surface p-3 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
                    {getFileIcon(selectedExistingDoc.filename, selectedExistingDoc.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold text-foreground truncate"
                      title={selectedExistingDoc.title || selectedExistingDoc.filename}
                    >
                      {selectedExistingDoc.title || selectedExistingDoc.filename}
                    </p>
                    {selectedExistingDoc.title &&
                      selectedExistingDoc.title !== selectedExistingDoc.filename && (
                        <p
                          className="text-[10px] text-muted-foreground truncate"
                          title={selectedExistingDoc.filename}
                        >
                          {selectedExistingDoc.filename}
                        </p>
                      )}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatFileSize(selectedExistingDoc.size_bytes)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="size-2.5" />
                        {language === "vi" ? "Từ Tài liệu" : "From Documents"}
                      </span>
                    </div>
                    {(isParsingExistingDoc || uploadProgress) && (
                      <p className="text-[10px] text-brand-text font-medium truncate mt-1">
                        •{" "}
                        {uploadProgress ||
                          (language === "vi"
                            ? "Đang đọc dữ liệu bảng điểm..."
                            : "Reading transcript data...")}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedExistingDoc(null)}
                      disabled={isUploading}
                      className="flex items-center gap-1 text-[10px] text-brand-text hover:underline cursor-pointer disabled:opacity-50 mt-1"
                    >
                      <RefreshCw className="size-2.5" />
                      <span>
                        {language === "vi" ? "Chọn tài liệu khác" : "Choose another document"}
                      </span>
                    </button>
                  </div>
                </div>

                {isUploading && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-brand-bright animate-pulse w-3/4" />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <button
                    type="button"
                    onClick={handleRemoveExistingDoc}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span>{language === "vi" ? "Xóa" : "Remove"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAnalyzeTranscript}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-brand py-1.5 text-xs font-medium text-brand-foreground hover:bg-brand-hover shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5 text-brand-bright" />
                    )}
                    <span>
                      {isUploading
                        ? language === "vi"
                          ? "Đang xử lý..."
                          : "Processing..."
                        : language === "vi"
                          ? "Phân tích"
                          : "Analyze"}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: PICK FROM UPLOADED DOCUMENTS (TÀI LIỆU) */
              <div className="rounded-xl border border-border bg-surface/60 p-2.5 space-y-2">
                {/* Search & Refresh Toolbar */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1 min-w-0">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      placeholder={
                        language === "vi" ? "Tìm trong Tài liệu..." : "Search Documents..."
                      }
                      aria-label={
                        language === "vi"
                          ? "Tìm kiếm tài liệu đã tải lên"
                          : "Search uploaded documents"
                      }
                      className="w-full rounded-lg border border-input bg-background pl-8 pr-7 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand"
                    />
                    {docSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setDocSearchQuery("")}
                        aria-label={language === "vi" ? "Xóa từ khóa tìm kiếm" : "Clear search"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadExistingDocs()}
                    disabled={isLoadingDocs}
                    title={language === "vi" ? "Làm mới danh sách" : "Refresh list"}
                    aria-label={
                      language === "vi" ? "Làm mới danh sách tài liệu" : "Refresh document list"
                    }
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:bg-hover hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`size-3.5 ${isLoadingDocs ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* Picker Body */}
                {isLoadingDocs && existingDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                    <Loader2 className="size-5 animate-spin text-brand-text" />
                    <p className="text-[11px] text-muted-foreground">
                      {language === "vi"
                        ? "Đang tải danh sách Tài liệu..."
                        : "Loading your documents..."}
                    </p>
                  </div>
                ) : docsError ? (
                  <div className="flex flex-col items-center justify-center py-4 px-2 text-center gap-2">
                    <AlertCircle className="size-5 text-destructive" />
                    <p className="text-[11px] text-destructive">{docsError}</p>
                    <button
                      type="button"
                      onClick={() => void loadExistingDocs()}
                      className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-hover cursor-pointer"
                    >
                      {language === "vi" ? "Thử lại" : "Retry"}
                    </button>
                  </div>
                ) : existingDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/60 px-3 py-5 text-center">
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                      <FolderOpen className="size-4" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      {language === "vi"
                        ? "Chưa có tài liệu nào"
                        : "No uploaded documents"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                      {language === "vi"
                        ? "Bạn chưa tải file nào lên mục Tài liệu."
                        : "You have not uploaded any files to Documents yet."}
                    </p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFileTab("upload")}
                        className="rounded-lg bg-brand px-2.5 py-1 text-[10px] font-semibold text-brand-foreground hover:bg-brand-hover transition-colors cursor-pointer"
                      >
                        {language === "vi" ? "Tải file mới" : "Upload new"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/documents")}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-foreground hover:bg-hover transition-colors cursor-pointer"
                      >
                        <span>{language === "vi" ? "Mở Tài liệu" : "Open Documents"}</span>
                        <ExternalLink className="size-2.5" />
                      </button>
                    </div>
                  </div>
                ) : filteredExistingDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-5 text-center gap-1.5">
                    <p className="text-[11px] text-muted-foreground">
                      {language === "vi"
                        ? "Không tìm thấy tài liệu phù hợp."
                        : "No matching documents found."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setDocSearchQuery("")}
                      className="text-[10px] font-medium text-brand-text hover:underline cursor-pointer"
                    >
                      {language === "vi" ? "Xóa bộ lọc" : "Clear filter"}
                    </button>
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5 [scrollbar-width:thin]">
                    {filteredExistingDocs.map((doc) => {
                      const extBadge = getFileExtensionBadge(doc.filename);
                      const displayTitle = doc.title || doc.filename;
                      const showFilename = Boolean(doc.title && doc.title !== doc.filename);
                      return (
                        <button
                          key={doc.document_id}
                          type="button"
                          onClick={() => void handleSelectExistingDoc(doc)}
                          className="group w-full flex items-center gap-2.5 rounded-lg border border-border bg-background p-2 text-left hover:border-brand-bright hover:bg-brand-soft/30 transition-colors cursor-pointer"
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface border border-border">
                            {getFileIcon(doc.filename, doc.file_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[11px] font-semibold text-foreground truncate group-hover:text-brand-text"
                              title={displayTitle}
                            >
                              {displayTitle}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                              {extBadge && (
                                <span className="font-mono text-[9px] font-semibold uppercase bg-muted px-1 py-0.2 rounded">
                                  {extBadge}
                                </span>
                              )}
                              <span className="font-mono shrink-0">
                                {formatFileSize(doc.size_bytes)}
                              </span>
                              {showFilename && (
                                <span className="truncate" title={doc.filename}>
                                  • {doc.filename}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {fileError && (
              <div className="flex items-start gap-1.5 rounded-lg bg-destructive/10 p-2 text-[11px] text-destructive">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                <span className="flex-1">{fileError}</span>
              </div>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* ======================================================== */}
          {/* SECTION: KHOA (FACULTY) SELECTOR (REQUIRED)              */}
          {/* ======================================================== */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="faculty-select" className="text-xs font-bold text-foreground">
                Khoa <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] font-semibold text-brand-text bg-brand-soft px-1.5 py-0.2 rounded">
                Bắt buộc
              </span>
            </div>

            <CareerCustomSelect
              id="faculty-select"
              label="Khoa"
              required
              value={currentFacultyId}
              placeholder="Chọn Khoa đào tạo..."
              onChange={handleFacultyChange}
              options={FACULTIES_DATA.map((faculty) => ({
                value: faculty.id,
                label: faculty.name,
                disabled: !faculty.isAvailable,
              }))}
            />
          </div>

          {/* ======================================================== */}
          {/* SECTION: NGÀNH (MAJOR) SELECTOR (REQUIRED)               */}
          {/* ======================================================== */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="major-select" className="text-xs font-bold text-foreground">
                Ngành <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] font-semibold text-brand-text bg-brand-soft px-1.5 py-0.2 rounded">
                Bắt buộc
              </span>
            </div>

            <CareerCustomSelect
              id="major-select"
              label="Ngành"
              required
              value={currentMajorId}
              placeholder="Chọn Ngành đào tạo..."
              onChange={handleMajorChange}
              options={currentMajors.map((major) => ({
                value: major.id,
                label: major.name,
                disabled: !major.isAvailable,
              }))}
            />
          </div>

          <div className="h-px bg-border" />

          {/* ======================================================== */}
          {/* SECTION B: CAREER DOMAIN SELECTOR (MANDATORY!)           */}
          {/* ======================================================== */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="domain-select" className="text-xs font-bold text-foreground">
                Career Domain <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] font-semibold text-brand-text bg-brand-soft px-1.5 py-0.2 rounded">
                Bắt buộc
              </span>
            </div>

            <CareerCustomSelect
              id="domain-select"
              label="Career Domain"
              required
              value={selectedState.domainId || ""}
              placeholder="Chọn nhóm nghề nghiệp chính"
              onChange={(domainId) => onSelectDomain(domainId)}
              options={CAREER_UNIVERSE_CATALOG.map((domain) => ({
                value: domain.id,
                label: language === "vi" ? domain.vietnameseName : domain.name,
              }))}
            />
            <p className="text-[10px] text-muted-foreground">
              Chọn nhóm để mở rộng mạng lưới nghề nghiệp radial.
            </p>
          </div>

          {/* ======================================================== */}
          {/* SECTION C: OCCUPATION SELECTOR (OPTIONAL, LAYER 3)       */}
          {/* ======================================================== */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="occupation-select" className="text-xs font-bold text-foreground">
                Occupation
              </label>
              <span className="text-[10px] text-muted-foreground">Layer 3</span>
            </div>

            <CareerCustomSelect
              id="occupation-select"
              label="Occupation"
              disabled={!selectedState.domainId}
              value={selectedState.occupationId || ""}
              placeholder="Chọn nghề nghiệp cụ thể"
              onChange={(occId) => onSelectOccupation(occId || null)}
              options={(activeDomain?.occupations || []).map((occ) => ({
                value: occ.id,
                label: language === "vi" ? occ.vietnameseName : occ.name,
              }))}
            />
          </div>

          {/* ======================================================== */}
          {/* SECTION D: SPECIALIZATION SELECTOR (OPTIONAL, LAYER 4)   */}
          {/* ======================================================== */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="specialization-select" className="text-xs font-bold text-foreground">
                Specialization
              </label>
              <span className="text-[10px] text-muted-foreground">Layer 4</span>
            </div>

            <CareerCustomSelect
              id="specialization-select"
              label="Specialization"
              disabled={!selectedState.occupationId}
              value={selectedState.specializationId || ""}
              placeholder="Chọn chuyên môn sâu"
              onChange={(specId) => onSelectSpecialization(specId || null)}
              options={(activeOccupation?.specializations || []).map((spec) => ({
                value: spec.id,
                label: language === "vi" ? spec.vietnameseName : spec.name,
              }))}
            />
          </div>

          {/* Selection Status Summary */}
          {activeDomain && (
            <div className="rounded-xl border border-border bg-surface/70 p-3 text-[11px] space-y-1.5">
              <span className="font-bold text-foreground block">
                Đường dẫn đang chọn:
              </span>
              <div className="flex items-center gap-1.5 text-fg-secondary">
                <span className="size-1.5 rounded-full bg-brand-bright" />
                <span className="font-semibold text-brand-text truncate">
                  {currentFaculty.name} &gt; {currentMajor.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-fg-secondary pl-3">
                <span className="size-1.5 rounded-full bg-brand-bright" />
                <span className="font-semibold text-brand-text truncate">
                  {language === "vi" ? activeDomain.vietnameseName : activeDomain.name}
                </span>
              </div>
              {activeOccupation && (
                <div className="flex items-center gap-1.5 text-fg-secondary pl-6">
                  <span className="size-1.5 rounded-full bg-brand-bright" />
                  <span className="truncate">
                    {language === "vi" ? activeOccupation.vietnameseName : activeOccupation.name}
                  </span>
                </div>
              )}
              {selectedState.specializationId && (
                <div className="flex items-center gap-1.5 text-fg-secondary pl-9">
                  <span className="size-1.5 rounded-full bg-brand-bright" />
                  <span className="truncate">
                    {(() => {
                      const sp = activeOccupation?.specializations.find(
                        (s) => s.id === selectedState.specializationId
                      );
                      return language === "vi" && sp?.vietnameseName
                        ? sp.vietnameseName
                        : sp?.name;
                    })()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
    </>
  );

  // Mobile & Tablet (< lg): Floating top-right toggle + Overlay Slide-Over Drawer with Backdrop
  if (!isDesktop) {
    return (
      <>
        {!isOpen && (
          <button
            type="button"
            data-testid="career-panel-toggle-btn"
            onClick={onToggleOpen}
            aria-label={language === "vi" ? "Mở bảng điều khiển nghề nghiệp" : "Open career controls"}
            title={language === "vi" ? "Mở bảng điều khiển nghề nghiệp" : "Open career controls"}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface/95 px-2.5 sm:px-3.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md hover:bg-hover transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="size-4 text-brand-text shrink-0" />
            <span className="hidden sm:inline">
              {language === "vi" ? "Điều khiển" : "Controls"}
            </span>
            {activeDomain && (
              <span
                className="size-2 rounded-full bg-brand-bright shrink-0"
                aria-hidden="true"
              />
            )}
          </button>
        )}

        {isOpen && (
          <>
            <div
              data-testid="career-panel-backdrop"
              onClick={handleCloseDrawer}
              aria-hidden="true"
              className="absolute inset-0 z-20 bg-black/45 backdrop-blur-[1px] transition-opacity"
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Định Hướng Nghề Nghiệp"
              className="absolute inset-y-0 right-0 z-20 flex h-full w-[min(21rem,calc(100vw-2rem))] max-w-full flex-col border-l border-border bg-card shadow-2xl select-none"
            >
              {panelBody}
            </aside>
          </>
        )}
      </>
    );
  }

  // Desktop (>= lg): Collapsible docked right sidebar
  return (
    <div className="relative flex h-full shrink-0 select-none">
      {/* Toggle Button when panel is collapsed */}
      {!isOpen && (
        <button
          type="button"
          data-testid="career-panel-toggle-btn"
          onClick={onToggleOpen}
          aria-label="Mở bảng điều khiển nghề nghiệp"
          title="Mở bảng điều khiển nghề nghiệp"
          className="absolute -left-10 top-4 z-10 flex size-9 items-center justify-center rounded-l-xl border-y border-l border-border bg-surface text-fg-secondary shadow-sm hover:bg-hover hover:text-foreground transition-all cursor-pointer"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}

      {/* Main Panel Container */}
      <aside
        className={`h-full border-l border-border bg-card transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? "w-80 opacity-100" : "w-0 opacity-0 overflow-hidden border-none"
        }`}
      >
        {panelBody}
      </aside>
    </div>
  );
}
