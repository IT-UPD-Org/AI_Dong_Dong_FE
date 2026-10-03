import { BrandMark } from "./BrandMark";

type PageLoaderProps = {
  label?: string;
  content?: boolean;
};

export function PageLoader({ label = "Đang tải trang...", content = false }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`brand-loader grid place-items-center bg-[#f8faf9] px-6 ${
        content ? "min-h-[calc(100svh-80px)]" : "min-h-svh"
      }`}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="brand-loader__stage relative grid size-20 place-items-center">
          <span aria-hidden="true" className="brand-loader__shadow" />
          <span aria-hidden="true" className="brand-loader__object">
            <BrandMark className="brand-loader__face brand-loader__face--front" />
            <BrandMark className="brand-loader__face brand-loader__face--back" />
          </span>
        </div>
        <p className="text-xs font-medium tracking-wide text-[#425e50]">{label}</p>
      </div>
    </div>
  );
}
