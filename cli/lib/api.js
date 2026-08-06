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
   * Same request, multipart body. One endpoint needs it — POST /employees/custom
   * takes an avatar, so it parses form data and rejects JSON. Content-Type is
   * omitted deliberately: fetch derives it from the FormData, boundary included,
   * and setting it by hand produces a boundary-less header the server can't split.
   */
  async function requestForm(method, path, fields) {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined && v !== null && v !== '') form.append(k, String(v));
    }

    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'X-API-Key': apiKey },
      body: form,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new ApiError(errBody?.error || `Request failed: ${res.status}`, res.status, errBody);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    postForm: (path, fields) => requestForm('POST', path, fields),
    put: (path, body) => request('PUT', path, body),
    patch: (path, body) => request('PATCH', path, body),
    del: (path) => request('DELETE', path),
  };
}
