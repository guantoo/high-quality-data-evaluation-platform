import pg from 'pg';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const engines = ['mysql', 'postgres', 'opengauss', 'kingbase', 'tidb', 'oceanbase'];
export function protocol(engine) { if (!engines.includes(engine)) throw new Error('请选择支持的数据库类型'); return ['mysql', 'tidb', 'oceanbase'].includes(engine) ? 'mysql' : 'postgres'; }
export function transaction(engine) { return engine === 'tidb' ? 'START TRANSACTION' : protocol(engine) === 'mysql' ? 'START TRANSACTION READ ONLY' : 'BEGIN READ ONLY'; }
export async function postgresDriver(engine) {
  if (engine === 'opengauss') return (await import('pg-opengauss')).default;
  if (engine === 'kingbase') {
    if (!process.env.HQDP_KINGBASE_DRIVER) throw new Error('人大金仓驱动未配置，请在连接服务设置 HQDP_KINGBASE_DRIVER 为官方 kb 驱动绝对路径');
    try { const driver = require(process.env.HQDP_KINGBASE_DRIVER); if (typeof driver.Client !== 'function') throw new Error(); return driver; } catch { throw new Error('人大金仓官方 kb 驱动无法加载，请检查连接服务配置'); }
  }
  return pg;
}
