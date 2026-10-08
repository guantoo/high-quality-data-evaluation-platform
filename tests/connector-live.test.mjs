import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import ts from 'typescript';
import { Miniflare } from 'miniflare';
import { connectorServer } from '../connector/server.mjs';
import { runDatabase } from '../connector/database.mjs';

test('live MySQL and PostgreSQL: read-only catalog, safe preview, authenticated encrypted D1 import and downstream processing', { skip: process.env.HQDP_DB_INTEGRATION !== '1' }, async () => {
  const token = randomBytes(32).toString('hex'); const server = connectorServer(token);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("ok"); } };', d1Databases: ['DB'] });
  const directory = await mkdtemp(join(tmpdir(), 'hqdp-connections-'));
  try {
    globalThis.connectorTestEnv = { DB: await mf.getD1Database('DB'), DB_CONNECTOR_URL: url, DB_CONNECTOR_TOKEN: token, DB_CONNECTION_KEY: randomBytes(32).toString('base64') };
    const modules = { 'assessment-document': 'lib/assessment-document.ts', 'assessment': 'lib/assessment.ts', 'assessment-catalog': 'lib/assessment-catalog.ts', 'business-model': 'db/business-model.ts', 'platform-store': 'db/platform-store.ts', 'project-store': 'db/project-store.ts', 'dataset-store': 'db/dataset-store.ts', 'connection-store': 'db/connection-store.ts', 'data-quality': 'lib/data-quality.ts', 'database-connection': 'lib/database-connection.ts', 'database-engines': 'lib/database-engines.ts', 'connections-route': 'app/api/connections/route.ts' };
    for (const [name, sourcePath] of Object.entries(modules)) {
      let source = await readFile(new URL('../' + sourcePath, import.meta.url), 'utf8');
      source = source.replace(/import \{ env \} from ['"]cloudflare:workers['"];?/, 'const env = globalThis.connectorTestEnv;').replace(/from ['"](?:@\/(?:db|lib)\/|\.\/)([a-z-]+)['"]/g, "from './$1.mjs'");
      await writeFile(join(directory, name + '.mjs'), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
    }
    const store = await import(pathToFileURL(join(directory, 'platform-store.mjs'))); const route = await import(pathToFileURL(join(directory, 'connections-route.mjs'))); const datasets = await import(pathToFileURL(join(directory, 'dataset-store.mjs'))); const connectionStore = await import(pathToFileURL(join(directory, 'connection-store.mjs')));
    const admin = await store.authenticateUser('高质量数据评估演示', '123456'); const session = await store.createSession(admin.id);
    const reviewer = await store.authenticateUser('wangmin@local', '123456'); const reviewerSession = await store.createSession(reviewer.id);
    const post = (payload, auth = session, extra = {}) => route.POST(new Request('http://localhost/api/connections', { method: 'POST', headers: { cookie: `hqdp_session=${auth}`, 'Content-Type': 'application/json', 'x-platform-request': '1', ...extra }, body: JSON.stringify(payload) }));
    assert.equal((await route.GET(new Request('http://localhost/api/connections'))).status, 401);
    assert.equal((await post({ action: 'test' }, session, { origin: 'https://untrusted.test' })).status, 403);
    assert.equal((await post({ action: 'save' }, reviewerSession)).status, 403);
    assert.equal((await fetch(url + '/health')).status, 401);
    assert.equal((await fetch(url + '/health', { headers: { Authorization: `Bearer ${token}` } })).status, 200);
    for (const engine of ['mysql', 'postgres']) {
      const settings = { engine, host: '127.0.0.1', port: engine === 'mysql' ? 23306 : 25432, database: 'quality_test', username: 'quality_reader', tls: false };
      const connection = { ...settings, password: 'hqdp_reader_test' }; const schema = engine === 'mysql' ? 'quality_test' : 'public';
      assert.equal((await runDatabase({ action: 'test', connection })).database, 'quality_test');
      const tables = (await runDatabase({ action: 'tables', connection })).tables; assert.ok(tables.some(table => table.name === 'contacts'));
      const preview = await runDatabase({ action: 'preview', connection, schema, table: 'contacts' }); assert.equal(preview.rows.length, 3); assert.equal(preview.rows.find(row => row.id === '1').amount, '123456789012345678.1234'); assert.equal(preview.rows.find(row => row.id === '2').email, '');
      const odd = await runDatabase({ action: 'preview', connection, schema, table: engine === 'mysql' ? 'odd`table' : 'odd"table' }); assert.equal(odd.rows[0].__proto__, 'literal-field-value');
      const empty = await runDatabase({ action: 'preview', connection, schema, table: 'empty_table' }); assert.deepEqual(empty.columns, ['id']); assert.equal(empty.rows.length, 0);
      await assert.rejects(runDatabase({ action: 'preview', connection, schema, table: 'contacts; DROP TABLE contacts' }), /表不存在/);
      await assert.rejects(runDatabase({ action: 'import', connection, schema, table: 'oversized', sample: false, limit: 5000 }), /超过 5000/);
      const sample = await runDatabase({ action: 'import', connection, schema, table: 'oversized', sample: true, limit: 2 }); assert.equal(sample.rows.length, 2); assert.equal(sample.truncated, true);
      const bad = await post({ action: 'test', settings, password: 'bad-test-password' }); assert.equal(bad.status, 400); const badText = await bad.text(); assert.match(badText, /认证失败/); assert.doesNotMatch(badText, /bad-test-password/);
      const saved = await post({ action: 'save', settings, password: connection.password, name: engine + ' 临时测试连接' }); assert.equal(saved.status, 200, await saved.clone().text()); const id = (await saved.json()).id;
      const raw = await globalThis.connectorTestEnv.DB.prepare('SELECT secret FROM database_connections WHERE id=?').bind(id).first(); assert.ok(!raw.secret.includes(connection.password));
      assert.equal(await connectionStore.getConnection(reviewer.id, id), null);
      const listed = await route.GET(new Request('http://localhost/api/connections', { headers: { cookie: `hqdp_session=${session}` } })); const listedText = await listed.text(); assert.doesNotMatch(listedText, /hqdp_reader_test|"secret"|"password"/);
      assert.equal((await post({ action: 'tables', id }, reviewerSession)).status, 404);
      assert.equal((await post({ action: 'tables', id })).status, 200);
      assert.equal((await post({ action: 'preview', id, schema, table: 'contacts' })).status, 200);
      const imported = await post({ action: 'import', id, schema, table: 'contacts', sample: false, limit: 5000, name: engine + ' 数据资产' }); assert.equal(imported.status, 201, await imported.clone().text()); const assetId = (await imported.json()).id;
      const detail = await datasets.getDataset(admin.id, assetId); assert.equal(detail.source.rowCount, 3); assert.equal(detail.source.isSample, 0); assert.equal(detail.source.tableName, 'contacts'); assert.equal((await datasets.getVersion(admin.id, assetId, detail.versions[0].id)).rows.length, 3);
      const cleaned = await datasets.runQuality(admin.id, assetId, detail.versions[0].id, 'clean', { trim: true, deduplicate: true, maskSensitive: false }); assert.equal(cleaned.result.after.records, 3); const content = await datasets.getVersion(admin.id, assetId, cleaned.outputId); assert.equal(content.rows.find(row => row.id === '1').name, 'Alice');
      assert.ok(await datasets.runQuality(admin.id, assetId, cleaned.outputId, 'assessment', { trim: false, deduplicate: false, maskSensitive: false }));
      const sampleResponse = await post({ action: 'import', id, schema, table: 'oversized', sample: true, limit: 2 }); assert.equal(sampleResponse.status, 201); const sampleDetail = await datasets.getDataset(admin.id, (await sampleResponse.json()).id); assert.equal(sampleDetail.source.isSample, 1); assert.equal(sampleDetail.source.rowCount, 2);
      const beforeCount = (await datasets.listDatasets(admin.id)).length;
      assert.equal((await post({ action: 'import', id, schema, table: 'oversized', sample: false, limit: 5000 })).status, 400); assert.equal((await datasets.listDatasets(admin.id)).length, beforeCount);
      await assert.rejects(datasets.createDataset(admin.id, '必须回滚', 'test.database', { columns: ['id'], rows: [{ id: '1' }] }, { connectionId: 'missing', database: 'quality_test', schema, table: 'contacts', sample: false })); assert.equal((await datasets.listDatasets(admin.id)).length, beforeCount);
      assert.equal((await post({ action: 'save', id, name: '保留密码连接', settings })).status, 200);
    }
    assert.ok((await store.databaseStatus()).audit.some(row => row.action === 'connection.import'));
  } finally { await mf.dispose(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); delete globalThis.connectorTestEnv; }
});
