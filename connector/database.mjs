import { lookup } from 'node:dns/promises';
import { engines, protocol, transaction, postgresDriver } from './engines.mjs';
import mysql from 'mysql2/promise';
export function validateConnection(value) {
  if (!value || !engines.includes(value.engine)) throw new Error('请选择支持的数据库类型');
  for (const name of ['host', 'database', 'username']) if (typeof value[name] !== 'string' || !value[name].trim() || value[name].length > 255 || Array.from(value[name]).some(char => char.charCodeAt(0) < 32)) throw new Error('主机、数据库名称和账号不能为空且不能包含控制字符');
  if (!/^[a-zA-Z0-9._:-]+$/.test(value.host) || /^(metadata\.|instance-data)/i.test(value.host)) throw new Error('请填写主机名或 IP，不要填写 URL 或连接字符串');
  if (!Number.isInteger(value.port) || value.port < 1 || value.port > 65535) throw new Error('端口应为 1–65535');
  if (typeof value.password !== 'string' || value.password.length > 4096 || typeof value.tls !== 'boolean') throw new Error('连接凭据格式无效');
  if (value.ca !== undefined && (typeof value.ca !== 'string' || value.ca.length > 16384)) throw new Error('CA 证书格式无效');
  return { engine: value.engine, host: value.host.trim(), port: value.port, database: value.database.trim(), username: value.username.trim(), password: value.password, tls: value.tls, ca: value.ca || '' };
}
function blockedAddress(address) { const ip = address.toLowerCase().replace(/^::ffff:/, ''); return ip === '0.0.0.0' || ip === '::' || ip.startsWith('169.254.') || /^fe[89ab]/.test(ip); }
async function checkedHost(host) { const addresses = await lookup(host, { all: true }); if (!addresses.length || addresses.some(item => blockedAddress(item.address))) throw new Error('该地址不可用于数据库连接'); }
function quote(value, engine) { if (typeof value !== 'string' || !value || value.length > 255 || Array.from(value).some(char => char.charCodeAt(0) < 32)) throw new Error('表名或模式名称无效'); const q = engine === 'mysql' ? '`' : '"'; return q + value.replaceAll(q, q + q) + q; }
function cell(value) { if (value === null || value === undefined) return ''; if (value instanceof Date) return value.toISOString(); if (Buffer.isBuffer(value)) return value.toString('base64'); if (typeof value === 'object') return JSON.stringify(value); return String(value); }
export async function runDatabase(input) {
  const config = validateConnection(input.connection); const wire = protocol(config.engine); await checkedHost(config.host);
  if (!['test', 'tables', 'preview', 'import'].includes(input.action)) throw new Error('未知数据库操作');
  const ssl = config.tls ? { rejectUnauthorized: true, ...(config.ca ? { ca: config.ca } : {}) } : undefined;
  let connection;
  const watchdog = setTimeout(() => { if (wire === 'mysql') connection?.destroy(); else connection?.end().catch(() => {}); }, 15000);
  try {
    if (wire === 'postgres') {
      const driver = await postgresDriver(config.engine);
      connection = new driver.Client({ host: config.host, port: config.port, database: config.database, user: config.username, password: config.password, ssl: ssl ?? false, connectionTimeoutMillis: 5000, query_timeout: 6000, statement_timeout: 5000, application_name: 'quality-hub-readonly' });
      connection.on('error', () => {}); await connection.connect(); await connection.query(transaction(config.engine));
    } else {
      connection = await mysql.createConnection({ host: config.host, port: config.port, database: config.database, user: config.username, password: config.password, ssl, connectTimeout: 5000, supportBigNumbers: true, bigNumberStrings: true, dateStrings: true, rowsAsArray: true, disableEval: true, multipleStatements: false });
      await connection.query(transaction(config.engine));
    }
    async function query(text, parameters = []) {
      if (wire === 'postgres') { const result = await connection.query({ text, values: parameters, rowMode: 'array' }); const columns = result.fields.map(field => field.name); return { rows: result.rows.map(row => Object.fromEntries(columns.map((name, index) => [name, row[index]]))), columns }; }
      const [rows, fields] = await connection.query({ sql: text, timeout: 5000 }, parameters); const columns = fields?.map(field => field.name) ?? []; return { rows: rows.map(row => Object.fromEntries(columns.map((name, index) => [name, row[index]]))), columns };
    }
    const result = await query(wire === 'postgres' ? 'SELECT current_database() AS database, current_user AS username' : 'SELECT DATABASE() AS `database`, CURRENT_USER() AS username');
    if (input.action === 'test') return { database: result.rows[0].database, username: result.rows[0].username };
    const list = await query(wire === 'postgres' ? `SELECT table_schema AS schema, table_name AS name, table_type AS type FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'sys_catalog', 'db4ai') AND has_table_privilege(quote_ident(table_schema) || '.' || quote_ident(table_name), 'SELECT') ORDER BY table_schema, table_name LIMIT 1001` : `SELECT TABLE_SCHEMA AS \`schema\`, TABLE_NAME AS name, TABLE_TYPE AS type FROM information_schema.tables WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME LIMIT 1001`, wire === 'mysql' ? [config.database] : []);
    if (list.rows.length > 1000) throw new Error('可访问的表超过 1000 张，请使用范围更小的数据库账号');
    if (input.action === 'tables') return { database: config.database, tables: list.rows };
    const table = list.rows.find(item => item.schema === input.schema && item.name === input.table); if (!table) throw new Error('表不存在或没有读取权限');
    const limit = input.action === 'preview' ? 50 : input.sample ? input.limit : 5000;
    if (!Number.isInteger(limit) || limit < 1 || limit > 5000) throw new Error('导入行数应为 1–5000');
    const qualified = quote(table.schema, wire) + '.' + quote(table.name, wire);
    const data = await query(`SELECT * FROM ${qualified} LIMIT ${limit + 1}`);
    if (data.columns.length > 100) throw new Error('表超过 100 个字段，暂不能导入');
    const truncated = data.rows.length > limit;
    if (input.action === 'import' && !input.sample && truncated) throw new Error('该表超过 5000 行，请选择样本导入或缩小数据范围');
    const content = { columns: data.columns, rows: data.rows.slice(0, limit).map(row => Object.fromEntries(data.columns.map(name => [name, cell(row[name])]))) };
    if (Buffer.byteLength(JSON.stringify(content)) > 1024 * 1024) throw new Error('结果超过 1 MiB，请减小样本导入行数');
    return { ...content, truncated, sample: Boolean(input.sample), database: config.database, schema: table.schema, table: table.name };
  } finally { clearTimeout(watchdog); if (connection) { try { await connection.end(); } catch { /* connection already closed by timeout */ } } }
}
export function databaseError(error) {
  const code = error?.code;
  if (['28P01', '28000', 'ER_ACCESS_DENIED_ERROR'].includes(code)) return '数据库认证失败，请检查账号和密码';
  if (['3D000', 'ER_BAD_DB_ERROR'].includes(code)) return '数据库不存在或账号无权连接';
  if (['ECONNREFUSED', 'ENOTFOUND', 'EHOSTUNREACH', 'ETIMEDOUT', 'ECONNRESET'].includes(code)) return '无法连接数据库，请检查主机、端口、网络和服务状态';
  if (['42501', 'ER_TABLEACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR'].includes(code)) return '数据库账号没有读取权限';
  if (/certificate|ssl|tls/i.test(error?.message ?? '')) return 'TLS 连接失败，请检查证书和数据库 TLS 配置';
  if (/timeout|timed out|canceling statement/i.test(error?.message ?? '')) return '数据库连接或查询超时';
  if (!code && error?.message && !/password|postgres:\/\/|mysql:\/\//i.test(error.message)) return error.message.slice(0, 180);
  return '数据库读取失败，请检查连接配置和读取权限';
}
