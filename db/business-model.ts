// Shared persistence contract; browser snapshots remain a compatibility format.
export const businessCollections = {
  projects: 'governance', sources: 'inventory', cleaningTasks: 'inventory',
  reviewTasks: 'assessment', assessmentIssues: 'assessment', jobs: 'modelDev',
  evaluations: 'modelEval', messages: 'home', auditLogs: 'home',
  roles: 'admin', users: 'admin', resolvedRisks: 'home',
} as const;
export type BusinessSnapshot = { version: number; savedAt: string; data: Record<string, unknown> };
export function validateSnapshot(value: unknown): asserts value is BusinessSnapshot {
  if (!value || typeof value !== 'object') throw new Error('业务快照格式无效');
  const snapshot = value as BusinessSnapshot;
  if (snapshot.version !== 2 || !snapshot.data || typeof snapshot.data !== 'object' || Array.isArray(snapshot.data)) throw new Error('仅支持版本 2 的业务快照');
  if (!Number.isFinite(Date.parse(snapshot.savedAt))) throw new Error('保存时间无效');
  const allowed = new Set([...Object.keys(businessCollections), 'project', 'compact', 'activeRoleId']);
  for (const key of Object.keys(snapshot.data)) if (!allowed.has(key)) throw new Error(`未知数据集合：${key}`);
  for (const key of Object.keys(businessCollections)) {
    const rows = snapshot.data[key];
    if (!Array.isArray(rows) || rows.length > 10000) throw new Error(`数据集合无效：${key}`);
    for (const row of rows) if (row === null || (typeof row !== 'object' && typeof row !== 'string')) throw new Error(`数据记录无效：${key}`);
  }
  if (typeof snapshot.data.project !== 'string' || typeof snapshot.data.compact !== 'boolean') throw new Error('平台设置无效');
}
export function changedCollections(previous: BusinessSnapshot, next: BusinessSnapshot) {
  return Object.keys(businessCollections).filter(key => JSON.stringify(previous.data[key]) !== JSON.stringify(next.data[key]));
}
