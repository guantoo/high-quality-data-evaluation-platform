export type AssessmentFinding = { id: string; runId: string; assetId: string; assetName: string; filename: string; version: number; createdAt: number; rule: string; kind: '文档缺项' | '指标待核查'; problem: string; method: string; note: string; numerator: number; denominator: number };
export function assessmentFindings(row: { id: string; asset_id: string; name: string; filename: string; version: number; created_at: number; result: string }): AssessmentFinding[] {
  const assessment = JSON.parse(row.result).assessment;
  if (!Array.isArray(assessment?.results)) return [];
  return assessment.results.flatMap((rule: { id: string; name: string; numerator: number | null; denominator: number | null; method: string; note?: string; documentCheck?: { checks: Array<{ name: string; found: boolean }> } }) => {
    if (typeof rule.numerator !== 'number' || typeof rule.denominator !== 'number' || !Number.isFinite(rule.numerator) || !Number.isFinite(rule.denominator) || rule.denominator <= 0) return [];
    const missing = rule.documentCheck?.checks.filter(item => !item.found).map(item => item.name);
    const inverse = ['数据重复率', '脏数据出现率'].includes(rule.name);
    if (!(missing?.length || (inverse ? rule.numerator > 0 : rule.numerator < rule.denominator))) return [];
    return [{ id: `${row.id}:${rule.id}`, runId: row.id, assetId: row.asset_id, assetName: row.name, filename: row.filename, version: row.version, createdAt: row.created_at, rule: rule.name, kind: missing?.length ? '文档缺项' as const : '指标待核查' as const, problem: missing?.length ? `说明文档缺少检查项：${missing.join('、')}` : `${rule.name}：A=${rule.numerator}，B=${rule.denominator}。${inverse ? '检测到非零问题数量' : '满足要求的数量少于评价总量'}，需结合业务标准核查。`, method: rule.method, note: rule.note ?? '', numerator: rule.numerator, denominator: rule.denominator }];
  });
}
export function removeLegacyAssessmentSamples<T extends { id: string; sample: string }>(rows: T[]): T[] {
  const samples: Record<string, string> = { 'QA-0823-001': 'basketball_03812.jpeg', 'QA-0823-002': 'basketball_09218.jpeg', 'QA-0823-003': 'basketball_00186.jpeg' };
  return rows.filter(row => !(Object.hasOwn(samples, row.id) && samples[row.id] === row.sample));
}
