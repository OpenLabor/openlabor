/**
 * Lightweight HTTP client for the OpenLabor API.
 * Zero external dependencies — uses Node's built-in fetch (Node 18+).
 */

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Create an API client bound to a base URL and API key.
 * Auth is via X-API-Key header (not Bearer token).
 */
export function createClient({ apiUrl, apiKey }) {
  const base = apiUrl.replace(/\/+$/, '');

  async function request(method, path, body) {
    const url = `${base}${path}`;
    const headers = {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    };

    const opts = { method, headers };
    if (body !== undefined) {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(url, opts);

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      let msg = errBody?.error || `Request failed: ${res.status}`;

      // Say what to do, not just what happened. "Request failed: 401" tells a
      // caller — human or agent — nothing it can act on, and these two statuses
      // have exactly one remedy each.
      if (res.status === 401) {
        msg = 'Not authenticated (401). Your key is missing, invalid or revoked — run `openlabor login`.';
      } else if (res.status === 403 && errBody?.error === 'guest_forbidden') {
        msg = 'Forbidden (403). This key only covers one employee. Run `openlabor login` to get a workspace key.';
      }

      throw new ApiError(msg, res.status, errBody);
    }

    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  }

  /**
   * Send a file's own bytes as the body. `POST /api/workspace/file` streams an
   * `application/octet-stream` body straight into storage (up to 100 MB, binary
   * included), which the JSON routes cannot: they hold text, and refused a PNG
   * as "decodes to binary". fetch sets Content-Length from the Buffer, and the
   * route refuses a raw upload without one.
   */
  async function requestRaw(method, path, bytes) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/octet-stream' },
      body: bytes,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new ApiError(errBody?.error || `Request failed: ${res.status}`, res.status, errBody);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  /**
   * POST a JSON body and read the answer as server-sent events, calling
   * onEvent(parsed) for each `data:` line. Resolves when the stream closes.
   */
  async function stream(path, body, onEvent) {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      const errBody = await res.json().catch(() => null);
      let msg = errBody?.error || `Request failed: ${res.status}`;
      if (typeof msg !== 'string') msg = JSON.stringify(msg);
      if (res.status === 401) {
        msg = 'Not authenticated (401). Your key is missing, invalid or revoked — run `openlabor login`.';
      }
      throw new ApiError(msg, res.status, errBody);
    }
    const decoder = new TextDecoder();
    let buffer = '';
    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk, { stream: true });
      let nl;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).replace(/\r$/, '');
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data) continue;
        try { onEvent(JSON.parse(data)); } catch { /* not JSON — ignore */ }
      }
    }
  }

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    postRaw: (path, bytes) => requestRaw('POST', path, bytes),
    stream,
    put: (path, body) => request('PUT', path, body),
    patch: (path, body) => request('PATCH', path, body),
    del: (path) => request('DELETE', path),
  };
}
