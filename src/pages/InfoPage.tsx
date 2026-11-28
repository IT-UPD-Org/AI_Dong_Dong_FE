export function InfoPage({
  title,
  eyebrow,
  body,
}: {
  title: string;
  eyebrow: string;
  body: string;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 text-foreground sm:px-6 sm:py-16 md:px-12 md:py-24">
      <p className="mono text-xs uppercase tracking-[.18em] text-brand-text">
        {eyebrow}
      </p>
      <h1 className="mt-4 sm:mt-6 max-w-3xl break-words text-3xl font-extrabold tracking-[-.06em] text-foreground sm:text-5xl md:text-7xl">
        {title}
      </h1>
      <p className="mt-6 sm:mt-10 max-w-xl text-base leading-7 sm:text-xl sm:leading-8 text-fg-secondary">
        {body}
      </p>
      <div className="mt-12 sm:mt-20 h-px bg-border" />
    </main>
  );
}
