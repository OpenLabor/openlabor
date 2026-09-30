import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname, relative, isAbsolute } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync } from 'child_process';
import { VERSION } from './version.js';
import { CONFIG_DIR, loadConfig } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNOOZE_FILE = join(CONFIG_DIR, 'update-snoozed');

const LAST_CHECK_FILE = join(CONFIG_DIR, 'last-update-check');
const JUST_UPGRADED_FILE = join(CONFIG_DIR, 'just-upgraded-from');
const CHECK_INTERVAL_S = 24 * 60 * 60; // 24 hours
const REGISTRY_URL = 'https://raw.githubusercontent.com/OpenLabor/openlabor/main/cli/package.json';
/**
 * The published npm name. Must match package.json.
 *
 * This used to be spelled "openlabor" in the update instructions — a package
 * that is not ours and, as of this writing, does not exist. Users following
 * `openlabor update` got a 404, and had that name ever been squatted they would
 * have installed a stranger's code globally on our own instruction.
 */
const PACKAGE_NAME = 'openlabor';

/**
 * Compare two semver strings. Returns true if a > b.
 */
function semverGt(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

/**
 * Ensure config dir exists.
 */
function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Run the shell-based update check script.
 * Returns the output string: "UPGRADE_AVAILABLE <old> <new>", "JUST_UPGRADED <old> <new>", or "".
 */
export function checkForUpdateShell() {
  try {
    const binPath = resolve(__dirname, '../bin/openlabor-update-check');
    const output = execSync(binPath, { encoding: 'utf8', timeout: 10000 }).trim();
    return output;
  } catch {
    return '';
  }
}

/**
 * Snooze update notifications for a given remote version.
 * Uses escalating backoff: level 1 = 24h, level 2 = 48h, level 3+ = 7d.
 * Returns a message describing the snooze duration.
 */
export function snoozeUpdate(remoteVersion) {
  ensureConfigDir();
  let level = 1;

  if (existsSync(SNOOZE_FILE)) {
    try {
      const parts = readFileSync(SNOOZE_FILE, 'utf8').trim().split(' ');
      const snoozedVer = parts[0];
      const snoozedLevel = parseInt(parts[1], 10) || 0;
      if (snoozedVer === remoteVersion) {
        level = Math.min(snoozedLevel + 1, 3);
      }
    } catch {
      // ignore, use level 1
    }
  }

  const epoch = Math.floor(Date.now() / 1000);
  writeFileSync(SNOOZE_FILE, `${remoteVersion} ${level} ${epoch}`, 'utf8');

  const durations = { 1: '24 hours', 2: '48 hours', 3: '7 days' };
  return `Snoozed for ${durations[level] || '7 days'}.`;
}

/**
 * Seconds since the epoch, read from the shared last-check file.
 *
 * ⚠️ The shell check (bin/openlabor-update-check) writes SECONDS; this function
 * used to write MILLISECONDS to the same file. Once it had, the shell's
 * `now - last` was negative forever and it never checked again. Seconds is the
 * format now, and a millisecond value left behind by an older version is read
 * as what it is.
 */
function readLastCheck() {
  if (!existsSync(LAST_CHECK_FILE)) return null;
  const n = parseInt(readFileSync(LAST_CHECK_FILE, 'utf8').trim(), 10);
  if (isNaN(n)) return null;
  return n > 1e11 ? Math.floor(n / 1000) : n;
}

/** True while the user has snoozed `remoteVersion` (same file and backoff as the shell check). */
function isSnoozed(remoteVersion) {
  if (!existsSync(SNOOZE_FILE)) return false;
  try {
    const [ver, level, epoch] = readFileSync(SNOOZE_FILE, 'utf8').trim().split(' ');
    if (ver !== remoteVersion || !epoch) return false;
    const duration = { 1: 86400, 2: 172800 }[level] ?? 604800;
    return Math.floor(Date.now() / 1000) < Number(epoch) + duration;
  } catch {
    return false;
  }
}

/**
 * Check if an update is available. Prints a one-line notice if so.
 * Skips if checked within last 24 hours, if `update_check` is false, or while
 * snoozed. Silent on network errors.
 */
export async function checkForUpdate() {
  try {
    if (loadConfig().update_check === false) return null;
    ensureConfigDir();

    const now = Math.floor(Date.now() / 1000);
    const lastCheck = readLastCheck();
    if (lastCheck !== null && lastCheck <= now && now - lastCheck < CHECK_INTERVAL_S) {
      return null;
    }

    // Fetch remote package.json
    const response = await fetch(REGISTRY_URL, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return null;
    const pkg = await response.json();
    const remoteVersion = pkg && pkg.version;

    writeFileSync(LAST_CHECK_FILE, String(now), 'utf8');

    if (remoteVersion && semverGt(remoteVersion, VERSION) && !isSnoozed(remoteVersion)) {
      return remoteVersion;
    }
    return null;
  } catch {
    // Silent fail — network error, timeout, parse error
    return null;
  }
}

/**
 * Print the update notice to stderr (so it appears after command output).
 */
export function printUpdateNotice(remoteVersion) {
  if (!remoteVersion) return;
  process.stderr.write(
    `\n\x1b[33mopenlabor v${remoteVersion} available (current: v${VERSION}). Run: openlabor update\x1b[0m\n`
  );
}

/**
 * Detect how openlabor is installed.
 * Returns 'git-global', 'git-vendored', 'npm', or 'npx'.
 */
/** This package's own directory. fileURLToPath, not URL.pathname: that one keeps `%20` and breaks on Windows. */
const PKG_DIR = resolve(__dirname, '..');
const VENDORED_DIR = join(homedir(), '.claude', 'skills', 'openlabor');

export function detectInstallType() {
  const pkgDir = PKG_DIR;

  // Vendored install: THIS copy runs from inside ~/.claude/skills/openlabor.
  // ⚠️ It used to be enough for that folder to merely exist, so an npm install
  // on a machine that also had the clone answered `openlabor update` with a
  // `git reset --hard` in the clone — and never updated itself.
  const rel = relative(VENDORED_DIR, pkgDir);
  if (existsSync(join(VENDORED_DIR, '.git')) && !rel.startsWith('..') && !isAbsolute(rel)) {
    return 'git-vendored';
  }

  // Check if we're running from a git repo
  try {
    // The package is the repo's `cli/` folder, so the clone's .git is one up.
    if (existsSync(join(pkgDir, '.git')) || existsSync(join(pkgDir, '..', '.git'))) {
      return 'git-global';
    }
  } catch {
    // ignore
  }

  // Check if running from npx cache
  const npmCacheMarkers = ['_npx', 'npm/_npx'];
  const pkgDirStr = String(pkgDir);
  for (const marker of npmCacheMarkers) {
    if (pkgDirStr.includes(marker)) return 'npx';
  }

  // Default: npm global
  return 'npm';
}

/**
 * Perform the actual update based on install type.
 */
export async function performUpdate() {
  const installType = detectInstallType();

  console.log(`\x1b[2mDetected install type: ${installType}\x1b[0m`);
  console.log('');

  if (installType === 'npx') {
    console.log('\x1b[33mYou are running openlabor via npx — it always uses the latest version.\x1b[0m');
    console.log(`Just run: \x1b[36mnpx ${PACKAGE_NAME}@latest\x1b[0m`);
    return;
  }

  if (installType === 'npm') {
    // Actually perform the upgrade. Printing the command and exiting made
    // `openlabor update` a no-op that looked like it had worked — and the
    // command it printed named a package that does not exist.
    const cmd = `npm install -g ${PACKAGE_NAME}@latest`;
    console.log(`Running: \x1b[36m${cmd}\x1b[0m`);
    console.log('');
    try {
      execSync(cmd, { stdio: 'inherit' });
      console.log('');
      console.log('\x1b[32m✓ Updated.\x1b[0m Run \x1b[36mopenlabor --version\x1b[0m to confirm.');
    } catch {
      console.error('');
      console.error('\x1b[31mUpdate failed.\x1b[0m If this is a permissions error, either re-run with');
      console.error(`sudo, or reinstall with a user-writable npm prefix, then: \x1b[36m${cmd}\x1b[0m`);
      process.exitCode = 1;
    }
    return;
  }

  // git-global or git-vendored
  // The clone's root: the package sits in its `cli/` folder.
  const pkgDir = installType === 'git-vendored' ? VENDORED_DIR : PKG_DIR;

  console.log(`Updating from: \x1b[2m${pkgDir}\x1b[0m`);
  console.log('');

  // Save old version
  ensureConfigDir();
  writeFileSync(JUST_UPGRADED_FILE, VERSION, 'utf8');

  try {
    // Show git log before update
    let oldHash = '';
    try {
      oldHash = execSync('git rev-parse HEAD', { cwd: pkgDir }).toString().trim();
    } catch {
      // ignore
    }

    console.log('Fetching latest changes...');
    execSync('git fetch origin', { cwd: pkgDir, stdio: 'inherit' });
    execSync('git reset --hard origin/main', { cwd: pkgDir, stdio: 'inherit' });

    // Show changelog
    if (oldHash) {
      try {
        const log = execSync(`git log --oneline ${oldHash}..HEAD`, { cwd: pkgDir }).toString().trim();
        if (log) {
          console.log('');
          console.log('\x1b[1mChanges:\x1b[0m');
          console.log(log);
        }
      } catch {
        // ignore
      }
    }

    console.log('');
    console.log('\x1b[32mUpdate complete.\x1b[0m');
  } catch (err) {
    console.error(`\x1b[31mUpdate failed:\x1b[0m ${err.message}`);
    process.exit(1);
  }
}
