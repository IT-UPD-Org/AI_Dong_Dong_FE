import { ApiError, authHeaders, buildApiUrl, describeError, handleUnauthorized } from './client';

export interface SseEvent {
  event: string;
  data: unknown;
  id?: string;
}

/**
 * POST to an endpoint that responds with Server-Sent Events and yield each event.
 *
 * EventSource only supports GET and cannot send the auth header, so streams
 * are read manually from the fetch response.
 */
export function streamSse(endpoint: string, body: BodyInit, signal?: AbortSignal): AsyncGenerator<SseEvent> {
  return readSse(endpoint, 'POST', body, signal);
}

/** GET an SSE endpoint (for example `/resume`) and yield each event. Never reconnects on its own. */
export function streamSseGet(endpoint: string, signal?: AbortSignal): AsyncGenerator<SseEvent> {
  return readSse(endpoint, 'GET', undefined, signal);
}

async function* readSse(
  endpoint: string,
  method: 'GET' | 'POST',
  body: BodyInit | undefined,
  signal?: AbortSignal,
): AsyncGenerator<SseEvent> {
  const headers = authHeaders({ Accept: 'text/event-stream' });
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(buildApiUrl(endpoint), { method, headers, body, signal });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError((error as Error).message || 'Lỗi kết nối mạng đến máy chủ.', 0);
  }

  handleUnauthorized(response.status);
  if (!response.ok || !response.body) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(describeError(errorData, response.status), response.status, errorData);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Events are separated by a blank line; normalize CRLF so both line endings work.
      buffer = buffer.replace(/\r\n/g, '\n');
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const parsed = parseEvent(raw);
        if (parsed) yield parsed;
      }
    }
    const trailing = parseEvent(buffer.trim());
    if (trailing) yield trailing;
  } finally {
    reader.releaseLock();
  }
}

function parseEvent(raw: string): SseEvent | null {
  if (!raw) return null;
  let event = 'message';
  let id: string | undefined;
  const dataLines: string[] = [];

  for (const line of raw.split('\n')) {
    if (!line || line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    // Per the SSE spec a single leading space after the colon is not part of the value.
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') event = value;
    else if (field === 'data') dataLines.push(value);
    else if (field === 'id') id = value;
  }

  if (dataLines.length === 0) return null;
  const text = dataLines.join('\n');
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    // Non-JSON payloads are passed through as raw text.
  }
  return { event, data, id };
}
