import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { Miniflare } from 'miniflare';
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const qualitySource = await readFile(new URL('../lib/dashboard.ts', import.meta.url), 'utf8');
const quality = await import(`data:text/javascript;base64,${Buffer.from(compile(qualitySource)).toString('base64')}`);

test('dashboard: no data is not a quality score; exact problem totals survive truncated details', () => {
  assert.equal(quality.summarizeDashboardQuality([]).quality.score, null);
  const result = JSON.stringify({ after: { score: 83.34, completeness: 86.67, uniqueness: 80, empty: 8, duplicates: 2, issueCount: 350, issues: [] } });
  const summary = quality.summarizeDashboardQuality([{ id: 'a', name: '客户', result }, { id: 'bad', name: '无效', result: '{}' }]);
  assert.equal(summary.quality.assets, 1);
  assert.equal(summary.quality.whitespace, 340);
  assert.equal(summary.risks[0].issues, 350);
  assert.equal(quality.dashboardPeriodStart('quarter', Date.parse('2026-09-30T16:00:00Z')), Date.parse('2026-09-30T16:00:00Z'));
});

test('dashboard D1: private/shared scope, period boundaries, current version and no duplicated latest results', async () => {
  const mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("ok"); } };', d1Databases: ['DB'] });
  const directory = await mkdtemp(join(tmpdir(), 'dashboard-db-'));
  try {
    const db = await mf.getD1Database('DB');
    globalThis.dashboardTestDb = db;
    const datasetSource = await readFile(new URL('../db/dataset-store.ts', import.meta.url), 'utf8');
    const ddl = datasetSource.match(/export const datasetDDL = (\[[\s\S]*?\n\]);/)[1];
    let projectSource = await readFile(new URL('../db/project-store.ts', import.meta.url), 'utf8');
    projectSource = projectSource.replace("import { env } from 'cloudflare:workers';", 'const env = { DB: globalThis.dashboardTestDb };');
    let storeSource = await readFile(new URL('../db/dashboard-store.ts', import.meta.url), 'utf8');
    storeSource = storeSource.replace("import { datasetDDL } from './dataset-store';", `const datasetDDL = ${ddl};`).replaceAll("'./project-store'", "'./project-store.mjs'").replaceAll("'@/lib/dashboard'", "'./dashboard.mjs'");
    for (const [name, source] of [['dashboard', qualitySource], ['project-store', projectSource], ['dashboard-store', storeSource]]) await writeFile(join(directory, `${name}.mjs`), compile(source));
    const store = await import(pathToFileURL(join(directory, 'dashboard-store.mjs')));
    await store.getDashboard('me', '30d', false);
    await db.exec('CREATE TABLE platform_users(id TEXT PRIMARY KEY); CREATE TABLE database_connections(id TEXT PRIMARY KEY,owner_id TEXT,status TEXT,tested_at INTEGER);');
    const now = Date.now();
    const profile = (score, empty = 1) => JSON.stringify({ score, completeness: score, uniqueness: score, empty, duplicates: 0, issueCount: empty });
    const content = JSON.stringify({ columns: ['x'], rows: [{ x: '' }, { x: 'ok' }] });
    await db.batch([
      db.prepare('INSERT INTO platform_users VALUES (?)').bind('me'),
      db.prepare('INSERT INTO data_projects VALUES (?,?,?,?)').bind('p', 'other', 'shared', now),
      db.prepare('INSERT INTO project_members VALUES (?,?,?)').bind('p', 'me', 'viewer'),
      ...[['mine','me'], ['shared','other'], ['hidden','other'], ['stale','me']].flatMap(([id, owner]) => [
        db.prepare('INSERT INTO data_assets VALUES (?,?,?,?,?)').bind(id, owner, id, 'a.csv', now),
        db.prepare('INSERT INTO data_versions VALUES (?,?,NULL,1,?,?)').bind(id + '-v1', id, content, now),
        db.prepare('INSERT INTO quality_runs VALUES (?,?,?,NULL,?,?,?,?,?)').bind(id + '-r', id, id + '-v1', 'profile', '{}', profile(50), owner, now - 1000),
      ]),
      db.prepare('INSERT INTO project_assets VALUES (?,?)').bind('shared','p'),
      db.prepare('INSERT INTO data_versions VALUES (?,?,?,2,?,?)').bind('mine-v2','mine','mine-v1',content,now),
      db.prepare('INSERT INTO quality_runs VALUES (?,?,?,?,?,?,?,?,?)').bind('mine-clean','mine','mine-v1','mine-v2','clean','{}', JSON.stringify({ after: JSON.parse(profile(100,0)) }), 'me',now-900),
      db.prepare('INSERT INTO quality_runs VALUES (?,?,?,NULL,?,?,?,?,?)').bind('mine-old-assessment','mine','mine-v1','assessment','{}',JSON.stringify({ after:JSON.parse(profile(10)) }),'me',now-800),
      db.prepare('INSERT INTO data_versions VALUES (?,?,?,2,?,?)').bind('stale-v2','stale','stale-v1',content,now),
      db.prepare('INSERT INTO quality_runs VALUES (?,?,?,NULL,?,?,?,?,?)').bind('stale-import','stale','stale-v2','import','{}',profile(90),'me',now-40*86400000),
      db.prepare('INSERT INTO database_connections VALUES (?,?,?,?)').bind('c','me','正常',now),
      db.prepare('INSERT INTO database_connections VALUES (?,?,?,?)').bind('foreign','other','异常',now),
      db.prepare('INSERT INTO database_connections VALUES (?,?,?,NULL)').bind('untested','me','正常'),
    ]);
    const summary = await store.getDashboard('me', '30d', true);
    assert.equal(summary.assetCount, 3);
    assert.equal(summary.versionCount, 5);
    assert.equal(summary.recordCount, 6);
    assert.equal(summary.quality.assets, 2);
    assert.equal(summary.quality.score, 75);
    assert.equal(summary.quality.empty, 1);
    assert.deepEqual(summary.risks.map(row => row.id), ['shared']);
    assert.deepEqual(summary.tasks, { profile: 3, clean: 1, assessment: 1 });
    assert.deepEqual(summary.connections, { total: 2, normal: 1, abnormal: 0, untested: 1 });
    assert.equal((await store.getDashboard('me','30d',false)).connections, null);
    assert.equal((await store.getDashboard('outsider','30d',true)).assetCount, 0);
    await db.prepare('UPDATE quality_runs SET created_at=? WHERE id=?').bind(now-8*86400000, 'shared-r').run();
    assert.equal((await store.getDashboard('me','7d',true)).quality.score, 100);
    assert.equal((await store.getDashboard('me','30d',true)).quality.score, 75);
  } finally { delete globalThis.dashboardTestDb; await mf.dispose(); await rm(directory, { recursive: true, force: true }); }
});

test('dashboard endpoint enforces login, module permission and validated periods, with safe failure responses', async () => {
  const source = (await readFile(new URL('../app/api/dashboard/route.ts', import.meta.url), 'utf8'))
    .replace("import { getSessionUser, canReadModule } from '@/db/platform-store';", `
      const getSessionUser = async request => request.headers.has('x-test-user') ? { id: request.headers.get('x-test-user') } : null;
      const canReadModule = async user => user.id !== 'denied';`)
    .replace("import { getDashboard } from '@/db/dashboard-store';", `
      const getDashboard = async (id, period, readable) => {
        if (id === 'failed') throw new Error('internal secret');
        return { id, period, readable };
      };`);
  const route = await import(`data:text/javascript;base64,${Buffer.from(compile(source)).toString('base64')}`);
  const request = (user, period = '30d') => new Request('http://localhost/api/dashboard?period=' + period, { headers: user ? { 'x-test-user': user } : {} });
  assert.equal((await route.GET(request(null))).status, 401);
  assert.equal((await route.GET(request('denied'))).status, 403);
  assert.equal((await route.GET(request('me','invalid'))).status, 400);
  const response = await route.GET(request('me','7d'));
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { id: 'me', period: '7d', readable: true });
  const failure = await route.GET(request('failed'));
  assert.equal(failure.status, 500);
  assert.doesNotMatch(await failure.text(), /internal secret/);
});
