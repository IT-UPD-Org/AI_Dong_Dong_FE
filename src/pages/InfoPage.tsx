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
    <main className="mx-auto max-w-5xl px-6 py-24 text-foreground md:px-12">
      <p className="mono text-xs uppercase tracking-[.18em] text-brand-text">
        {eyebrow}
      </p>
      <h1 className="mt-6 max-w-3xl break-words text-4xl font-extrabold tracking-[-.08em] text-foreground sm:text-6xl md:text-8xl">
        {title}
      </h1>
      <p className="mt-10 max-w-xl text-xl leading-8 text-fg-secondary">
        {body}
      </p>
      <div className="mt-20 h-px bg-border" />
    </main>
  );
}
