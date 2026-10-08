import { databaseEngines, type DatabaseEngine } from './database-engines';
export type ConnectionSettings = { engine: DatabaseEngine; host: string; port: number; database: string; username: string; tls: boolean; ca?: string };
export type DatabaseCredentials = ConnectionSettings & { password: string };
export function connectionSettings(value: unknown): ConnectionSettings {
  const input = value as ConnectionSettings;
  if (!input || !databaseEngines.some(item => item.id === input.engine)) throw new Error('请选择支持的数据库类型');
  for (const key of ['host', 'database', 'username'] as const) if (typeof input[key] !== 'string' || !input[key].trim() || input[key].length > 255 || Array.from(input[key]).some(char => char.charCodeAt(0) < 32)) throw new Error('主机、数据库和账号必须填写，且不能包含控制字符');
  if (!/^[a-zA-Z0-9._:-]+$/.test(input.host) || /^(metadata\.|instance-data)/i.test(input.host)) throw new Error('请填写主机名或 IP，不要填写 URL');
  if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) throw new Error('端口应为 1–65535');
  if (typeof input.tls !== 'boolean' || (input.ca !== undefined && (typeof input.ca !== 'string' || input.ca.length > 16384))) throw new Error('TLS 配置无效');
  return { engine: input.engine, host: input.host.trim(), port: input.port, database: input.database.trim(), username: input.username.trim(), tls: input.tls, ca: input.ca || '' };
}
