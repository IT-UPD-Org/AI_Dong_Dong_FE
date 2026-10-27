import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  GraduationCap,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { contributors } from "../../mocks/data";

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

interface NavGroup {
  title: string;
  links: FooterLink[];
}

const navigation: NavGroup[] = [
  {
    title: "Khám phá",
    links: [
      { label: "Trợ lý AI", href: "#ai-assistant" },
      { label: "Kho tri thức số", href: "#knowledge" },
      { label: "Hỗ trợ hành chính", href: "#administration" },
    ],
  },
  {
    title: "Dịch vụ & Cấp phép",
    links: [
      { label: "Cấp phép tài khoản", href: "/approve" },
      { label: "Yêu cầu tăng dung lượng", href: "/approve?type=storage_increase" },
      { label: "Báo lỗi hệ thống", href: "/approve?type=bug_report" },
      { label: "Đóng góp phát triển", href: "/donate" },
    ],
  },
  {
    title: "Nhà trường & Cộng đồng",
    links: [
      { label: "Đội ngũ phát triển", href: "/contributors" },
      {
        label: "Đại học Phương Đông",
        href: "https://phuongdong.edu.vn",
        isExternal: true,
      },
      {
        label: "Cổng tuyển sinh PDU",
        href: "https://tuyensinh.phuongdong.edu.vn",
        isExternal: true,
      },
    ],
  },
];

export function LandingFooter() {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative overflow-hidden bg-[#11130f] text-white">
      {/* Decorative background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-40 size-[420px] rounded-full bg-[#00a86b]/10 blur-[120px]"
      />

      <div className="relative mx-auto max-w-[1600px] px-6 md:px-12">
        {/* Main Banner CTA */}
        <div className="border-b border-white/10 py-16 md:py-24">
          <div className="grid gap-10 md:grid-cols-[1.4fr_0.6fr] md:items-end">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#68d9a7]/20 bg-[#68d9a7]/5 px-3 py-1.5">
                <Sparkles size={13} className="text-[#68d9a7]" />
                <span className="mono text-[10px] uppercase tracking-[.16em] text-[#68d9a7]">
                  University Artificial Intelligence
                </span>
              </div>

              <h2 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.055em] md:text-6xl lg:text-7xl">
                Tri thức kết nối.
                <br />
                <span className="text-[#68d9a7]">Tương lai rộng mở.</span>
              </h2>

              <p className="mt-6 max-w-xl text-sm leading-7 text-white/50 md:text-base">
                Đông Đông AI — trợ lý trí tuệ nhân tạo đồng hành cùng cộng đồng
                Đại học Phương Đông trong học tập, nghiên cứu và công việc hằng
                ngày.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row md:justify-end">
              <Link
                to="/approve"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#04714a] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#03593a] hover:shadow-lg hover:shadow-[#00a86b]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68d9a7]"
              >
                <ShieldCheck size={16} />
                Cấp phép tài khoản
              </Link>
              <Link
                to="/contributors"
                className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-[#68d9a7] hover:text-[#68d9a7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68d9a7]"
              >
                Đội ngũ phát triển
                <ArrowUpRight
                  size={15}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer navigation */}
        <div className="grid gap-12 py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-8">
          {/* Brand & info */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68d9a7] rounded-lg"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl border border-[#68d9a7]/20 bg-[#68d9a7]/10">
                <GraduationCap size={25} className="text-[#68d9a7]" />
              </div>

              <div>
                <p className="text-lg font-semibold tracking-tight">
                  Đông Đông AI
                </p>
                <p className="mono mt-0.5 text-[10px] uppercase tracking-[.15em] text-white/40">
                  UAI-01 · PDU
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-6 text-white/45">
              Nền tảng trí tuệ nhân tạo chuyên biệt được xây dựng hướng tới nhu
              cầu học tập, nghiên cứu và thủ tục hành chính của Trường Đại học
              Phương Đông.
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs text-white/60">
              <Mail size={14} className="text-[#68d9a7]" />
              <span>Tiếp nhận: </span>
              <a
                href="mailto:dung.nm@phuongdong.edu.vn"
                className="text-white/80 hover:text-[#68d9a7] transition-colors underline"
              >
                dung.nm@phuongdong.edu.vn
              </a>
            </div>
          </div>

          {/* Navigation Groups */}
          {navigation.map((group) => (
            <div key={group.title}>
              <p className="mono mb-5 text-[10px] uppercase tracking-[.18em] text-white/40 font-semibold">
                {group.title}
              </p>

              <ul className="space-y-3.5">
                {group.links.map((item) => {
                  const isHash = item.href.startsWith("#");

                  if (item.isExternal) {
                    return (
                      <li key={item.label}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-white/65 transition-colors hover:text-[#68d9a7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68d9a7] rounded"
                        >
                          {item.label}
                          <ExternalLink size={12} className="opacity-60" />
                        </a>
                      </li>
                    );
                  }

                  if (isHash) {
                    return (
                      <li key={item.label}>
                        <a
                          href={item.href}
                          className="text-sm text-white/65 transition-colors hover:text-[#68d9a7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68d9a7] rounded"
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li key={item.label}>
                      <Link
                        to={item.href}
                        className="text-sm text-white/65 transition-colors hover:text-[#68d9a7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68d9a7] rounded"
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Contributors summary */}
          <div>
            <p className="mono mb-5 text-[10px] uppercase tracking-[.18em] text-white/40 font-semibold">
              Cộng đồng
            </p>

            <div className="flex items-center">
              <div className="flex -space-x-2.5">
                {contributors.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    title={c.name}
                    className="flex size-9 items-center justify-center rounded-full border-2 border-[#11130f] text-[10px] font-bold text-black"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.initials}
                  </div>
                ))}
              </div>

              <span className="ml-3 text-xs text-white/50">
                {contributors.length}+ thành viên
              </span>
            </div>

            <Link
              to="/contributors"
              className="group mt-5 inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-[#68d9a7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68d9a7] rounded"
            >
              Gặp gỡ đội ngũ phát triển
              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Đông Đông AI · Trường Đại học Phương Đông</p>

          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#68d9a7]" />
            <span>Phát triển vì cộng đồng sinh viên & giảng viên PDU</span>
          </div>

          <button
            type="button"
            onClick={handleScrollToTop}
            className="inline-flex items-center gap-2 transition-colors hover:text-[#68d9a7] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68d9a7] rounded"
          >
            Về đầu trang
            <ArrowDownRight size={14} className="rotate-[-135deg]" />
          </button>
        </div>
      </div>
    </footer>
  );
}
