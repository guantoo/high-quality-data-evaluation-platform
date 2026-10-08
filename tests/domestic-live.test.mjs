import test from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import { runDatabase } from '../connector/database.mjs';
test('native TiDB: real authentication, catalog, preview and import with its own transaction dialect', { skip: process.env.HQDP_TIDB_INTEGRATION !== '1' }, async () => {
  const setup = await mysql.createConnection({ host: '127.0.0.1', port: 24000, user: 'root' });
  try {
    await setup.query('CREATE DATABASE IF NOT EXISTS quality_test');
    await setup.query("CREATE USER IF NOT EXISTS 'quality_reader'@'%' IDENTIFIED BY 'hqdp_reader_test'");
    await setup.query("GRANT SELECT ON quality_test.* TO 'quality_reader'@'%'");
    await setup.query('CREATE TABLE IF NOT EXISTS quality_test.contacts (id BIGINT PRIMARY KEY, name VARCHAR(100), amount DECIMAL(22,4))');
    await setup.query("REPLACE INTO quality_test.contacts VALUES (1, ' Alice ', 123456789012345678.1234), (2, 'Bob', 2.5000)");
  } finally { await setup.end(); }
  const connection = { engine: 'tidb', host: '127.0.0.1', port: 24000, database: 'quality_test', username: 'quality_reader', password: 'hqdp_reader_test', tls: false };
  assert.equal((await runDatabase({ action: 'test', connection })).database, 'quality_test');
  assert.ok((await runDatabase({ action: 'tables', connection })).tables.some(table => table.name === 'contacts'));
  const preview = await runDatabase({ action: 'preview', connection, schema: 'quality_test', table: 'contacts' });
  assert.equal(preview.rows.length, 2); assert.equal(preview.rows.find(row => row.id === '1').amount, '123456789012345678.1234');
  const imported = await runDatabase({ action: 'import', connection, schema: 'quality_test', table: 'contacts', sample: false }); assert.equal(imported.rows.length, 2);
  await assert.rejects(runDatabase({ action: 'test', connection: { ...connection, password: 'wrong-test-only' } }));
  await assert.rejects(runDatabase({ action: 'preview', connection, schema: 'quality_test', table: 'contacts; DROP TABLE contacts' }), /表不存在/);
});
