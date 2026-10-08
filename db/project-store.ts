import { env } from 'cloudflare:workers';

export const projectDDL = [
  `CREATE TABLE IF NOT EXISTS data_assets (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, filename TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS data_projects (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS project_members (project_id TEXT NOT NULL REFERENCES data_projects(id), user_id TEXT NOT NULL REFERENCES platform_users(id), permission TEXT NOT NULL CHECK(permission IN ('viewer', 'editor')), PRIMARY KEY(project_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS project_assets (asset_id TEXT PRIMARY KEY REFERENCES data_assets(id), project_id TEXT NOT NULL REFERENCES data_projects(id))`,
  `CREATE TABLE IF NOT EXISTS project_workflows (project_id TEXT PRIMARY KEY REFERENCES data_projects(id), workspace TEXT NOT NULL CHECK(json_valid(workspace)), updated_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_project_assets_project ON project_assets(project_id)`,
  `CREATE TABLE IF NOT EXISTS data_audit (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, action TEXT NOT NULL, target_id TEXT NOT NULL, detail TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_data_audit_created ON data_audit(created_at)`,
];
export async function projectDatabase() {
  if (!env.DB) throw new Error('数据库未配置');
  await env.DB.batch(projectDDL.map(sql => env.DB!.prepare(sql)));
  return env.DB;
}
export function auditStatement(db: D1Database, userId: string, action: string, target: string, detail = '') {
  return db.prepare('INSERT INTO data_audit VALUES (?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), userId, action, target, detail, Date.now());
}
export async function listDataProjects(userId: string) {
  const db = await projectDatabase();
  return (await db.prepare(`SELECT p.*, CASE WHEN p.owner_id = ? THEN 'owner' ELSE m.permission END AS permission
    FROM data_projects p LEFT JOIN project_members m ON m.project_id = p.id AND m.user_id = ?
    WHERE p.owner_id = ? OR m.user_id = ? ORDER BY p.created_at DESC`).bind(userId, userId, userId, userId).all()).results;
}
export async function createDataProject(userId: string, name: string) {
  const db = await projectDatabase(); const id = crypto.randomUUID();
  await db.batch([db.prepare('INSERT INTO data_projects VALUES (?, ?, ?, ?)').bind(id, userId, name, Date.now()), auditStatement(db, userId, 'project.create', id, name)]);
  return id;
}
export async function ownsDataProject(userId: string, id: string) {
  const db = await projectDatabase();
  return !!(await db.prepare('SELECT id FROM data_projects WHERE id = ? AND owner_id = ?').bind(id, userId).first());
}
export async function dataProjectMembers(userId: string, id: string) {
  const db = await projectDatabase();
  if (!(await ownsDataProject(userId, id))) return null;
  return (await db.prepare(`SELECT m.user_id, m.permission, u.username, u.display_name AS displayName FROM project_members m
    JOIN platform_users u ON u.id = m.user_id WHERE m.project_id = ? ORDER BY u.username`).bind(id).all()).results;
}
export async function updateDataMember(userId: string, projectId: string, username: string, permission: 'viewer' | 'editor' | 'remove') {
  const db = await projectDatabase();
  if (!(await ownsDataProject(userId, projectId))) return { error: '仅项目所有者可管理成员', status: 403 };
  const member = await db.prepare("SELECT id FROM platform_users WHERE username = ? AND (? = 'remove' OR active = 1)").bind(username, permission).first<{ id: string }>();
  if (!member) return { error: '账号不存在或已停用', status: 400 };
  if (member.id === userId) return { error: '项目所有者权限不能通过成员列表修改', status: 400 };
  const statement = permission === 'remove' ? db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').bind(projectId, member.id)
    : db.prepare(`INSERT INTO project_members VALUES (?, ?, ?) ON CONFLICT(project_id, user_id) DO UPDATE SET permission = excluded.permission`).bind(projectId, member.id, permission);
  await db.batch([statement, auditStatement(db, userId, 'project.member', projectId, `${member.id}:${permission}`)]);
  return { ok: true };
}
export async function assignDataProject(userId: string, assetId: string, projectId: string | null) {
  const db = await projectDatabase();
  if (!(await db.prepare('SELECT id FROM data_assets WHERE id = ? AND owner_id = ?').bind(assetId, userId).first())) return false;
  if (projectId && !(await ownsDataProject(userId, projectId))) return false;
  const statement = projectId ? db.prepare(`INSERT INTO project_assets VALUES (?, ?) ON CONFLICT(asset_id) DO UPDATE SET project_id = excluded.project_id`).bind(assetId, projectId)
    : db.prepare('DELETE FROM project_assets WHERE asset_id = ?').bind(assetId);
  await db.batch([statement, auditStatement(db, userId, 'asset.project', assetId, projectId ?? 'private')]);
  return true;
}
export const readableAssetSql = `(a.owner_id = ? OR EXISTS (
  SELECT 1 FROM project_assets pa JOIN data_projects p ON p.id = pa.project_id
  LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
  WHERE pa.asset_id = a.id AND (p.owner_id = ? OR pm.user_id = ?)))`;
export async function canProcessAsset(userId: string, assetId: string) {
  const db = await projectDatabase();
  return !!(await db.prepare(`SELECT a.id FROM data_assets a WHERE a.id = ? AND (a.owner_id = ? OR EXISTS (
    SELECT 1 FROM project_assets pa JOIN data_projects p ON p.id = pa.project_id
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    WHERE pa.asset_id = a.id AND (p.owner_id = ? OR pm.permission = 'editor')))`)
    .bind(assetId, userId, userId, userId).first());
}

export async function canProcessProjectAsset(userId: string, projectId: string, assetId: string) {
  const db = await projectDatabase();
  return !!(await db.prepare(`SELECT pa.asset_id FROM project_assets pa JOIN data_projects p ON p.id = pa.project_id
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    WHERE pa.project_id = ? AND pa.asset_id = ? AND (p.owner_id = ? OR pm.permission = 'editor')`)
    .bind(userId, projectId, assetId, userId).first());
}

export async function readProjectWorkflow(userId: string, projectId: string) {
  const db = await projectDatabase();
  const project = await db.prepare(`SELECT p.id, CASE WHEN p.owner_id = ? THEN 'owner' ELSE pm.permission END AS permission
    FROM data_projects p LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    WHERE p.id = ? AND (p.owner_id = ? OR pm.user_id = ?)`)
    .bind(userId, userId, projectId, userId, userId).first<{ id: string; permission: string }>();
  if (!project) return null;
  const record = await db.prepare('SELECT workspace FROM project_workflows WHERE project_id = ?').bind(projectId).first<{ workspace: string }>();
  return { permission: project.permission, workspace: record ? JSON.parse(record.workspace) : null };
}
export async function saveProjectWorkflow(userId: string, projectId: string, workspace: unknown) {
  const project = await readProjectWorkflow(userId, projectId);
  if (!project || project.permission === 'viewer') return false;
  const db = await projectDatabase();
  await db.batch([db.prepare('INSERT INTO project_workflows VALUES (?, ?, ?) ON CONFLICT(project_id) DO UPDATE SET workspace = excluded.workspace, updated_at = excluded.updated_at').bind(projectId, JSON.stringify(workspace), Date.now()), auditStatement(db, userId, 'project.workflow', projectId)]);
  return true;
}
