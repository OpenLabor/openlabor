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
export async function ask(employeeIdOrName, message) {
  const { client } = getClient();

  let employee;
  let routed = false;
  if (employeeIdOrName) {
    employee = await getEmployee(employeeIdOrName);
  } else {
    // Auto-route
    const employees = await client.get('/api/employees');
    employee = routeToEmployee(employees.filter(e => e.status !== 'fired'), message);
    routed = true;
  }

  const sessionId = `cli-${Date.now()}`;

  const result = await client.post(
    `/api/employees/${employee.id}/chat/${sessionId}`,
    { message }
  );

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
export async function chat(employeeIdOrName, message) {
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

  const result = await client.post(
    `/api/employees/${employee.id}/chat/${encodeURIComponent(sessionId)}`,
    { message }
  );

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

  return client.postForm('/api/employees/custom', {
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

  let employeeId;
  if (employee) employeeId = (await getEmployee(employee)).id;

  return client.post('/api/skills/create', {
    name: name.trim(),
    description: description?.trim() || '',
    instruction,
    ...(employeeId ? { employeeId } : {}),
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

/** The company brain (hq/COMPANY.md) — what every employee reads before working. */
export async function getContext() {
  const { client } = getClient();
  const org = await client.get('/api/org');
  return org?.org_context || '';
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
