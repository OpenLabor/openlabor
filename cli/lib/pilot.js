import { readFileSync, statSync, existsSync } from 'fs';
import { basename, extname } from 'path';
import { randomUUID } from 'crypto';
import { requireAuth, saveLastSession, getLastSession } from './auth.js';
import { createClient } from './api.js';
import { API_URL } from './config.js';

// ─── Keyword → department/role routing table ─────────────────
const ROUTE_RULES = [
  { keywords: ['tweet', 'twitter', 'x ', 'x/', 'post on x', 'thread'], departments: ['Marketing'], roles: ['X Manager'] },
  { keywords: ['instagram', 'ig ', 'reels', 'stories'], departments: ['Marketing'], roles: ['Social Manager'] },
  { keywords: ['social', 'content calendar', 'social media'], departments: ['Marketing'], roles: ['Social Manager', 'CMO'] },
  { keywords: ['marketing', 'campaign', 'launch', 'brand', 'positioning', 'ads', 'growth'], departments: ['Marketing'], roles: ['CMO'] },
  { keywords: ['seo', 'keyword', 'meta tag', 'search rank'], departments: ['Marketing'], roles: ['CMO'] },
  { keywords: ['code', 'bug', 'review', 'architecture', 'api', 'deploy', 'security', 'tech stack', 'database'], departments: ['Engineering'], roles: ['CTO'] },
  { keywords: ['design', 'ui', 'ux', 'mockup', 'wireframe', 'logo', 'landing page', 'figma'], departments: ['Design'], roles: ['Designer'] },
  { keywords: ['write', 'blog', 'article', 'copy', 'newsletter', 'email content'], departments: ['Content'], roles: ['Content Writer'] },
  { keywords: ['sales', 'outreach', 'cold email', 'prospect', 'lead', 'pipeline', 'demo', 'meeting'], departments: ['Sales'], roles: ['Sales Rep', 'SDR'] },
  { keywords: ['domain', 'brand name', 'naming', 'brand advisor'], departments: ['Marketing'], roles: ['Domain & Brand Advisor'] },
  { keywords: ['strategy', 'consulting', 'advice', 'roadmap', 'plan'], departments: ['Strategy'], roles: ['Strategic Consultant'] },
  { keywords: ['support', 'help', 'ticket', 'customer'], departments: ['Support'], roles: ['Support Agent'] },
  { keywords: ['data', 'analytics', 'report', 'metrics', 'dashboard'], departments: ['Data'], roles: ['Data Analyst'] },
];

/**
 * Auto-route a message to the best employee based on keywords.
 */
function routeToEmployee(employees, message) {
  const msg = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const rule of ROUTE_RULES) {
    const hits = rule.keywords.filter(k => msg.includes(k)).length;
    if (hits === 0) continue;

    // Find matching employee
    for (const emp of employees) {
      const roleMatch = rule.roles.some(r => emp.role?.toLowerCase().includes(r.toLowerCase()));
      const deptMatch = rule.departments.some(d => emp.department?.toLowerCase() === d.toLowerCase());
      const score = hits * 10 + (roleMatch ? 5 : 0) + (deptMatch ? 3 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = emp;
      }
    }
  }

  // Fallback: pick first employee (usually CMO or CTO)
  return bestMatch || employees[0];
}

/**
 * Resolve an API key by calling the org endpoint.
 */
export async function resolveApiKey(apiKey) {
  const client = createClient({ apiUrl: API_URL, apiKey });

  let org;
  try {
    org = await client.get('/api/org');
  } catch (err) {
    if (err.status === 401) {
      throw new Error('Invalid API key. Check your key and try again.');
    }
    throw new Error(`Could not reach ${API_URL}. ${err.message}`);
  }

  return {
    api_key: apiKey,
    company_id: org.id || null,
    company_name: org.name || null,
  };
}

/**
 * Get an authenticated API client from stored credentials.
 */
function getClient() {
  const creds = requireAuth();
  return {
    client: createClient({ apiUrl: API_URL, apiKey: creds.api_key }),
    companyId: creds.company_id,
  };
}

/**
 * List all employees in the org.
 */
export async function listOrgEmployees() {
  const { client } = getClient();
  return client.get('/api/employees');
}

/**
 * Get a single employee by ID, name, or template_id.
 */
export async function getEmployee(idOrName) {
  const { client } = getClient();

  try {
    return await client.get(`/api/employees/${encodeURIComponent(idOrName)}`);
  } catch (err) {
    if (err.status === 404) {
      const employees = await client.get('/api/employees');
      const query = idOrName.toLowerCase();
      const match = employees.find(e =>
        e.custom_name?.toLowerCase() === query ||
        e.template_id?.toLowerCase() === query ||
        e.id === idOrName
      );
      if (!match) throw new Error(`Employee not found: "${idOrName}"`);
      return match;
    }
    throw err;
  }
}

/**
 * ask — always creates a new session.
 * If no employee specified, auto-routes based on message content.
 */
export async function ask(employeeIdOrName, message, opts = {}) {
  const { client } = getClient();

  let employee;
  let routed = false;
  if (employeeIdOrName) {
    employee = await getEmployee(employeeIdOrName);
  } else {
    // Auto-route
    const employees = await client.get('/api/employees');
    const active = (Array.isArray(employees) ? employees : []).filter(e => e.status !== 'fired');
    if (active.length === 0) {
      throw new Error('Nobody works in this workspace yet. Hire someone first: `openlabor hire`.');
    }
    employee = routeToEmployee(active, message);
    routed = true;
    opts.onRouted?.(employee);
  }

  const sessionId = `cli-${Date.now()}`;

  const result = await sendMessage(client, employee.id, sessionId, message, opts);

  // Save session for this employee AND as the global latest
  const employeeKey = employee.template_id || employee.custom_name || employee.id;
  saveLastSession(employeeKey, sessionId);
  saveLastSession('_latest', sessionId);
  saveLastSession('_latest_employee', employeeKey);

  return {
    employeeId: employee.id,
    employeeName: employee.custom_name || employee.template_id,
    role: employee.role || '',
    sessionId,
    reply: result.reply || null,
    routed,
  };
}

/**
 * chat — continues the latest session.
 * If employee specified, continues latest session with that employee.
 * If no employee, continues the most recent conversation.
 */
export async function chat(employeeIdOrName, message, opts = {}) {
  const { client } = getClient();

  let employeeKey;
  let employee;

  if (employeeIdOrName) {
    employee = await getEmployee(employeeIdOrName);
    employeeKey = employee.template_id || employee.custom_name || employeeIdOrName;
  } else {
    // Use global latest
    employeeKey = getLastSession('_latest_employee');
    if (!employeeKey) {
      throw new Error('No previous conversation. Use "ask" first.');
    }
    employee = await getEmployee(employeeKey);
  }

  const sessionId = getLastSession(employeeKey);
  if (!sessionId) {
    throw new Error(`No previous conversation with "${employeeKey}". Use "ask" first.`);
  }

  const result = await sendMessage(client, employee.id, sessionId, message, opts);

  // Update global latest
  saveLastSession('_latest', sessionId);
  saveLastSession('_latest_employee', employeeKey);

  return {
    employeeId: employee.id,
    employeeName: employee.custom_name || employee.template_id,
    role: employee.role || '',
    sessionId,
    reply: result.reply || null,
    routed: false,
  };
}

/** A file type the chat accepts, read from the extension. */
const MEDIA_TYPES = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.pdf': 'application/pdf', '.txt': 'text/plain', '.md': 'text/markdown',
  '.csv': 'text/csv', '.json': 'application/json', '.html': 'text/html',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Put a local file where the chat can attach it: `attachments/<uuid>/<name>`,
 * uploaded raw, so a 40 MB PDF costs one request and no base64. The chat
 * schema wants the path, the revision the upload answered and the size.
 */
async function uploadAttachment(client, localPath) {
  if (!existsSync(localPath)) throw new Error(`No such file to attach: ${localPath}`);
  const name = basename(localPath).replace(/[\\/\x00-\x1f]/g, '_').slice(0, 180);
  const path = `attachments/${randomUUID()}/${name}`;
  const bytes = readFileSync(localPath);
  const up = await client.postRaw(`/api/workspace/file?path=${encodeURIComponent(path)}`, bytes);
  const mediaType = MEDIA_TYPES[extname(name).toLowerCase()] || 'application/octet-stream';
  return {
    type: mediaType.startsWith('image/') ? 'image' : 'document',
    data: '',
    mediaType,
    name,
    workspacePath: path,
    revision: up?.revision,
    size: up?.size ?? statSync(localPath).size,
  };
}

/**
 * Send one message and wait for the whole reply, streamed.
 *
 * The stream endpoint, not the blocking one: a long turn (research, a big
 * file) held one request open until the reply was complete, and any proxy
 * that gives up first lost the answer. The stream sends a ping every few
 * seconds, and `onToken` lets a person watch the reply arrive.
 */
async function sendMessage(client, employeeId, sessionId, message, opts = {}) {
  const attachments = [];
  for (const file of opts.attach ?? []) attachments.push(await uploadAttachment(client, file));

  let text = '';
  let fullText = null;
  let error = null;
  await client.stream(
    `/api/employees/${encodeURIComponent(employeeId)}/chat/${encodeURIComponent(sessionId)}/stream`,
    { message, ...(attachments.length ? { attachments } : {}) },
    (event) => {
      if (typeof event.token === 'string') {
        text += event.token;
        opts.onToken?.(event.token);
      } else if (event.tool?.name) {
        opts.onTool?.(event.tool);
      } else if (event.done) {
        fullText = typeof event.fullText === 'string' ? event.fullText : null;
      } else if (event.error) {
        error = String(event.error);
      }
    },
  );
  if (error && !text && !fullText) throw new Error(error);
  return { reply: fullText ?? (text || null), error };
}

/**
 * history — list conversations.
 * If employee specified, list that employee's sessions.
 * If no employee, list all recent sessions from local store.
 */
export async function history(employeeIdOrName) {
  if (employeeIdOrName) {
    const { client } = getClient();
    const employee = await getEmployee(employeeIdOrName);
    const result = await client.get(`/api/employees/${employee.id}/chat/sessions`);

    // Also include locally tracked sessions
    const employeeKey = employee.template_id || employee.custom_name || employeeIdOrName;
    const localSession = getLastSession(employeeKey);

    return {
      employeeId: employee.id,
      employeeName: employee.custom_name || employee.template_id,
      sessions: Array.isArray(result) ? result : [],
      localSession,
    };
  } else {
    // List all locally tracked sessions
    return { all: true };
  }
}

/**
 * List scheduled tasks for an employee.
 */
export async function listTasks(employeeIdOrName) {
  const { client } = getClient();
  const employee = await getEmployee(employeeIdOrName);
  const tasks = await client.get(`/api/crons/tasks/employee/${employee.id}`);

  return {
    employeeId: employee.id,
    employeeName: employee.custom_name,
    tasks: Array.isArray(tasks) ? tasks : [],
  };
}

/**
 * Run a scheduled task immediately.
 */
export async function runTask(taskId) {
  const { client } = getClient();
  return client.post(`/api/crons/tasks/${encodeURIComponent(taskId)}/run`, {});
}

/**
 * Schedule a recurring task. `schedule` is a 5-field cron or the dashboard's
 * wording ("Daily at 9:00 AM", "Weekly, Monday at 9:00 AM", "Every 30
 * minutes"); the API turns it into a cron and refuses anything more often than
 * every 15 minutes.
 */
export async function createTask(employeeIdOrName, { name, prompt, schedule, timezone }) {
  const { client } = getClient();
  if (!name?.trim()) throw new Error('A task needs a name.');
  if (!prompt?.trim()) throw new Error('A task needs a prompt — pass --prompt "<text>" or --file <path>.');
  if (!schedule?.trim()) throw new Error('A task needs a schedule — pass --schedule "Daily at 9:00 AM" or a cron.');
  const employee = await getEmployee(employeeIdOrName);
  const task = await client.post(`/api/crons/tasks/employee/${encodeURIComponent(employee.id)}`, {
    name: name.trim(),
    prompt,
    schedule: schedule.trim(),
    timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  return { employee, task };
}

/** Pause a running task or resume a paused one. Answers the new state. */
export async function toggleTask(taskId) {
  const { client } = getClient();
  return client.patch(`/api/crons/tasks/${encodeURIComponent(taskId)}/toggle`, {});
}

export async function deleteTask(taskId) {
  const { client } = getClient();
  await client.del(`/api/crons/tasks/${encodeURIComponent(taskId)}`);
  return { ok: true, id: taskId };
}

// ─── Building a team, rather than talking to one ──────────────
//
// These four exist so a migration can run unattended: an agent that already
// holds someone's Claude Code or OpenClaw setup can hire the team, teach it the
// skills, and write the company brain without ever hand-rolling an HTTP call.
// See `openlabor hire`, `openlabor skill create`, `openlabor context`.

/**
 * The roles OpenLabor ships, ready to hire.
 *
 * Deliberately not the same list as `openlabor list roles`: that one browses the
 * public prompt catalog and writes files into your editor. This one is what your
 * workspace can actually employ.
 */
export async function listHirableRoles() {
  const { client } = getClient();
  const catalog = await client.get('/api/employees/catalog');
  return Array.isArray(catalog) ? catalog : [];
}

/**
 * Hire one of our roles. `name` is what you'll call them; it defaults to the role.
 *
 * A role is single-occupancy — the API rejects a second hire of the same
 * templateId — so re-running an import is safe but not idempotent-in-silence:
 * you get a clear error rather than a duplicate team.
 */
export async function hire(templateId, customName) {
  const { client } = getClient();
  const roles = await listHirableRoles();
  const match = roles.find(
    (r) => r.id === templateId || r.id === templateId?.toLowerCase(),
  );
  if (!match) {
    const known = roles.map((r) => r.id).join(', ');
    throw new Error(`Unknown role: "${templateId}". Available: ${known}`);
  }
  const created = await client.post('/api/employees/hire', {
    templateId: match.id,
    customName: customName?.trim() || match.role,
  });
  return { ...created, templateId: match.id, role: match.role };
}

/** Palette the API accepts for an emoji avatar (see api services/avatar-url.ts). */
const AVATAR_BG = [
  '1e1b4b', '312e81', '1e3a5f', '0f766e', '166534', '3f6212',
  '854d0e', '9a3412', '9f1239', '86198f', '5b21b6', '334155',
];

/**
 * Create an employee no catalog role covers.
 *
 * `description` is not decoration: it is what the persona is synthesized from,
 * so a vague one produces a generic employee. An avatar is mandatory server-side;
 * we pick a palette colour when the caller doesn't care, because failing a hire
 * over a background colour would be absurd.
 */
export async function hireCustom({ name, role, description, emoji, bg }) {
  const { client } = getClient();
  if (!name?.trim()) throw new Error('A name is required.');

  const colour = bg && AVATAR_BG.includes(bg)
    ? bg
    : AVATAR_BG[Math.abs(hashString(name)) % AVATAR_BG.length];

  // JSON, not a form: the route validates a JSON body, and a multipart one
  // failed every time with 400 "name: Required".
  return client.post('/api/employees/custom', {
    name: name.trim(),
    role: role?.trim() || '',
    description: description?.trim() || '',
    avatarEmoji: emoji || '🧑‍💼',
    avatarBg: colour,
  });
}

/** Stable colour per name, so re-running an import doesn't reshuffle avatars. */
function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/**
 * Teach a skill to the workspace, optionally installing it on one employee.
 * `instruction` is the whole procedure — markdown, as you'd write it by hand.
 */
export async function createSkill({ name, description, instruction, employee }) {
  const { client } = getClient();
  if (!name?.trim()) throw new Error('A skill name is required.');
  if (!instruction?.trim()) throw new Error('A skill needs an instruction — pass --file.');
  // A skill lives in one employee's workspace; the API refuses one with no
  // owner. Saying so here beats its "employeeId: Required".
  if (!employee) throw new Error('Who should learn it? Pass --for <employee>.');

  const employeeId = (await getEmployee(employee)).id;

  return client.post('/api/skills/create', {
    name: name.trim(),
    description: description?.trim() || '',
    instruction,
    employeeId,
  });
}

/**
 * Rewrite a skill one employee already has, in their workspace.
 *
 * Not a catalog edit. The catalog is shared by the whole workspace, so changing
 * it would change what everyone else is served; this touches the SKILL.md that
 * this one employee actually reads. The edit also outranks the catalog from
 * then on — a later version bump reports the file as customised and leaves it
 * alone instead of overwriting the correction.
 *
 * `skill` is the id `openlabor skill list <employee>` prints.
 */
export async function updateInstalledSkill({ employee, skill, instruction, name, description, icon }) {
  const { client } = getClient();
  if (!skill?.trim()) throw new Error('Which skill? Pass the id from `openlabor skill list <employee>`.');
  if (!instruction?.trim()) throw new Error('A skill needs an instruction — pass --file.');

  const emp = await getEmployee(employee);
  const installed = await client.get(`/api/skills/employee/${encodeURIComponent(emp.id)}`);
  const match = (Array.isArray(installed) ? installed : []).find(
    (s) => s.id === skill.trim() || s.templateId === skill.trim() || s.name?.toLowerCase() === skill.trim().toLowerCase(),
  );
  // Fail here rather than let the API 404: this way the message can say what
  // they DO have, which is the next thing anyone asks.
  if (!match) {
    const have = (Array.isArray(installed) ? installed : []).map((s) => s.id).join(', ') || '(none installed)';
    throw new Error(`${emp.custom_name || emp.template_id} has no skill "${skill}". Installed: ${have}`);
  }

  await client.put(`/api/skills/employee/${encodeURIComponent(emp.id)}/${encodeURIComponent(match.id)}`, {
    instruction,
    ...(name ? { name } : {}),
    ...(description != null ? { description } : {}),
    ...(icon != null ? { icon } : {}),
  });
  return { employee: emp, skill: match };
}

/** Install a catalog skill (`openlabor skill catalog` prints the ids) on one employee. */
export async function installSkillOn(employeeIdOrName, skillId) {
  const { client } = getClient();
  const employee = await getEmployee(employeeIdOrName);
  const res = await client.post(`/api/skills/employee/${encodeURIComponent(employee.id)}`, { skillId });
  const skills = Array.isArray(res?.skills) ? res.skills : [];
  // The installed copy gets its own id (the folder name); that is the one
  // `skill list`, `skill update` and `skill remove` show.
  const installed = skills.find((s) => s.templateId === skillId || s.id === skillId);
  return { employee, skill: installed?.id ?? skillId, skills };
}

/**
 * Take a skill away from one employee. Their workspace copy is removed; the
 * catalog keeps it.
 *
 * An installed skill has its own id (`agent-intelligence`, the folder name) and
 * remembers the catalog id it came from as `templateId`. The API deletes by the
 * first; people copy either one, so both are accepted — as is the name.
 */
export async function removeSkillFrom(employeeIdOrName, skill) {
  const { client } = getClient();
  const employee = await getEmployee(employeeIdOrName);
  const installed = await client.get(`/api/skills/employee/${encodeURIComponent(employee.id)}`);
  const list = Array.isArray(installed) ? installed : [];
  const want = String(skill).trim();
  const match = list.find(
    (s) => s.id === want || s.templateId === want || s.name?.toLowerCase() === want.toLowerCase(),
  );
  if (!match) {
    const have = list.map((s) => s.id).join(', ') || '(none installed)';
    throw new Error(`${employee.custom_name || employee.template_id} has no skill "${skill}". Installed: ${have}`);
  }
  await client.del(`/api/skills/employee/${encodeURIComponent(employee.id)}/${encodeURIComponent(match.id)}`);
  return { employee, skill: match.id };
}

/**
 * The company brain — what every employee reads before working.
 *
 * Since the wiki, the brief lives in `wiki/company.md` and `org_context` is
 * empty on most orgs, so this answered "(empty)" beside a page of prose. The
 * column still wins when it holds something; the page is the fallback.
 */
export async function getContext() {
  const { client } = getClient();
  const org = await client.get('/api/org');
  if (org?.org_context) return { text: org.org_context, source: 'org_context' };
  try {
    const file = await client.get(`/api/workspace/file?path=${encodeURIComponent('wiki/company.md')}`);
    if (typeof file?.content === 'string' && file.content.trim()) return { text: file.content, source: 'wiki/company.md' };
  } catch {
    // No page either: the brain is genuinely empty.
  }
  return { text: '', source: null };
}

/**
 * Replace the company brain.
 *
 * Replace, not append: callers that mean to keep what's there must read it
 * first and send the merged text. An import that blindly overwrites a brain the
 * founder wrote by hand is the one unrecoverable mistake in this file.
 */
export async function setContext(text) {
  const { client } = getClient();
  if (!text?.trim()) throw new Error('Refusing to write an empty company brain.');
  if (text.length > 30000) {
    throw new Error(`Company brain is ${text.length} characters; the limit is 30000.`);
  }
  await client.put('/api/org/context', { context: text });
  return { ok: true, characters: text.length };
}

/**
 * The org's skill catalog — every skill the database holds, installed or not.
 *
 * Deliberately a different question from `listInstalledSkills`. This one answers
 * "what could this workspace teach someone"; that one answers "what does this
 * employee actually know", and the two drift apart the moment a skill is created
 * for one person.
 */
export async function listCatalogSkills(role) {
  const { client } = getClient();
  const path = role ? `/api/skills?role=${encodeURIComponent(role)}` : '/api/skills';
  const skills = await client.get(path);
  return Array.isArray(skills) ? skills : [];
}

/**
 * What one employee actually has, read from the files in their workspace.
 *
 * The workspace is the truth here, not the database: a skill is installed when
 * its SKILL.md is on disk, and the catalog row only decorates it (version,
 * roles, icon). Reading the DB instead would report skills that were never
 * written, and miss ones an agent wrote for itself.
 */
export async function listInstalledSkills(employeeIdOrName) {
  const { client } = getClient();
  const employee = await getEmployee(employeeIdOrName);
  const skills = await client.get(`/api/skills/employee/${encodeURIComponent(employee.id)}`);
  return {
    employee,
    skills: Array.isArray(skills) ? skills : [],
  };
}

// ── The wiki ──────────────────────────────────────────────────────────────
//
// The org's knowledge lives in `wiki/*.md` — pricing, ICP, positioning, the
// roster, the messaging in each language. It is what every employee reads and
// what the nightly pass edits, and until now the CLI could not see a word of
// it: `openlabor context` reads `org_profile.org_context`, a single column that
// is empty on any org whose brief was split into pages, so it answered
// "(empty — nothing written yet)" beside sixty kilobytes of prose.
//
// The agent surface is `use wiki LIST|GET|SEARCH|WRITE`, which is scoped to one
// employee. These go through `/api/workspace/*` instead, because a wiki page
// belongs to the org and not to whoever happens to be reading it.

const WIKI_DIR = 'wiki';

/** `wiki/pricing.md` from `pricing`, and from `wiki/pricing.md`. */
function wikiPath(slug) {
  const clean = String(slug || '')
    .trim()
    .replace(/^wiki\//, '')
    .replace(/\.md$/, '');
  if (!clean || clean.includes('/') || clean.includes('..')) {
    throw new Error(`Not a wiki slug: ${slug}`);
  }
  return `${WIKI_DIR}/${clean}.md`;
}

/** Every page, newest first, with its size. */
export async function listWiki() {
  const { client } = getClient();
  const tree = await client.get(`/api/workspace/tree?path=${WIKI_DIR}`);
  const pages = [];
  const walk = (nodes) => {
    for (const node of nodes ?? []) {
      if (node.type === 'file' && node.path?.startsWith(`${WIKI_DIR}/`)) {
        pages.push({
          slug: node.path.slice(WIKI_DIR.length + 1).replace(/\.md$/, ''),
          path: node.path,
          bytes: node.size ?? 0,
          modified: node.modified ?? 0,
        });
      }
      walk(node.children);
    }
  };
  walk(tree?.tree);
  return pages.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** One page's markdown. */
export async function readWiki(slug) {
  const { client } = getClient();
  const path = wikiPath(slug);
  const file = await client.get(`/api/workspace/file?path=${encodeURIComponent(path)}`);
  if (typeof file?.content !== 'string') throw new Error(`No wiki page at ${path}`);
  return { path, content: file.content };
}

/**
 * Replace a page.
 *
 * Replace, not append, and the same warning `setContext` carries: a page the
 * team has been writing for months is one PUT away from gone. So the caller is
 * told what it is about to overwrite, and an empty body is refused outright
 * rather than treated as "clear the page".
 */
export async function writeWiki(slug, text) {
  const { client } = getClient();
  const path = wikiPath(slug);
  if (!text?.trim()) throw new Error(`Refusing to write an empty page to ${path}.`);

  let existing = null;
  let revision;
  try {
    const file = await client.get(`/api/workspace/file?path=${encodeURIComponent(path)}`);
    existing = typeof file?.content === 'string' ? file.content : null;
    revision = typeof file?.revision === 'number' ? file.revision : undefined;
  } catch (err) {
    // A page that is not there yet is a create, not an error.
    if (err.status !== 404) throw err;
  }

  // The revision read above goes back with the write. Newer orgs refuse to
  // overwrite a file without it (409 "supply its revision"), and it also means
  // an edit made between the read and the write is refused, not clobbered.
  await client.put(`/api/workspace/file?path=${encodeURIComponent(path)}`, {
    content: text,
    ...(revision !== undefined ? { revision } : {}),
  });
  return { path, created: existing === null, replaced: existing?.length ?? 0, characters: text.length };
}

/**
 * Keyword search, narrowed to the wiki.
 *
 * `?path=` does the narrowing server-side, and it has to: the result set is
 * capped, and one large document under `shared/` filled the whole cap on a
 * search for "pricing" — the wiki page called `pricing` never appeared. Doing
 * it here instead would have filtered an answer that never contained the rows.
 */
export async function searchWiki(query) {
  const { client } = getClient();
  if (!query?.trim()) throw new Error('Nothing to search for.');
  const found = await client.get(
    `/api/workspace/search?q=${encodeURIComponent(query)}&path=${WIKI_DIR}`,
  );
  return (found?.results ?? [])
    .filter((r) => typeof r.path === 'string' && r.path.startsWith(`${WIKI_DIR}/`))
    .map((r) => ({ ...r, slug: r.path.slice(WIKI_DIR.length + 1).replace(/\.md$/, '') }));
}

// ─── Apps ─────────────────────────────────────────────────────

/**
 * Connect an app that takes an API key (agentmail, hunter, apollo…) for one
 * employee, then read back whether the key actually works.
 *
 * OAuth apps (gmail, slack, linkedin…) are refused by the server: they end at a
 * consent screen only the founder can click, in Dashboard → Employees → Apps.
 * The status read-back matters because the BYOK route stores any string — a
 * "connected" with a dead key is the thing the caller must not report as done.
 */
export async function connectApp(app, employeeIdOrName, appKey) {
  const { client } = getClient();
  const slug = app?.trim().toLowerCase();
  if (!slug) throw new Error('Which app? e.g. openlabor connect agentmail <employee> --key-env AGENTMAIL_API_KEY');
  if (!appKey?.trim()) throw new Error(`No key given for ${slug}.`);
  const employee = await getEmployee(employeeIdOrName);

  try {
    await client.post(`/api/connectors/${encodeURIComponent(slug)}/connect-api-key`, {
      employeeId: employee.id,
      apiKey: appKey.trim(),
    });
  } catch (err) {
    if (/uses OAuth/.test(err.message)) {
      throw new Error(`${slug} signs in with OAuth, not a key. Connect it in Dashboard → Employees → ${employee.custom_name || employee.name || employee.id} → Apps.`);
    }
    throw err;
  }

  let status = null;
  try {
    status = await client.get(`/api/connectors/${encodeURIComponent(slug)}/status?employeeId=${encodeURIComponent(employee.id)}`);
  } catch {
    // Connected but unverifiable; say so rather than guess.
  }
  return {
    app: slug,
    employeeId: employee.id,
    employee: employee.custom_name || employee.name || employee.id,
    connected: status?.connected ?? true,
    keyStatus: status?.keyStatus ?? 'unchecked',
    keyError: status?.keyError ?? null,
  };
}
