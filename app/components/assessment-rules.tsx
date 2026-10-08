"use client";
import { assessmentCatalog } from '@/lib/assessment-catalog';
import { documentRuleNames } from '@/lib/assessment-document';
import { automaticRuleNames } from '@/lib/assessment';
import type { AssessmentEvidence, AssessmentResult } from '@/lib/assessment';
export default function AssessmentRules({ evidence, onChange, result, busy, editable, selectedRules, onSelect }: { evidence: AssessmentEvidence; onChange: (value: AssessmentEvidence) => void; result?: AssessmentResult; busy: boolean; editable: boolean; selectedRules: string[]; onSelect: (ids: string[]) => void }) {
  const rules = result ? result.results : assessmentCatalog.filter(rule => selectedRules.includes(rule.id));
  return <section className="assessment-rule-list">
    <h3>{result ? `本次规则评估结果（${result.total} 条）` : `已选规则（${selectedRules.length} 条）`}</h3>
    {result && <p className="assessment-rule-count" role="status">已计算 {result.calculated} 条 · 待补充证据 {result.pending} 条</p>}
    {result?.explanation && <details><summary>评估口径</summary><p>{result.explanation}</p></details>}
    {!rules.length ? <p className="assessment-simple-empty">点击“规则库”添加需要评估的规则。</p> :
    <div className="reuse-table-wrap"><table className="reuse-table"><thead><tr>{editable && !result && <th className="assessment-selection-column">操作</th>}<th className="assessment-rule-column">指标 / 规则项</th><th className="assessment-evidence-column">执行方式及证据</th><th className="assessment-result-column">结果</th></tr></thead><tbody>{rules.map(rule => {
      const item = result?.results.find(item => item.id === rule.id);
      const value = evidence[rule.id]; const auto = automaticRuleNames.has(rule.name); const excluded = rule.name === '模型适配性'; const selected = selectedRules.includes(rule.id);
      function update(key: 'numerator' | 'denominator' | 'note', next: number | string) { onChange({ ...evidence, [rule.id]: { ...(value ?? { numerator: 0, denominator: 1, note: '' }), [key]: next } }); }
      return <tr key={rule.id} className={selected && !result ? 'data-selected-row' : undefined}>
        {editable && !result && <td><button className="reuse-link" aria-label={`移除${rule.name}`} disabled={busy} onClick={() => onSelect(selectedRules.filter(id => id !== rule.id))}>移除</button></td>}
        <td className="assessment-rule-cell"><strong className="assessment-rule-name">{rule.name}</strong><p className="assessment-rule-category">{rule.category}{rule.suggested ? ' · 建议规则' : ''}</p><details className="assessment-rule-details"><summary>查看规则原文</summary><div className="assessment-rule-description"><span>规则说明</span><p>{rule.description}</p></div><div className="assessment-rule-formula"><span>计算口径</span><pre>{rule.sourceFormula}</pre></div><p className="assessment-rule-source">原表自动化标记：{rule.sourceAutomation}<br />实际执行方式以本页为准</p>{['内容专业性', '内容真实性'].includes(rule.name) && <p>原表描述与计算口径存在差异，请核对后提供证据。</p>}</details></td>
        <td className="assessment-evidence-cell">{documentRuleNames.has(rule.name) ? item?.method ?? '平台读取说明文档' : auto ? '全量自动计算' : excluded ? '暂不执行' : editable && !result && selected ? <div className="assessment-evidence">
          <label>A：{rule.name === '脏数据出现率' ? '脏数据数量' : '满足要求数量'}<input type="number" min="0" value={value?.numerator ?? ''} disabled={busy} onChange={event => update('numerator', Number(event.target.value))} /></label>
          <label>B：评价总量<input type="number" min="0.000001" value={value?.denominator ?? ''} disabled={busy} onChange={event => update('denominator', Number(event.target.value))} /></label>
          <label className="assessment-evidence-note">证据来源 / 口径说明<textarea rows={3} maxLength={2000} value={value?.note ?? ''} disabled={busy} onChange={event => update('note', event.target.value)} /></label>
          {value && <button className="reuse-link" disabled={busy} onClick={() => { const next = { ...evidence }; delete next[rule.id]; onChange(next); }}>清除证据</button>}
        </div> : item?.method ?? '需要业务证据'}{item?.numerator !== null && item && <p>A={item.numerator} / B={item.denominator}</p>}{item?.note && <p>{item.note}</p>}{item?.documentCheck && <><p>文档：{item.documentCheck.filename} · 检查项存在性，不代表内容真实或符合业务标准。</p><ul>{item.documentCheck.checks.map(check => <li key={check.name}>{check.name}：{check.found ? `已找到（第 ${check.line} 行）` : '未找到有效说明'}{check.excerpt && <details><summary>查看原文依据</summary><pre>{check.excerpt}</pre></details>}</li>)}</ul></>}</td>
        <td className="assessment-result-cell"><span className={`assessment-rule-status${item?.value !== null && item?.value !== undefined ? ' is-calculated' : excluded ? ' is-disabled' : selected ? ' is-selected' : ''}`}>{item?.value !== null && item?.value !== undefined ? `${item.value}%${['数据重复率', '脏数据出现率'].includes(rule.name) ? '（越低越好）' : ''}` : item?.status ?? (excluded ? '暂不执行' : selected ? '待执行' : '未选择')}</span></td>
      </tr>;
    })}{!rules.length && <tr><td colSpan={editable && !result ? 4 : 3} className="data-empty">尚未选择规则，请点击上方“规则库”添加评估项目</td></tr>}</tbody></table></div>}
  </section>;
}
