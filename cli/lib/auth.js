import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
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
  try {
    return JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Save credentials to ~/.openlabor/credentials.json
 */
export function saveCredentials(creds) {
  if (!existsSync(CREDENTIALS_DIR)) {
    mkdirSync(CREDENTIALS_DIR, { recursive: true });
  }
  writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf8');
}

/**
 * Clear stored credentials (logout).
 */
export function clearCredentials() {
  if (existsSync(CREDENTIALS_FILE)) {
    writeFileSync(CREDENTIALS_FILE, '{}', 'utf8');
  }
}

/**
 * Save last session ID for an employee (for reply/history auto-resolve).
 */
export function saveLastSession(employeeKey, sessionId) {
  if (!existsSync(CREDENTIALS_DIR)) {
    mkdirSync(CREDENTIALS_DIR, { recursive: true });
  }
  let sessions = {};
  if (existsSync(SESSIONS_FILE)) {
    try { sessions = JSON.parse(readFileSync(SESSIONS_FILE, 'utf8')); } catch { /* empty */ }
  }
  sessions[employeeKey.toLowerCase()] = sessionId;
  writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
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
