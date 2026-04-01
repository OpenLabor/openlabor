#!/usr/bin/env node

import { listEmployees, listSkills, search } from '../lib/registry.js';
import { installEmployee, installSkill, TARGETS } from '../lib/installer.js';
import { printEmployees, printSkills, printSearchResults, printHelp, printTargets, printVersion, printConfig, printOutdated, printOrgEmployees, printDispatchResult, printHistory, printEmployeeTasks, colors } from '../lib/display.js';
import { VERSION } from '../lib/version.js';
import { checkForUpdate, checkForUpdateShell, printUpdateNotice, detectInstallType, performUpdate } from '../lib/updater.js';
import { loadConfig, saveConfig, CONFIG_FILE } from '../lib/config.js';
import { loadCredentials, saveCredentials, clearCredentials, getAllSessions } from '../lib/auth.js';
import { listOrgEmployees, ask, chat, history, listTasks, runTask, resolveApiKey } from '../lib/pilot.js';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);

function unknownCommand(cmd) {
  console.error(`${colors.red}Unknown command:${colors.reset} ${cmd}`);
  console.error(`Run ${colors.dim}openlabor --help${colors.reset} for usage.`);
  process.exit(1);
}

if (args.length === 0 || args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
  printHelp();
  process.exit(0);
}

const [cmd, sub, ...rest] = args;

// Shell-based update check (synchronous, uses cache — fast)
const shellUpdateOutput = checkForUpdateShell();

// Non-blocking async update check fallback
const updateCheckPromise = checkForUpdate();

async function main() {
  let updateVersion = null;

  // Show just-upgraded notice at start
  if (shellUpdateOutput.startsWith('JUST_UPGRADED')) {
    const parts = shellUpdateOutput.split(' ');
    const oldVer = parts[1];
    const newVer = parts[2];
    console.log(`${colors.green}Upgraded from v${oldVer} to v${newVer}!${colors.reset}`);
    console.log('');
  }

  switch (cmd) {
    case 'list': {
      if (!sub || sub === 'employees') {
        const employees = listEmployees();
        printEmployees(employees);
      } else if (sub === 'skills') {
        const skills = listSkills();
        printSkills(skills);
      } else {
        console.error(`${colors.red}Unknown list target:${colors.reset} "${sub}"`);
        console.error(`Try: ${colors.dim}openlabor list employees${colors.reset} or ${colors.dim}openlabor list skills${colors.reset}`);
        process.exit(1);
      }
      break;
    }

    case 'install': {
      if (!sub) {
        console.error(`${colors.red}Error:${colors.reset} Specify what to install.`);
        console.error(`Usage: ${colors.dim}openlabor install employee <name>${colors.reset}`);
        console.error(`       ${colors.dim}openlabor install skill <name>${colors.reset}`);
        process.exit(1);
      }

      // Parse --target / -t from rest args
      let name = null;
      let targetName = null;
      for (let i = 0; i < rest.length; i++) {
        if ((rest[i] === '--target' || rest[i] === '-t') && rest[i + 1]) {
          targetName = rest[i + 1];
          i++;
        } else if (!name && !rest[i].startsWith('-')) {
          name = rest[i];
        }
      }

      if (!name) {
        console.error(`${colors.red}Error:${colors.reset} Missing name argument.`);
        console.error(`Usage: ${colors.dim}openlabor install ${sub} <name>${colors.reset}`);
        process.exit(1);
      }

      if (sub === 'employee') {
        await installEmployee(name, targetName).catch((err) => {
          console.error(`${colors.red}Error:${colors.reset} ${err.message}`);
          process.exit(1);
        });
      } else if (sub === 'skill') {
        await installSkill(name, targetName).catch((err) => {
          console.error(`${colors.red}Error:${colors.reset} ${err.message}`);
          process.exit(1);
        });
      } else {
        console.error(`${colors.red}Unknown install type:${colors.reset} "${sub}"`);
        console.error(`Try: ${colors.dim}employee${colors.reset} or ${colors.dim}skill${colors.reset}`);
        process.exit(1);
      }
      break;
    }

    case 'search': {
      const query = [sub, ...rest].filter(Boolean).join(' ');
      if (!query) {
        console.error(`${colors.red}Error:${colors.reset} Missing search query.`);
        console.error(`Usage: ${colors.dim}openlabor search <query>${colors.reset}`);
        process.exit(1);
      }
      const searchResult = search(query);
      if (searchResult.remote) {
        console.log(`${colors.yellow}Search requires the local repo.${colors.reset} Clone the repo or use ${colors.dim}openlabor list skills${colors.reset} to browse.`);
      } else {
        printSearchResults(searchResult.results, query);
      }
      break;
    }

    case 'targets': {
      printTargets(TARGETS);
      break;
    }

    case 'version': {
      const installType = detectInstallType();
      const employees = listEmployees();
      const skills = listSkills();
      printVersion(VERSION, installType, { employees: employees.length, skills: skills.length });
      // No update notice for version command — it's already showing version
      return;
    }

    case 'update': {
      await performUpdate();
      return;
    }

    case 'config': {
      const config = loadConfig();
      if (!sub) {
        // Show config
        printConfig(config);
      } else {
        // Set a value: openlabor config <key> <value>
        const key = sub;
        const value = rest[0];
        if (value === undefined) {
          console.error(`${colors.red}Error:${colors.reset} Missing value.`);
          console.error(`Usage: ${colors.dim}openlabor config <key> <value>${colors.reset}`);
          process.exit(1);
        }
        // Parse booleans
        let parsed = value;
        if (value === 'true') parsed = true;
        else if (value === 'false') parsed = false;
        config[key] = parsed;
        saveConfig(config);
        console.log(`${colors.green}Config updated:${colors.reset} ${key} = ${parsed}`);
        console.log(`${colors.dim}Saved to: ${CONFIG_FILE}${colors.reset}`);
      }
      break;
    }

    case 'outdated': {
      // Scan known target dirs for files with openlabor markers and check version
      const outdated = scanOutdated();
      printOutdated(outdated, VERSION);
      break;
    }

    case 'update-skills': {
      const outdated = scanOutdated();
      if (outdated.length === 0) {
        console.log(`${colors.green}All installed skills are up to date.${colors.reset}`);
        break;
      }
      console.log(`Re-installing ${outdated.length} skill(s)...`);
      console.log('');
      for (const item of outdated) {
        if (item.type === 'skill') {
          await installSkill(item.slug, item.target).catch((err) => {
            console.error(`${colors.red}Error reinstalling ${item.slug}:${colors.reset} ${err.message}`);
          });
        } else if (item.type === 'employee') {
          await installEmployee(item.slug, item.target).catch((err) => {
            console.error(`${colors.red}Error reinstalling ${item.slug}:${colors.reset} ${err.message}`);
          });
        }
      }
      console.log('');
      console.log(`${colors.green}Done.${colors.reset}`);
      break;
    }

    // ─── Pilot commands ───────────────────────────────────────

    case 'login': {
      // openlabor login <api-key> [--url <url>]
      let apiKey = null;
      let apiUrl = null;
      const loginArgs = [sub, ...rest].filter(Boolean);
      for (let i = 0; i < loginArgs.length; i++) {
        if ((loginArgs[i] === '--key' || loginArgs[i] === '-k') && loginArgs[i + 1]) { apiKey = loginArgs[++i]; }
        else if ((loginArgs[i] === '--url' || loginArgs[i] === '-u') && loginArgs[i + 1]) { apiUrl = loginArgs[++i]; }
        else if (!apiKey && !loginArgs[i].startsWith('-')) { apiKey = loginArgs[i]; }
      }
      if (!apiKey) {
        console.error(`${colors.red}Error:${colors.reset} Missing API key.`);
        console.error(`Usage: ${colors.dim}openlabor login <api-key>${colors.reset}`);
        console.error(`Get your key from: ${colors.dim}Settings → API Keys${colors.reset} in your dashboard.`);
        process.exit(1);
      }
      // Resolve org and URL from the API key
      const loginResult = await resolveApiKey(apiKey, apiUrl).catch((err) => {
        console.error(`${colors.red}Error:${colors.reset} ${err.message}`);
        process.exit(1);
      });
      saveCredentials(loginResult);
      console.log(`${colors.green}Logged in!${colors.reset}`);
      console.log(`  Org:      ${colors.bold}${loginResult.company_name || loginResult.company_id}${colors.reset}`);
      console.log(`  API URL:  ${colors.dim}${loginResult.api_url}${colors.reset}`);
      console.log(`${colors.dim}Credentials saved to ~/.openlabor/credentials.json${colors.reset}`);
      break;
    }

    case 'logout': {
      clearCredentials();
      console.log(`${colors.green}Logged out.${colors.reset} Credentials cleared.`);
      break;
    }

    case 'whoami': {
      const creds = loadCredentials();
      if (!creds || !creds.api_key) {
        console.log(`${colors.yellow}Not logged in.${colors.reset} Run: ${colors.dim}openlabor login <api-key>${colors.reset}`);
      } else {
        console.log(`${colors.bold}Logged in${colors.reset}`);
        console.log(`  API URL:  ${colors.dim}${creds.api_url}${colors.reset}`);
        console.log(`  Org:      ${colors.dim}${creds.company_id || '(auto-detect)'}${colors.reset}`);
        console.log(`  Key:      ${colors.dim}${creds.api_key.slice(0, 8)}...${colors.reset}`);
      }
      break;
    }

    case 'team':
    case 'employees': {
      const agents = await listOrgEmployees().catch((err) => {
        console.error(`${colors.red}Error:${colors.reset} ${err.message}`);
        process.exit(1);
      });
      printOrgEmployees(agents);
      break;
    }

    case 'ask':
    case 'dispatch': {
      // openlabor ask "message"                 — auto-routes
      // openlabor ask <employee> "message"      — specific employee
      let askEmployee = null;
      let askMsg;
      const allArgs = [sub, ...rest].filter(Boolean);

      if (allArgs.length === 0) {
        console.error(`${colors.red}Error:${colors.reset} Missing message.`);
        console.error(`Usage: ${colors.dim}openlabor ask "<message>"${colors.reset}`);
        console.error(`       ${colors.dim}openlabor ask <employee> "<message>"${colors.reset}`);
        process.exit(1);
      }

      // If first arg looks like a message (has spaces or is quoted), treat as auto-route
      if (allArgs.length === 1 || (sub && sub.includes(' '))) {
        askMsg = allArgs.join(' ');
      } else {
        askEmployee = sub;
        askMsg = rest.join(' ');
      }

      if (!askMsg) {
        console.error(`${colors.red}Error:${colors.reset} Missing message.`);
        process.exit(1);
      }

      console.log(`${colors.dim}${askEmployee ? `Asking ${askEmployee}...` : 'Routing to best employee...'}${colors.reset}`);
      const askResult = await ask(askEmployee, askMsg).catch((err) => {
        console.error(`${colors.red}Error:${colors.reset} ${err.message}`);
        process.exit(1);
      });
      if (askResult.routed) {
        console.log(`${colors.dim}Routed to ${askResult.employeeName} (${askResult.role})${colors.reset}`);
      }
      printDispatchResult(askResult);
      break;
    }

    case 'chat':
    case 'reply': {
      // openlabor chat "message"                — continues latest conversation
      // openlabor chat <employee> "message"     — continues latest with that employee
      let chatEmployee = null;
      let chatMsg;
      const chatArgs = [sub, ...rest].filter(Boolean);

      if (chatArgs.length === 0) {
        console.error(`${colors.red}Error:${colors.reset} Missing message.`);
        console.error(`Usage: ${colors.dim}openlabor chat "<message>"${colors.reset}`);
        process.exit(1);
      }

      if (chatArgs.length === 1 || (sub && sub.includes(' '))) {
        chatMsg = chatArgs.join(' ');
      } else {
        chatEmployee = sub;
        chatMsg = rest.join(' ');
      }

      if (!chatMsg) {
        console.error(`${colors.red}Error:${colors.reset} Missing message.`);
        process.exit(1);
      }

      console.log(`${colors.dim}${chatEmployee ? `Chatting with ${chatEmployee}...` : 'Continuing last conversation...'}${colors.reset}`);
      const chatResult = await chat(chatEmployee, chatMsg).catch((err) => {
        console.error(`${colors.red}Error:${colors.reset} ${err.message}`);
        process.exit(1);
      });
      printDispatchResult(chatResult);
      break;
    }

    case 'history': {
      // openlabor history              — list all conversations
      // openlabor history <employee>   — list employee's conversations
      const histEmployee = sub || null;
      if (!histEmployee) {
        // Show all local sessions
        const allSess = getAllSessions();
        const entries = Object.entries(allSess).filter(([k]) => !k.startsWith('_'));
        if (entries.length === 0) {
          console.log(`${colors.yellow}No conversations yet.${colors.reset} Start one with: ${colors.dim}openlabor ask "your message"${colors.reset}`);
        } else {
          console.log('');
          console.log(`${colors.bold}Recent Conversations${colors.reset}`);
          console.log('');
          for (const [employee, sessionId] of entries) {
            console.log(`  ${colors.bold}${employee}${colors.reset}  ${colors.dim}${sessionId}${colors.reset}`);
          }
          console.log('');
          console.log(`${colors.dim}Continue: openlabor chat <employee> "your message"${colors.reset}`);
          console.log('');
        }
      } else {
        const histResult = await history(histEmployee).catch((err) => {
          console.error(`${colors.red}Error:${colors.reset} ${err.message}`);
          process.exit(1);
        });
        printHistory(histResult);
      }
      break;
    }

    case 'tasks': {
      // openlabor tasks <employee>
      const tasksEmployee = sub;
      if (!tasksEmployee) {
        console.error(`${colors.red}Error:${colors.reset} Missing employee.`);
        console.error(`Usage: ${colors.dim}openlabor tasks <employee>${colors.reset}`);
        process.exit(1);
      }
      const tasksResult = await listTasks(tasksEmployee).catch((err) => {
        console.error(`${colors.red}Error:${colors.reset} ${err.message}`);
        process.exit(1);
      });
      printEmployeeTasks(tasksResult);
      break;
    }

    case 'run': {
      // openlabor run <task-id>
      const runTaskId = sub;
      if (!runTaskId) {
        console.error(`${colors.red}Error:${colors.reset} Missing task ID.`);
        console.error(`Usage: ${colors.dim}openlabor run <task-id>${colors.reset}`);
        process.exit(1);
      }
      const runResult = await runTask(runTaskId).catch((err) => {
        console.error(`${colors.red}Error:${colors.reset} ${err.message}`);
        process.exit(1);
      });
      console.log(`${colors.green}Task triggered.${colors.reset}`);
      if (process.env.OPENLABOR_JSON === '1') console.log(JSON.stringify(runResult));
      break;
    }

    default:
      unknownCommand(cmd);
  }

  // Print update notice after command output
  // Prefer shell output (already checked cache), fall back to async check
  if (shellUpdateOutput.startsWith('UPGRADE_AVAILABLE')) {
    const parts = shellUpdateOutput.split(' ');
    const oldVer = parts[1];
    const newVer = parts[2];
    process.stderr.write(
      `\n${colors.yellow}openlabor v${newVer} available${colors.reset} (current: v${oldVer}). Run: ${colors.dim}openlabor update${colors.reset}\n`
    );
  } else {
    updateVersion = await updateCheckPromise;
    printUpdateNotice(updateVersion);
  }
}

/**
 * Scan install target directories for files with openlabor markers.
 * Returns array of { slug, type, installedVersion, target, filePath }.
 */
function scanOutdated() {
  const cwd = process.cwd();
  const results = [];

  // Targets that use file-per-skill mode
  const fileDirs = [
    { target: 'claude', dir: join(cwd, '.claude', 'commands'), ext: '.md' },
    { target: 'cursor', dir: join(cwd, '.cursor', 'rules'), ext: '.mdc' },
    { target: 'raw', dir: cwd, ext: '.md' },
  ];

  // Targets that use append mode (single file)
  const appendFiles = [
    { target: 'codex', file: join(cwd, 'codex.md') },
    { target: 'opencode', file: join(cwd, 'opencode.md') },
    { target: 'windsurf', file: join(cwd, '.windsurfrules') },
  ];

  // Marker pattern: <!-- Installed from openlabor (skill|employee): <slug> | v<version> -->
  const markerRegex = /<!-- Installed from openlabor (skill|employee): ([^\s|]+)(?: \| v([^\s]+))? -->/;

  for (const { target, dir, ext } of fileDirs) {
    if (!existsSync(dir)) continue;
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.endsWith(ext)) continue;
      const filePath = join(dir, entry);
      try {
        const content = readFileSync(filePath, 'utf8');
        const match = content.match(markerRegex);
        if (!match) continue;
        const [, type, slug, installedVersion] = match;
        if (!installedVersion || installedVersion !== VERSION) {
          results.push({ slug, type, installedVersion: installedVersion || 'unknown', target, filePath });
        }
      } catch {
        // skip unreadable files
      }
    }
  }

  for (const { target, file } of appendFiles) {
    if (!existsSync(file)) continue;
    try {
      const content = readFileSync(file, 'utf8');
      let match;
      const re = /<!-- Installed from openlabor (skill|employee): ([^\s|]+)(?: \| v([^\s]+))? -->/g;
      while ((match = re.exec(content)) !== null) {
        const [, type, slug, installedVersion] = match;
        if (!installedVersion || installedVersion !== VERSION) {
          results.push({ slug, type, installedVersion: installedVersion || 'unknown', target, filePath: file });
        }
      }
    } catch {
      // skip
    }
  }

  return results;
}

main().catch((err) => {
  console.error(`${colors.red}Error:${colors.reset} ${err.message}`);
  process.exit(1);
});
