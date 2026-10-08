import type { AssessmentDocument } from '@/lib/assessment-document';
import { assessDataset, type AssessmentEvidence } from '@/lib/assessment';
import { projectDatabase, readableAssetSql, canProcessAsset, auditStatement } from './project-store';
import { env } from 'cloudflare:workers';
import { cleanDataset, profileDataset, type DatasetContent, type CleaningRules } from '@/lib/data-quality';

export const datasetDDL = [
  `CREATE TABLE IF NOT EXISTS data_assets (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, filename TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_data_assets_owner ON data_assets(owner_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS data_versions (id TEXT PRIMARY KEY, asset_id TEXT NOT NULL REFERENCES data_assets(id), parent_id TEXT REFERENCES data_versions(id), version INTEGER NOT NULL, content TEXT NOT NULL CHECK(json_valid(content)), created_at INTEGER NOT NULL, UNIQUE(asset_id, version))`,
  `CREATE TABLE IF NOT EXISTS quality_runs (id TEXT PRIMARY KEY, asset_id TEXT NOT NULL REFERENCES data_assets(id), input_id TEXT NOT NULL REFERENCES data_versions(id), output_id TEXT REFERENCES data_versions(id), kind TEXT NOT NULL, rules TEXT NOT NULL, result TEXT NOT NULL CHECK(json_valid(result)), created_by TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_quality_runs_asset ON quality_runs(asset_id, created_at)`,
];
async function database() {
  if (!env.DB) throw new Error('数据库未配置');
  await env.DB.batch(datasetDDL.map(sql => env.DB!.prepare(sql)));
  await projectDatabase();
  return env.DB;
}
export async function listDatasets(owner: string) {
  const db = await database();
  return (await db.prepare(`SELECT a.*, (SELECT project_id FROM project_assets WHERE asset_id = a.id) AS project_id, (SELECT COUNT(*) FROM data_versions v WHERE v.asset_id = a.id) AS versions FROM data_assets a WHERE ${readableAssetSql} ORDER BY a.created_at DESC`).bind(owner, owner, owner, owner).all()).results;
}
export async function createDataset(owner: string, name: string, filename: string, content: DatasetContent, source?: { connectionId: string; database: string; schema: string; table: string; sample: boolean }) {
  const db = await database(); const assetId = crypto.randomUUID(); const versionId = crypto.randomUUID(); const now = Date.now();
  const statements = [
    db.prepare('INSERT INTO data_assets VALUES (?, ?, ?, ?, ?)').bind(assetId, owner, name, filename, now),
    db.prepare('INSERT INTO data_versions VALUES (?, ?, NULL, 1, ?, ?)').bind(versionId, assetId, JSON.stringify(content), now),
    db.prepare('INSERT INTO quality_runs VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), assetId, versionId, 'import', '{}', JSON.stringify(profileDataset(content)), owner, now),
    auditStatement(db, owner, 'asset.import', assetId, filename),
  ];
  if (source) {
    statements.push(db.prepare('INSERT INTO database_imports VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(assetId, source.connectionId, source.database, source.schema, source.table, source.sample ? 1 : 0, content.rows.length, now));
    statements.push(auditStatement(db, owner, 'connection.import', source.connectionId, JSON.stringify({ assetId, schema: source.schema, table: source.table, sample: source.sample, records: content.rows.length })));
  }
  await db.batch(statements);
  return assetId;
}
export async function getDataset(owner: string, id: string) {
  const db = await database();
  const asset = await db.prepare(`SELECT a.*, (SELECT project_id FROM project_assets WHERE asset_id = a.id) AS project_id FROM data_assets a WHERE a.id = ? AND ${readableAssetSql}`).bind(id, owner, owner, owner, owner).first();
  if (!asset) return null;
  const versions = (await db.prepare('SELECT id, parent_id, version, created_at FROM data_versions WHERE asset_id = ? ORDER BY version DESC').bind(id).all()).results;
  const runs = (await db.prepare('SELECT * FROM quality_runs WHERE asset_id = ? ORDER BY created_at DESC LIMIT 50').bind(id).all()).results.map(row => ({ ...row, result: JSON.parse(String(row.result)), rules: JSON.parse(String(row.rules)) }));
  const hasImports = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='database_imports'").first();
  const source = hasImports ? await db.prepare('SELECT database_name AS databaseName, schema_name AS schemaName, table_name AS tableName, is_sample AS isSample, row_count AS rowCount FROM database_imports WHERE asset_id = ?').bind(id).first() : null;
  return { asset, versions, runs, source };
}
export async function getVersion(owner: string, assetId: string, versionId: string) {
  const db = await database();
  const version = await db.prepare(`SELECT v.content FROM data_versions v JOIN data_assets a ON a.id = v.asset_id WHERE a.id = ? AND v.id = ? AND ${readableAssetSql}`).bind(assetId, versionId, owner, owner, owner, owner).first<{ content: string }>();
  return version ? JSON.parse(version.content) as DatasetContent : null;
}
export async function runQuality(owner: string, assetId: string, versionId: string, kind: 'profile' | 'clean' | 'assessment', rules: CleaningRules, evidence: AssessmentEvidence = {}, selectedRules?: string[], document?: AssessmentDocument) {
  if (!(await canProcessAsset(owner, assetId))) return null;
  const content = await getVersion(owner, assetId, versionId);
  if (!content) return null;
  const db = await database(); const runId = crypto.randomUUID(); const now = Date.now();
  const output = kind === 'clean' ? cleanDataset(content, rules) : content;
  const outputId = kind === 'clean' ? crypto.randomUUID() : null;
  const result = { before: profileDataset(content), after: profileDataset(output), ...(kind === 'assessment' ? { assessment: assessDataset(content, evidence, selectedRules, document) } : {}) };
  const statements = [];
  if (outputId) statements.push(db.prepare(`INSERT INTO data_versions (id, asset_id, parent_id, version, content, created_at)
    SELECT ?, ?, ?, COALESCE(MAX(version), 0) + 1, ?, ? FROM data_versions WHERE asset_id = ?`).bind(outputId, assetId, versionId, JSON.stringify(output), now, assetId));
  statements.push(db.prepare('INSERT INTO quality_runs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(runId, assetId, versionId, outputId, kind, JSON.stringify(kind === 'assessment' ? { evidence, document, selectedRules: result.assessment?.selectedRules } : rules), JSON.stringify(result), owner, now));
  statements.push(auditStatement(db, owner, `quality.${kind}`, assetId, JSON.stringify({ runId, versionId, outputId })));
  await db.batch(statements);
  return { runId, outputId, result };
}

export async function saveGovernanceResult(owner: string, assetId: string, versionId: string, output: DatasetContent, results: unknown) {
  if (!await canProcessAsset(owner, assetId)) throw new Error('无结果保存权限');
  const db = await database(); const outputId = crypto.randomUUID(); const runId = crypto.randomUUID(); const now = Date.now();
  await db.batch([
    db.prepare('INSERT INTO data_versions (id, asset_id, parent_id, version, content, created_at) SELECT ?, ?, ?, COALESCE(MAX(version), 0) + 1, ?, ? FROM data_versions WHERE asset_id = ?').bind(outputId, assetId, versionId, JSON.stringify(output), now, assetId),
    db.prepare('INSERT INTO quality_runs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(runId, assetId, versionId, outputId, 'clean', JSON.stringify({ workflow: true }), JSON.stringify({ after: profileDataset(output), nodes: results }), owner, now),
    auditStatement(db, owner, 'quality.workflow', assetId, JSON.stringify({ runId, versionId, outputId })),
  ]);
  return outputId;
}
