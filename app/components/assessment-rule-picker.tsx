"use client";
import { useEffect, useRef, useState } from 'react';
import { assessmentCatalog } from '@/lib/assessment-catalog';
import { automaticRuleNames } from '@/lib/assessment';
import { documentRuleNames } from '@/lib/assessment-document';
export default function AssessmentRulePicker({ selectedRules, onConfirm, onDismiss }: { selectedRules: string[]; onConfirm: (ids: string[]) => void; onDismiss: () => void }) {
  const search = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(selectedRules);
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('');
  const [onlySelected, setOnlySelected] = useState(false);
  useEffect(() => { const element = dialog.current!; const opener = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; element.showModal(); search.current?.focus(); return () => { element.close(); document.body.style.overflow = overflow; opener?.focus(); }; }, []);
  const visible = assessmentCatalog.filter(rule => (!category || rule.category === category) && `${rule.name} ${rule.description}`.includes(query) && (!onlySelected || draft.includes(rule.id)));
  const selectable = visible.filter(rule => rule.name !== '模型适配性');
  return <dialog ref={dialog} className="assessment-rule-picker" aria-labelledby="rule-picker-title" onCancel={event => { event.preventDefault(); onDismiss(); }}>
    <header><div><h2 id="rule-picker-title">评估规则库</h2><p>从 45 条规则中选择本次评估项目，确认后配置并执行。</p></div><button type="button" className="reuse-secondary" aria-label="关闭规则库" onClick={onDismiss}>关闭</button></header>
    <div className="assessment-picker-tools"><label>搜索规则<input ref={search} value={query} onChange={event => setQuery(event.target.value)} placeholder="规则名称或说明" /></label><label>指标分类<select value={category} onChange={event => setCategory(event.target.value)}><option value="">全部分类</option>{Array.from(new Set(assessmentCatalog.map(rule => rule.category))).map(name => <option key={name}>{name}</option>)}</select></label><label className="assessment-picker-selected"><input type="checkbox" checked={onlySelected} onChange={event => setOnlySelected(event.target.checked)} />仅看已选</label></div>
    <div className="assessment-picker-actions"><span role="status">已选 {draft.length} 条 · 当前显示 {visible.length} 条</span><div><button className="reuse-secondary" disabled={!selectable.length} onClick={() => setDraft(Array.from(new Set([...draft, ...selectable.map(rule => rule.id)])))}>选择筛选结果</button><button className="reuse-link" disabled={!draft.length} onClick={() => setDraft([])}>清空选择</button></div></div>
    <div className="assessment-picker-list">{visible.map(rule => <article key={rule.id} className={draft.includes(rule.id) ? 'is-selected' : ''}><label><input type="checkbox" aria-label={`选择${rule.name}`} checked={draft.includes(rule.id)} disabled={rule.name === '模型适配性'} onChange={event => setDraft(event.target.checked ? [...draft, rule.id] : draft.filter(id => id !== rule.id))} /><span><strong>{rule.name}</strong><small>{rule.category}{rule.suggested ? ' · 建议规则' : ''}</small></span><em>{rule.name === '模型适配性' ? '暂不执行' : documentRuleNames.has(rule.name) ? '读取说明文档' : automaticRuleNames.has(rule.name) ? '自动检查' : '需配置证据'}</em></label><details><summary>查看规则说明</summary><p>{rule.description}</p><pre>{rule.sourceFormula}</pre></details></article>)}{!visible.length && <p className="assessment-picker-empty">没有符合条件的规则，请调整筛选条件。</p>}</div>
    <footer><span>选择仅在确认后生效</span><div><button className="reuse-secondary" onClick={onDismiss}>取消</button><button className="reuse-primary" onClick={() => onConfirm(draft)}>确认选择（{draft.length}）</button></div></footer>
  </dialog>;
}
