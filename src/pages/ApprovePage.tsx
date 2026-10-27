import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Database,
  FileCheck,
  HardDrive,
  HelpCircle,
  Info,
  KeyRound,
  Mail,
  Paperclip,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  UserCheck,
  UserRound,
} from "lucide-react";
import {
  approvalApi,
  ApprovalRequestType,
  ApprovalSubmitResponse,
  StudentStatus,
} from "../api/approval.api";
import { LandingFooter } from "../components/layout/LandingFooter";

const STORAGE_MARKS: { value: number; label: string; desc: string }[] = [
  { value: 236, label: "236 MB", desc: "Mặc định tiêu chuẩn UAI" },
  { value: 512, label: "512 MB", desc: "Mở rộng tài liệu học tập" },
  { value: 1080, label: "1080 MB", desc: "Nghiên cứu & đồ án tốt nghiệp" },
];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ApprovePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Request type selection
  const initialType: ApprovalRequestType = (() => {
    const typeParam = searchParams.get("type");
    if (typeParam === "storage_increase" || typeParam === "bug_report") {
      return typeParam;
    }
    return "account_request";
  })();

  const [requestType, setRequestType] = useState<ApprovalRequestType>(initialType);

  // Sync state if URL search param changes
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (
      typeParam &&
      (typeParam === "account_request" ||
        typeParam === "storage_increase" ||
        typeParam === "bug_report")
    ) {
      setRequestType(typeParam as ApprovalRequestType);
    }
  }, [searchParams]);

  const handleSelectRequestType = (type: ApprovalRequestType) => {
    setRequestType(type);
    setSearchParams({ type });
    // Clear type-specific errors
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.description;
      delete copy.bug_title;
      delete copy.bug_description;
      delete copy.file;
      return copy;
    });
  };

  // 2. Common fields
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [studentStatus, setStudentStatus] = useState<StudentStatus>("student");

  // 3. Student specific fields
  const [studentId, setStudentId] = useState("");
  const [classCode, setClassCode] = useState("");
  const [major, setMajor] = useState("");
  const [faculty, setFaculty] = useState("");

  // 4. Non-student specific fields
  const [phoneNumber, setPhoneNumber] = useState("");

  // 5. Shared description / request details
  const [description, setDescription] = useState("");

  // 6. Storage increase specific
  const [storageMb, setStorageMb] = useState<number>(236);

  // 7. Bug report specific
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [affectedPage, setAffectedPage] = useState("");

  // 8. File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 9. UI Status states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<ApprovalSubmitResponse | null>(null);
  const [generalError, setGeneralError] = useState("");

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrors((prev) => ({
        ...prev,
        file: `Kích thước tệp (${formatFileSize(file.size)}) vượt quá giới hạn tối đa 10 MB.`,
      }));
      return;
    }

    // Validate extension & mime type
    const lowerName = file.name.toLowerCase();
    const hasValidExt = /\.(jpg|jpeg|png|webp)$/i.test(lowerName);
    if (!hasValidExt || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        file: "Định dạng không hợp lệ. Chỉ chấp nhận tệp ảnh JPG, JPEG, PNG hoặc WEBP.",
      }));
      return;
    }

    // Clear file error and set file
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.file;
      return copy;
    });

    setSelectedFile(file);

    // Create thumbnail preview
    if (filePreview) URL.revokeObjectURL(filePreview);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.file;
      return copy;
    });
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.full_name = "Vui lòng nhập họ và tên đầy đủ.";
    }

    if (!dateOfBirth) {
      errs.date_of_birth = "Vui lòng chọn ngày, tháng, năm sinh.";
    }

    if (studentStatus === "student") {
      if (!studentId.trim()) errs.student_id = "Vui lòng nhập mã sinh viên.";
      if (!classCode.trim()) errs.class_code = "Vui lòng nhập mã lớp.";
      if (!major.trim()) errs.major = "Vui lòng nhập ngành học.";
      if (!faculty.trim()) errs.faculty = "Vui lòng nhập khoa.";
    } else {
      const cleanPhone = phoneNumber.replace(/[\s.-]/g, "");
      if (!cleanPhone) {
        errs.phone_number = "Vui lòng nhập số điện thoại liên hệ.";
      } else if (!/^(\+84|0)[3|5|7|8|9][0-9]{8}$/.test(cleanPhone)) {
        errs.phone_number = "Số điện thoại không đúng định dạng (VD: 0912345678).";
      }

      // Graduation certificate photo is required for alumni when requesting account
      if (requestType === "account_request" && !selectedFile) {
        errs.file = "Vui lòng tải lên ảnh chụp bằng tốt nghiệp để xác minh.";
      }
    }

    // Request type specific validation
    if (requestType === "account_request") {
      if (!description.trim()) {
        errs.description = "Vui lòng mô tả nhu cầu hoặc lý do xin cấp tài khoản.";
      }
    } else if (requestType === "storage_increase") {
      if (![236, 512, 1080].includes(storageMb)) {
        errs.storage = "Mức dung lượng phải là 236 MB, 512 MB hoặc 1080 MB.";
      }
    } else if (requestType === "bug_report") {
      if (!bugTitle.trim()) {
        errs.bug_title = "Vui lòng nhập tiêu đề ngắn gọn cho lỗi gặp phải.";
      }
      const desc = bugDescription.trim() || description.trim();
      if (!desc) {
        errs.bug_description = "Vui lòng mô tả chi tiết các bước xảy ra lỗi.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorEl = document.querySelector(".form-error-anchor");
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await approvalApi.submit({
        request_type: requestType,
        full_name: fullName,
        date_of_birth: dateOfBirth,
        student_status: studentStatus,
        student_id: studentStatus === "student" ? studentId : undefined,
        class_code: studentStatus === "student" ? classCode : undefined,
        major: studentStatus === "student" ? major : undefined,
        faculty: studentStatus === "student" ? faculty : undefined,
        phone_number: studentStatus === "alumni_other" ? phoneNumber : undefined,
        description:
          requestType === "bug_report" ? bugDescription || description : description,
        storage_mb: requestType === "storage_increase" ? storageMb : undefined,
        bug_title: requestType === "bug_report" ? bugTitle : undefined,
        bug_description:
          requestType === "bug_report" ? bugDescription || description : undefined,
        affected_page: requestType === "bug_report" ? affectedPage : undefined,
        file: selectedFile,
      });

      setSubmitSuccess(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setGeneralError(
        (err as Error).message ||
          "Có lỗi xảy ra trong quá trình gửi yêu cầu. Vui lòng kiểm tra lại thông tin và thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmitSuccess(null);
    setGeneralError("");
    setErrors({});
    setDescription("");
    setBugTitle("");
    setBugDescription("");
    setAffectedPage("");
    handleRemoveFile();
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#11130f]">
      {/* Top Header & Breadcrumb */}
      <section className="border-b border-black/10 bg-white px-4 py-8 sm:px-6 md:px-12">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav
            aria-label="Đường dẫn trang"
            className="flex items-center gap-2 text-xs font-medium text-black/50"
          >
            <Link
              to="/"
              className="transition-colors hover:text-[#04714a] focus-visible:outline-none focus-visible:underline"
            >
              Trang chủ
            </Link>
            <ChevronRight size={14} className="opacity-40" />
            <span className="font-semibold text-[#04714a]">Cấp phép tài khoản</span>
          </nav>

          {/* Page Title & Subtitle */}
          <div className="mt-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00a86b]/20 bg-[#e8f7ef] px-3 py-1 text-xs font-semibold text-[#04714a]">
              <ShieldCheck size={14} />
              CỔNG TIẾP NHẬN YÊU CẦU UAI
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Cấp phép tài khoản UAI
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-black/65 sm:text-base">
              Gửi yêu cầu cấp tài khoản, điều chỉnh dung lượng lưu trữ hoặc báo lỗi
              khi sử dụng UAI. Thông tin sẽ được chuyển đến bộ phận phụ trách để xem xét.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 text-xs text-black/60 bg-black/5 px-3 py-1.5 rounded-lg">
              <Mail size={13} className="text-[#04714a]" />
              <span>Email tiếp nhận thông báo:</span>
              <a
                href="mailto:dung.nm@phuongdong.edu.vn"
                className="font-semibold text-[#04714a] hover:underline"
              >
                dung.nm@phuongdong.edu.vn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:px-12">
        {/* SUCCESS VIEW */}
        {submitSuccess ? (
          <div className="rounded-3xl border border-[#00a86b]/30 bg-white p-6 shadow-xl sm:p-10 animate-in fade-in duration-300">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#e8f7ef] text-[#00a86b]">
              <CheckCircle2 size={32} />
            </div>

            <h2 className="mt-6 text-2xl font-bold tracking-tight text-[#04714a] sm:text-3xl">
              Đã tiếp nhận yêu cầu thành công!
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-black/70 sm:text-base">
              {submitSuccess.message}
            </p>

            <div className="mt-6 rounded-2xl border border-black/10 bg-[#fafaf9] p-5">
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-xs text-black/50 block">Mã yêu cầu tra cứu:</span>
                  <span className="font-mono font-bold text-base text-[#04714a]">
                    {submitSuccess.request_code}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-black/50 block">Trạng thái:</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full text-xs">
                    <span className="size-1.5 rounded-full bg-amber-600 animate-pulse" />
                    Đang chờ quản trị viên xem xét
                  </span>
                </div>
                <div>
                  <span className="text-xs text-black/50 block">Loại hỗ trợ:</span>
                  <span className="font-medium text-black/80">
                    {submitSuccess.request_type === "account_request" && "Xin cấp tài khoản"}
                    {submitSuccess.request_type === "storage_increase" && "Tăng dung lượng lưu trữ"}
                    {submitSuccess.request_type === "bug_report" && "Báo lỗi hệ thống"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-black/50 block">Email người nhận:</span>
                  <span className="font-medium text-black/80">dung.nm@phuongdong.edu.vn</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs text-black/55 leading-relaxed bg-[#f0fdf4] p-4 rounded-xl border border-[#bbf7d0]">
              <p className="font-semibold text-[#166534] mb-1">Lưu ý về quy trình phê duyệt:</p>
              Yêu cầu của bạn đã được ghi nhận. Việc cấp tài khoản hoặc thay đổi dung lượng
              lưu trữ sẽ do quản trị viên trường kiểm tra đối chiếu dữ liệu trước khi kích hoạt chính thức.
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleResetForm}
                className="rounded-xl bg-[#04714a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#03593a] transition-colors cursor-pointer"
              >
                Gửi thêm yêu cầu khác
              </button>
              <Link
                to="/"
                className="rounded-xl border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-black/80 hover:bg-black/5 transition-colors inline-flex items-center"
              >
                Trở về Trang chủ
              </Link>
            </div>
          </div>
        ) : (
          /* FORM SUBMISSION VIEW */
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* General Submission Error Alert */}
            {generalError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800"
              >
                <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={18} />
                <div className="flex-1">
                  <p className="font-semibold">Không thể gửi yêu cầu</p>
                  <p className="mt-1 text-xs leading-relaxed">{generalError}</p>
                </div>
              </div>
            )}

            {/* STEP 1: CHỌN LOẠI YÊU CẦU */}
            <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-[#04714a] text-xs font-bold text-white">
                  1
                </span>
                <h2 className="text-lg font-bold text-[#11130f] sm:text-xl">
                  Bạn cần hỗ trợ vấn đề gì?
                </h2>
              </div>
              <p className="text-xs text-black/55 mb-6">
                Chọn danh mục phù hợp nhất để yêu cầu được chuyển đến đúng quy trình xử lý.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Option 1: Xin cấp tài khoản */}
                <button
                  type="button"
                  onClick={() => handleSelectRequestType("account_request")}
                  className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                    requestType === "account_request"
                      ? "border-[#00a86b] bg-[#e8f7ef]/50 shadow-sm"
                      : "border-black/10 hover:border-black/25 bg-white"
                  }`}
                >
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl mb-3 ${
                      requestType === "account_request"
                        ? "bg-[#04714a] text-white"
                        : "bg-black/5 text-black/70"
                    }`}
                  >
                    <KeyRound size={20} />
                  </div>
                  <span className="font-bold text-sm text-[#11130f]">
                    Xin cấp tài khoản
                  </span>
                  <p className="mt-1.5 text-xs text-black/60 leading-relaxed">
                    Dành cho sinh viên, cựu sinh viên cần cấp quyền trải nghiệm trợ lý UAI.
                  </p>
                </button>

                {/* Option 2: Tăng dung lượng lưu trữ */}
                <button
                  type="button"
                  onClick={() => handleSelectRequestType("storage_increase")}
                  className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                    requestType === "storage_increase"
                      ? "border-[#00a86b] bg-[#e8f7ef]/50 shadow-sm"
                      : "border-black/10 hover:border-black/25 bg-white"
                  }`}
                >
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl mb-3 ${
                      requestType === "storage_increase"
                        ? "bg-[#04714a] text-white"
                        : "bg-black/5 text-black/70"
                    }`}
                  >
                    <HardDrive size={20} />
                  </div>
                  <span className="font-bold text-sm text-[#11130f]">
                    Tăng dung lượng lưu trữ
                  </span>
                  <p className="mt-1.5 text-xs text-black/60 leading-relaxed">
                    Đề nghị nâng hạn mức lưu trữ tài liệu phục vụ học tập và nghiên cứu.
                  </p>
                </button>

                {/* Option 3: Báo lỗi */}
                <button
                  type="button"
                  onClick={() => handleSelectRequestType("bug_report")}
                  className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                    requestType === "bug_report"
                      ? "border-[#00a86b] bg-[#e8f7ef]/50 shadow-sm"
                      : "border-black/10 hover:border-black/25 bg-white"
                  }`}
                >
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl mb-3 ${
                      requestType === "bug_report"
                        ? "bg-[#04714a] text-white"
                        : "bg-black/5 text-black/70"
                    }`}
                  >
                    <AlertTriangle size={20} />
                  </div>
                  <span className="font-bold text-sm text-[#11130f]">
                    Báo lỗi hệ thống
                  </span>
                  <p className="mt-1.5 text-xs text-black/60 leading-relaxed">
                    Phản ánh sự cố, hiển thị sai hoặc tính năng không hoạt động như mong muốn.
                  </p>
                </button>
              </div>
            </section>

            {/* STEP 2: THÔNG TIN CHUNG */}
            <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-[#04714a] text-xs font-bold text-white">
                  2
                </span>
                <h2 className="text-lg font-bold text-[#11130f] sm:text-xl">
                  Thông tin người gửi
                </h2>
              </div>
              <p className="text-xs text-black/55 mb-6">
                Các trường có dấu sao đỏ (<span className="text-red-500">*</span>) là thông tin bắt buộc.
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Họ và tên */}
                <div>
                  <label
                    htmlFor="full_name"
                    className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                  >
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.full_name) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.full_name;
                          return copy;
                        });
                      }
                    }}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#11130f] outline-none transition-all placeholder:text-black/35 focus:ring-2 focus:ring-[#00a86b]/30 ${
                      errors.full_name
                        ? "border-red-500 bg-red-50/20 form-error-anchor"
                        : "border-black/15 focus:border-[#00a86b]"
                    }`}
                  />
                  {errors.full_name && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.full_name}
                    </p>
                  )}
                </div>

                {/* Ngày, tháng, năm sinh */}
                <div>
                  <label
                    htmlFor="date_of_birth"
                    className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                  >
                    Ngày, tháng, năm sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="date_of_birth"
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      if (errors.date_of_birth) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.date_of_birth;
                          return copy;
                        });
                      }
                    }}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#11130f] outline-none transition-all focus:ring-2 focus:ring-[#00a86b]/30 ${
                      errors.date_of_birth
                        ? "border-red-500 bg-red-50/20 form-error-anchor"
                        : "border-black/15 focus:border-[#00a86b]"
                    }`}
                  />
                  {errors.date_of_birth && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.date_of_birth}
                    </p>
                  )}
                </div>

                {/* Tình trạng sinh viên (Segmented Control) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2">
                    Tình trạng sinh viên <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-black/5 rounded-2xl border border-black/10">
                    <button
                      type="button"
                      onClick={() => setStudentStatus("student")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all cursor-pointer ${
                        studentStatus === "student"
                          ? "bg-white text-[#04714a] shadow-sm font-bold"
                          : "text-black/60 hover:text-black"
                      }`}
                    >
                      <UserCheck size={16} />
                      Là sinh viên
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentStatus("alumni_other")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all cursor-pointer ${
                        studentStatus === "alumni_other"
                          ? "bg-white text-[#04714a] shadow-sm font-bold"
                          : "text-black/60 hover:text-black"
                      }`}
                    >
                      <UserRound size={16} />
                      Không còn là sinh viên
                    </button>
                  </div>
                </div>
              </div>

              {/* DYNAMIC FIELDS: LÀ SINH VIÊN */}
              {studentStatus === "student" && (
                <div className="mt-6 pt-6 border-t border-black/10 grid gap-6 sm:grid-cols-2 animate-in fade-in duration-200">
                  {/* Mã sinh viên */}
                  <div>
                    <label
                      htmlFor="student_id"
                      className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                    >
                      Mã sinh viên <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="student_id"
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => {
                        setStudentId(e.target.value);
                        if (errors.student_id) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.student_id;
                            return copy;
                          });
                        }
                      }}
                      placeholder="Ví dụ: 21100123"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#11130f] outline-none transition-all placeholder:text-black/35 focus:ring-2 focus:ring-[#00a86b]/30 ${
                        errors.student_id
                          ? "border-red-500 bg-red-50/20 form-error-anchor"
                          : "border-black/15 focus:border-[#00a86b]"
                      }`}
                    />
                    {errors.student_id && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.student_id}
                      </p>
                    )}
                  </div>

                  {/* Mã lớp */}
                  <div>
                    <label
                      htmlFor="class_code"
                      className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                    >
                      Mã lớp <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="class_code"
                      type="text"
                      required
                      value={classCode}
                      onChange={(e) => {
                        setClassCode(e.target.value);
                        if (errors.class_code) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.class_code;
                            return copy;
                          });
                        }
                      }}
                      placeholder="Ví dụ: 21CNTT01"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#11130f] outline-none transition-all placeholder:text-black/35 focus:ring-2 focus:ring-[#00a86b]/30 ${
                        errors.class_code
                          ? "border-red-500 bg-red-50/20 form-error-anchor"
                          : "border-black/15 focus:border-[#00a86b]"
                      }`}
                    />
                    {errors.class_code && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.class_code}
                      </p>
                    )}
                  </div>

                  {/* Ngành học */}
                  <div>
                    <label
                      htmlFor="major"
                      className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                    >
                      Ngành học <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="major"
                      type="text"
                      required
                      value={major}
                      onChange={(e) => {
                        setMajor(e.target.value);
                        if (errors.major) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.major;
                            return copy;
                          });
                        }
                      }}
                      placeholder="Ví dụ: Công nghệ thông tin"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#11130f] outline-none transition-all placeholder:text-black/35 focus:ring-2 focus:ring-[#00a86b]/30 ${
                        errors.major
                          ? "border-red-500 bg-red-50/20 form-error-anchor"
                          : "border-black/15 focus:border-[#00a86b]"
                      }`}
                    />
                    {errors.major && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.major}
                      </p>
                    )}
                  </div>

                  {/* Khoa */}
                  <div>
                    <label
                      htmlFor="faculty"
                      className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                    >
                      Khoa <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="faculty"
                      type="text"
                      required
                      value={faculty}
                      onChange={(e) => {
                        setFaculty(e.target.value);
                        if (errors.faculty) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.faculty;
                            return copy;
                          });
                        }
                      }}
                      placeholder="Ví dụ: Khoa Công nghệ thông tin"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#11130f] outline-none transition-all placeholder:text-black/35 focus:ring-2 focus:ring-[#00a86b]/30 ${
                        errors.faculty
                          ? "border-red-500 bg-red-50/20 form-error-anchor"
                          : "border-black/15 focus:border-[#00a86b]"
                      }`}
                    />
                    {errors.faculty && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.faculty}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* DYNAMIC FIELDS: KHÔNG CÒN LÀ SINH VIÊN */}
              {studentStatus === "alumni_other" && (
                <div className="mt-6 pt-6 border-t border-black/10 space-y-6 animate-in fade-in duration-200">
                  {/* Số điện thoại */}
                  <div>
                    <label
                      htmlFor="phone_number"
                      className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                    >
                      Số điện thoại liên hệ <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="phone_number"
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (errors.phone_number) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.phone_number;
                            return copy;
                          });
                        }
                      }}
                      placeholder="Ví dụ: 0912345678"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#11130f] outline-none transition-all placeholder:text-black/35 focus:ring-2 focus:ring-[#00a86b]/30 ${
                        errors.phone_number
                          ? "border-red-500 bg-red-50/20 form-error-anchor"
                          : "border-black/15 focus:border-[#00a86b]"
                      }`}
                    />
                    {errors.phone_number && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.phone_number}
                      </p>
                    )}
                  </div>

                  {/* Ảnh chụp bằng tốt nghiệp */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="graduation_certificate"
                        className="text-xs font-semibold uppercase tracking-wider text-black/70"
                      >
                        Ảnh chụp bằng tốt nghiệp{" "}
                        {requestType === "account_request" && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <span className="text-[11px] text-black/45">
                        JPG, JPEG, PNG, WEBP (Tối đa 10 MB)
                      </span>
                    </div>

                    {!selectedFile ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors hover:border-[#00a86b] hover:bg-[#e8f7ef]/20 ${
                          errors.file
                            ? "border-red-400 bg-red-50/20 form-error-anchor"
                            : "border-black/15 bg-[#fafaf9]"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          id="graduation_certificate"
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <div className="flex size-12 mx-auto items-center justify-center rounded-2xl bg-black/5 text-[#04714a] mb-3">
                          <UploadCloud size={24} />
                        </div>
                        <p className="text-sm font-semibold text-black/80">
                          Nhấn để chọn ảnh bằng tốt nghiệp từ thiết bị
                        </p>
                        <p className="text-xs text-black/50 mt-1">
                          Hỗ trợ xem trước và kiểm tra dung lượng tự động
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[#00a86b]/40 bg-[#e8f7ef]/30 p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {filePreview ? (
                            <img
                              src={filePreview}
                              alt="Xem trước"
                              className="size-14 rounded-xl object-cover border border-black/10 shrink-0"
                            />
                          ) : (
                            <div className="flex size-14 items-center justify-center rounded-xl bg-black/5 text-[#04714a] shrink-0">
                              <FileCheck size={24} />
                            </div>
                          )}
                          <div className="truncate">
                            <p className="text-sm font-semibold text-black/90 truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-black/55 mt-0.5">
                              {formatFileSize(selectedFile.size)} · Tệp đã sẵn sàng tải lên
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-medium text-black/70 hover:bg-black/5 transition-colors cursor-pointer"
                          >
                            Đổi ảnh
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            title="Xóa tệp"
                            className="flex size-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {errors.file && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.file}
                      </p>
                    )}

                    <p className="mt-2 text-[11px] text-black/50 leading-relaxed">
                      Lưu ý bảo mật: Ảnh bằng tốt nghiệp chỉ được dùng để bộ phận quản trị viên xác minh danh tính và được bảo vệ theo tiêu chuẩn dữ liệu cá nhân của Đại học Phương Đông.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* STEP 3: CHI TIẾT THEO LOẠI YÊU CẦU */}
            <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-[#04714a] text-xs font-bold text-white">
                  3
                </span>
                <h2 className="text-lg font-bold text-[#11130f] sm:text-xl">
                  {requestType === "account_request" && "Nội dung xin cấp tài khoản"}
                  {requestType === "storage_increase" && "Chọn mức dung lượng đề nghị"}
                  {requestType === "bug_report" && "Chi tiết sự cố & báo lỗi"}
                </h2>
              </div>

              {/* 3.1: NỘI DUNG XIN CẤP TÀI KHOẢN */}
              {requestType === "account_request" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <p className="text-xs text-black/55">
                    Mô tả mục đích sử dụng UAI (học tập, làm đồ án, nghiên cứu khoa học...) để quản trị viên thuận tiện xét duyệt.
                  </p>
                  <div>
                    <label
                      htmlFor="request_description"
                      className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                    >
                      Mô tả nhu cầu / Lý do <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="request_description"
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (errors.description) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.description;
                            return copy;
                          });
                        }
                      }}
                      placeholder="Ví dụ: Em muốn đăng ký tài khoản UAI để phục vụ tra cứu học tập, tham khảo đề cương và tài liệu môn học chuyên ngành CNTT..."
                      className={`w-full rounded-xl border bg-white p-4 text-sm text-[#11130f] outline-none transition-all placeholder:text-black/35 focus:ring-2 focus:ring-[#00a86b]/30 ${
                        errors.description
                          ? "border-red-500 bg-red-50/20 form-error-anchor"
                          : "border-black/15 focus:border-[#00a86b]"
                      }`}
                    />
                    {errors.description && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 3.2: TĂNG DUNG LƯỢNG LƯU TRỮ */}
              {requestType === "storage_increase" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <p className="text-xs text-black/60 leading-relaxed">
                    Chọn mức dung lượng bạn muốn đề nghị. Việc tăng dung lượng cần được quản trị viên xem xét và phê duyệt.
                  </p>

                  {/* Slider Control with 3 discrete stops */}
                  <div className="rounded-2xl border border-black/10 bg-[#fafaf9] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-black/70">
                        Hạn mức đề nghị:
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#04714a] px-3.5 py-1 text-sm font-bold text-white shadow-sm">
                        <Database size={14} />
                        {storageMb} MB
                      </span>
                    </div>

                    {/* Interactive 3-stop track */}
                    <div className="relative my-6 px-3">
                      {/* Track background */}
                      <div className="h-2 w-full rounded-full bg-black/10 relative">
                        {/* Active fill */}
                        <div
                          className="h-2 rounded-full bg-[#00a86b] transition-all duration-300"
                          style={{
                            width:
                              storageMb === 236
                                ? "0%"
                                : storageMb === 512
                                  ? "50%"
                                  : "100%",
                          }}
                        />
                      </div>

                      {/* 3 interactive click stops */}
                      <div className="absolute top-1/2 -translate-y-1/2 left-3 right-3 flex justify-between">
                        {STORAGE_MARKS.map((mark) => {
                          const isSelected = storageMb === mark.value;
                          return (
                            <button
                              key={mark.value}
                              type="button"
                              onClick={() => setStorageMb(mark.value)}
                              aria-label={`Chọn hạn mức ${mark.label}`}
                              className={`size-6 rounded-full border-2 transition-all cursor-pointer -ml-3 first:ml-0 last:mr-0 last:-mr-3 flex items-center justify-center ${
                                isSelected
                                  ? "border-[#04714a] bg-white ring-4 ring-[#00a86b]/30 scale-125"
                                  : "border-black/30 bg-white hover:border-[#00a86b]"
                              }`}
                            >
                              {isSelected && (
                                <span className="size-2 rounded-full bg-[#04714a]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Labels under slider */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      {STORAGE_MARKS.map((mark) => {
                        const isSelected = storageMb === mark.value;
                        return (
                          <div
                            key={mark.value}
                            onClick={() => setStorageMb(mark.value)}
                            className={`p-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-white border border-[#00a86b]/40 shadow-xs"
                                : "hover:bg-black/5"
                            }`}
                          >
                            <span
                              className={`block font-bold text-sm ${
                                isSelected ? "text-[#04714a]" : "text-black/70"
                              }`}
                            >
                              {mark.label}
                            </span>
                            <span className="block text-[11px] text-black/50 mt-0.5">
                              {mark.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lý do xin tăng dung lượng */}
                  <div>
                    <label
                      htmlFor="storage_reason"
                      className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                    >
                      Lý do cần tăng dung lượng (tùy chọn)
                    </label>
                    <textarea
                      id="storage_reason"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ví dụ: Em đang thực hiện nghiên cứu khoa học với nhiều tệp PDF và bộ dữ liệu giáo trình chuyên ngành..."
                      className="w-full rounded-xl border border-black/15 bg-white p-4 text-sm text-[#11130f] outline-none transition-all placeholder:text-black/35 focus:border-[#00a86b] focus:ring-2 focus:ring-[#00a86b]/30"
                    />
                  </div>
                </div>
              )}

              {/* 3.3: BÁO LỖI HỆ THỐNG */}
              {requestType === "bug_report" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <p className="text-xs text-black/55">
                    Mô tả rõ lỗi bạn gặp phải để đội ngũ kỹ thuật UAI nhanh chóng kiểm tra và khắc phục.
                  </p>

                  {/* Tiêu đề lỗi */}
                  <div>
                    <label
                      htmlFor="bug_title"
                      className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                    >
                      Tiêu đề lỗi <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="bug_title"
                      type="text"
                      required
                      value={bugTitle}
                      onChange={(e) => {
                        setBugTitle(e.target.value);
                        if (errors.bug_title) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.bug_title;
                            return copy;
                          });
                        }
                      }}
                      placeholder="Ví dụ: Không thể tải tài liệu PDF trên trang Kho tri thức"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#11130f] outline-none transition-all placeholder:text-black/35 focus:ring-2 focus:ring-[#00a86b]/30 ${
                        errors.bug_title
                          ? "border-red-500 bg-red-50/20 form-error-anchor"
                          : "border-black/15 focus:border-[#00a86b]"
                      }`}
                    />
                    {errors.bug_title && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.bug_title}
                      </p>
                    )}
                  </div>

                  {/* Trang hoặc chức năng gặp lỗi */}
                  <div>
                    <label
                      htmlFor="affected_page"
                      className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                    >
                      Trang hoặc chức năng gặp sự cố (tùy chọn)
                    </label>
                    <input
                      id="affected_page"
                      type="text"
                      value={affectedPage}
                      onChange={(e) => setAffectedPage(e.target.value)}
                      placeholder="Ví dụ: /chat, /documents, Cửa sổ đăng nhập Microsoft..."
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[#11130f] outline-none transition-all placeholder:text-black/35 focus:border-[#00a86b] focus:ring-2 focus:ring-[#00a86b]/30"
                    />
                  </div>

                  {/* Mô tả chi tiết lỗi */}
                  <div>
                    <label
                      htmlFor="bug_description"
                      className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                    >
                      Mô tả chi tiết các bước xảy ra lỗi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="bug_description"
                      required
                      rows={4}
                      value={bugDescription || description}
                      onChange={(e) => {
                        setBugDescription(e.target.value);
                        setDescription(e.target.value);
                        if (errors.bug_description) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.bug_description;
                            return copy;
                          });
                        }
                      }}
                      placeholder="1. Em vào trang /knowledge&#10;2. Bấm nút Tải tệp lên&#10;3. Màn hình hiện thông báo lỗi mã 400..."
                      className={`w-full rounded-xl border bg-white p-4 text-sm text-[#11130f] outline-none transition-all placeholder:text-black/35 focus:ring-2 focus:ring-[#00a86b]/30 ${
                        errors.bug_description
                          ? "border-red-500 bg-red-50/20 form-error-anchor"
                          : "border-black/15 focus:border-[#00a86b]"
                      }`}
                    />
                    {errors.bug_description && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.bug_description}
                      </p>
                    )}
                  </div>

                  {/* Ảnh chụp màn hình lỗi (Tùy chọn) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="bug_screenshot"
                        className="text-xs font-semibold uppercase tracking-wider text-black/70"
                      >
                        Ảnh chụp màn hình lỗi (tùy chọn)
                      </label>
                      <span className="text-[11px] text-black/45">
                        PNG, JPG, WEBP (Tối đa 10 MB)
                      </span>
                    </div>

                    {!selectedFile ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-black/15 bg-[#fafaf9] rounded-2xl p-5 text-center cursor-pointer transition-colors hover:border-[#00a86b] hover:bg-[#e8f7ef]/20"
                      >
                        <input
                          ref={fileInputRef}
                          id="bug_screenshot"
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <div className="flex size-10 mx-auto items-center justify-center rounded-xl bg-black/5 text-[#04714a] mb-2">
                          <Paperclip size={18} />
                        </div>
                        <p className="text-xs font-semibold text-black/80">
                          Nhấn để đính kèm ảnh chụp màn hình
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-black/15 bg-white p-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {filePreview && (
                            <img
                              src={filePreview}
                              alt="Ảnh xem trước"
                              className="size-12 rounded-lg object-cover border border-black/10 shrink-0"
                            />
                          )}
                          <div className="truncate">
                            <p className="text-xs font-semibold text-black/90 truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-[11px] text-black/50">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="flex size-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* SUBMIT BUTTON */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-black/60 hover:text-black transition-colors"
              >
                <ArrowLeft size={16} />
                Quay lại Trang chủ
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#04714a] px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#03593a] hover:shadow-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Đang gửi thông tin...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Gửi yêu cầu đến quản trị viên
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Shared Footer */}
      <LandingFooter />
    </div>
  );
}
