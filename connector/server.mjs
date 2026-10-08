import { executeWorkflow } from './governance.mjs';
import { engines } from './engines.mjs';
import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { runDatabase, databaseError } from './database.mjs';
import { localConnectorConfig } from './config.mjs';
export function connectorServer(token) {
  if (typeof token !== 'string' || token.length < 32) throw new Error('连接服务需要至少 32 字符的访问令牌');
  return createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.setHeader('Cache-Control', 'no-store');
    const presented = String(request.headers.authorization ?? '').replace(/^Bearer /, '');
    if (Buffer.byteLength(presented) !== Buffer.byteLength(token) || !timingSafeEqual(Buffer.from(presented), Buffer.from(token))) { response.writeHead(401); response.end(JSON.stringify({ error: '连接服务认证失败' })); return; }
    if (request.url === '/health' && request.method === 'GET') { response.end(JSON.stringify({ ready: true, engines })); return; }
    if (!['/v1/database', '/v1/governance'].includes(request.url) || request.method !== 'POST') { response.writeHead(404); response.end('{}'); return; }
    try {
      let size = 0; const chunks = [];
      for await (const chunk of request) { size += chunk.length; if (size > (request.url === '/v1/governance' ? 12 * 1024 * 1024 : 32768)) throw new Error('连接请求过大'); chunks.push(chunk); }
      let input; try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Error('连接请求格式无效'); }
      const result = request.url === '/v1/governance' ? await executeWorkflow(input.workspace, input.sources, input.targetId, input.annotations) : await runDatabase(input); response.end(JSON.stringify(result));
    } catch (error) { response.writeHead(400); response.end(JSON.stringify({ error: request.url === '/v1/governance' ? error.message : databaseError(error) })); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = await localConnectorConfig(); const url = new URL(config.DB_CONNECTOR_URL);
  if (url.hostname !== '127.0.0.1' || url.protocol !== 'http:') throw new Error('本机启动命令只监听 127.0.0.1；远程服务需单独部署');
  const server = connectorServer(config.DB_CONNECTOR_TOKEN); server.listen(Number(url.port || 8788), '127.0.0.1', () => console.log(`数据库连接服务已启动：${url.origin}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
