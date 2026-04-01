// ANSI color codes — no external deps
export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
};

/**
 * Pad a string to a fixed width (truncates if too long).
 */
function pad(str, width) {
  const s = String(str || '');
  if (s.length >= width) return s.slice(0, width - 1) + ' ';
  return s + ' '.repeat(width - s.length);
}

/**
 * Strip ANSI codes to measure visual length.
 */
function visLen(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '').length;
}

/**
 * Print a table given an array of row arrays and column widths.
 * columns: [{ label, width, color? }]
 */
export function printTable(columns, rows) {
  // Header
  const header = columns.map((c) => `${colors.bold}${colors.cyan}${pad(c.label, c.width)}${colors.reset}`).join('  ');
  console.log(header);

  // Separator
  const sep = columns.map((c) => '-'.repeat(c.width)).join('  ');
  console.log(`${colors.dim}${sep}${colors.reset}`);

  // Rows
  for (const row of rows) {
    const line = columns.map((c, i) => {
      const val = row[i] || '';
      const colored = c.color ? `${c.color}${val}${colors.reset}` : val;
      // Pad based on visual length
      const vl = visLen(colored);
      const padding = Math.max(0, c.width - vl);
      return colored + ' '.repeat(padding);
    }).join('  ');
    console.log(line);
  }
}

/**
 * Print employees table.
 */
export function printEmployees(employees) {
  const cols = [
    { label: 'ID', width: 16 },
    { label: 'NAME', width: 14 },
    { label: 'ROLE', width: 22 },
    { label: 'DEPARTMENT', width: 14 },
    { label: 'TAGLINE', width: 40 },
  ];

  const rows = employees.map((e) => [
    `${colors.yellow}${e.slug}${colors.reset}`,
    e.name,
    e.role,
    `${colors.dim}${e.department}${colors.reset}`,
    `${colors.dim}${e.tagline}${colors.reset}`,
  ]);

  console.log('');
  console.log(`${colors.bold}${colors.magenta}OpenLabor Employees${colors.reset}  ${colors.dim}(${employees.length} total)${colors.reset}`);
  console.log('');
  printTable(cols, rows);
  console.log('');
  console.log(`${colors.dim}Install with: openlabor install employee <id>${colors.reset}`);
  console.log('');
}

/**
 * Print skills table.
 */
export function printSkills(skills) {
  const cols = [
    { label: 'SKILL', width: 24 },
    { label: 'CATEGORY', width: 16 },
    { label: 'DESCRIPTION', width: 60 },
  ];

  const rows = skills.map((s) => [
    `${colors.yellow}${s.slug}${colors.reset}`,
    `${colors.cyan}${s.category}${colors.reset}`,
    `${colors.dim}${s.description}${colors.reset}`,
  ]);

  console.log('');
  console.log(`${colors.bold}${colors.magenta}OpenLabor Skills${colors.reset}  ${colors.dim}(${skills.length} total)${colors.reset}`);
  console.log('');
  printTable(cols, rows);
  console.log('');
  console.log(`${colors.dim}Install with: openlabor install skill <name>${colors.reset}`);
  console.log('');
}

/**
 * Print search results.
 */
export function printSearchResults(results, query) {
  if (results.length === 0) {
    console.log(`${colors.yellow}No results found for "${query}"${colors.reset}`);
    return;
  }

  console.log('');
  console.log(`${colors.bold}Search results for "${query}"${colors.reset}  ${colors.dim}(${results.length} found)${colors.reset}`);
  console.log('');

  for (const result of results) {
    const { type, item } = result;
    if (type === 'employee') {
      console.log(
        `  ${colors.green}employee${colors.reset}  ${colors.yellow}${colors.bold}${item.slug}${colors.reset}` +
        `  ${item.name} — ${item.role}` +
        `  ${colors.dim}[${item.department}]${colors.reset}`
      );
      if (item.tagline) {
        console.log(`           ${colors.dim}${item.tagline}${colors.reset}`);
      }
    } else {
      console.log(
        `  ${colors.cyan}skill${colors.reset}     ${colors.yellow}${colors.bold}${item.slug}${colors.reset}` +
        `  ${item.name}` +
        `  ${colors.dim}[${item.category}]${colors.reset}`
      );
      if (item.description) {
        const desc = item.description.length > 80 ? item.description.slice(0, 77) + '...' : item.description;
        console.log(`           ${colors.dim}${desc}${colors.reset}`);
      }
    }
  }
  console.log('');
}

export function printTargets(TARGETS) {
  console.log('');
  console.log(`${colors.bold}Supported install targets:${colors.reset}`);
  console.log('');
  for (const [key, t] of Object.entries(TARGETS)) {
    const dest = t.mode === 'file'
      ? `${t.dir}/<name>${t.ext}`
      : t.file;
    console.log(`  ${colors.yellow}${key.padEnd(12)}${colors.reset}  ${t.name.padEnd(14)}  ${colors.dim}${dest}${colors.reset}`);
  }
  console.log('');
  console.log(`${colors.dim}Use with: openlabor install skill <name> --target <target>${colors.reset}`);
  console.log('');
}

export function printHelp() {
  console.log('');
  console.log(`${colors.bold}openlabor${colors.reset} — Browse and install OpenLabor employees & skills into Claude Code, Codex, Cursor, OpenCode, and more`);
  console.log('');
  console.log(`${colors.bold}Usage:${colors.reset}`);
  console.log(`  openlabor <command> [options]`);
  console.log('');
  console.log(`${colors.bold}Commands:${colors.reset}`);
  console.log(`  ${colors.yellow}list employees${colors.reset}                         List all available employees`);
  console.log(`  ${colors.yellow}list skills${colors.reset}                            List all available skills`);
  console.log(`  ${colors.yellow}install employee <name> [--target <t>]${colors.reset}  Install an employee`);
  console.log(`  ${colors.yellow}install skill <name> [--target <t>]${colors.reset}     Install a skill`);
  console.log(`  ${colors.yellow}search <query>${colors.reset}                         Search employees and skills`);
  console.log(`  ${colors.yellow}targets${colors.reset}                                List supported install targets`);
  console.log('');
  console.log(`${colors.bold}Pilot (dispatch & control your team):${colors.reset}`);
  console.log(`  ${colors.yellow}login <api-key>${colors.reset}                        Connect to your org`);
  console.log(`  ${colors.yellow}logout${colors.reset}                                 Clear stored credentials`);
  console.log(`  ${colors.yellow}whoami${colors.reset}                                 Show current login info`);
  console.log(`  ${colors.yellow}team${colors.reset}                                   List your org's live employees`);
  console.log(`  ${colors.yellow}ask "<message>"${colors.reset}                        New conversation (auto-routes to best employee)`);
  console.log(`  ${colors.yellow}ask <employee> "<message>"${colors.reset}              New conversation with specific employee`);
  console.log(`  ${colors.yellow}chat "<message>"${colors.reset}                       Continue last conversation`);
  console.log(`  ${colors.yellow}chat <employee> "<message>"${colors.reset}             Continue with specific employee`);
  console.log(`  ${colors.yellow}history${colors.reset}                                List all conversations`);
  console.log(`  ${colors.yellow}history <employee>${colors.reset}                    List employee's conversations`);
  console.log(`  ${colors.yellow}tasks <employee>${colors.reset}                       List scheduled tasks`);
  console.log(`  ${colors.yellow}run <task-id>${colors.reset}                          Run a scheduled task now`);
  console.log('');
  console.log(`${colors.bold}Update & Config:${colors.reset}`);
  console.log(`  ${colors.yellow}version${colors.reset}                                Show version and install info`);
  console.log(`  ${colors.yellow}update${colors.reset}                                 Update openlabor to latest`);
  console.log(`  ${colors.yellow}config${colors.reset}                                 Show current config`);
  console.log(`  ${colors.yellow}config <key> <value>${colors.reset}                   Set a config value`);
  console.log(`  ${colors.yellow}outdated${colors.reset}                               List skills installed with older version`);
  console.log(`  ${colors.yellow}update-skills${colors.reset}                          Re-install all openlabor-tracked skills`);
  console.log('');
  console.log(`${colors.bold}Targets (--target / -t):${colors.reset}`);
  console.log(`  ${colors.cyan}claude${colors.reset}     Claude Code  → .claude/commands/<name>.md`);
  console.log(`  ${colors.cyan}cursor${colors.reset}     Cursor       → .cursor/rules/<name>.mdc`);
  console.log(`  ${colors.cyan}codex${colors.reset}      Codex        → codex.md (appended)`);
  console.log(`  ${colors.cyan}opencode${colors.reset}   OpenCode     → opencode.md (appended)`);
  console.log(`  ${colors.cyan}windsurf${colors.reset}   Windsurf     → .windsurfrules (appended)`);
  console.log(`  ${colors.cyan}raw${colors.reset}        Raw file     → ./<name>.md`);
  console.log('');
  console.log(`${colors.dim}If --target is omitted, the tool auto-detects based on config files in your project.${colors.reset}`);
  console.log('');
  console.log(`${colors.bold}Examples:${colors.reset}`);
  console.log(`  ${colors.dim}# Browse & install${colors.reset}`);
  console.log(`  openlabor list employees`);
  console.log(`  openlabor install skill logo-maker --target cursor`);
  console.log(`  openlabor search "social media"`);
  console.log('');
  console.log(`  ${colors.dim}# Pilot your team${colors.reset}`);
  console.log(`  openlabor login ABCDEF1234567890ABCDEF1234567890`);
  console.log(`  openlabor team`);
  console.log(`  openlabor ask "Draft 3 tweet threads about our launch"`);
  console.log(`  openlabor chat "Make the second one more casual"`);
  console.log(`  openlabor ask cto "Review our auth module"`);
  console.log(`  openlabor history`);
  console.log('');
}

/**
 * Print version info.
 */
export function printVersion(version, installType, registry) {
  console.log('');
  console.log(`${colors.bold}openlabor${colors.reset} v${version}`);
  console.log(`Install type: ${colors.cyan}${installType}${colors.reset}`);
  console.log(`Config: ${colors.dim}~/.openlabor/config.yaml${colors.reset}`);
  if (registry) {
    console.log(`Registry: ${colors.dim}${registry.employees} employees, ${registry.skills} skills${colors.reset}`);
  }
  console.log('');
}

/**
 * Print config key/value pairs.
 */
export function printConfig(config) {
  console.log('');
  console.log(`${colors.bold}Config${colors.reset} ${colors.dim}(~/.openlabor/config.yaml)${colors.reset}`);
  console.log('');
  for (const [key, val] of Object.entries(config)) {
    console.log(`  ${colors.yellow}${key}${colors.reset}: ${val}`);
  }
  console.log('');
}

// ─── Pilot display functions ──────────────────────────────────

/**
 * Print live org employees (from API, not registry).
 */
export function printOrgEmployees(agents) {
  if (!agents || agents.length === 0) {
    console.log(`${colors.yellow}No employees found in your org.${colors.reset}`);
    return;
  }

  const cols = [
    { label: 'NAME', width: 16 },
    { label: 'ROLE', width: 24 },
    { label: 'DEPARTMENT', width: 16 },
    { label: 'SKILLS', width: 40 },
  ];

  const rows = agents
    .filter(a => a.status !== 'fired')
    .map((a) => {
      const skills = Array.isArray(a.skills) ? a.skills.slice(0, 3).join(', ') : '';
      return [
        `${colors.bold}${a.custom_name || a.name || a.template_id || a.id}${colors.reset}`,
        a.role || '',
        `${colors.cyan}${a.department || ''}${colors.reset}`,
        `${colors.dim}${skills}${colors.reset}`,
      ];
    });

  console.log('');
  console.log(`${colors.bold}${colors.magenta}Your Employees${colors.reset}  ${colors.dim}(${rows.length} active)${colors.reset}`);
  console.log('');
  printTable(cols, rows);
  console.log('');
  console.log(`${colors.dim}Ask: openlabor ask <name> "your message"${colors.reset}`);
  console.log('');
}

/**
 * Print dispatch/reply result (chat response).
 */
export function printDispatchResult(result) {
  console.log('');
  console.log(`${colors.green}${colors.bold}${result.employeeName}${colors.reset} ${colors.dim}(${result.role})${colors.reset}`);
  console.log(`${colors.dim}Session: ${result.sessionId}${colors.reset}`);
  console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
  console.log('');

  if (result.reply) {
    console.log(result.reply);
  } else {
    console.log(`${colors.yellow}No reply yet.${colors.reset} The employee may still be processing.`);
  }
  console.log('');
  console.log(`${colors.dim}Continue: openlabor reply ${result.employeeName} "your follow-up"${colors.reset}`);
  console.log('');

  if (process.env.OPENLABOR_JSON === '1') {
    console.log(JSON.stringify(result));
  }
}

/**
 * Print history for an employee — sessions from API + local.
 */
export function printHistory(result) {
  console.log('');
  console.log(`${colors.bold}Conversations${colors.reset}  ${colors.dim}${result.employeeName}${colors.reset}`);
  console.log('');

  const hasSessions = result.sessions && result.sessions.length > 0;
  const hasLocal = result.localSession;

  if (!hasSessions && !hasLocal) {
    console.log(`${colors.yellow}No conversations yet.${colors.reset} Start one with: ${colors.dim}openlabor ask ${result.employeeName} "your message"${colors.reset}`);
  } else {
    if (hasLocal) {
      console.log(`  ${colors.green}latest${colors.reset}  ${colors.yellow}${result.localSession}${colors.reset}`);
    }
    if (hasSessions) {
      for (const sess of result.sessions) {
        const key = sess.sessionKey || sess.key || sess.id || 'unknown';
        const date = sess.lastMessageAt || sess.createdAt || sess.updatedAt || '';
        if (key !== result.localSession) {
          console.log(`  ${colors.dim}${key}${colors.reset}  ${colors.dim}${date}${colors.reset}`);
        }
      }
    }
  }
  console.log('');
  console.log(`${colors.dim}Continue: openlabor chat ${result.employeeName} "your message"${colors.reset}`);
  console.log('');

  if (process.env.OPENLABOR_JSON === '1') {
    console.log(JSON.stringify(result));
  }
}

/**
 * Print employee scheduled tasks.
 */
export function printEmployeeTasks(result) {
  console.log('');
  console.log(`${colors.bold}Scheduled Tasks${colors.reset}  ${colors.dim}${result.employeeName}${colors.reset}  ${colors.dim}(${result.tasks.length} total)${colors.reset}`);
  console.log('');

  if (result.tasks.length === 0) {
    console.log(`${colors.yellow}No scheduled tasks.${colors.reset}`);
  } else {
    for (const task of result.tasks) {
      const name = task.name || 'Unnamed';
      const schedule = task.schedule?.expr || task.schedule || '';
      console.log(`  ${colors.yellow}${task.id}${colors.reset}  ${colors.bold}${name}${colors.reset}  ${colors.dim}${schedule}${colors.reset}`);
    }
    console.log('');
    console.log(`${colors.dim}Run now: openlabor run <task-id>${colors.reset}`);
  }
  console.log('');

  if (process.env.OPENLABOR_JSON === '1') {
    console.log(JSON.stringify(result));
  }
}

/**
 * Print outdated skills list.
 */
export function printOutdated(outdated, currentVersion) {
  if (outdated.length === 0) {
    console.log(`${colors.green}All installed skills are up to date.${colors.reset}`);
    return;
  }
  console.log('');
  console.log(`${colors.bold}Outdated skills${colors.reset} ${colors.dim}(current CLI: v${currentVersion})${colors.reset}`);
  console.log('');
  for (const item of outdated) {
    console.log(
      `  ${colors.yellow}${item.slug.padEnd(24)}${colors.reset}` +
      `  ${colors.dim}v${item.installedVersion}${colors.reset} → ${colors.green}v${currentVersion}${colors.reset}`
    );
  }
  console.log('');
  console.log(`Run: ${colors.dim}openlabor update-skills${colors.reset}`);
  console.log('');
}
