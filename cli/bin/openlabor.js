#!/usr/bin/env node

import { listEmployees, listSkills, search } from '../lib/registry.js';
import { installEmployee, installSkill, TARGETS } from '../lib/installer.js';
import { printEmployees, printSkills, printSearchResults, printHelp, printTargets, printVersion, printConfig, printOutdated, printOrgEmployees, printDispatchResult, printHistory, printEmployeeTasks, colors, fail } from '../lib/display.js';
import { VERSION } from '../lib/version.js';
import { checkForUpdate, checkForUpdateShell, printUpdateNotice, detectInstallType, performUpdate } from '../lib/updater.js';
import { loadConfig, saveConfig, CONFIG_FILE, API_URL } from '../lib/config.js';
import { loadCredentials, saveCredentials, clearCredentials, getAllSessions } from '../lib/auth.js';
import { listOrgEmployees, ask, chat, history, listTasks, runTask, resolveApiKey, listHirableRoles, hire, hireCustom, createSkill, updateInstalledSkill, getContext, setContext, listCatalogSkills, listInstalledSkills } from '../lib/pilot.js';
import { browserLogin } from '../lib/browser-login.js';
import { upload, uploadToHq, download } from '../lib/files.js';
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

/** Re-install every prompt file this CLI put in your editor, at its latest version. */
async function refreshPrompts() {
  const outdated = scanOutdated();
  if (outdated.length === 0) {
    console.log(`${colors.green}All installed prompts are up to date.${colors.reset}`);
    return;
  }
  console.log(`Re-installing ${outdated.length} prompt(s)...`);
  console.log('');
  for (const item of outdated) {
    const install = item.type === 'skill' ? installSkill : installEmployee;
    await install(item.slug, item.target).catch((err) => {
      console.error(`${colors.red}Error reinstalling ${item.slug}:${colors.reset} ${err.message}`);
    });
  }
  console.log('');
  console.log(`${colors.green}Done.${colors.reset}`);
}

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
    case 'catalog':
    case 'list': {
      // "roles" is the accurate word: these are prompt templates you copy into
      // an editor, not people you employ. "employees" stays as an alias so the
      // command everyone already types keeps working.
      if (!sub || sub === 'roles' || sub === 'employees') {
        const employees = listEmployees();
        printEmployees(employees);
      } else if (sub === 'skills') {
        const skills = listSkills();
        printSkills(skills);
      } else {
        console.error(`${colors.red}Unknown catalog target:${colors.reset} "${sub}"`);
        console.error(`Try: ${colors.dim}openlabor list roles${colors.reset} or ${colors.dim}openlabor list skills${colors.reset}`);
        console.error(`${colors.dim}Looking for the employees working in your workspace? That's ${colors.reset}${colors.yellow}openlabor team${colors.reset}${colors.dim}.${colors.reset}`);
        process.exit(1);
      }
      break;
    }

    case 'install': {
      if (!sub) {
        console.error(`${colors.red}Error:${colors.reset} Specify what to install.`);
        console.error(`Usage: ${colors.dim}openlabor install role <name>${colors.reset}`);
        console.error(`       ${colors.dim}openlabor install skill <name>${colors.reset}`);
        console.error(`${colors.dim}This copies a prompt into your editor. To hire in your workspace, use the dashboard.${colors.reset}`);
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

      if (sub === 'role' || sub === 'employee') {
        await installEmployee(name, targetName).catch((err) => fail(err.message));
      } else if (sub === 'skill') {
        await installSkill(name, targetName).catch((err) => fail(err.message));
      } else {
        console.error(`${colors.red}Unknown install type:${colors.reset} "${sub}"`);
        console.error(`Try: ${colors.dim}role${colors.reset} or ${colors.dim}skill${colors.reset}`);
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

    // `prompts` groups everything about the prompt files this CLI copied into
    // your editor. Before, "update" meant the CLI itself while "update-skills"
    // meant these files — one word, two subjects, and no way to guess which.
    case 'prompts': {
      if (!sub || sub === 'outdated' || sub === 'list') {
        printOutdated(scanOutdated(), VERSION);
        break;
      }
      if (sub === 'refresh' || sub === 'update') {
        await refreshPrompts();
        break;
      }
      console.error(`${colors.red}Unknown prompts command:${colors.reset} "${sub}"`);
      console.error(`Try: ${colors.dim}openlabor prompts outdated${colors.reset} or ${colors.dim}openlabor prompts refresh${colors.reset}`);
      process.exit(1);
      break;
    }

    case 'outdated': {
      // Scan known target dirs for files with openlabor markers and check version
      const outdated = scanOutdated();
      printOutdated(outdated, VERSION);
      break;
    }

    case 'update-skills': {
      await refreshPrompts();
      break;
    }

    // ─── Pilot commands ───────────────────────────────────────

    case 'login': {
      // openlabor login <api-key> [--url <url>]
      let apiKey = null;
      const loginArgs = [sub, ...rest].filter(Boolean);
      for (let i = 0; i < loginArgs.length; i++) {
        if ((loginArgs[i] === '--key' || loginArgs[i] === '-k') && loginArgs[i + 1]) { apiKey = loginArgs[++i]; }
        else if (!apiKey && !loginArgs[i].startsWith('-')) { apiKey = loginArgs[i]; }
      }
      // No key given → browser login. This is the default path: it always mints
      // a workspace key, whereas hand-copying from the settings page is how
      // people ended up with an employee-scoped key that 403s on `team`.
      let loginResult;
      if (!apiKey) {
        loginResult = await browserLogin(({ userCode, verificationUrl, opened }) => {
          console.log('');
          console.log(`  Confirmation code: ${colors.bold}${userCode}${colors.reset}`);
          console.log('');
          console.log(opened
            ? `${colors.dim}Opened your browser. Approve the code there.${colors.reset}`
            : `Open this URL to approve: ${colors.dim}${verificationUrl}${colors.reset}`);
          console.log(`${colors.dim}Waiting…  (Ctrl-C to cancel · openlabor login --key <api-key> to paste one instead)${colors.reset}`);
        }).catch((err) => fail(err.message));
      } else {
        // Resolve org and URL from the API key
        loginResult = await resolveApiKey(apiKey).catch((err) => fail(err.message));
      }
      saveCredentials(loginResult);
      console.log(`${colors.green}Logged in!${colors.reset}`);
      console.log(`  Org:      ${colors.bold}${loginResult.company_name || loginResult.company_id}${colors.reset}`);
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
        if (process.env.OPENLABOR_JSON === '1') {
          console.log(JSON.stringify({ ok: false, logged_in: false }));
        } else {
          console.log(`${colors.yellow}Not logged in.${colors.reset} Run: ${colors.dim}openlabor login${colors.reset}`);
        }
        process.exit(1);
      }

      // Actually ask the server. Reading credentials off disk only proves a file
      // exists — it said "Logged in" for a key the API rejects with 401, which
      // is the one moment this command has to be right.
      let org = null;
      let authError = null;
      try {
        org = await resolveApiKey(creds.api_key);
      } catch (err) {
        authError = err.message;
      }

      if (process.env.OPENLABOR_JSON === '1') {
        console.log(JSON.stringify(authError
          ? { ok: false, logged_in: false, error: authError }
          : { ok: true, logged_in: true, api: API_URL, org_id: org.company_id, org_name: org.company_name }));
        if (authError) process.exit(1);
        break;
      }

      if (authError) {
        fail(`Your stored credentials are not valid: ${authError}`, 'Run `openlabor login` to sign in again.');
      }
      console.log(`${colors.bold}Logged in${colors.reset}`);
      console.log(`  API:      ${colors.dim}${API_URL}${colors.reset}`);
      console.log(`  Org:      ${colors.dim}${org.company_name || org.company_id}${colors.reset}`);
      console.log(`  Key:      ${colors.dim}${creds.api_key.slice(0, 8)}...${colors.reset}`);
      break;
    }

    case 'team':
    case 'employees': {
      const agents = await listOrgEmployees().catch((err) => fail(err.message));
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
      const askResult = await ask(askEmployee, askMsg).catch((err) => fail(err.message));
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
      const chatResult = await chat(chatEmployee, chatMsg).catch((err) => fail(err.message));
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
        const histResult = await history(histEmployee).catch((err) => fail(err.message));
        printHistory(histResult);
      }
      break;
    }

    case 'upload': {
      // openlabor upload <employee> <path> [--dir <subdir>] [--overwrite]
      // openlabor upload --hq <path> [--dir <subdir>] [--overwrite]
      // Employee first, like every other pilot command — except for the shared
      // HQ folder, which belongs to nobody and so takes no employee.
      if (sub === '--hq') {
        const hqPath = rest[0];
        let hqDir = '';
        let hqOverwrite = false;
        for (let i = 1; i < rest.length; i++) {
          if (rest[i] === '--dir' && rest[i + 1]) hqDir = rest[++i];
          else if (rest[i] === '--overwrite') hqOverwrite = true;
        }
        if (!hqPath) fail('Missing path.', 'Usage: openlabor upload --hq <file-or-dir> [--dir <subdir>] [--overwrite]');
        const hqRes = await uploadToHq(hqPath, {
          dir: hqDir,
          overwrite: hqOverwrite,
          onFile: ({ rel, status, why }) => {
            if (status === 'ok') console.log(`  ${colors.green}\u2713${colors.reset} ${rel}`);
            else if (status === 'skipped') console.log(`  ${colors.dim}\u2013 ${rel}${why ? ` (${why})` : ''}${colors.reset}`);
            else console.log(`  ${colors.red}\u2717${colors.reset} ${rel} ${colors.dim}(${why})${colors.reset}`);
          },
        }).catch((err) => fail(err.message));
        console.log('');
        console.log(`${colors.green}${hqRes.uploaded} file(s)${colors.reset} \u2192 ${colors.bold}HQ${colors.reset} ${colors.dim}(shared with every employee)${colors.reset}`);
        if (hqRes.skipped.length) console.log(`${colors.dim}${hqRes.skipped.length} skipped${colors.reset}`);
        if (hqRes.failed.length) console.log(`${colors.yellow}${hqRes.failed.length} failed${colors.reset}`);
        break;
      }

      const upEmployee = sub;
      const upPath = rest[0];
      let upDir = '';
      let upOverwrite = false;
      for (let i = 1; i < rest.length; i++) {
        if (rest[i] === '--dir' && rest[i + 1]) upDir = rest[++i];
        else if (rest[i] === '--overwrite') upOverwrite = true;
      }
      if (!upEmployee || !upPath) {
        fail('Missing arguments.', 'Usage: openlabor upload <employee> <file-or-dir> [--dir <subdir>] [--overwrite]');
      }
      const upRes = await upload(upEmployee, upPath, {
        dir: upDir,
        overwrite: upOverwrite,
        onFile: ({ rel, status, why }) => {
          if (status === 'ok') console.log(`  ${colors.green}✓${colors.reset} ${rel}`);
          else if (status === 'skipped') console.log(`  ${colors.dim}– ${rel}${colors.reset}`);
          else console.log(`  ${colors.red}✗${colors.reset} ${rel} ${colors.dim}(${why})${colors.reset}`);
        },
      }).catch((err) => fail(err.message));
      console.log('');
      console.log(`${colors.green}${upRes.uploaded} file(s)${colors.reset} → ${colors.bold}${upRes.employee.custom_name || upRes.employee.template_id}${colors.reset}`);
      if (upRes.skipped.length) console.log(`${colors.dim}${upRes.skipped.length} skipped${colors.reset}`);
      if (upRes.failed.length) console.log(`${colors.yellow}${upRes.failed.length} failed${colors.reset}`);
      break;
    }

    case 'download': {
      // openlabor download <employee> [dest.zip]
      const dlEmployee = sub;
      if (!dlEmployee) {
        fail('Missing employee.', 'Usage: openlabor download <employee> [dest.zip]');
      }
      const dlRes = await download(dlEmployee, rest[0]).catch((err) => fail(err.message));
      console.log(`${colors.green}Downloaded${colors.reset} ${colors.bold}${dlRes.path}${colors.reset} ${colors.dim}(${(dlRes.bytes / 1048576).toFixed(1)} MB)${colors.reset}`);
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
      const tasksResult = await listTasks(tasksEmployee).catch((err) => fail(err.message));
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
      const runResult = await runTask(runTaskId).catch((err) => fail(err.message));
      console.log(`${colors.green}Task triggered.${colors.reset}`);
      if (process.env.OPENLABOR_JSON === '1') console.log(JSON.stringify(runResult));
      break;
    }

    // ─── Building the team ───────────────────────────────────
    // These three are what an unattended migration needs. Before them, an agent
    // holding someone's Claude Code setup could talk to a team but not create
    // one, so every import guide fell back to hand-written curl.

    case 'hire': {
      // openlabor hire                                  — what you can hire
      // openlabor hire <role> [name]                    — hire one of ours
      // openlabor hire --custom <name> --role <r> --description <d> [--emoji X]
      if (!sub) {
        const roles = await listHirableRoles().catch((err) => fail(err.message));
        if (process.env.OPENLABOR_JSON === '1') {
          console.log(JSON.stringify({ ok: true, roles }));
          break;
        }
        console.log(`${colors.bold}Roles you can hire${colors.reset}\n`);
        for (const r of roles) {
          console.log(`  ${colors.bold}${r.id}${colors.reset}  ${colors.dim}${r.role}${colors.reset}`);
        }
        console.log(`\n${colors.dim}openlabor hire <role> "<name>"${colors.reset}`);
        break;
      }

      if (sub === '--custom') {
        const flag = (n) => {
          const i = rest.indexOf(`--${n}`);
          return i >= 0 ? rest[i + 1] : undefined;
        };
        // The name is the one positional: `hire --custom "Atlas" --role ...`
        const customName = rest[0] && !rest[0].startsWith('--') ? rest[0] : flag('name');
        const created = await hireCustom({
          name: customName,
          role: flag('role'),
          description: flag('description'),
          emoji: flag('emoji'),
          bg: flag('bg'),
        }).catch((err) => fail(err.message));
        if (process.env.OPENLABOR_JSON === '1') {
          console.log(JSON.stringify({ ok: true, employee: created }));
          break;
        }
        console.log(`${colors.green}Hired${colors.reset} ${colors.bold}${customName}${colors.reset} ${colors.dim}(${created.id})${colors.reset}`);
        break;
      }

      const hired = await hire(sub, rest.join(' ')).catch((err) => fail(err.message));
      if (process.env.OPENLABOR_JSON === '1') {
        console.log(JSON.stringify({ ok: true, employee: hired }));
        break;
      }
      console.log(`${colors.green}Hired${colors.reset} ${colors.bold}${rest.join(' ') || hired.role}${colors.reset} ${colors.dim}as ${hired.role} (${hired.id})${colors.reset}`);
      break;
    }

    case 'skill': {
      // openlabor skill catalog [--role <r>]   — everything the workspace holds
      // openlabor skill list <employee>        — what that employee actually has
      // openlabor skill create <name> --file <path> [--for <employee>]
      // openlabor skill update <employee> <skill> --file <path>
      //
      // NB `openlabor update-skills` is a different word entirely: it refreshes
      // the prompt files this CLI copied into your editor. Nothing to do with
      // what an employee knows.
      //
      // catalog and list answer different questions and read different sources:
      // the catalog is the database, the list is the files in the employee's
      // workspace. A skill exists in the catalog long before anyone installs it.
      if (sub === 'catalog') {
        const ri = rest.indexOf('--role');
        const catalog = await listCatalogSkills(ri >= 0 ? rest[ri + 1] : undefined).catch((err) => fail(err.message));
        if (process.env.OPENLABOR_JSON === '1') {
          console.log(JSON.stringify({ ok: true, skills: catalog }));
          break;
        }
        console.log('');
        console.log(`${colors.bold}Skill catalog${colors.reset} ${colors.dim}(${catalog.length} in this workspace)${colors.reset}`);
        console.log('');
        for (const sk of catalog) {
          console.log(`  ${colors.yellow}${sk.id}${colors.reset}  ${sk.name}${sk.category ? ` ${colors.dim}[${sk.category}]${colors.reset}` : ''}`);
        }
        console.log('');
        console.log(`${colors.dim}Installed on one employee: openlabor skill list <employee>${colors.reset}`);
        console.log('');
        break;
      }

      if (sub === 'list' || sub === 'installed') {
        if (!rest[0]) {
          fail('Missing employee.', 'Usage: openlabor skill list <employee>   —  for every skill in the workspace, use `openlabor skill catalog`');
        }
        const inst = await listInstalledSkills(rest[0]).catch((err) => fail(err.message));
        if (process.env.OPENLABOR_JSON === '1') {
          console.log(JSON.stringify({ ok: true, employee_id: inst.employee.id, skills: inst.skills }));
          break;
        }
        console.log('');
        console.log(`${colors.bold}${inst.employee.custom_name || inst.employee.template_id}${colors.reset} ${colors.dim}knows ${inst.skills.length} skill(s)${colors.reset}`);
        console.log('');
        for (const sk of inst.skills) {
          console.log(`  ${colors.yellow}${sk.id}${colors.reset}  ${sk.name}`);
        }
        if (inst.skills.length === 0) console.log(`  ${colors.dim}(none installed)${colors.reset}`);
        console.log('');
        break;
      }

      if (sub === 'update' || sub === 'edit') {
        const uf = (n) => {
          const i = rest.indexOf(`--${n}`);
          return i >= 0 ? rest[i + 1] : undefined;
        };
        const [who, which] = rest;
        if (!who || !which || which.startsWith('--')) {
          fail(
            'Usage: openlabor skill update <employee> <skill> --file <path>',
            'The skill id is what `openlabor skill list <employee>` prints.',
          );
        }
        const file = uf('file');
        if (!file || !existsSync(file)) fail(`No such file: ${file || '(missing --file)'}`);

        const res = await updateInstalledSkill({
          employee: who,
          skill: which,
          instruction: readFileSync(file, 'utf-8'),
          name: uf('name'),
          description: uf('description'),
          icon: uf('icon'),
        }).catch((err) => fail(err.message));

        if (process.env.OPENLABOR_JSON === '1') {
          console.log(JSON.stringify({ ok: true, employee_id: res.employee.id, skill: res.skill.id }));
          break;
        }
        const label = res.employee.custom_name || res.employee.template_id;
        console.log(`${colors.green}Updated${colors.reset} ${colors.bold}${res.skill.name}${colors.reset} ${colors.dim}on ${label}${colors.reset}`);
        console.log(`${colors.dim}Their copy only — the catalog and everyone else's copy are unchanged.${colors.reset}`);
        break;
      }

      if (sub !== 'create') {
        console.error(`${colors.red}Error:${colors.reset} Unknown skill command: ${sub || '(none)'}`);
        console.error(`Usage: ${colors.dim}openlabor skill catalog${colors.reset}                          every skill in the workspace`);
        console.error(`       ${colors.dim}openlabor skill list <employee>${colors.reset}                  what one employee has`);
        console.error(`       ${colors.dim}openlabor skill create "<name>" --file <path> [--for <employee>]${colors.reset}`);
        console.error(`       ${colors.dim}openlabor skill update <employee> <skill> --file <path>${colors.reset}   fix one employee's copy`);
        process.exit(1);
      }
      const flag = (n) => {
        const i = rest.indexOf(`--${n}`);
        return i >= 0 ? rest[i + 1] : undefined;
      };
      const skillName = rest[0] && !rest[0].startsWith('--') ? rest[0] : flag('name');
      const skillFile = flag('file');
      if (!skillFile || !existsSync(skillFile)) {
        fail(`No such file: ${skillFile || '(missing --file)'}`);
      }
      const created = await createSkill({
        name: skillName,
        description: flag('description'),
        instruction: readFileSync(skillFile, 'utf-8'),
        employee: flag('for'),
      }).catch((err) => fail(err.message));
      if (process.env.OPENLABOR_JSON === '1') {
        console.log(JSON.stringify({ ok: true, skill: created }));
        break;
      }
      console.log(`${colors.green}Created skill${colors.reset} ${colors.bold}${skillName}${colors.reset}${flag('for') ? ` ${colors.dim}→ ${flag('for')}${colors.reset}` : ''}`);
      break;
    }

    case 'context': {
      // openlabor context                     — print the company brain
      // openlabor context set --file <path>   — replace it
      if (!sub) {
        const text = await getContext().catch((err) => fail(err.message));
        if (process.env.OPENLABOR_JSON === '1') {
          console.log(JSON.stringify({ ok: true, context: text }));
          break;
        }
        console.log(text || `${colors.dim}(empty — nothing written yet)${colors.reset}`);
        break;
      }
      if (sub !== 'set') {
        console.error(`${colors.red}Error:${colors.reset} Unknown context command: ${sub}`);
        console.error(`Usage: ${colors.dim}openlabor context${colors.reset} | ${colors.dim}openlabor context set --file <path>${colors.reset}`);
        process.exit(1);
      }
      const fi = rest.indexOf('--file');
      const ctxFile = fi >= 0 ? rest[fi + 1] : undefined;
      if (!ctxFile || !existsSync(ctxFile)) {
        fail(`No such file: ${ctxFile || '(missing --file)'}`);
      }
      // Replaces, never merges — say so at the moment it matters, since the
      // thing being replaced may be something the founder wrote by hand.
      const written = await setContext(readFileSync(ctxFile, 'utf-8')).catch((err) => fail(err.message));
      if (process.env.OPENLABOR_JSON === '1') {
        console.log(JSON.stringify({ ok: true, ...written }));
        break;
      }
      console.log(`${colors.green}Company brain updated${colors.reset} ${colors.dim}(${written.characters} characters — replaced, not merged)${colors.reset}`);
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

main().catch((err) => fail(err.message));
