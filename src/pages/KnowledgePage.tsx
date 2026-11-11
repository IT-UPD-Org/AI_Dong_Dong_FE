import { useLanguage } from "../contexts/LanguageContext";

export function KnowledgePage() {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  const categories = isEn
    ? [
        { title: "Academic life", desc: "Curated course information, schedules, and academic regulations." },
        { title: "Campus & services", desc: "Campus facilities, student support services, and university libraries." },
        { title: "Research & people", desc: "Scientific research projects, faculty profiles, and publications." },
      ]
    : [
        { title: "Đời sống học đường", desc: "Thông tin chương trình học, thời khóa biểu và quy chế đào tạo." },
        { title: "Cơ sở & dịch vụ", desc: "Cơ sở vật chất, dịch vụ hỗ trợ sinh viên và thư viện trường." },
        { title: "Nghiên cứu & nhân sự", desc: "Các đề tài nghiên cứu khoa học, giảng viên và công bố." },
      ];

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 text-foreground">
      <p className="font-mono text-xs uppercase tracking-[.18em] text-brand-text">
        {isEn ? "Explore the base" : "Khám phá cơ sở tri thức"}
      </p>
      <h1 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-.07em] text-foreground">
        {isEn ? "Knowledge" : "Cơ sở tri thức"}
      </h1>
      <p className="mt-4 max-w-xl text-fg-secondary">
        {isEn
          ? "Browse the living collection that helps Dong Dong AI answer with institutional context."
          : "Khám phá tập hợp dữ liệu giúp Đông Đông AI trả lời chính xác theo ngữ cảnh trường học."}
      </p>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {categories.map((cat, i) => (
          <div
            key={cat.title}
            className="rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <span className="font-mono text-xs text-brand-text">0{i + 1}</span>
            <h2 className="mt-16 text-xl font-semibold text-foreground">{cat.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {cat.desc}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
