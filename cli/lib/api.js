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

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    patch: (path, body) => request('PATCH', path, body),
    del: (path) => request('DELETE', path),
  };
}
