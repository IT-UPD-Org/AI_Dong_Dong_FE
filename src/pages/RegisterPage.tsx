import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, School } from 'lucide-react';

export function RegisterPage() {
  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Trở về trang chủ
        </Link>

        <p className="font-mono text-xs uppercase tracking-[.18em] text-brand-text">
          Kích hoạt tài khoản
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-.06em] md:text-5xl text-foreground">
          Không cần đăng ký trước.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Hệ thống IT UPD GenAI liên kết trực tiếp với email nhà trường. Tất cả sinh viên và cán bộ giảng viên đều đã có tài khoản sẵn sàng sử dụng.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3 text-brand-text font-semibold text-sm mb-2">
            <School size={18} />
            <span>Tên miền hợp lệ</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li><strong>Giảng viên & Cán bộ:</strong> @phuongdong.edu.vn</li>
            <li><strong>Sinh viên:</strong> @pduni.edu.vn</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 font-semibold text-background hover:bg-brand hover:text-brand-foreground transition-colors"
          >
            Đăng nhập bằng Email nhà trường <ArrowRight size={16} />
          </Link>
          <Link
            to="/approve"
            className="flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-fg-secondary hover:border-brand-bright hover:text-brand-text transition-colors"
          >
            Cấp phép tài khoản
          </Link>
        </div>
      </div>
    </main>
  );
}
