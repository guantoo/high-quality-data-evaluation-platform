import { spawn } from 'node:child_process';
import { connectorServer } from '../connector/server.mjs';
import { localConnectorConfig } from '../connector/config.mjs';
const config = await localConnectorConfig();
const url = new URL(config.DB_CONNECTOR_URL);
let server;
if (url.hostname === '127.0.0.1' && url.protocol === 'http:') {
  try { const check = await fetch(`${url.origin}/health`, { headers: { Authorization: `Bearer ${config.DB_CONNECTOR_TOKEN}` }, signal: AbortSignal.timeout(1000) }); if (!check.ok || !(await check.json()).ready) throw new Error('现有连接服务配置不匹配'); }
  catch (error) { if (error.message === '现有连接服务配置不匹配') throw error; server = connectorServer(config.DB_CONNECTOR_TOKEN); await new Promise((resolve, reject) => { server.once('error', reject); server.listen(Number(url.port || 8788), '127.0.0.1', resolve); }); }
}
const child = spawn(process.execPath, ['node_modules/vinext/dist/cli.js', 'dev', ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, WRANGLER_LOG_PATH: '.wrangler/wrangler.log' } });
function stop(signal) { child.kill(signal); server?.close(); }
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(signal));
child.on('exit', code => { server?.close(); process.exitCode = code ?? 1; });
