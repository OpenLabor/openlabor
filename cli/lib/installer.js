import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { findEmployee, findSkill } from './registry.js';
import { colors } from './display.js';
import { VERSION } from './version.js';

// Target configurations
export const TARGETS = {
  claude: {
    name: 'Claude Code',
    dir: '.claude/commands',
    ext: '.md',
    mode: 'file',
  },
  codex: {
    name: 'Codex',
    file: 'codex.md',
    mode: 'append',
  },
  cursor: {
    name: 'Cursor',
    dir: '.cursor/rules',
    ext: '.mdc',
    mode: 'file',
  },
  opencode: {
    name: 'OpenCode',
    file: 'opencode.md',
    mode: 'append',
  },
  windsurf: {
    name: 'Windsurf',
    file: '.windsurfrules',
    mode: 'append',
  },
  raw: {
    name: 'Raw file',
    dir: '.',
    ext: '.md',
    mode: 'file',
  },
};

/**
 * Auto-detect which AI coding tool is being used in cwd.
 */
export function detectTarget(cwd) {
  if (existsSync(join(cwd, '.claude'))) return 'claude';
  if (existsSync(join(cwd, '.cursor'))) return 'cursor';
  if (existsSync(join(cwd, 'codex.md'))) return 'codex';
  if (existsSync(join(cwd, 'opencode.md'))) return 'opencode';
  if (existsSync(join(cwd, '.windsurfrules'))) return 'windsurf';
  return 'claude'; // default fallback
}

/**
 * Build the content to write, with a header comment.
 */
function buildInstallContent(raw, type, slug, metadata = {}) {
  const header = `<!-- Installed from openlabor ${type}: ${slug} | v${VERSION} -->\n`;
  let content = raw;

  // Replace template variables
  if (metadata.name) content = content.replace(/\{\{name\}\}/g, metadata.name);
  if (metadata.role) content = content.replace(/\{\{role\}\}/g, metadata.role);

  return header + content;
}

/**
 * Write a file-mode target (one file per skill/employee).
 */
function writeFileTarget(target, slug, content, cwd) {
  const dir = join(cwd, target.dir);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const outPath = join(dir, `${slug}${target.ext}`);
  writeFileSync(outPath, content, 'utf8');
  return outPath;
}

/**
 * Append (or replace) a section in an append-mode target file.
 */
function writeAppendTarget(target, type, slug, content, cwd) {
  const outPath = join(cwd, target.file);
  const startMarker = `<!-- openlabor:${type}:${slug} -->`;
  const endMarker = `<!-- /openlabor:${type}:${slug} -->`;
  const section = `${startMarker}\n${content}\n${endMarker}\n`;

  if (existsSync(outPath)) {
    const existing = readFileSync(outPath, 'utf8');
    if (existing.includes(startMarker)) {
      // Replace existing section
      const regex = new RegExp(
        `${escapeRegex(startMarker)}[\\s\\S]*?${escapeRegex(endMarker)}\n?`,
        'g'
      );
      const updated = existing.replace(regex, section);
      writeFileSync(outPath, updated, 'utf8');
      return { outPath, replaced: true };
    }
    // Append new section
    const separator = existing.endsWith('\n') ? '\n' : '\n\n';
    writeFileSync(outPath, existing + separator + section, 'utf8');
  } else {
    writeFileSync(outPath, section, 'utf8');
  }
  return { outPath, replaced: false };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolve and validate target, with auto-detection if not specified.
 */
function resolveTarget(targetName, cwd) {
  if (targetName) {
    const t = TARGETS[targetName];
    if (!t) {
      console.error(`${colors.red}Error:${colors.reset} Unknown target "${targetName}".`);
      console.error(`Run ${colors.dim}openlabor targets${colors.reset} to see supported targets.`);
      process.exit(1);
    }
    return { key: targetName, target: t, autoDetected: false };
  }
  const key = detectTarget(cwd);
  const target = TARGETS[key];
  console.log(`${colors.dim}Auto-detected target: ${target.name} (${key})${colors.reset}`);
  return { key, target, autoDetected: true };
}

/**
 * Print the success message for a file-mode install.
 */
function printFileSuccess(type, item, targetKey, outPath) {
  if (type === 'skill') {
    console.log(`${colors.green}Installed skill:${colors.reset} ${item.name}`);
    console.log(`${colors.dim}  Written to: ${outPath}${colors.reset}`);
    console.log(`${colors.dim}  Category: ${item.category}${colors.reset}`);
    console.log('');
    if (targetKey === 'claude') {
      console.log(`Use it in Claude Code with: ${colors.yellow}/${item.slug}${colors.reset}`);
    } else if (targetKey === 'cursor') {
      console.log(`Skill available in Cursor as a rule: ${colors.yellow}${item.slug}${colors.reset}`);
    } else {
      console.log(`Skill written to: ${colors.yellow}${outPath}${colors.reset}`);
    }
  } else {
    console.log(`${colors.green}Installed employee:${colors.reset} ${item.name}${item.role ? ` (${item.role})` : ''}`);
    console.log(`${colors.dim}  Written to: ${outPath}${colors.reset}`);
    if (item.department) console.log(`${colors.dim}  Department: ${item.department}${colors.reset}`);
    console.log('');
    if (targetKey === 'claude') {
      console.log(`Activate in Claude Code with: ${colors.yellow}/${item.slug}${colors.reset}`);
    } else if (targetKey === 'cursor') {
      console.log(`Employee available in Cursor as a rule: ${colors.yellow}${item.slug}${colors.reset}`);
    } else {
      console.log(`Employee written to: ${colors.yellow}${outPath}${colors.reset}`);
    }
  }
}

/**
 * Print the success message for an append-mode install.
 */
function printAppendSuccess(type, item, targetKey, outPath, replaced) {
  const targetConfig = TARGETS[targetKey];
  const action = replaced ? 'Updated' : 'Added';
  if (type === 'skill') {
    console.log(`${colors.green}${action} skill:${colors.reset} ${item.name}`);
  } else {
    console.log(`${colors.green}${action} employee:${colors.reset} ${item.name}${item.role ? ` (${item.role})` : ''}`);
  }
  console.log(`${colors.dim}  ${replaced ? 'Updated in' : 'Appended to'}: ${outPath}${colors.reset}`);
  console.log('');
  console.log(`Available in ${targetConfig.name} via ${colors.yellow}${targetConfig.file}${colors.reset}`);
}

export async function installSkill(name, targetName, cwd = process.cwd()) {
  const skill = await findSkill(name);
  if (!skill) {
    console.error(`${colors.red}Error:${colors.reset} Skill "${name}" not found.`);
    console.error(`Run ${colors.dim}openlabor list skills${colors.reset} to see available skills.`);
    process.exit(1);
  }

  const { key, target } = resolveTarget(targetName, cwd);
  const content = buildInstallContent(skill.raw, 'skill', skill.slug, {
    name: skill.name,
  });

  if (target.mode === 'file') {
    const outPath = writeFileTarget(target, skill.slug, content, cwd);
    printFileSuccess('skill', skill, key, outPath);
    return { skill, outPath };
  } else {
    const { outPath, replaced } = writeAppendTarget(target, 'skill', skill.slug, content, cwd);
    printAppendSuccess('skill', skill, key, outPath, replaced);
    return { skill, outPath };
  }
}

export async function installEmployee(name, targetName, cwd = process.cwd()) {
  const employee = await findEmployee(name);
  if (!employee) {
    console.error(`${colors.red}Error:${colors.reset} Employee "${name}" not found.`);
    console.error(`Run ${colors.dim}openlabor list employees${colors.reset} to see available employees.`);
    process.exit(1);
  }

  const { key, target } = resolveTarget(targetName, cwd);
  const content = buildInstallContent(employee.raw, 'employee', employee.slug, {
    name: employee.name,
    role: employee.role,
  });

  if (target.mode === 'file') {
    const outPath = writeFileTarget(target, employee.slug, content, cwd);
    printFileSuccess('employee', employee, key, outPath);
    return { employee, outPath };
  } else {
    const { outPath, replaced } = writeAppendTarget(target, 'employee', employee.slug, content, cwd);
    printAppendSuccess('employee', employee, key, outPath, replaced);
    return { employee, outPath };
  }
}
