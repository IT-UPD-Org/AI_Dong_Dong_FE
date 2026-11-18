import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  GraduationCap,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHashLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace(/^#/, "");

    if (location.pathname === "/") {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", href);
        return;
      }
    }
    navigate(`/${href}`);
  };

  return (
    <footer className="relative overflow-hidden border-t border-footer-border bg-footer text-footer-foreground">
      {/* Decorative background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-40 size-[420px] rounded-full bg-brand-bright/10 blur-[120px]"
      />

      <div className="relative mx-auto max-w-[1600px] px-6 md:px-12">
        {/* Main Banner CTA */}
        <div className="border-b border-footer-border py-16 md:py-24">
          <div className="grid gap-10 md:grid-cols-[1.4fr_0.6fr] md:items-end">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-bright/20 bg-brand-bright/5 px-3 py-1.5">
                <Sparkles size={13} className="text-footer-brand" />
                <span className="mono text-[10px] uppercase tracking-[.16em] text-footer-brand">
                  University Artificial Intelligence
                </span>
              </div>

              <h2 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.055em] md:text-6xl lg:text-7xl">
                Tri thức kết nối.
                <br />
                <span className="text-footer-brand">Tương lai rộng mở.</span>
              </h2>

              <p className="mt-6 max-w-xl text-sm leading-7 text-footer-muted md:text-base">
                Đông Đông AI — trợ lý trí tuệ nhân tạo đồng hành cùng cộng đồng
                Đại học Phương Đông trong học tập, nghiên cứu và công việc hằng
                ngày.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row md:justify-end">
              <Link
                to="/approve"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
              >
                <ShieldCheck size={16} />
                Cấp phép tài khoản
              </Link>
              <Link
                to="/contributors"
                className="group inline-flex items-center justify-center gap-3 rounded-full border border-footer-border px-6 py-3 text-sm font-medium text-footer-foreground transition-colors hover:border-footer-brand hover:text-footer-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
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
              className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl border border-brand-bright/20 bg-brand-bright/10">
                <GraduationCap size={25} className="text-footer-brand" />
              </div>

              <div>
                <p className="text-lg font-semibold tracking-tight">
                  Đông Đông AI
                </p>
                <p className="mono mt-0.5 text-[10px] uppercase tracking-[.15em] text-footer-muted">
                  UAI-01 · PDU
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-xs text-xs leading-6 text-footer-muted">
              Sản phẩm GenAI thử nghiệm phục vụ hoạt động đào tạo và nghiên cứu
              của Trường Đại học Phương Đông.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <a
                href="mailto:contact@phuongdong.edu.vn"
                className="inline-flex items-center gap-1.5 rounded-full border border-footer-border px-3 py-1 text-footer-muted transition-colors hover:border-footer-brand hover:text-footer-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
              >
                <Mail size={12} />
                <span>Liên hệ quản trị</span>
              </a>
              <Link
                to="/donate"
                className="inline-flex items-center gap-1.5 rounded-full border border-footer-border px-3 py-1 text-footer-muted transition-colors hover:border-footer-brand hover:text-footer-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
              >
                <span>Ủng hộ dự án</span>
                <ArrowUpRight size={11} />
              </Link>
            </div>
          </div>

          {/* Links groups */}
          {navigation.map((group) => (
            <div key={group.title}>
              <p className="mono mb-5 text-[10px] uppercase tracking-[.18em] text-footer-muted font-semibold">
                {group.title}
              </p>

              <ul className="space-y-3.5">
                {group.links.map((item) => {
                  const isExternal = item.isExternal;
                  const isHash = item.href.startsWith("#");

                  if (isExternal) {
                    return (
                      <li key={item.label}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 text-sm text-footer-muted transition-colors hover:text-footer-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright rounded"
                        >
                          <span>{item.label}</span>
                          <ExternalLink size={12} className="opacity-70" />
                        </a>
                      </li>
                    );
                  }

                  if (isHash) {
                    return (
                      <li key={item.label}>
                        <a
                          href={`/${item.href}`}
                          onClick={(e) => handleHashLink(e, item.href)}
                          className="text-sm text-footer-muted transition-colors hover:text-footer-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright rounded"
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
                        className="text-sm text-footer-muted transition-colors hover:text-footer-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright rounded"
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
            <p className="mono mb-5 text-[10px] uppercase tracking-[.18em] text-footer-muted font-semibold">
              Cộng đồng
            </p>

            <div className="flex items-center">
              <div className="flex -space-x-2.5">
                {contributors.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    title={c.name}
                    className="flex size-9 items-center justify-center rounded-full border-2 border-footer text-[10px] font-bold text-[#11130f]"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.initials}
                  </div>
                ))}
              </div>

              <span className="ml-3 text-xs text-footer-muted">
                {contributors.length}+ thành viên
              </span>
            </div>

            <Link
              to="/contributors"
              className="group mt-5 inline-flex items-center gap-2 text-sm text-footer-muted transition-colors hover:text-footer-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright rounded"
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
        <div className="flex flex-col gap-4 border-t border-footer-border py-6 text-xs text-footer-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Đông Đông AI · Trường Đại học Phương Đông</p>

          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-brand-bright" />
            <span>Phát triển vì cộng đồng sinh viên & giảng viên PDU</span>
          </div>

          <button
            type="button"
            onClick={handleScrollToTop}
            className="inline-flex items-center gap-2 transition-colors hover:text-footer-brand cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright rounded text-footer-muted"
          >
            Về đầu trang
            <ArrowDownRight size={14} className="rotate-[-135deg]" />
          </button>
        </div>
      </div>
    </footer>
  );
}
