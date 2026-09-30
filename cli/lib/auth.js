import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CREDENTIALS_DIR = join(homedir(), '.openlabor');
const CREDENTIALS_FILE = join(CREDENTIALS_DIR, 'credentials.json');
const SESSIONS_FILE = join(CREDENTIALS_DIR, 'sessions.json');

/**
 * Load stored credentials (api_key, api_url, company_id).
 * Returns null if not logged in.
 */
export function loadCredentials() {
  if (!existsSync(CREDENTIALS_FILE)) return null;
  // A file written by an older CLI is still world-readable; close it on sight
  // rather than waiting for the next login.
  try { chmodSync(CREDENTIALS_FILE, 0o600); chmodSync(CREDENTIALS_DIR, 0o700); } catch { /* not ours / Windows */ }
  try {
    return JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * The folder holds a workspace key, so nobody but its owner may read it.
 *
 * Both used to be written with the default umask — 664 on a shared server —
 * which left the key readable by every other account on the machine. `mode`
 * only applies when a file is CREATED, so an existing file is chmod-ed as well.
 */
function ensurePrivateDir() {
  if (!existsSync(CREDENTIALS_DIR)) mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  try { chmodSync(CREDENTIALS_DIR, 0o700); } catch { /* not ours to change */ }
}

function writePrivate(file, text) {
  ensurePrivateDir();
  writeFileSync(file, text, { encoding: 'utf8', mode: 0o600 });
  try { chmodSync(file, 0o600); } catch { /* Windows: no POSIX modes */ }
}

/**
 * Save credentials to ~/.openlabor/credentials.json
 */
export function saveCredentials(creds) {
  writePrivate(CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
}

/**
 * Clear stored credentials (logout).
 */
export function clearCredentials() {
  if (existsSync(CREDENTIALS_FILE)) {
    writePrivate(CREDENTIALS_FILE, '{}');
  }
}

/**
 * Save last session ID for an employee (for reply/history auto-resolve).
 */
export function saveLastSession(employeeKey, sessionId) {
  let sessions = {};
  if (existsSync(SESSIONS_FILE)) {
    try { sessions = JSON.parse(readFileSync(SESSIONS_FILE, 'utf8')); } catch { /* empty */ }
  }
  sessions[employeeKey.toLowerCase()] = sessionId;
  writePrivate(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

/**
 * Get last session ID for an employee.
 */
export function getLastSession(employeeKey) {
  if (!existsSync(SESSIONS_FILE)) return null;
  try {
    const sessions = JSON.parse(readFileSync(SESSIONS_FILE, 'utf8'));
    return sessions[employeeKey.toLowerCase()] || null;
  } catch {
    return null;
  }
}

/**
 * Get all stored sessions (employee → sessionId map).
 */
export function getAllSessions() {
  if (!existsSync(SESSIONS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(SESSIONS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Require credentials or exit with helpful message.
 */
export function requireAuth() {
  const creds = loadCredentials();
  if (!creds || !creds.api_key) {
    console.error('\x1b[31mNot logged in.\x1b[0m');
    console.error('Run: \x1b[2mopenlabor login <api-key>\x1b[0m');
    process.exit(1);
  }
  return creds;
}
