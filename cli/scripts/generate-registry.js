#!/usr/bin/env node

/**
 * generate-registry.js
 *
 * Scans ../employees/ and ../skills/ (relative to repo root),
 * reads EMPLOYEE.md and SKILL.md frontmatter, and generates
 * cli/registry.json with full metadata.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const REGISTRY_OUT = resolve(__dirname, '../registry.json');

/**
 * Minimal YAML frontmatter parser (matches the one in registry.js).
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const raw = match[1];
  const body = match[2];
  const frontmatter = {};

  let currentKey = null;
  let inArray = false;
  const arrayItems = [];

  for (const line of raw.split('\n')) {
    if (/^\s+-\s+/.test(line)) {
      const val = line.replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, '');
      arrayItems.push(val);
      continue;
    }

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

  if (inArray && currentKey !== null) {
    frontmatter[currentKey] = [...arrayItems];
  }

  return { frontmatter, body };
}

function scanEmployees() {
  const dir = join(REPO_ROOT, 'employees');
  if (!existsSync(dir)) {
    console.warn(`Warning: employees directory not found at ${dir}`);
    return [];
  }

  const entries = readdirSync(dir, { withFileTypes: true });
  const employees = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const mdPath = join(dir, entry.name, 'EMPLOYEE.md');
    if (!existsSync(mdPath)) continue;

    const content = readFileSync(mdPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);

    employees.push({
      slug: entry.name,
      name: frontmatter.name || entry.name,
      role: frontmatter.role || '',
      department: frontmatter.department || '',
      tagline: frontmatter.tagline || '',
    });
  }

  return employees.sort((a, b) => a.slug.localeCompare(b.slug));
}

function scanSkills() {
  const dir = join(REPO_ROOT, 'skills');
  if (!existsSync(dir)) {
    console.warn(`Warning: skills directory not found at ${dir}`);
    return [];
  }

  const entries = readdirSync(dir, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const mdPath = join(dir, entry.name, 'SKILL.md');
    if (!existsSync(mdPath)) continue;

    const content = readFileSync(mdPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);

    skills.push({
      slug: entry.name,
      name: frontmatter.name || entry.name,
      description: frontmatter.description || '',
      category: frontmatter.category || '',
    });
  }

  return skills.sort((a, b) => a.slug.localeCompare(b.slug));
}

const employees = scanEmployees();
const skills = scanSkills();

const registry = { employees, skills };

writeFileSync(REGISTRY_OUT, JSON.stringify(registry, null, 2) + '\n', 'utf8');

console.log(`Generated registry.json: ${employees.length} employees, ${skills.length} skills`);
