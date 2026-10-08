export type AssessmentDocument = { filename: string; text: string };
export const documentRuleNames = new Set(['基本信息完整性', '内容特征完整性', '建设过程完整性', '应用说明完整性']);
const requirements: Record<string, Array<{ name: string; labels: string[] }>> = {
  基本信息完整性: [
    { name: '数据集规模', labels: ['数据集规模', '数据规模', '样本数量', '记录数量'] },
    { name: '格式规范', labels: ['格式规范', '数据格式', '文件格式'] },
    { name: '文件结构', labels: ['文件结构', '目录结构', '数据结构'] },
    { name: '获取渠道', labels: ['获取渠道', '下载地址', '获取方式'] },
    { name: '技术支持方式', labels: ['技术支持方式', '技术支持', '联系方式'] },
  ],
  内容特征完整性: [
    { name: '模态类型', labels: ['模态类型', '数据模态'] },
    { name: '数据分布情况', labels: ['数据分布情况', '数据分布', '分布情况'] },
    { name: '标签类别统计', labels: ['标签类别统计', '类别统计', '标签分布'] },
    { name: '样本示例', labels: ['样本示例', '数据示例', '样例数据'] },
    { name: '局限性说明', labels: ['局限性说明', '局限性', '使用限制'] },
  ],
  建设过程完整性: [
    { name: '数据来源', labels: ['数据来源', '采集来源'] },
    { name: '采集方法', labels: ['采集方法', '采集方式'] },
    { name: '加工处理流程', labels: ['加工处理流程', '处理流程', '加工流程'] },
    { name: '标注规范', labels: ['标注规范', '标注指南'] },
    { name: '版本控制记录', labels: ['版本控制记录', '版本记录', '版本历史', '变更记录'] },
  ],
  应用说明完整性: [
    { name: '使用许可', labels: ['使用许可', '许可协议', '许可证'] },
    { name: '目标应用场景', labels: ['目标应用场景', '应用场景', '适用场景'] },
    { name: '评估方法', labels: ['评估方法', '评价方法'] },
    { name: '基准测试结果', labels: ['基准测试结果', '基准测试', '基准结果'] },
    { name: '典型应用案例', labels: ['典型应用案例', '应用案例', '使用案例'] },
  ],
};
export function validateAssessmentDocument(value: unknown): AssessmentDocument | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('说明文档格式无效');
  const { filename, text } = value as Record<string, unknown>;
  if (typeof filename !== 'string' || !filename.trim() || filename.length > 200 || !/\.(txt|md|json)$/i.test(filename) || typeof text !== 'string' || !text.trim() || new TextEncoder().encode(text).length > 512 * 1024) throw new Error('说明文档需为非空 TXT、Markdown 或 JSON，且不超过 512 KiB');
  return { filename, text };
}
export function inspectDocument(ruleName: string, document: AssessmentDocument) {
  let text = document.text.replace(/\r\n?/g, '\n');
  if (/\.json$/i.test(document.filename)) {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new Error('说明文档 JSON 格式无效'); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('说明文档 JSON 需为以检查项名称为键的对象');
    text = Object.entries(parsed).map(([key, value]) => `${key}：${typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value)}`).join('\n');
  }
  const lines = text.split('\n');
  const checks = (requirements[ruleName] ?? []).map(requirement => {
    let match: { line: number; excerpt: string } | undefined;
    lines.some((line, index) => {
      const cleaned = line.trim().replace(/^[#\s*\-\d.、]+/, '').replace(/\*\*/g, '');
      for (const label of requirement.labels) {
        if (!cleaned.startsWith(label)) continue;
        const tail = cleaned.slice(label.length);
        if (tail && !/^[\s:：=|]/.test(tail)) continue;
        let body = tail.replace(/^[\s:：=|]+/, '').trim();
        let excerpt = line;
        if (!body) {
          const following = lines.slice(index + 1).find(item => item.trim());
          // A subsequent heading or labelled field is not evidence for this heading.
          if (following && !/^\s*#|^[^：:]{1,30}[：:]/.test(following)) { body = following.trim(); excerpt += '\n' + following; }
        }
        if (body.length >= 2 && !/^(待补充|待填写|暂无|未提供|无|N\/?A|TBD|null|\[\]|\{\}|[-—]*)[。.!！\s]*$/i.test(body)) {
          match = { line: index + 1, excerpt: excerpt.slice(0, 500) }; return true;
        }
      }
      return false;
    });
    return { name: requirement.name, found: Boolean(match), line: match?.line ?? null, excerpt: match?.excerpt ?? '' };
  });
  return { filename: document.filename, checks, numerator: checks.filter(check => check.found).length, denominator: checks.length };
}
