import { env } from 'cloudflare:workers';
import { projectDatabase, auditStatement } from './project-store';
import { type ConnectionSettings, type DatabaseCredentials } from '@/lib/database-connection';
export const connectionDDL = [
  `CREATE TABLE IF NOT EXISTS database_connections (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, settings TEXT NOT NULL CHECK(json_valid(settings)), secret TEXT NOT NULL, status TEXT NOT NULL, error TEXT NOT NULL DEFAULT '', tested_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_database_connections_owner ON database_connections(owner_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS database_imports (asset_id TEXT PRIMARY KEY REFERENCES data_assets(id), connection_id TEXT NOT NULL REFERENCES database_connections(id), database_name TEXT NOT NULL, schema_name TEXT NOT NULL, table_name TEXT NOT NULL, is_sample INTEGER NOT NULL, row_count INTEGER NOT NULL, created_at INTEGER NOT NULL)`,
];
async function database() { const db = await projectDatabase(); await db.batch(connectionDDL.map(sql => db.prepare(sql))); return db; }
function base64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
function unbase64(value: string) { return Uint8Array.from(atob(value), char => char.charCodeAt(0)); }
async function encryptionKey() { if (!env.DB_CONNECTION_KEY) throw new Error('服务端尚未配置连接凭据加密密钥'); let bytes; try { bytes = unbase64(env.DB_CONNECTION_KEY); } catch { throw new Error('连接凭据加密密钥格式无效'); } if (bytes.length !== 32) throw new Error('连接凭据加密密钥必须为 32 字节'); return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']); }
async function encrypt(password: string, identity: string) { const iv = crypto.getRandomValues(new Uint8Array(12)); const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(identity) }, await encryptionKey(), new TextEncoder().encode(password)); return JSON.stringify({ iv: base64(iv), data: base64(new Uint8Array(data)) }); }
async function decrypt(secret: string, identity: string) { try { const value = JSON.parse(secret); const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64(value.iv), additionalData: new TextEncoder().encode(identity) }, await encryptionKey(), unbase64(value.data)); return new TextDecoder().decode(data); } catch { throw new Error('无法解密连接凭据，请恢复原加密密钥或重新配置连接'); } }
export async function listConnections(userId: string) { const db = await database(); return (await db.prepare('SELECT id, name, settings, status, error, tested_at AS testedAt, updated_at AS updatedAt FROM database_connections WHERE owner_id = ? ORDER BY created_at DESC').bind(userId).all()).results.map(row => ({ ...row, settings: JSON.parse(String(row.settings)) as ConnectionSettings })); }
export async function getConnection(userId: string, id: string) { const db = await database(); const row = await db.prepare('SELECT * FROM database_connections WHERE id = ? AND owner_id = ?').bind(id, userId).first(); if (!row) return null; return { id, name: String(row.name), connection: { ...JSON.parse(String(row.settings)), password: await decrypt(String(row.secret), `${userId}:${id}`) } as DatabaseCredentials }; }
export async function saveConnection(userId: string, name: string, connection: DatabaseCredentials, existingId?: string) {
  const db = await database(); const id = existingId || crypto.randomUUID();
  if (existingId && !(await db.prepare('SELECT id FROM database_connections WHERE id = ? AND owner_id = ?').bind(id, userId).first())) return null;
  const { password, ...settings } = connection; const secret = await encrypt(password, `${userId}:${id}`); const now = Date.now();
  await db.batch([db.prepare(`INSERT INTO database_connections VALUES (?, ?, ?, ?, ?, '正常', '', ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, settings=excluded.settings, secret=excluded.secret, status='正常', error='', tested_at=excluded.tested_at, updated_at=excluded.updated_at WHERE database_connections.owner_id=excluded.owner_id`).bind(id, userId, name, JSON.stringify(settings), secret, now, now, now), auditStatement(db, userId, 'connection.save', id, connection.engine)]);
  return id;
}
export async function connectionTestResult(userId: string, id: string, error = '') { const db = await database(); await db.batch([db.prepare('UPDATE database_connections SET status=?, error=?, tested_at=?, updated_at=? WHERE id=? AND owner_id=?').bind(error ? '异常' : '正常', error, Date.now(), Date.now(), id, userId), auditStatement(db, userId, 'connection.test', id, error ? 'failed' : 'success')]); }
