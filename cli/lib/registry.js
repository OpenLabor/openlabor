import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OPENLABOR_BASE = resolve(__dirname, '../..');
const MANIFEST_PATH = resolve(__dirname, '../registry.json');

const GITHUB_RAW = 'https://raw.githubusercontent.com/OpenLabor/openlabor/main';

/**
 * Parse YAML frontmatter from a markdown string.
 * Returns { frontmatter: {}, body: '' }
 */
export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const raw = match[1];
  const body = match[2];
  const frontmatter = {};

  let currentKey = null;
  let inArray = false;
  const arrayItems = [];

  for (const line of raw.split('\n')) {
    // Array item
    if (/^\s+-\s+/.test(line)) {
      const val = line.replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, '');
      arrayItems.push(val);
      continue;
    }

    // If we were collecting an array, store it
    if (inArray && currentKey !== null && !/^\s/.test(line)) {
      frontmatter[currentKey] = [...arrayItems];
      arrayItems.length = 0;
      inArray = false;
      currentKey = null;
    }

    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)?$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = (kvMatch[2] || '').trim().replace(/^["']|["']$/g, '');

      if (val === '' || val === undefined) {
        // Could be start of block array
        currentKey = key;
        inArray = true;
        arrayItems.length = 0;
      } else {
        currentKey = key;
        inArray = false;
        frontmatter[key] = val;
      }
    }
  }

  // Flush trailing array
  if (inArray && currentKey !== null) {
    frontmatter[currentKey] = [...arrayItems];
  }

  return { frontmatter, body };
}

/**
 * Load the registry manifest.
 */
function loadManifest() {
  if (existsSync(MANIFEST_PATH)) {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  }
  return { employees: [], skills: [] };
}

/**
 * List items from the manifest, handling both rich objects and legacy string arrays.
 */
function listFromManifest(type) {
  const manifest = loadManifest();
  if (!manifest) return [];
  const items = manifest[type] || [];
  return items.map(item => {
    if (typeof item === 'string') {
      return { slug: item, name: item };
    }
    return item;
  });
}

/**
 * Check whether the local openlabor repo is available.
 */
function isLocalAvailable() {
  return existsSync(OPENLABOR_BASE);
}

/**
 * Fetch raw content from GitHub for a single employee or skill.
 * type: 'employee' | 'skill'
 */
export async function fetchRemoteContent(type, slug) {
  const filename = type === 'employee' ? 'EMPLOYEE.md' : 'SKILL.md';
  const url = `${GITHUB_RAW}/${type}s/${slug}/${filename}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Remote fetch failed for ${type} "${slug}": HTTP ${res.status}`);
  }
  return res.text();
}

/**
 * Read all employees from openlabor/employees/ (local).
 */
function listEmployeesLocal() {
  const employeesDir = join(OPENLABOR_BASE, 'employees');
  if (!existsSync(employeesDir)) {
    throw new Error(`Employees directory not found: ${employeesDir}`);
  }

  const entries = readdirSync(employeesDir, { withFileTypes: true });
  const employees = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const mdPath = join(employeesDir, entry.name, 'EMPLOYEE.md');
    if (!existsSync(mdPath)) continue;

    const content = readFileSync(mdPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);

    employees.push({
      slug: entry.name,
      id: frontmatter.id || entry.name,
      name: frontmatter.name || entry.name,
      role: frontmatter.role || '',
      department: frontmatter.department || '',
      tagline: frontmatter.tagline || '',
      skills: frontmatter.skills || [],
      status: frontmatter.status || 'available',
      path: mdPath,
      body,
      raw: content,
    });
  }

  return employees.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Read all skills from openlabor/skills/ (local).
 */
function listSkillsLocal() {
  const skillsDir = join(OPENLABOR_BASE, 'skills');
  if (!existsSync(skillsDir)) {
    throw new Error(`Skills directory not found: ${skillsDir}`);
  }

  const entries = readdirSync(skillsDir, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const mdPath = join(skillsDir, entry.name, 'SKILL.md');
    if (!existsSync(mdPath)) continue;

    const content = readFileSync(mdPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);

    skills.push({
      slug: entry.name,
      name: frontmatter.name || entry.name,
      description: frontmatter.description || '',
      category: frontmatter.category || '',
      roles: frontmatter.roles || [],
      triggers: frontmatter.triggers || [],
      platforms: frontmatter.platforms || [],
      path: mdPath,
      body,
      raw: content,
    });
  }

  return skills.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * List employees — local if available, else manifest slugs only.
 */
export function listEmployees() {
  if (isLocalAvailable()) {
    return listEmployeesLocal();
  }
  // Remote mode: return rich data from manifest
  const items = listFromManifest('employees');
  return items.map((item) => ({
    slug: item.slug,
    id: item.slug,
    name: item.name || item.slug,
    role: item.role || '',
    department: item.department || '',
    tagline: item.tagline || '',
    skills: [],
    status: 'available',
    remote: true,
  }));
}

/**
 * List skills — local if available, else manifest slugs only.
 */
export function listSkills() {
  if (isLocalAvailable()) {
    return listSkillsLocal();
  }
  // Remote mode: return rich data from manifest
  const items = listFromManifest('skills');
  return items.map((item) => ({
    slug: item.slug,
    name: item.name || item.slug,
    description: item.description || '',
    category: item.category || '',
    roles: [],
    triggers: [],
    platforms: [],
    remote: true,
  }));
}

/**
 * Find a single employee by slug or id (local or remote).
 */
export async function findEmployee(name) {
  const needle = name.toLowerCase();

  if (isLocalAvailable()) {
    const employees = listEmployeesLocal();
    return employees.find(
      (e) => e.slug === needle || e.id === needle || e.name.toLowerCase() === needle
    ) || null;
  }

  // Remote: check manifest first, then fetch content
  const manifest = loadManifest();
  const items = manifest.employees || [];
  const found = items.find((item) => {
    const s = typeof item === 'string' ? item : item.slug;
    return s === needle;
  });
  if (!found) return null;
  const slug = typeof found === 'string' ? found : found.slug;

  const content = await fetchRemoteContent('employee', slug);
  const { frontmatter, body } = parseFrontmatter(content);
  return {
    slug,
    id: frontmatter.id || slug,
    name: frontmatter.name || slug,
    role: frontmatter.role || '',
    department: frontmatter.department || '',
    tagline: frontmatter.tagline || '',
    skills: frontmatter.skills || [],
    status: frontmatter.status || 'available',
    body,
    raw: content,
    remote: true,
  };
}

/**
 * Find a single skill by slug or name (local or remote).
 */
export async function findSkill(name) {
  const needle = name.toLowerCase();

  if (isLocalAvailable()) {
    const skills = listSkillsLocal();
    return skills.find(
      (s) => s.slug === needle || s.name.toLowerCase() === needle
    ) || null;
  }

  // Remote: check manifest first, then fetch content
  const manifest = loadManifest();
  const items = manifest.skills || [];
  const found = items.find((item) => {
    const s = typeof item === 'string' ? item : item.slug;
    return s === needle;
  });
  if (!found) return null;
  const slug = typeof found === 'string' ? found : found.slug;

  const content = await fetchRemoteContent('skill', slug);
  const { frontmatter, body } = parseFrontmatter(content);
  return {
    slug,
    name: frontmatter.name || slug,
    description: frontmatter.description || '',
    category: frontmatter.category || '',
    roles: frontmatter.roles || [],
    triggers: frontmatter.triggers || [],
    platforms: frontmatter.platforms || [],
    body,
    raw: content,
    remote: true,
  };
}

/**
 * Fuzzy search across employees and skills (local only; remote shows message).
 */
export function search(query) {
  const q = query.toLowerCase();

  // Use local data if available, otherwise fall back to manifest
  const employees = isLocalAvailable() ? listEmployeesLocal() : listEmployees();
  const skills = isLocalAvailable() ? listSkillsLocal() : listSkills();

  const score = (str) => {
    if (!str) return 0;
    const s = str.toLowerCase();
    if (s === q) return 10;
    if (s.startsWith(q)) return 7;
    if (s.includes(q)) return 5;
    // partial word match
    const words = q.split(/\s+/);
    const matched = words.filter((w) => s.includes(w)).length;
    return matched > 0 ? matched * 2 : 0;
  };

  const employeeResults = employees
    .map((e) => {
      const s =
        score(e.slug) +
        score(e.name) +
        score(e.role) +
        score(e.department) +
        score(e.tagline) +
        (Array.isArray(e.skills) ? e.skills.reduce((acc, sk) => acc + score(sk), 0) : 0);
      return { type: 'employee', item: e, score: s };
    })
    .filter((r) => r.score > 0);

  const skillResults = skills
    .map((s) => {
      const sc =
        score(s.slug) +
        score(s.name) +
        score(s.description) +
        score(s.category) +
        (Array.isArray(s.roles) ? s.roles.reduce((acc, r) => acc + score(r), 0) : 0);
      return { type: 'skill', item: s, score: sc };
    })
    .filter((r) => r.score > 0);

  return { remote: false, results: [...employeeResults, ...skillResults].sort((a, b) => b.score - a.score) };
}
