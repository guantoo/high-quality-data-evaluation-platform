import { env } from "cloudflare:workers";

const SESSION_COOKIE = "hqdp_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const PASSWORD_ITERATIONS = 120_000;

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
  if (!constantTimeEqual(candidate, row.passwordHash)) return null;
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

export async function savePlatformSnapshot(snapshot: unknown, user: SessionUser) {
  await ensurePlatformDatabase();
  const version = typeof snapshot === "object" && snapshot && "version" in snapshot ? Number((snapshot as { version: unknown }).version) || 2 : 2;
  await getDatabase().prepare(`INSERT INTO platform_snapshots (id, version, payload, updated_by, updated_at)
    VALUES ('default', ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET version = excluded.version, payload = excluded.payload,
      updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
    .bind(version, JSON.stringify(snapshot), user.id, Date.now()).run();
}

export async function clearPlatformSnapshot() {
  await ensurePlatformDatabase();
  await getDatabase().prepare("DELETE FROM platform_snapshots WHERE id = 'default'").run();
}

export async function canWriteModule(user: SessionUser, moduleId: string) {
  if (user.roleId === "role-admin") return true;
  const snapshot = await loadPlatformSnapshot() as { data?: { roles?: Array<{ id: string; permissions?: Record<string, string> }> } } | null;
  const role = snapshot?.data?.roles?.find((item) => item.id === user.roleId);
  const permission = role?.permissions?.[moduleId] || fallbackPermissions[user.roleId]?.[moduleId] || "无权限";
  return permission === "管理";
}

function readCookie(cookieHeader: string, name: string) {
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return "";
}

async function hashPassword(password: string, saltHex: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(saltHex), iterations: PASSWORD_ITERATIONS }, key, 256);
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
