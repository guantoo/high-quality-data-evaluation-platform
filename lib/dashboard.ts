export type DashboardPeriod = '7d' | '30d' | 'quarter';
export type DashboardSnapshot = {
  generatedAt: number;
  assetCount: number;
  versionCount: number;
  recordCount: number;
  connections: { total: number; normal: number; abnormal: number; untested: number } | null;
  tasks: { profile: number; clean: number; assessment: number };
  quality: { assets: number; score: number | null; completeness: number | null; uniqueness: number | null; empty: number; duplicates: number; whitespace: number; problemAssets: number };
  risks: Array<{ id: string; name: string; issues: number; score: number }>;
};
export function dashboardPeriodStart(period: DashboardPeriod, now: number) {
  if (period !== 'quarter') return now - (period === '7d' ? 7 : 30) * 86400000;
  const local = new Date(now + 8 * 3600000);
  return Date.UTC(local.getUTCFullYear(), Math.floor(local.getUTCMonth() / 3) * 3, 1) - 8 * 3600000;
}
export function summarizeDashboardQuality(rows: Array<{ id: string; name: string; result: string }>) {
  const profiles = rows.flatMap(row => {
    try {
      const result = JSON.parse(row.result);
      const profile = result.after ?? result;
      if (!['score', 'completeness', 'uniqueness', 'empty', 'duplicates', 'issueCount'].every(key => typeof profile[key] === 'number' && Number.isFinite(profile[key]))) return [];
      return [{ ...row, profile }];
    } catch { return []; }
  });
  const average = (key: string) => profiles.length ? Math.round(profiles.reduce((sum, row) => sum + row.profile[key], 0) / profiles.length * 100) / 100 : null;
  const sum = (key: string) => profiles.reduce((total, row) => total + row.profile[key], 0);
  return {
    quality: { assets: profiles.length, score: average('score'), completeness: average('completeness'), uniqueness: average('uniqueness'), empty: sum('empty'), duplicates: sum('duplicates'), whitespace: profiles.reduce((total, row) => total + Math.max(0, row.profile.issueCount - row.profile.empty - row.profile.duplicates), 0), problemAssets: profiles.filter(row => row.profile.issueCount > 0).length },
    risks: profiles.filter(row => row.profile.issueCount > 0).sort((a, b) => b.profile.issueCount - a.profile.issueCount || a.name.localeCompare(b.name)).slice(0, 5).map(row => ({ id: row.id, name: row.name, issues: row.profile.issueCount, score: row.profile.score })),
  };
}
