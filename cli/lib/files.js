/**
 * `openlabor upload` / `openlabor download` — move files in and out of an
 * employee's workspace.
 *
 * Both are thin: the API already knows how to zip a folder and how to write a
 * file. What was missing was a way to ask for either without a browser, which
 * is what turns "migrate my team onto OpenLabor" from a day of drag-and-drop
 * into one command.
 */

import { readFileSync, writeFileSync, statSync, readdirSync, existsSync } from 'fs';
import { join, basename, relative, sep } from 'path';
import { requireAuth } from './auth.js';
import { createClient } from './api.js';
import { API_URL } from './config.js';
import { getEmployee } from './pilot.js';

/** Files that are never worth moving between machines. */
const SKIP_NAMES = new Set(['.DS_Store', 'Thumbs.db', '.git', 'node_modules', '__pycache__']);
/** Matches the server-side WRITE_FILE ceiling. */
const MAX_BYTES = 25 * 1024 * 1024;

function client() {
  return createClient({ apiUrl: API_URL, apiKey: requireAuth().api_key });
}

/** Every file under `dir`, depth-first, as {abs, rel} pairs. */
function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_NAMES.has(entry.name) || entry.name.startsWith('.')) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs, base));
    else if (entry.isFile()) out.push({ abs, rel: relative(base, abs).split(sep).join('/') });
  }
  return out;
}

/**
 * Upload a file or a whole directory into an employee's workspace.
 *
 * onFile({ rel, bytes, status }) is called per file so the caller can print
 * progress: a 200-file upload that prints nothing looks like a hang.
 */
export async function upload(employeeIdOrName, localPath, opts = {}) {
  const { dir: targetDir = '', overwrite = false } = opts;

  if (!existsSync(localPath)) throw new Error(`No such file or directory: ${localPath}`);
  const employee = await getEmployee(employeeIdOrName);
  const api = client();

  const stat = statSync(localPath);
  const files = stat.isDirectory()
    ? walk(localPath)
    : [{ abs: localPath, rel: basename(localPath) }];

  if (files.length === 0) throw new Error(`Nothing to upload from ${localPath}`);

  const results = { uploaded: 0, merged: [], skipped: [], failed: [] };

  for (const f of files) {
    const dest = targetDir ? `${targetDir.replace(/\/+$/, '')}/${f.rel}` : f.rel;

    const buf = readFileSync(f.abs);
    if (buf.length > MAX_BYTES) {
      results.skipped.push({ rel: dest, why: `too large (${(buf.length / 1048576).toFixed(1)}MB)` });
      opts.onFile?.({ rel: dest, status: 'skipped' });
      continue;
    }

    try {
      // The generated persona files (SOUL.md, MEMORY.md…) are not refused here
      // any more: the server folds an incoming version into what is already in
      // the workspace instead of replacing it, so an edit no longer has to go
      // around the CLI. It answers `merged` when it did, because the bytes on
      // disk are then not the bytes that were sent.
      const res = await api.post('/api/connectors/workspace/execute', {
        employeeId: employee.id,
        tool: 'WRITE_FILE',
        args: { path: dest, content_base64: buf.toString('base64'), overwrite },
      });
      const merged = !!res?.result?.merged;
      results.uploaded++;
      if (merged) results.merged.push({ rel: dest });
      opts.onFile?.({ rel: dest, bytes: buf.length, status: merged ? 'merged' : 'ok' });
    } catch (err) {
      // An existing file is a normal outcome without --overwrite, not a crash.
      const why = /already exists/i.test(err.message) ? 'exists (use --overwrite)' : err.message;
      results.failed.push({ rel: dest, why });
      opts.onFile?.({ rel: dest, status: 'failed', why });
    }
  }

  return { employee, ...results };
}

/**
 * Upload into the org's `shared/` folder, which every employee reads.
 *
 * Not a flag on `upload` by accident: the two take different routes. An
 * employee upload goes through that employee's workspace tool, which is fenced
 * to their own directory — `upload cmo x.md --dir shared` writes cmo/shared/x.md, a
 * private folder that merely looks shared. Reaching the real shared/ needs the
 * org-scoped workspace route, which is what this uses.
 */
export async function uploadToShared(localPath, opts = {}) {
  const { dir: subDir = '', overwrite = false } = opts;
  if (!existsSync(localPath)) throw new Error(`No such file or directory: ${localPath}`);

  const creds = requireAuth();
  const api = createClient({ apiUrl: API_URL, apiKey: creds.api_key });

  const stat = statSync(localPath);
  const files = stat.isDirectory()
    ? walk(localPath)
    : [{ abs: localPath, rel: basename(localPath) }];
  if (files.length === 0) throw new Error(`Nothing to upload from ${localPath}`);

  const results = { uploaded: 0, merged: [], skipped: [], failed: [] };

  for (const f of files) {
    const inner = subDir ? `${subDir.replace(/^\/+|\/+$/g, '')}/${f.rel}` : f.rel;
    const dest = `shared/${inner}`;

    // COMPANY.md is the company brain. Writing the file alone leaves the DB and
    // the memory backend behind, so the brain reads as empty everywhere except
    // on disk — `openlabor context set` is the one path that keeps all three
    // in step.
    if (basename(dest) === 'COMPANY.md') {
      results.skipped.push({ rel: dest, why: 'use `openlabor context set --file` instead' });
      opts.onFile?.({ rel: dest, status: 'skipped', why: 'use `openlabor context set --file`' });
      continue;
    }

    const buf = readFileSync(f.abs);
    if (buf.length > MAX_BYTES) {
      results.skipped.push({ rel: dest, why: `too large (${(buf.length / 1048576).toFixed(1)}MB)` });
      opts.onFile?.({ rel: dest, status: 'skipped' });
      continue;
    }

    try {
      if (!overwrite) {
        const existing = await api.get(`/api/workspace/file?path=${encodeURIComponent(dest)}`).catch(() => null);
        if (existing) {
          results.skipped.push({ rel: dest, why: 'exists (use --overwrite)' });
          opts.onFile?.({ rel: dest, status: 'skipped', why: 'exists (use --overwrite)' });
          continue;
        }
      }
      await api.put(`/api/workspace/file?path=${encodeURIComponent(dest)}`, {
        content: buf.toString('base64'),
        encoding: 'base64',
      });
      results.uploaded++;
      opts.onFile?.({ rel: dest, bytes: buf.length, status: 'ok' });
    } catch (err) {
      results.failed.push({ rel: dest, why: err.message });
      opts.onFile?.({ rel: dest, status: 'failed', why: err.message });
    }
  }

  return results;
}

/**
 * Download an employee's whole workspace as a zip.
 *
 * The server streams a zip for any directory, so the entire workspace is one
 * request — no per-file loop, and no chance of a half-copied tree.
 */
export async function download(employeeIdOrName, destPath) {
  const creds = requireAuth();
  const employee = await getEmployee(employeeIdOrName);

  // The workspace folder is named after template_id (custom hires carry their
  // own id there), which is what the API resolves paths against.
  const folder = employee.template_id || employee.id;
  const url = `${API_URL}/api/workspace/download?path=${encodeURIComponent(folder)}`;

  const res = await fetch(url, { headers: { 'X-API-Key': creds.api_key } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 403) {
      throw new Error(
        'Forbidden. Downloading a workspace needs a workspace key — run `openlabor login` ' +
        '(browser) rather than logging in with an employee key.',
      );
    }
    throw new Error(`Download failed: ${res.status} ${body.slice(0, 200)}`);
  }

  const out = destPath || `${folder}-workspace.zip`;
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  return { employee, path: out, bytes: statSync(out).size };
}
