import { env } from 'cloudflare:workers';
import { getSessionUser, canReadModule, canWriteModule } from '@/db/platform-store';
import { listConnections, getConnection, saveConnection, connectionTestResult } from '@/db/connection-store';
import { createDataset } from '@/db/dataset-store';
import { connectionSettings, type DatabaseCredentials } from '@/lib/database-connection';
import { type DatasetContent, maxFileBytes } from '@/lib/data-quality';
function serviceConfig() {
  if (!env.DB_CONNECTOR_URL || !env.DB_CONNECTOR_TOKEN || !env.DB_CONNECTION_KEY) throw new Error('数据库连接服务未配置，请运行 npm run connector 并重启开发服务');
  const url = new URL(env.DB_CONNECTOR_URL);
  if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))) throw new Error('连接服务应使用 HTTPS 或本机回环地址');
  return { url, token: env.DB_CONNECTOR_TOKEN };
}
async function service(action: string, connection?: DatabaseCredentials, options: Record<string, unknown> = {}) {
  const { url, token } = serviceConfig(); let response;
  try { response = await fetch(new URL(action === 'health' ? '/health' : '/v1/database', url), { method: action === 'health' ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(action === 'health' ? {} : { body: JSON.stringify({ action, connection, ...options }) }), signal: AbortSignal.timeout(action === 'health' ? 2000 : 20000) }); }
  catch { throw new Error('数据库连接服务不可用，请检查服务是否启动及网络配置'); }
  const reader = response.body?.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  if (!reader) throw new Error('连接服务响应为空');
  while (true) { const item = await reader.read(); if (item.done) break; length += item.value.byteLength; if (length > maxFileBytes * 2) { await reader.cancel(); throw new Error('数据库结果超过大小限制'); } chunks.push(item.value); }
  const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let result; try { result = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error('连接服务响应格式无效'); }
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error.slice(0, 200) : '数据库操作失败'); return result;
}
export async function GET(request: Request) {
  const user = await getSessionUser(request); if (!user) return Response.json({ error: '未登录' }, { status: 401 });
  if (!(await canReadModule(user, 'inventory'))) return Response.json({ error: '无数据库管理权限' }, { status: 403 });
  let ready = false, message = ''; try { ready = (await service('health')).ready === true; } catch (error) { message = (error as Error).message; }
  return Response.json({ connections: await listConnections(user.id), canManage: await canWriteModule(user, 'inventory'), ready, message }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  const user = await getSessionUser(request); if (!user) return Response.json({ error: '未登录' }, { status: 401 });
  if (request.headers.get('x-platform-request') !== '1' || (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin)) return Response.json({ error: '请求来源无效' }, { status: 403 });
  if (!(await canReadModule(user, 'inventory'))) return Response.json({ error: '无数据库管理权限' }, { status: 403 });
  let payload; try { const reader = request.body?.getReader(); if (!reader) throw new Error(); const chunks = []; let size = 0; while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 32768) { await reader.cancel(); return Response.json({ error: '连接请求过大' }, { status: 413 }); } chunks.push(part.value); } const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; } payload = JSON.parse(new TextDecoder().decode(bytes)); } catch { return Response.json({ error: '请求格式无效' }, { status: 400 }); }
  if (!payload || !['test', 'save', 'tables', 'preview', 'import'].includes(payload.action)) return Response.json({ error: '未知操作' }, { status: 400 });
  const action = payload.action;
  if (!['tables', 'preview'].includes(action) && !(await canWriteModule(user, 'inventory'))) return Response.json({ error: '当前账号无数据库操作权限' }, { status: 403 });
  let stored;
  try {
    if (payload.id !== undefined && typeof payload.id !== 'string') throw new Error('连接编号无效');
    stored = payload.id ? await getConnection(user.id, payload.id) : null;
    if (payload.id && !stored) return Response.json({ error: '连接不存在或无权访问' }, { status: 404 });
    let connection = stored?.connection;
    if (payload.settings && ['test', 'save'].includes(action)) {
      const settings = connectionSettings(payload.settings); const password = payload.password === undefined ? stored?.connection.password : payload.password;
      if (typeof password !== 'string' || password.length > 4096) throw new Error('请填写数据库密码'); connection = { ...settings, password };
    }
    if (!connection) throw new Error('请选择连接或填写连接配置');
    if (action === 'test' || action === 'save') {
      if (action === 'save' && (typeof payload.name !== 'string' || !payload.name.trim() || payload.name.length > 120)) throw new Error('请填写不超过 120 字的数据连接名称');
      const result = await service('test', connection);
      if (action === 'save') { const id = await saveConnection(user.id, payload.name.trim(), connection, payload.id); if (!id) return Response.json({ error: '无权修改连接' }, { status: 403 }); return Response.json({ id, ...result }); }
      if (stored && !payload.settings) await connectionTestResult(user.id, stored.id); return Response.json(result);
    }
    if (!stored) throw new Error('请先保存数据连接');
    if (action === 'tables') return Response.json(await service('tables', connection));
    if (typeof payload.schema !== 'string' || typeof payload.table !== 'string') throw new Error('请选择数据库表');
    if (action === 'import' && (typeof payload.sample !== 'boolean' || !Number.isInteger(payload.limit) || payload.limit < 1 || payload.limit > 5000)) throw new Error('导入范围无效');
    const data = await service(action, connection, { schema: payload.schema, table: payload.table, sample: payload.sample, limit: payload.limit });
    if (action === 'preview') return Response.json(data);
    const content: DatasetContent = { columns: data.columns, rows: data.rows };
    if (!Array.isArray(content.columns) || !content.columns.length || content.columns.length > 100 || content.columns.some(name => typeof name !== 'string') || new Set(content.columns).size !== content.columns.length || !Array.isArray(content.rows) || content.rows.length > 5000 || content.rows.some(row => !row || typeof row !== 'object' || content.columns.some(name => typeof row[name] !== 'string')) || new TextEncoder().encode(JSON.stringify(content)).length > maxFileBytes) throw new Error('数据库导入结果格式无效或超过限制');
    const name = typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : `${stored.name}/${payload.table}${payload.sample ? ' · 样本' : ''}`;
    if (name.length > 120) throw new Error('数据集名称不能超过 120 字');
    const id = await createDataset(user.id, name, `${payload.table}.database`, content, { connectionId: stored.id, database: connection.database, schema: payload.schema, table: payload.table, sample: payload.sample });
    return Response.json({ id, records: content.rows.length, sample: payload.sample, truncated: Boolean(data.truncated) }, { status: 201 });
  } catch (error) { const message = (error as Error).message; if (stored && action === 'test' && !payload.settings) await connectionTestResult(user.id, stored.id, message); return Response.json({ error: message }, { status: 400 }); }
}
