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
    <main className="px-4 py-6 sm:px-6 sm:py-8 text-zinc-900 dark:text-gray-100">
      <p className="font-mono text-xs uppercase tracking-[.18em] text-[#04714a] dark:text-emerald-400">
        {isEn ? "Explore the base" : "Khám phá cơ sở tri thức"}
      </p>
      <h1 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-.07em] text-gray-900 dark:text-white">
        {isEn ? "Knowledge" : "Cơ sở tri thức"}
      </h1>
      <p className="mt-4 max-w-xl text-black/55 dark:text-gray-400">
        {isEn
          ? "Browse the living collection that helps Dong Dong AI answer with institutional context."
          : "Khám phá tập hợp dữ liệu giúp Đông Đông AI trả lời chính xác theo ngữ cảnh trường học."}
      </p>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {categories.map((cat, i) => (
          <div
            key={cat.title}
            className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1e1e1e]"
          >
            <span className="font-mono text-xs text-[#00a86b] dark:text-emerald-400">0{i + 1}</span>
            <h2 className="mt-16 text-xl font-semibold text-gray-900 dark:text-white">{cat.title}</h2>
            <p className="mt-3 text-sm leading-6 text-black/50 dark:text-gray-400">
              {cat.desc}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
