export interface ServerEvent {
  event: string;
  data: string;
}

/** Read complete SSE events even when HTTP chunks split lines or UTF-8 characters. */
export async function* readServerEvents(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<ServerEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let event = "";
  let data: string[] = [];

  function consumeLine(line: string): ServerEvent | undefined {
    if (line === "") {
      const result = data.length ? { event: event || "message", data: data.join("\n") } : undefined;
      event = "";
      data = [];
      return result;
    }
    if (line.startsWith(":")) return;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
    if (field === "event") event = value;
    if (field === "data") data.push(value);
  }

  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    while (true) {
      signal?.throwIfAborted();
      const { done, value } = await reader.read();
      signal?.throwIfAborted();
      buffer += decoder.decode(value, { stream: !done });

      let newline = buffer.search(/[\r\n]/);
      while (newline !== -1) {
        // A CR at the end of a chunk may still be followed by LF in the next chunk.
        if (!done && buffer[newline] === "\r" && newline === buffer.length - 1) break;
        const line = buffer.slice(0, newline);
        const length = buffer[newline] === "\r" && buffer[newline + 1] === "\n" ? 2 : 1;
        buffer = buffer.slice(newline + length);
        const result = consumeLine(line);
        if (result) yield result;
        newline = buffer.search(/[\r\n]/);
      }

      if (done) {
        if (buffer) consumeLine(buffer);
        const lastEvent = consumeLine("");
        if (lastEvent) yield lastEvent;
        return;
      }
    }
  } finally {
    signal?.removeEventListener("abort", cancel);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
