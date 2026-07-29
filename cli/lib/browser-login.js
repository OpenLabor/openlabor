/**
 * Browser login (device flow) for `openlabor login`.
 *
 * The CLI has no credentials yet, so it cannot ask the API "who am I". Instead
 * it asks the server to open a login attempt, shows the user a short code, and
 * waits while they confirm it in a browser where they are already signed in.
 * The server hands back a workspace API key once — the CLI stores that.
 *
 * Pasting a key by hand still works (`--key`), but it is no longer the default:
 * the settings page lists several kinds of key and the wrong one silently fails
 * on org-wide calls.
 */

import { execFile } from 'child_process';
import { createClient } from './api.js';

const DEFAULT_API_URL = 'https://api.openlabor.ai';

/** Open a URL in the user's default browser. Best-effort: never throws. */
function openBrowser(url) {
  const cmd =
    process.platform === 'darwin' ? 'open' :
    process.platform === 'win32' ? 'cmd' :
    'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    execFile(cmd, args, () => {});
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Run the whole flow. `onPrompt({ userCode, verificationUrl, opened })` is
 * called once the code is ready so the caller owns all the printing.
 *
 * Resolves to the same credential shape as resolveApiKey().
 */
export async function browserLogin(apiUrl, onPrompt) {
  const base = (apiUrl || DEFAULT_API_URL).replace(/\/+$/, '');
  // No key yet — /cli-auth/start and /cli-auth/poll are the two unauthenticated
  // endpoints in the API, for exactly this reason.
  const client = createClient({ apiUrl: base, apiKey: '' });

  let start;
  try {
    start = await client.post('/cli-auth/start', {});
  } catch (err) {
    throw new Error(
      `Could not reach ${base}. ${err.message}\n` +
      `If this server predates browser login, use: openlabor login --key <api-key>`,
    );
  }

  const opened = openBrowser(start.verification_url);
  if (typeof onPrompt === 'function') {
    onPrompt({ userCode: start.user_code, verificationUrl: start.verification_url, opened });
  }

  const intervalMs = Math.max(1, Number(start.interval) || 2) * 1000;
  const deadline = Date.now() + (Number(start.expires_in) || 600) * 1000;

  while (Date.now() < deadline) {
    await sleep(intervalMs);

    let poll;
    try {
      poll = await client.get(`/cli-auth/poll?device_code=${encodeURIComponent(start.device_code)}`);
    } catch {
      // A blip in the network is not a failed login: the code is still valid
      // server-side, so keep polling until the deadline says otherwise.
      continue;
    }

    if (poll.status === 'approved') {
      return {
        api_key: poll.api_key,
        api_url: base,
        company_id: poll.org_id || null,
        company_name: poll.org_name || null,
      };
    }
    if (poll.status === 'denied') throw new Error('Login was denied in the browser.');
    if (poll.status === 'expired') break;
  }

  throw new Error('Login timed out. Run `openlabor login` again.');
}
