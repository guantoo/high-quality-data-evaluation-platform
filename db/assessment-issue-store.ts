import { projectDatabase, readableAssetSql, canProcessAsset } from './project-store';
import { datasetDDL } from './dataset-store';
import { assessmentFindings } from '@/lib/assessment-issues';
const ddl = `CREATE TABLE IF NOT EXISTS assessment_issue_actions (id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES quality_runs(id), status TEXT NOT NULL, assignee TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', updated_by TEXT NOT NULL, updated_at INTEGER NOT NULL)`;
async function database() { const db = await projectDatabase(); await db.batch([...datasetDDL, ddl].map(sql => db.prepare(sql))); return db; }
export async function listAssessmentIssues(userId: string, page: number) {
  const db = await database();
  const scope = `FROM quality_runs r JOIN data_assets a ON a.id=r.asset_id JOIN data_versions v ON v.id=r.input_id WHERE r.kind='assessment' AND ${readableAssetSql}`;
  const bindings = [userId,userId,userId,userId];
  const [count, runs] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS total ${scope}`).bind(...bindings),
    db.prepare(`SELECT r.id,r.asset_id,r.result,r.created_at,a.name,a.filename,v.version ${scope} ORDER BY r.created_at DESC,r.id DESC LIMIT 20 OFFSET ?`).bind(...bindings,(page-1)*20),
  ]);
  const findings = runs.results.flatMap(row => assessmentFindings(row as Parameters<typeof assessmentFindings>[0]));
  const runIds = runs.results.map(row=>String(row.id));
  const actions = runIds.length ? (await db.prepare(`SELECT id,status,assignee,note,updated_at FROM assessment_issue_actions WHERE run_id IN (${runIds.map(()=>'?').join(',')})`).bind(...runIds).all()).results : [];
  const actionById = new Map(actions.map(action=>[String(action.id),action]));
  const assetIds = [...new Set(findings.map(finding=>finding.assetId))];
  const permissions = new Map(await Promise.all(assetIds.map(async assetId=>[assetId,await canProcessAsset(userId,assetId)] as const)));
  const rows = findings.map(finding=>{
    const action=actionById.get(finding.id);
    return { ...finding, status:action?.status??'待处理', assignee:action?.assignee??'', closureNote:action?.note??'', updatedAt:action?.updated_at??null, editable:permissions.get(finding.assetId)??false };
  });
  return { issues: rows, totalRuns: Number(count.results[0].total), page, pageSize: 20 };
}
export async function updateAssessmentIssue(userId: string, id: string, expectedStatus: string, assignee: string, note: string) {
  const db = await database();
  const split = id.lastIndexOf(':');
  if (split < 1) return { error:'问题编号无效', status:400 };
  const runId = id.slice(0,split);
  const row = await db.prepare(`SELECT r.id,r.asset_id,r.result,r.created_at,a.name,a.filename,v.version FROM quality_runs r JOIN data_assets a ON a.id=r.asset_id JOIN data_versions v ON v.id=r.input_id WHERE r.id=? AND r.kind='assessment' AND ${readableAssetSql}`).bind(runId,userId,userId,userId,userId).first();
  if (!row || !assessmentFindings(row as Parameters<typeof assessmentFindings>[0]).some(issue => issue.id===id) || !(await canProcessAsset(userId,String(row.asset_id)))) return { error:'问题不存在或无处理权限', status:404 };
  const next: Record<string,string> = { '待处理':'已分派','已分派':'待复核','待复核':'已关闭' };
  if (!next[expectedStatus]) return { error:'问题状态无效', status:400 };
  if (!assignee.trim() || !note.trim()) return { error:'请填写责任人和处理记录', status:400 };
  const now = Date.now();
  const results = await db.batch([
    db.prepare(`INSERT INTO assessment_issue_actions SELECT ?,?,?,?,?,?,?
      WHERE ?='待处理' OR EXISTS(SELECT 1 FROM assessment_issue_actions WHERE id=? AND status=?)
      ON CONFLICT(id) DO UPDATE SET status=excluded.status,assignee=excluded.assignee,note=excluded.note,updated_by=excluded.updated_by,updated_at=excluded.updated_at WHERE assessment_issue_actions.status=?`).bind(id,runId,next[expectedStatus],assignee.trim(),note.trim(),userId,now,expectedStatus,id,expectedStatus,expectedStatus),
    db.prepare(`INSERT INTO data_audit SELECT ?,?,?,?,?,? WHERE changes()>0`).bind(crypto.randomUUID(),userId,`assessment.issue.${next[expectedStatus]}`,id,JSON.stringify({ assignee:assignee.trim(),note:note.trim() }),now),
  ]);
  if (!results[0].meta.changes) return { error:'问题状态已变化，请刷新', status:409 };
  return { ok:true };
}
