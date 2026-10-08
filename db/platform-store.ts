import { projectDatabase } from "./project-store";
import { env } from "cloudflare:workers";
import { businessCollections, validateSnapshot, type BusinessSnapshot } from "./business-model";

const SESSION_COOKIE = "hqdp_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const PASSWORD_ITERATIONS = 100_000;
const LEGACY_PASSWORD_ITERATIONS = 120_000;

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  roleId: string;
};

const defaultAccounts = [
  { id: "auth-admin", username: "高质量数据评估演示", displayName: "高质量数据评估演示", roleId: "role-admin" },
  { id: "auth-data", username: "zhaoning@local", displayName: "赵宁", roleId: "role-data" },
  { id: "auth-quality", username: "wangmin@local", displayName: "王敏", roleId: "role-quality" },
  { id: "auth-model", username: "licheng@local", displayName: "李成", roleId: "role-model" },
];

const fallbackPermissions: Record<string, Record<string, "无权限" | "只读" | "管理">> = {
  "role-admin": { home: "管理", inventory: "管理", governance: "管理", assessment: "管理", modelDev: "管理", modelEval: "管理", admin: "管理" },
  "role-data": { home: "只读", inventory: "管理", governance: "管理", assessment: "只读", modelDev: "无权限", modelEval: "只读", admin: "只读" },
  "role-quality": { home: "只读", inventory: "只读", governance: "只读", assessment: "管理", modelDev: "无权限", modelEval: "管理", admin: "只读" },
  "role-model": { home: "只读", inventory: "只读", governance: "只读", assessment: "只读", modelDev: "管理", modelEval: "管理", admin: "只读" },
};

function getDatabase(): D1Database {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  return env.DB as D1Database;
}

export async function ensurePlatformDatabase() {
  const db = getDatabase();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS platform_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      role_id TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      last_login_at INTEGER
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS platform_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS platform_snapshots (
      id TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      payload TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    db.prepare("CREATE TABLE IF NOT EXISTS platform_write_guard (id TEXT PRIMARY KEY, valid INTEGER NOT NULL CHECK(valid = 1))"),
    db.prepare(`CREATE TABLE IF NOT EXISTS platform_records (
      collection TEXT NOT NULL, record_id TEXT NOT NULL, module_id TEXT NOT NULL,
      payload TEXT NOT NULL CHECK(json_valid(payload)), updated_by TEXT NOT NULL,
      updated_at INTEGER NOT NULL, PRIMARY KEY(collection, record_id))`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_platform_records_module ON platform_records(module_id, collection)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS platform_write_audit (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, action TEXT NOT NULL,
      collections TEXT NOT NULL, created_at INTEGER NOT NULL)`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_platform_write_audit_created ON platform_write_audit(created_at)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_users_username ON platform_users(username)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_platform_users_role_id ON platform_users(role_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_platform_sessions_user_id ON platform_sessions(user_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_platform_sessions_expires_at ON platform_sessions(expires_at)"),
  ]);

  for (const account of defaultAccounts) {
    const existing = await db.prepare("SELECT id FROM platform_users WHERE username = ? LIMIT 1").bind(account.username).first();
    if (existing) continue;
    const salt = randomHex(16);
    const passwordHash = await hashPassword("123456", salt);
    await db.prepare(`INSERT INTO platform_users
      (id, username, display_name, role_id, password_hash, password_salt, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)`)
      .bind(account.id, account.username, account.displayName, account.roleId, passwordHash, salt, Date.now())
      .run();
  }

  await db.prepare("DELETE FROM platform_sessions WHERE expires_at <= ?").bind(Date.now()).run();
  await db.prepare("PRAGMA optimize").run();
}

export async function authenticateUser(username: string, password: string): Promise<SessionUser | null> {
  await ensurePlatformDatabase();
  const row = await getDatabase().prepare(`SELECT id, username, display_name AS displayName, role_id AS roleId,
    password_hash AS passwordHash, password_salt AS passwordSalt, active
    FROM platform_users WHERE username = ? LIMIT 1`).bind(username).first<SessionUser & { passwordHash: string; passwordSalt: string; active: number }>();
  if (!row || !row.active) return null;
  const candidate = await hashPassword(password, row.passwordSalt);
  if (!constantTimeEqual(candidate, row.passwordHash)) {
    let matchesLegacyHash = false;
    try {
      const legacyCandidate = await hashPassword(password, row.passwordSalt, LEGACY_PASSWORD_ITERATIONS);
      matchesLegacyHash = constantTimeEqual(legacyCandidate, row.passwordHash);
    } catch {
      // Some Workers runtimes reject the former 120k work factor. New hashes use 100k.
    }
    if (!matchesLegacyHash) return null;
    await getDatabase().prepare("UPDATE platform_users SET password_hash = ? WHERE id = ?").bind(candidate, row.id).run();
  }
  await getDatabase().prepare("UPDATE platform_users SET last_login_at = ? WHERE id = ?").bind(Date.now(), row.id).run();
  return { id: row.id, username: row.username, displayName: row.displayName, roleId: row.roleId };
}

export async function createSession(userId: string) {
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const now = Date.now();
  await getDatabase().prepare(`INSERT INTO platform_sessions (token_hash, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)`)
    .bind(tokenHash, userId, now, now + SESSION_TTL_SECONDS * 1000)
    .run();
  return token;
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  await ensurePlatformDatabase();
  const token = readCookie(request.headers.get("cookie") || "", SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await getDatabase().prepare(`SELECT u.id, u.username, u.display_name AS displayName, u.role_id AS roleId
    FROM platform_sessions s JOIN platform_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1 LIMIT 1`)
    .bind(tokenHash, Date.now()).first<SessionUser>();
  return row || null;
}

export async function destroySession(request: Request) {
  const token = readCookie(request.headers.get("cookie") || "", SESSION_COOKIE);
  if (!token) return;
  await ensurePlatformDatabase();
  await getDatabase().prepare("DELETE FROM platform_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
}

export function sessionCookie(request: Request, token: string, maxAge = SESSION_TTL_SECONDS) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function expiredSessionCookie(request: Request) {
  return sessionCookie(request, "", 0);
}

export async function loadPlatformSnapshot(): Promise<unknown | null> {
  await ensurePlatformDatabase();
  const row = await getDatabase().prepare("SELECT payload FROM platform_snapshots WHERE id = 'default' LIMIT 1").first<{ payload: string }>();
  if (!row) return null;
  return JSON.parse(row.payload);
}

export async function savePlatformSnapshot(snapshot: unknown, user: SessionUser, expectedSavedAt: string | null = null) {
  validateSnapshot(snapshot);
  await ensurePlatformDatabase();
  const db = getDatabase();
  const now = Date.now();
  const guardId = crypto.randomUUID();
  const statements = [
    db.prepare(`INSERT INTO platform_write_guard (id, valid) VALUES (?, CASE WHEN
      COALESCE((SELECT json_extract(payload, '$.savedAt') FROM platform_snapshots WHERE id = 'default'), '') = ?
      THEN 1 ELSE 0 END)`).bind(guardId, expectedSavedAt ?? ""),
    db.prepare("DELETE FROM platform_records"),
  ];
  for (const [collection, moduleId] of Object.entries(businessCollections)) {
    const rows = snapshot.data[collection] as Array<Record<string, unknown> | string>;
    rows.forEach((row, index) => {
      // Include position to preserve order and avoid collisions between display names.
      const identity = typeof row === "string" ? row : String(row.id ?? row.name ?? index);
      statements.push(db.prepare(`INSERT INTO platform_records
        (collection, record_id, module_id, payload, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(collection, `${index}:${identity}`, moduleId, JSON.stringify(row), user.id, now));
    });
  }
  const members = snapshot.data.users as Array<{ account: string; roleId: string; status: string }>;
  for (const member of members) {
    if (member.account === "admin@local") continue;
    statements.push(db.prepare("UPDATE platform_users SET role_id = ?, active = ? WHERE username = ? AND role_id != 'role-admin'")
      .bind(member.roleId, member.status === "正常" ? 1 : 0, member.account));
  }
  statements.push(db.prepare(`INSERT INTO platform_snapshots (id, version, payload, updated_by, updated_at)
    VALUES ('default', ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET version = excluded.version,
    payload = excluded.payload, updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
    .bind(snapshot.version, JSON.stringify(snapshot), user.id, now));
  statements.push(db.prepare("INSERT INTO platform_write_audit (id, user_id, action, collections, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), user.id, "save", JSON.stringify(Object.keys(businessCollections)), now));
  // D1 batch is transactional: snapshot, records, accounts and audit commit together.
  statements.push(db.prepare("DELETE FROM platform_write_guard WHERE id = ?").bind(guardId));
  await db.batch(statements);
}

export async function clearPlatformSnapshot(user?: SessionUser) {
  await ensurePlatformDatabase();
  const db = getDatabase();
  await db.batch([
    db.prepare("DELETE FROM platform_snapshots WHERE id = 'default'"),
    db.prepare("DELETE FROM platform_records"),
    db.prepare("UPDATE platform_users SET role_id = CASE username WHEN 'zhaoning@local' THEN 'role-data' WHEN 'wangmin@local' THEN 'role-quality' WHEN 'licheng@local' THEN 'role-model' ELSE role_id END, active = 1 WHERE username IN ('zhaoning@local', 'wangmin@local', 'licheng@local')"),
    db.prepare("INSERT INTO platform_write_audit (id, user_id, action, collections, created_at) VALUES (?, ?, 'reset', '[]', ?)")
      .bind(crypto.randomUUID(), user?.id ?? "system", Date.now()),
  ]);
}

export async function databaseStatus() {
  await ensurePlatformDatabase();
  const db = getDatabase();
  await projectDatabase();
  const records = await db.prepare("SELECT collection, module_id AS moduleId, COUNT(*) AS count FROM platform_records GROUP BY collection, module_id").all();
  const audit = await db.prepare(`SELECT id, user_id AS userId, action, collections, created_at AS createdAt FROM platform_write_audit
    UNION ALL SELECT id, user_id AS userId, action, target_id || ' ' || detail AS collections, created_at AS createdAt FROM data_audit
    ORDER BY createdAt DESC LIMIT 50`).all();
  for (const table of ["data_assets", "data_versions", "quality_runs", "data_projects", "project_members", "database_connections", "database_imports"]) {
    const exists = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").bind(table).first();
    if (exists) { const row = await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first<{ count: number }>(); records.results.push({ collection: table, moduleId: "database", count: row?.count ?? 0 }); }
  }
  return { engine: "Cloudflare D1 / SQLite", records: records.results, audit: audit.results };
}

export function modulePermission(user: SessionUser, moduleId: string, snapshot: BusinessSnapshot | null) {
  if (user.roleId === "role-admin") return "管理";
  const roles = snapshot?.data.roles as Array<{ id: string; permissions?: Record<string, string> }> | undefined;
  const role = roles?.find(item => item.id === user.roleId);
  return role?.permissions?.[moduleId] || fallbackPermissions[user.roleId]?.[moduleId] || "无权限";
}
export function visiblePlatformSnapshot(snapshot: BusinessSnapshot | null, user: SessionUser): BusinessSnapshot | null {
  if (!snapshot || user.roleId === "role-admin") return snapshot;
  const data: Record<string, unknown> = { ...snapshot.data, activeRoleId: user.roleId };
  for (const [key, moduleId] of Object.entries(businessCollections)) {
    if (modulePermission(user, moduleId, snapshot) === "无权限") data[key] = [];
  }
  // The current role is required to display navigation permissions, even without admin access.
  if (modulePermission(user, "admin", snapshot) === "无权限") {
    data.roles = (snapshot.data.roles as Array<{ id: string }> ?? []).filter(role => role.id === user.roleId);
  }
  return { ...snapshot, data };
}
export async function canReadModule(user: SessionUser, moduleId: string) {
  return modulePermission(user, moduleId, await loadPlatformSnapshot() as BusinessSnapshot | null) !== "无权限";
}
export async function canWriteModule(user: SessionUser, moduleId: string) {
  return modulePermission(user, moduleId, await loadPlatformSnapshot() as BusinessSnapshot | null) === "管理";
}

function readCookie(cookieHeader: string, name: string) {
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return "";
}

async function hashPassword(password: string, saltHex: string, iterations = PASSWORD_ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(saltHex), iterations }, key, 256);
  return bytesToHex(new Uint8Array(bits));
}

async function sha256(value: string) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}

function randomHex(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}
