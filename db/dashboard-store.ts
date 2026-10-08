import { datasetDDL } from './dataset-store';
import { projectDatabase, readableAssetSql } from './project-store';
import { dashboardPeriodStart, summarizeDashboardQuality, type DashboardPeriod, type DashboardSnapshot } from '@/lib/dashboard';

export async function getDashboard(userId: string, period: DashboardPeriod, readConnections: boolean): Promise<DashboardSnapshot> {
  const db = await projectDatabase();
  await db.batch(datasetDDL.map(sql => db.prepare(sql)));
  const now = Date.now();
  const start = dashboardPeriodStart(period, now);
  const visible = `WITH visible AS (SELECT a.id, a.name FROM data_assets a WHERE ${readableAssetSql})`;
  const bindings = [userId, userId, userId, userId];
  // Only use a result for the current version. A historical assessment of an older
  // version must not overwrite the quality of a newly cleaned or imported version.
  const statements = [
    db.prepare(`${visible} SELECT COUNT(*) AS assets FROM visible`).bind(...bindings),
    db.prepare(`${visible} SELECT COUNT(*) AS versions FROM data_versions v JOIN visible a ON a.id=v.asset_id`).bind(...bindings),
    db.prepare(`${visible} SELECT COALESCE(SUM(json_array_length(v.content, '$.rows')),0) AS records FROM data_versions v JOIN visible a ON a.id=v.asset_id WHERE v.version=(SELECT MAX(v2.version) FROM data_versions v2 WHERE v2.asset_id=v.asset_id)`).bind(...bindings),
    db.prepare(`${visible} SELECT r.kind, COUNT(*) AS count FROM quality_runs r JOIN visible a ON a.id=r.asset_id WHERE r.created_at>=? AND r.created_at<=? AND r.kind IN ('profile','clean','assessment') GROUP BY r.kind`).bind(...bindings, start, now),
    db.prepare(`${visible}, ranked AS (
      SELECT a.id, a.name, r.result, ROW_NUMBER() OVER (PARTITION BY a.id ORDER BY r.created_at DESC, r.id DESC) AS rank
      FROM visible a JOIN data_versions v ON v.asset_id=a.id
      JOIN quality_runs r ON r.asset_id=a.id AND COALESCE(r.output_id,r.input_id)=v.id
      WHERE v.version=(SELECT MAX(v2.version) FROM data_versions v2 WHERE v2.asset_id=a.id)
      AND r.created_at>=? AND r.created_at<=? AND r.kind IN ('import','profile','clean','assessment')
    ) SELECT id,name,result FROM ranked WHERE rank=1`).bind(...bindings, start, now),
  ];
  const results = await db.batch(statements);
  const tasks = { profile: 0, clean: 0, assessment: 0 };
  for (const row of results[3].results) tasks[row.kind as keyof typeof tasks] = Number(row.count);
  let connections: DashboardSnapshot['connections'] = null;
  if (readConnections) {
    connections = { total: 0, normal: 0, abnormal: 0, untested: 0 };
    const exists = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='database_connections'").first();
    if (exists) for (const row of (await db.prepare('SELECT status,tested_at,COUNT(*) AS count FROM database_connections WHERE owner_id=? GROUP BY status,tested_at IS NULL').bind(userId).all()).results) {
      const count = Number(row.count);
      connections.total += count;
      if (row.tested_at === null) connections.untested += count;
      else if (row.status === '正常') connections.normal += count;
      else connections.abnormal += count;
    }
  }
  const summary = summarizeDashboardQuality(results[4].results as Array<{ id: string; name: string; result: string }>);
  return { generatedAt: now, assetCount: Number(results[0].results[0].assets), versionCount: Number(results[1].results[0].versions), recordCount: Number(results[2].results[0].records), connections, tasks, ...summary };
}
