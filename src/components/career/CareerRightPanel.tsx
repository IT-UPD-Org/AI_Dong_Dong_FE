import React, { useState, useRef } from "react";
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
} from "lucide-react";
import {
  CAREER_UNIVERSE_CATALOG,
  INITIAL_DOMAINS,
  FACULTIES_DATA,
} from "../../data/careerUniverseData";
import { SelectedCareerState } from "../../types/careerUniverse";
import { documentApi, STORAGE_QUOTA_BYTES } from "../../api/document.api";
import { CareerCustomSelect } from "./CareerCustomSelect";

interface CareerRightPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  selectedState: SelectedCareerState;
  onSelectDomain: (domainId: string) => void;
  onSelectOccupation: (occupationId: string | null) => void;
  onSelectSpecialization: (specializationId: string | null) => void;
  onSelectFaculty?: (facultyId: string) => void;
  onSelectMajor?: (majorId: string) => void;
}

const SUPPORTED_EXTENSIONS = ["pdf", "docx", "xlsx", "xls", "jpg", "jpeg", "png"];
const MAX_FILE_SIZE = STORAGE_QUOTA_BYTES; // 236 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "xlsx" || ext === "xls") {
    return <FileSpreadsheet className="size-5 text-emerald-600" />;
  }
  if (ext === "jpg" || ext === "jpeg" || ext === "png") {
    return <ImageIcon className="size-5 text-blue-600" />;
  }
  return <FileText className="size-5 text-brand-text" />;
}

export function CareerRightPanel({
  isOpen,
  onToggleOpen,
  selectedState,
  onSelectDomain,
  onSelectOccupation,
  onSelectSpecialization,
  onSelectFaculty,
  onSelectMajor,
}: CareerRightPanelProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // File Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);

  // Drag-and-drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const validateAndSetFile = (file: File) => {
    setFileError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setFileError(
        `Định dạng file .${ext} không được hỗ trợ. Vui lòng chọn PDF, DOCX, XLSX, XLS, JPG hoặc PNG.`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("Kích thước file vượt quá giới hạn 236 MB.");
      return;
    }

    setSelectedFile(file);
    setUploadedDocId(null);
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
    setSelectedFile(null);
    setFileError(null);
    setUploadedDocId(null);
    setIsUploading(false);
    setUploadProgress("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyzeTranscript = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setFileError(null);
      setUploadProgress("Đang tải lên bảng điểm...");

      // 1. Upload file via the real backend documentApi
      const uploadedDoc = await documentApi.uploadDocument(
        selectedFile,
        `Bảng điểm - ${selectedFile.name}`
      );
      setUploadedDocId(uploadedDoc.document_id);

      setUploadProgress("Chuyển tiếp đến Đông Đông AI...");

      // 2. Submit to existing Đông Đông AI chat conversation
      const analysisPrompt = `Vui lòng phân tích bảng điểm này của sinh viên ${currentFaculty.name} - Ngành ${currentMajor.name}, xác định các môn học tôi đã hoàn thành, tính toán tiến độ học tập và đánh giá độ phù hợp với các định hướng nghề nghiệp CNTT.`;

      // 3. Navigate into Chat with attachment and prompt
      navigate("/chat", {
        state: {
          initialPrompt: analysisPrompt,
          initialAttachmentIds: [uploadedDoc.document_id],
          newChatKey: crypto.randomUUID(),
        },
      });
    } catch (err: any) {
      setFileError(
        err?.message || "Không thể tải lên bảng điểm để phân tích. Vui lòng thử lại."
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

  return (
    <div className="relative flex h-full shrink-0 select-none">
      {/* Toggle Button when panel is collapsed */}
      {!isOpen && (
        <button
          type="button"
          onClick={onToggleOpen}
          title="Mở bảng điều khiển nghề nghiệp"
          className="absolute -left-9 top-4 z-30 flex size-8 items-center justify-center rounded-l-xl border-y border-l border-border bg-surface text-fg-secondary shadow-sm hover:bg-hover hover:text-foreground transition-all cursor-pointer"
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
        {/* Panel Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3.5 bg-surface/50">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-foreground">
              Định Hướng Nghề Nghiệp
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleOpen}
            title="Thu gọn bảng điều khiển"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-hover hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Panel Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 [scrollbar-width:thin]">
          {/* ======================================================== */}
          {/* SECTION A: ACADEMIC TRANSCRIPT UPLOAD (ALWAYS FIRST!)    */}
          {/* ======================================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Bảng Điểm Học Tập
              </label>
              <span className="font-mono text-[10px] text-muted-foreground">
                Tối đa 236 MB
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* State 1: Empty Dropzone */}
            {!selectedFile ? (
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
              /* State 2: File Uploaded Card */
              <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
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
                    <span>Xóa</span>
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
                    <span>{isUploading ? "Đang xử lý..." : "Phân tích"}</span>
                  </button>
                </div>
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
                label: domain.name,
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
                label: occ.name,
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
                label: spec.name,
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
                  {activeDomain.name}
                </span>
              </div>
              {activeOccupation && (
                <div className="flex items-center gap-1.5 text-fg-secondary pl-6">
                  <span className="size-1.5 rounded-full bg-brand-bright" />
                  <span className="truncate">{activeOccupation.name}</span>
                </div>
              )}
              {selectedState.specializationId && (
                <div className="flex items-center gap-1.5 text-fg-secondary pl-9">
                  <span className="size-1.5 rounded-full bg-brand-bright" />
                  <span className="truncate">
                    {
                      activeOccupation?.specializations.find(
                        (s) => s.id === selectedState.specializationId
                      )?.name
                    }
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
