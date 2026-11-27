/**
 * Parsing of the `<LinkFile id="..."/>` and `<LinkKnowledge id="..."/>` tags the
 * assistant may put in a reply. The tags are never rendered as HTML: they are cut
 * out of the markdown and replaced by cards, and only plain digit IDs are accepted.
 */

export type LinkKind = "file" | "knowledge";

export type LinkSegment =
  | { type: "markdown"; text: string }
  | { type: "link"; kind: LinkKind; id: string };

// Exactly `<LinkFile id="123"/>`, tolerating spaces, single/double quotes and `></LinkFile>`.
const TAG = /<Link(File|Knowledge)\s+id\s*=\s*(["'])(\d{1,20})\2\s*(?:\/>|>\s*<\/Link\1\s*>)/g;
const NAMES = ["<LinkFile", "<LinkKnowledge"];
const OPEN_IN_PROGRESS = /^<Link(?:File|Knowledge)(?:\s[^<>]*)?$/;
const OPEN_DONE = /^<Link(File|Knowledge)\s+id\s*=\s*(["'])\d{1,20}\2\s*>\s*([\s\S]*)$/;

type Range = [number, number];

/** Code fences and inline code: tags written there are examples, not links. */
function codeRanges(text: string): Range[] {
  const ranges: Range[] = [];
  let pos = 0;
  let open: { ch: string; len: number; start: number } | null = null;
  for (const line of text.split("\n")) {
    const m = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (!open) {
      if (m) open = { ch: m[1][0], len: m[1].length, start: pos };
    } else if (m && m[1][0] === open.ch && m[1].length >= open.len && line.trim() === m[1]) {
      ranges.push([open.start, pos + line.length]);
      open = null;
    }
    pos += line.length + 1;
  }
  if (open) ranges.push([open.start, text.length]);

  for (const m of text.matchAll(/`[^`\n]*`/g)) {
    const start = m.index ?? 0;
    ranges.push([start, start + m[0].length]);
  }
  return ranges;
}

const inside = (ranges: Range[], index: number) => ranges.some(([a, b]) => index >= a && index < b);

function isPartialTag(tail: string): boolean {
  if (NAMES.some((name) => name.startsWith(tail))) return true; // "<", "<Li", "<LinkFi"...
  if (OPEN_IN_PROGRESS.test(tail)) return true; // `<LinkFile id="12`, `<LinkFile id="12"/`
  const done = tail.match(OPEN_DONE); // `<LinkFile id="12"></LinkFi`
  if (done) return `</Link${done[1]}>`.startsWith(done[3]);
  return false;
}

/** While a reply streams, drop a trailing tag that is not finished yet. */
export function hidePartialTag(content: string): string {
  const ranges = codeRanges(content);
  for (const needle of ["<Link", "<"]) {
    const index = content.lastIndexOf(needle);
    if (index === -1 || inside(ranges, index)) continue;
    if (isPartialTag(content.slice(index))) return content.slice(0, index);
  }
  return content;
}

/** Split reply markdown into markdown pieces and link tags, in order. */
export function splitLinkTags(content: string): LinkSegment[] {
  const text = hidePartialTag(content);
  if (!text.includes("<Link")) return text ? [{ type: "markdown", text }] : [];

  const ranges = codeRanges(text);
  const segments: LinkSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(TAG)) {
    const start = m.index ?? 0;
    if (inside(ranges, start)) continue;
    if (start > last) segments.push({ type: "markdown", text: text.slice(last, start) });
    segments.push({ type: "link", kind: m[1] === "File" ? "file" : "knowledge", id: m[3] });
    last = start + m[0].length;
  }
  if (last < text.length) segments.push({ type: "markdown", text: text.slice(last) });
  // Drop pieces left empty by the cut, including a bare list marker ("- ", "2. ") whose item was the tag.
  return segments.filter((s) => s.type === "link" || !/^\s*(?:[-*+]|\d+[.)])?\s*$/.test(s.text));
}