import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, School } from 'lucide-react';

export function RegisterPage() {
  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-black/55 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} /> Trở về trang chủ
        </Link>

        <p className="font-mono text-xs uppercase tracking-[.18em] text-[#04714a]">
          Kích hoạt tài khoản
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-.06em] md:text-5xl text-[#11130f]">
          Không cần đăng ký trước.
        </h1>
        <p className="mt-3 text-sm text-black/60 leading-relaxed">
          Hệ thống IT UPD GenAI liên kết trực tiếp với email nhà trường. Tất cả sinh viên và cán bộ giảng viên đều đã có tài khoản sẵn sàng sử dụng.
        </p>

        <div className="mt-8 rounded-2xl border border-black/10 bg-[#fcfcfb] p-5">
          <div className="flex items-center gap-3 text-[#04714a] font-semibold text-sm mb-2">
            <School size={18} />
            <span>Tên miền hợp lệ</span>
          </div>
          <ul className="text-xs text-black/60 space-y-1.5 list-disc list-inside">
            <li><strong>Giảng viên & Cán bộ:</strong> @phuongdong.edu.vn</li>
            <li><strong>Sinh viên:</strong> @pduni.edu.vn</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#11130f] px-4 py-3 font-semibold text-white hover:bg-[#04714a] transition-colors"
          >
            Đăng nhập bằng Email nhà trường <ArrowRight size={16} />
          </Link>
          <Link
            to="/approve"
            className="flex items-center justify-center rounded-xl border border-black/15 px-4 py-2.5 text-xs font-medium text-black/70 hover:border-[#00a86b] hover:text-[#04714a] transition-colors"
          >
            Yêu cầu cấp phép ngoài trường
          </Link>
        </div>
      </div>
    </main>
  );
}
