import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConnection, databaseError } from '../connector/database.mjs';
test('connection validation rejects malformed hosts, ports and credential types', () => {
  const valid = { engine: 'postgres', host: '127.0.0.1', port: 5432, database: 'quality', username: 'reader', password: '', tls: true };
  assert.equal(validateConnection(valid).database, 'quality');
  for (const patch of [{ host: 'postgres://user:secret@host/db' }, { port: 0 }, { port: 65536 }, { username: '\0reader' }, { engine: 'sqlite' }, { password: {} }, { tls: 'false' }]) assert.throws(() => validateConnection({ ...valid, ...patch }));
});
test('driver failure messages do not reveal database passwords or connection strings', () => {
  assert.match(databaseError({ code: 'ER_ACCESS_DENIED_ERROR', message: 'secret' }), /认证失败/);
  assert.match(databaseError({ code: 'ECONNREFUSED' }), /无法连接/);
  assert.match(databaseError({ code: '42501' }), /读取权限/);
  assert.ok(!databaseError(new Error('postgres://reader:secret@db')).includes('secret'));
  assert.match(databaseError(new Error('certificate verification failed')), /TLS/);
});

import { engines, protocol, transaction, postgresDriver } from '../connector/engines.mjs';
test('domestic adapters select correct protocol and TiDB does not use unsupported READ ONLY syntax', async () => {
  for (const engine of engines) assert.equal(validateConnection({ engine, host: '127.0.0.1', port: 4000, database: 'quality', username: 'reader', password: '', tls: true }).engine, engine);
  assert.equal(protocol('tidb'), 'mysql'); assert.equal(protocol('oceanbase'), 'mysql'); assert.equal(protocol('opengauss'), 'postgres'); assert.equal(protocol('kingbase'), 'postgres');
  assert.equal(transaction('tidb'), 'START TRANSACTION'); assert.equal(transaction('oceanbase'), 'START TRANSACTION READ ONLY');
  assert.equal(typeof (await postgresDriver('opengauss')).Client, 'function');
  if (!process.env.HQDP_KINGBASE_DRIVER) await assert.rejects(postgresDriver('kingbase'), /驱动未配置/);
  assert.throws(() => protocol('unknown'));
});
