import { requireAuth, saveLastSession, getLastSession } from './auth.js';
import { createClient } from './api.js';

const DEFAULT_API_URL = 'https://api.openlabor.ai';

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
export async function resolveApiKey(apiKey, apiUrl) {
  const base = (apiUrl || DEFAULT_API_URL).replace(/\/+$/, '');
  const client = createClient({ apiUrl: base, apiKey });

  let org;
  try {
    org = await client.get('/v1/org');
  } catch (err) {
    if (err.status === 401) {
      throw new Error('Invalid API key. Check your key and try again.');
    }
    throw new Error(`Could not validate key against ${base}. ${err.message}`);
  }

  return {
    api_key: apiKey,
    api_url: base,
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
    client: createClient({ apiUrl: creds.api_url, apiKey: creds.api_key }),
    companyId: creds.company_id,
  };
}

/**
 * List all employees in the org.
 */
export async function listOrgEmployees() {
  const { client } = getClient();
  return client.get('/v1/employees');
}

/**
 * Get a single employee by ID, name, or template_id.
 */
export async function getEmployee(idOrName) {
  const { client } = getClient();

  try {
    return await client.get(`/v1/employees/${encodeURIComponent(idOrName)}`);
  } catch (err) {
    if (err.status === 404) {
      const employees = await client.get('/v1/employees');
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
    const employees = await client.get('/v1/employees');
    employee = routeToEmployee(employees.filter(e => e.status !== 'fired'), message);
    routed = true;
  }

  const sessionId = `cli-${Date.now()}`;

  const result = await client.post(
    `/v1/employees/${employee.id}/chat/${sessionId}`,
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
    `/v1/employees/${employee.id}/chat/${encodeURIComponent(sessionId)}`,
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
    const result = await client.get(`/v1/employees/${employee.id}/chat/sessions`);

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
  const tasks = await client.get(`/v1/employees/${employee.id}/tasks`);

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
  return client.post(`/v1/tasks/${encodeURIComponent(taskId)}/run`, {});
}
