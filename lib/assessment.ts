import { documentRuleNames, inspectDocument, type AssessmentDocument } from './assessment-document';
import { assessmentCatalog } from './assessment-catalog';
import { profileDataset, type DatasetContent } from './data-quality';

export const automaticRuleNames = new Set(['结构完整性', '数据记录完整性', '数据元素完整性', '数据重复率', '数据唯一性', ...documentRuleNames]);
export const automaticRuleIds = assessmentCatalog.filter(rule => automaticRuleNames.has(rule.name)).map(rule => rule.id);
export function validateSelectedRules(value: unknown): string[] {
  if (!Array.isArray(value) || !value.length || value.length > assessmentCatalog.length || value.some(id => typeof id !== 'string' || !assessmentCatalog.some(rule => rule.id === id && rule.name !== '模型适配性')) || new Set(value).size !== value.length) throw new Error('请至少选择一条可执行规则；规则不能重复或不存在');
  return value;
}

export type AssessmentEvidence = Record<string, { numerator: number; denominator: number; note: string }>;
export function validateEvidence(value: unknown): AssessmentEvidence {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('评估证据格式无效');
  for (const [id, item] of Object.entries(value)) {
    const rule = assessmentCatalog.find(rule => rule.id === id);
    if (!rule || !item || typeof item !== 'object') throw new Error('评估规则不存在');
    const { numerator, denominator, note } = item;
    if (![numerator, denominator].every(n => typeof n === 'number' && Number.isFinite(n)) || numerator < 0 || denominator <= 0 || numerator > denominator || typeof note !== 'string' || !note.trim() || note.length > 2000) throw new Error('证据需满足 0 ≤ A ≤ B、B > 0，并填写证据来源');
    if (rule.name === '模型适配性') throw new Error('模型适配性暂不执行，请使用已授权的数据质量规则');
  }
  return value as AssessmentEvidence;
}
export function assessDataset(content: DatasetContent, evidence: AssessmentEvidence = {}, selectedRules: string[] = automaticRuleIds, document?: AssessmentDocument) {
  const selected = new Set(validateSelectedRules(selectedRules));
  const profile = profileDataset(content);
  const completeRecords = content.rows.filter(row => content.columns.every(field => row[field].trim())).length;
  const results = assessmentCatalog.filter(rule => selected.has(rule.id)).map(rule => {
    let numerator: number | null = null; let denominator: number | null = null; let method = '待补充证据';
    if (rule.name === '结构完整性' || rule.name === '数据记录完整性') { numerator = completeRecords; denominator = profile.records; method = '全量记录非空检查'; }
    if (rule.name === '数据元素完整性') { denominator = profile.records * content.columns.length; numerator = denominator - profile.empty; method = '全量单元格非空检查'; }
    if (rule.name === '数据重复率' || rule.name === '数据唯一性') { numerator = rule.name === '数据重复率' ? profile.duplicates : profile.records - profile.duplicates; denominator = profile.records; method = '全量整行精确比较'; }
    const documentCheck = documentRuleNames.has(rule.name) && document ? inspectDocument(rule.name, document) : undefined;
    if (documentCheck) { numerator = documentCheck.numerator; denominator = documentCheck.denominator; method = '平台读取说明文档（检查项存在性）'; }
    if (documentRuleNames.has(rule.name) && !document) method = '待提供说明文档';
    const supplied = documentRuleNames.has(rule.name) ? undefined : evidence[rule.id];
    if (numerator === null && supplied && rule.name !== '模型适配性') { numerator = supplied.numerator; denominator = supplied.denominator; method = '证据计算（人工提供）'; }
    return { ...rule, documentCheck, numerator, denominator, value: numerator === null || !denominator ? null : Math.round(numerator / denominator * 10000) / 100, method, note: supplied?.note ?? '', status: rule.name === '模型适配性' ? '暂不执行' : numerator === null ? (documentRuleNames.has(rule.name) ? '待提供说明文档' : '待补充证据') : '已计算' };
  });
  return { catalogVersion: 'xlsx-2025-07-v1', source: '副本高质量数据集评估规则.xlsx', selectedRules: results.map(rule => rule.id), total: results.length, calculated: results.filter(rule => rule.value !== null).length, pending: results.filter(rule => rule.value === null).length, results, explanation: '按指标文字定义采用 A/B；原表公式保留供核对。重复率越低越好。原表未提供权重或通过阈值，不生成综合通过结论。模型适配性暂不执行。' };
}
export type AssessmentResult = ReturnType<typeof assessDataset>;
