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
      const msg = errBody?.error || `Request failed: ${res.status}`;
      throw new ApiError(msg, res.status, errBody);
    }

    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  }

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    patch: (path, body) => request('PATCH', path, body),
    del: (path) => request('DELETE', path),
  };
}
