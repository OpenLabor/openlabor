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
/** Matches the ceiling of a raw `POST /api/workspace/file` (streamed to storage). */
const MAX_BYTES = 100 * 1024 * 1024;

/**
 * The files OpenLabor writes at the root of an employee's folder, which ARE
 * the employee — who they are, how they speak, what they remember. Mirrors
 * `PERSONA_FILES_SET` in edge/src/provisioning/classifier.ts.
 *
 * The server used to fold an uploaded SOUL.md into the existing one. It does
 * not any more: a write replaces the file. An import that happened to carry a
 * SOUL.md from someone's old setup would silently swap the employee's identity
 * for a stranger's, so these are skipped, `--overwrite` or not. The dashboard
 * is where a persona is edited.
 */
const PERSONA_FILES = new Set([
  'SOUL.md', 'TONE.md', 'AGENTS.md', 'NOTES.md', 'MEMORY.md', 'BOOTSTRAP.md', 'TOOLS.md',
  'IDENTITY.md', 'HEARTBEAT.md', 'DREAMS.md', 'USER.md',
]);

function client() {
  return createClient({ apiUrl: API_URL, apiKey: requireAuth().api_key });
}

/**
 * A workspace path as the API wants it: forward slashes, no leading or trailing
 * slash, and no `..`. The server refuses `..` too, but with "Invalid path",
 * which does not say which part of the path was the problem. A Windows path
 * (`ads\\plan.md`) used to be sent as-is and land as a file whose NAME held a
 * backslash.
 */
export function cleanPath(p) {
  const parts = String(p || '').replace(/\\/g, '/').split('/').filter((seg) => seg && seg !== '.');
  if (parts.includes('..')) throw new Error(`A workspace path cannot contain "..": ${p}`);
  return parts.join('/');
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
 * What is at `path`: 'file', or null when nothing is.
 *
 * A folder answers 404 here too — `GET /workspace/file` reads files only —
 * which is what `rm` relies on to refuse one. 413 is a file too big to inline:
 * it exists.
 */
async function fileAt(api, path) {
  try {
    const file = await api.get(`/api/workspace/file?path=${encodeURIComponent(path)}`);
    return { revision: file?.revision, size: file?.size };
  } catch (err) {
    if (err.status === 404) return null;
    if (err.status === 413) return { size: err.body?.size };
    throw err;
  }
}

/**
 * Write one file's bytes at `dest`, unless something is already there and the
 * caller did not say --overwrite.
 *
 * ⚠️ This used to go through the employee's `WRITE_FILE` tool. That tool now
 * ignores `overwrite` (it replaced existing files without asking — SOUL.md
 * included — on older orgs, and answered 409 "supply its revision" on newer
 * ones even WITH --overwrite), and it refuses any binary file. The raw upload
 * route has neither problem, so the existence check lives here, where it can
 * be honest about what it found.
 */
async function putFile(api, dest, buf, overwrite) {
  if (!overwrite && await fileAt(api, dest)) return { status: 'skipped', why: 'exists (use --overwrite)' };
  await api.postRaw(`/api/workspace/file?path=${encodeURIComponent(dest)}`, buf);
  return { status: 'ok' };
}

async function uploadFiles(api, files, destOf, opts, refuse = () => null) {
  const results = { uploaded: 0, skipped: [], failed: [] };
  for (const f of files) {
    const dest = destOf(f);
    const refusal = refuse(dest);
    if (refusal) {
      results.skipped.push({ rel: dest, why: refusal });
      opts.onFile?.({ rel: dest, status: 'skipped', why: refusal });
      continue;
    }
    const buf = readFileSync(f.abs);
    if (buf.length > MAX_BYTES) {
      const why = `too large (${(buf.length / 1048576).toFixed(1)} MB, limit 100 MB)`;
      results.skipped.push({ rel: dest, why });
      opts.onFile?.({ rel: dest, status: 'skipped', why });
      continue;
    }
    try {
      const res = await putFile(api, dest, buf, opts.overwrite);
      if (res.status === 'skipped') {
        results.skipped.push({ rel: dest, why: res.why });
        opts.onFile?.({ rel: dest, status: 'skipped', why: res.why });
      } else {
        results.uploaded++;
        opts.onFile?.({ rel: dest, bytes: buf.length, status: 'ok' });
      }
    } catch (err) {
      results.failed.push({ rel: dest, why: err.message });
      opts.onFile?.({ rel: dest, status: 'failed', why: err.message });
    }
  }
  return results;
}

function localFiles(localPath) {
  if (!existsSync(localPath)) throw new Error(`No such file or directory: ${localPath}`);
  const files = statSync(localPath).isDirectory()
    ? walk(localPath)
    : [{ abs: localPath, rel: basename(localPath) }];
  if (files.length === 0) throw new Error(`Nothing to upload from ${localPath}`);
  return files;
}

/** The folder an employee's files live in — the same one `download` zips. */
export function folderOf(employee) {
  return employee.template_id || employee.id;
}

/**
 * Upload a file or a whole directory into an employee's workspace.
 *
 * Where it lands: `<employee-folder>/[--dir/]<name>`. A single file keeps its
 * NAME only (`upload seth ads/plan.md` writes `cmo/plan.md`); a folder keeps
 * the paths INSIDE it but not its own name. `--dir ads` is how to put either
 * under a subfolder.
 *
 * onFile({ rel, bytes, status }) is called per file so the caller can print
 * progress: a 200-file upload that prints nothing looks like a hang.
 */
export async function upload(employeeIdOrName, localPath, opts = {}) {
  const files = localFiles(localPath);
  const employee = await getEmployee(employeeIdOrName);
  const api = client();

  // ⚠️ Paths are relative to the WORKSPACE ROOT, not to the employee. Until
  // 3.0.1 this sent `f.rel` alone, so `openlabor upload seth ads/plan.md` wrote
  // `/workspace/ads/plan.md` — a folder at the top of the customer's workspace —
  // while printing `✓ ads/plan.md`. `folder` is the expression `download()`
  // resolves: upload and download have to name the same directory or one of
  // them is lying.
  const folder = folderOf(employee);
  const sub = cleanPath(opts.dir);

  const results = await uploadFiles(
    api,
    files,
    (f) => [folder, sub, cleanPath(f.rel)].filter(Boolean).join('/'),
    opts,
    (dest) => (dest.split('/').length === 2 && PERSONA_FILES.has(basename(dest))
      ? 'persona file — edit it in the dashboard'
      : null),
  );
  return { employee, ...results };
}

/**
 * Upload into the org's `shared/` folder, which every employee reads.
 *
 * Not a flag on `upload` by accident: `upload cmo x.md --dir shared` writes
 * cmo/shared/x.md, a private folder that merely looks shared. This one writes
 * the real shared/.
 */
export async function uploadToShared(localPath, opts = {}) {
  const files = localFiles(localPath);
  const api = client();
  const sub = cleanPath(opts.dir);

  return uploadFiles(
    api,
    files,
    (f) => ['shared', sub, cleanPath(f.rel)].filter(Boolean).join('/'),
    opts,
    // COMPANY.md is the company brain. Writing the file alone leaves the
    // database behind — `openlabor context set` keeps the two in step.
    (dest) => (basename(dest) === 'COMPANY.md' ? 'use `openlabor context set --file` instead' : null),
  );
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

/**
 * Resolve a path given on the command line against an employee's folder (or
 * `shared/` for `--shared`). Accepts it with or without the folder prefix,
 * since `ls` and `upload` both print the full path.
 */
function resolveIn(folder, relPath) {
  const clean = cleanPath(relPath);
  if (!clean) return folder;
  return clean === folder || clean.startsWith(`${folder}/`) ? clean : `${folder}/${clean}`;
}

async function target(employeeIdOrName, shared) {
  if (shared) return { employee: null, folder: 'shared', label: 'Shared' };
  const employee = await getEmployee(employeeIdOrName);
  return { employee, folder: folderOf(employee), label: employee.custom_name || employee.template_id };
}

function forbidden(err, what) {
  if (err.status === 403) {
    return new Error(
      `Forbidden. ${what} needs a workspace key — run \`openlabor login\` (browser) rather ` +
        'than logging in with an employee key.',
    );
  }
  return err;
}

/**
 * Remove ONE file from an employee's workspace (or from shared/).
 *
 * `upload` had no counterpart, so a file put in the wrong place stayed there
 * until somebody opened the dashboard. That happened on 2026-09-12: three
 * documents meant for the OutreachGuy CMO were pushed to OpenLabor's CMO first.
 *
 * ⚠️ **Files only, checked here.** The server's DELETE removes every file under
 * the path it is given, so 3.0.1's `openlabor rm cmo memory` erased the whole
 * folder and printed "Removed". A folder answers 404 to `GET /workspace/file`,
 * which is the check: nothing is deleted unless a FILE sits at exactly that
 * path. A missing file is an error rather than a quiet success.
 */
export async function rm(employeeIdOrName, relPath, opts = {}) {
  if (!cleanPath(relPath)) throw new Error('Missing path. Usage: openlabor rm <employee> <path-in-workspace>');
  const { employee, folder, label } = await target(employeeIdOrName, opts.shared);
  const dest = resolveIn(folder, relPath);
  if (dest === folder) throw new Error(`Refusing to remove the whole ${label} folder.`);
  const api = client();

  if (!(await fileAt(api, dest).catch((err) => { throw forbidden(err, 'Reading the workspace'); }))) {
    const tree = await listFiles(api, `${dest}/`).catch(() => []);
    if (tree.length) {
      throw new Error(`${dest} is a folder (${tree.length} file(s)). rm removes one file at a time.`);
    }
    throw new Error(`No such file in the workspace: ${dest}`);
  }
  await api.del(`/api/workspace/file?path=${encodeURIComponent(dest)}`)
    .catch((err) => { throw forbidden(err, 'Deleting'); });
  return { employee, label, path: dest };
}

/** Every file in the org whose path starts with `prefix`, flattened from the tree. */
async function listFiles(api, prefix) {
  const { tree } = await api.get('/api/workspace/tree');
  const out = [];
  const visit = (nodes) => {
    for (const node of nodes ?? []) {
      if (node.type === 'file' && typeof node.path === 'string' && node.path.startsWith(prefix)) {
        out.push({ path: node.path, bytes: node.size ?? 0, modified: node.modified ?? null });
      }
      visit(node.children);
    }
  };
  visit(tree);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * List the files in an employee's folder (or `shared/`), optionally under one
 * subfolder. Skills and secrets are not in the tree the API serves.
 */
export async function ls(employeeIdOrName, relDir, opts = {}) {
  const { employee, folder, label } = await target(employeeIdOrName, opts.shared);
  const dir = resolveIn(folder, relDir);
  const files = await listFiles(client(), `${dir}/`).catch((err) => { throw forbidden(err, 'Listing'); });
  return { employee, label, dir, files };
}

/**
 * Move or rename one file or folder inside an employee's folder (or shared/).
 *
 * The API has two verbs — rename in place, move to another parent keeping the
 * name — so a move that also renames is both, in that order.
 */
export async function mv(employeeIdOrName, fromRel, toRel, opts = {}) {
  const { employee, folder, label } = await target(employeeIdOrName, opts.shared);
  const from = resolveIn(folder, fromRel);
  const intoDir = /[\\/]$/.test(String(toRel || ''));
  const to = resolveIn(folder, toRel);
  if (from === folder || to === folder && !intoDir) throw new Error('Refusing to move the employee folder itself.');
  const api = client();

  const parentOf = (p) => p.split('/').slice(0, -1).join('/');
  const nameOf = (p) => p.split('/').pop();
  const destParent = intoDir ? to : parentOf(to);
  const destName = intoDir ? nameOf(from) : nameOf(to);

  let current = from;
  try {
    if (destParent !== parentOf(from)) {
      const moved = await api.post('/api/workspace/move', { fromPath: current, toParentPath: destParent });
      current = moved?.path || `${destParent}/${nameOf(current)}`;
    }
    if (destName !== nameOf(current)) {
      const renamed = await api.post('/api/workspace/rename', { oldPath: current, newPath: destName });
      current = renamed?.path || `${parentOf(current)}/${destName}`;
    }
  } catch (err) {
    if (err.status === 409) throw new Error(`Could not move ${from}: it does not exist, or ${destParent}/${destName} already does.`);
    throw forbidden(err, 'Moving');
  }
  return { employee, label, from, to: current };
}
