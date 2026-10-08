"use client";
import ProfileCharts from './profile-charts';
import AssessmentRulePicker from './assessment-rule-picker';
import AssessmentRules from './assessment-rules';
import { documentRuleNames, validateAssessmentDocument, type AssessmentDocument } from '@/lib/assessment-document';
import { assessmentCatalog } from '@/lib/assessment-catalog';
import type { AssessmentEvidence, AssessmentResult } from '@/lib/assessment';
import { useCallback, useEffect, useRef, useState } from 'react';

type Asset = { id: string; name: string; filename: string; versions: number; project_id: string | null };
type Profile = { records: number; duplicates: number; empty: number; completeness: number; uniqueness: number; score: number; formula: string; issueCount: number; issuesTruncated: boolean; fields: Array<{ name: string; empty: number; unique: number }>; issues: Array<{ row: number; field: string; rule: string }> };
type Run = { rules?: { evidence?: AssessmentEvidence; document?: AssessmentDocument; selectedRules?: string[] }; id: string; kind: string; created_at: number; input_id: string; output_id: string | null; result: Profile | { before: Profile; after: Profile; assessment?: AssessmentResult } };
type Detail = { source?: { databaseName: string; schemaName: string; tableName: string; isSample: number; rowCount: number } | null; asset: { owner_id: string; project_id: string | null }; versions: Array<{ id: string; version: number; parent_id: string | null }>; runs: Run[] };
async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? '请求失败');
  return body;
}
export type DataView = 'files' | 'assets' | 'profile' | 'inventory' | 'clean' | 'assessment' | 'history';
const titles: Record<DataView, string> = { files: '本地数据管理', assets: '数据资产管理', profile: '数据探查', inventory: '智能数据盘点', clean: '智能数据清洗', assessment: '高质量数据评估', history: '高质量数据评估历史' };
export default function DataWorkbench({ mode, onNavigate, scopeProjectId, readOnly = false }: { mode: DataView; onNavigate?: (section: string) => void; scopeProjectId?: string; readOnly?: boolean }) {
  const [assessmentDocument, setDocument] = useState<AssessmentDocument>();
  const pickerTrigger = useRef<HTMLButtonElement>(null);
  function dismissPicker() { setPickerOpen(false); requestAnimationFrame(() => pickerTrigger.current?.focus()); }
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const needsDocument = selectedRules.some(id => assessmentCatalog.some(rule => rule.id === id && documentRuleNames.has(rule.name)));
  const [evidence, setEvidence] = useState<AssessmentEvidence>({});
  const [assets, setAssets] = useState<Asset[]>([]); const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState<Detail | null>(null); const [version, setVersion] = useState('');
  const [name, setName] = useState(''); const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const [reportId, setReportId] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(mode !== 'files');
  const [failed, setFailed] = useState(false);
  const [userId, setUserId] = useState('');
  const [projects, setProjects] = useState<Array<{ id: string; name: string; permission: string }>>([]);
  const [projectId, setProjectId] = useState('');
  const [rules, setRules] = useState({ trim: true, deduplicate: true, maskSensitive: false });
  const loadAssets = useCallback(async () => {
    const result = await api('/api/datasets'); setAssets(scopeProjectId ? result.assets.filter((asset: Asset) => asset.project_id === scopeProjectId) : result.assets);
  }, [scopeProjectId]);
  useEffect(() => {
    let cancelled = false;
    if (mode === 'files') return;
    Promise.all([api('/api/datasets'), api('/api/data-projects')]).then(([result, projectResult]) => { if (!cancelled) { setAssets(scopeProjectId ? result.assets.filter((asset: Asset) => asset.project_id === scopeProjectId) : result.assets); setProjects(projectResult.projects); setUserId(projectResult.userId); } }).catch(error => { if (!cancelled) { setMessage(error.message); setFailed(true); } }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mode, scopeProjectId]);
  const loadDetail = useCallback(async (id: string) => {
    const result = await api(`/api/datasets?id=${encodeURIComponent(id)}`) as Detail;
    setDetail(result); setProjectId(result.asset.project_id ?? ''); setVersion((mode === 'assessment' ? result.versions.filter(item => Boolean(item.parent_id)).sort((a, b) => b.version - a.version) : result.versions)[0]?.id ?? ''); setReportId(mode === 'assessment' ? '' : result.runs.find(run => mode === 'history' ? run.kind === 'assessment' : mode === 'clean' ? run.kind === 'clean' : run.kind === 'profile' || run.kind === 'import')?.id ?? '');
  }, [mode]);
  async function select(id: string) {
    setDocument(undefined); setEvidence({}); setMessage(''); setFailed(false); setSelected(id); setDetail(null); setVersion(''); setReportId('');
    if (id) { setBusy(true); try { await loadDetail(id); } catch (error) { setMessage((error as Error).message); setFailed(true); } finally { setBusy(false); } }
  }
  async function execute(mode: 'import' | 'profile' | 'clean' | 'assessment') {
    if (readOnly) return;
    setBusy(true); setMessage(''); setFailed(false);
    try {
      if (mode === 'import' && (!file || file.size > 1024 * 1024)) throw new Error('请选择不超过 1 MiB 的文件');
      const payload = mode === 'import' ? { mode, name: name || file!.name, filename: file!.name, text: await file!.text() } : { mode, ...(scopeProjectId ? { projectId: scopeProjectId } : {}), assetId: selected, versionId: version, rules, evidence: Object.fromEntries(Object.entries(evidence).filter(([id]) => selectedRules.includes(id))), selectedRules, document: assessmentDocument };
      const result = await api('/api/datasets', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-platform-request': '1' }, body: JSON.stringify(payload) });
      const id = mode === 'import' ? result.id : selected;
      if (mode !== 'import') { await loadAssets(); setSelected(id); await loadDetail(id); }
      if (mode !== 'import' && mode !== 'clean') setVersion(version);
      if (result.runId) setReportId(result.runId);
      setMessage(mode === 'clean' ? '清洗完成，已生成新版本；原始版本保留。' : mode === 'import' ? '真实文件已导入数据库，字段画像已生成。' : mode === 'assessment' ? '评估完成，逐项结果与证据已保存。' : '已基于所选版本完成真实结构质量检查。');
    } catch (error) { setMessage((error as Error).message); setFailed(true); } finally { setBusy(false); }
  }
  async function share() {
    setBusy(true); setMessage(''); setFailed(false);
    try { await api('/api/data-projects', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-platform-request': '1' }, body: JSON.stringify({ mode: 'assign', assetId: selected, projectId: projectId || null }) }); await loadDetail(selected); setMessage('资产共享范围已保存。'); }
    catch (error) { setMessage((error as Error).message); setFailed(true); } finally { setBusy(false); }
  }
  const run = detail?.runs.find(item => item.id === reportId);
  const profile = run ? ('after' in run.result ? run.result.after : run.result) : null;
  const before = run && 'before' in run.result ? run.result.before : null;
  function exportReport() {
    if (!run) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'quality-report.json'; link.click(); URL.revokeObjectURL(url);
  }
  const visibleAssets = assets.filter(asset => `${asset.name} ${asset.filename}`.toLowerCase().includes(query.toLowerCase()));
  const selectableVersions = detail?.versions.filter(item => mode !== 'assessment' || Boolean(item.parent_id)) ?? [];
  const runs = detail?.runs.filter(item => mode === 'assessment' || mode === 'history' ? item.kind === 'assessment' : mode === 'clean' ? item.kind === 'clean' : true) ?? [];
  return <article className={`white-panel reuse-list-panel real-data-workbench integrated-data-panel${mode === 'assessment' ? ' assessment-workbench' : ''}`}>
    <header className="reuse-panel-head"><div><h2>{scopeProjectId && mode === 'clean' ? '数据清洗处理' : titles[mode]}</h2><p>{mode === 'files' ? '上传本地结构化数据集，保存原始数据版本' : mode === 'clean' ? '选择数据版本和清洗规则，处理结果保存为新版本' : mode === 'history' ? '查看已保存的评估结果与报告' : mode === 'assessment' ? '选择数据与规则，开始评估' : '查看数据资产、版本和实际处理结果'}</p></div>{mode !== 'files' && <button className="reuse-secondary" disabled={busy || loading} onClick={async () => { setBusy(true); setFailed(false); try { await loadAssets(); setMessage('资产列表已更新'); } catch (error) { setMessage((error as Error).message); setFailed(true); } finally { setBusy(false); } }}>刷新</button>}</header>
    {mode === 'files' && <><p>支持 CSV / JSON / JSONL，单文件不超过 1 MiB、5000 行、100 个字段。</p><div className="real-data-controls"><label>数据集名称<input aria-label="数据集名称" value={name} maxLength={120} onChange={event => setName(event.target.value)} placeholder="留空使用文件名" /></label><label>导入文件<input type="file" aria-label="数据文件" accept=".csv,.json,.jsonl" disabled={busy} onChange={event => setFile(event.target.files?.[0] ?? null)} /></label><button className="reuse-primary" disabled={busy || !file} onClick={() => execute('import')}>导入文件</button></div></>}
    {mode === 'files' && <p className={`data-notice${failed ? ' is-error' : ''}`} role={failed ? 'alert' : 'status'}>{busy ? '正在导入文件…' : message || '请选择本地数据集文件后导入。'}</p>}
    {mode !== 'files' && <>
    {(mode === 'assets' || mode === 'inventory') && <><div className="real-data-controls"><label>搜索资产<input aria-label="搜索数据资产" value={query} onChange={event => setQuery(event.target.value)} placeholder="数据集名称或文件名" /></label>{onNavigate && <button className="reuse-primary" onClick={() => onNavigate('本地数据管理')}>导入数据</button>}</div><div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>数据集名称</th><th>来源</th><th>版本数</th><th>操作</th></tr></thead><tbody>{visibleAssets.map(asset => <tr key={asset.id} className={selected === asset.id ? 'data-selected-row' : ''}><td>{asset.name}</td><td>{asset.filename}</td><td>{asset.versions}</td><td><button className="reuse-link" disabled={busy} onClick={() => select(asset.id)}>查看版本与画像</button></td></tr>)}{!visibleAssets.length && <tr><td className="data-empty" colSpan={4}>{loading ? '正在加载数据资产…' : query ? '没有匹配的数据资产' : '暂无数据资产，请先导入文件。'}</td></tr>}</tbody></table></div></>}
    <div className="real-data-controls"><label>数据资产<select aria-label="数据资产" value={selected} disabled={busy || loading} onChange={event => select(event.target.value)}><option value="">{assets.length ? '请选择数据资产' : '暂无数据资产'}</option>{assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label><label>{mode === 'assessment' ? '治理后版本' : '输入版本'}<select aria-label="数据输入版本" value={version} disabled={busy || !detail || !selectableVersions.length} onChange={event => { setVersion(event.target.value); setDocument(undefined); setEvidence({}); setReportId(''); }}>{!detail && <option value="">请先选择资产</option>}{detail && !selectableVersions.length && <option value="">暂无治理后版本</option>}{selectableVersions.map(item => <option key={item.id} value={item.id}>v{item.version}{item.parent_id ? ' · 治理结果' : ' · 原始数据'}</option>)}</select></label>{(mode === 'profile' || mode === 'inventory') && <button className="reuse-primary" disabled={busy || !version} onClick={() => execute('profile')}>{mode === 'inventory' ? '执行盘点' : '执行探查'}</button>}{mode === 'assessment' && <button ref={pickerTrigger} className="reuse-secondary" disabled={busy} onClick={() => setPickerOpen(true)}>规则库</button>}{mode === 'assessment' && <button className="reuse-primary" disabled={busy || !version || !selectedRules.length || (needsDocument && !assessmentDocument) || Boolean(reportId)} onClick={() => execute('assessment')}>开始评估（{selectedRules.length}）</button>}{version && mode !== 'assessment' && <a className="reuse-link" href={`/api/datasets?id=${encodeURIComponent(selected)}&version=${encodeURIComponent(version)}`}>下载所选版本 CSV</a>}</div>
    {mode === 'assessment' && detail && !selectableVersions.length && <p className="data-notice" role="status">该数据集尚未生成治理结果，请先在高质量数据治理中完成清洗。</p>}
    {mode === 'assets' && detail?.asset.owner_id === userId && <div className="real-data-controls"><label>资产共享范围<select aria-label="资产共享范围" value={projectId} disabled={busy} onChange={event => setProjectId(event.target.value)}><option value="">仅自己（私有）</option>{projects.filter(project => project.permission === 'owner').map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><button className="reuse-secondary" disabled={busy} onClick={share}>保存共享范围</button><span>成员与权限在治理项目管理中设置</span></div>}
    {mode === 'clean' && readOnly && <p>当前为只读权限，可查看项目数据与清洗记录；执行清洗需要项目编辑权限和平台治理权限。</p>}
    {mode === 'clean' && <div className="real-data-controls">{([{ key: 'trim', label: '清理首尾空格' }, { key: 'deduplicate', label: '删除重复记录' }, { key: 'maskSensitive', label: '手机号 / 邮箱脱敏' }] as const).map(item => <label className="data-checkbox" key={item.key}><input type="checkbox" checked={rules[item.key]} disabled={busy || readOnly} onChange={event => setRules(current => ({ ...current, [item.key]: event.target.checked }))} />{item.label}</label>)}<button className="reuse-primary" disabled={busy || !version || readOnly} onClick={() => execute('clean')}>执行清洗</button><span>原始版本保留，处理后生成新版本</span></div>}
    {(mode !== 'assessment' || loading || busy || message || !assets.length) && <p className={`data-notice${failed ? ' is-error' : ''}`} role={failed ? 'alert' : 'status'}>{loading ? '正在加载数据…' : busy ? '正在处理…' : message || (assets.length ? '选择数据资产和版本查看结果' : scopeProjectId ? '项目暂无数据，请在项目数据资产中关联已有资产。' : '暂无数据，请在本地数据管理中导入文件。')}</p>}
    {detail && <details className={mode === 'assessment' ? 'assessment-data-details' : 'data-history-details'} open={mode !== 'assessment'}><summary>数据详情{runs.length ? `与历史评估（${runs.length}）` : ''}</summary>{mode === 'assessment' && version && <a className="reuse-link" href={`/api/datasets?id=${encodeURIComponent(selected)}&version=${encodeURIComponent(version)}`}>下载 CSV</a>}{detail.source && <p>来源：{detail.source.databaseName} / {detail.source.schemaName}.{detail.source.tableName} · {detail.source.isSample ? "样本导入" : "全表导入"} · {detail.source.rowCount} 行</p>}
    {detail && (mode !== 'assessment' || runs.length > 0) && <label>运行记录<select aria-label="数据质量运行历史" value={reportId} onChange={event => setReportId(event.target.value)}><option value="">{runs.length ? '请选择运行记录' : '暂无运行记录'}</option>{runs.map(item => <option key={item.id} value={item.id}>{({ import: '导入画像', profile: '数据探查', clean: '数据清洗', assessment: '质量评估' } as Record<string, string>)[item.kind]} · {new Date(item.created_at).toLocaleString('zh-CN')}</option>)}</select></label>}
    </details>}
    {mode === 'assessment' && needsDocument && !reportId && <div className="assessment-document-input"><label>数据集说明文档<input type="file" aria-label="数据集说明文档" accept=".txt,.md,.json" disabled={busy} onChange={async event => { const source = event.target.files?.[0]; setDocument(undefined); if (!source) return; setBusy(true); setFailed(false); try { if (source.size > 512 * 1024) throw new Error('说明文档不能超过 512 KiB'); const text = new TextDecoder('utf-8', { fatal: true }).decode(await source.arrayBuffer()); setDocument(validateAssessmentDocument({ filename: source.name, text })); setMessage('说明文档已读取，执行后将自动检查所选文档规则。'); } catch (error) { setMessage((error as Error).message); setFailed(true); } finally { setBusy(false); } }} /></label><p>{assessmentDocument ? `已读取：${assessmentDocument.filename}` : '请选择说明文档，平台自动读取内容，无需填写 A、B。'} 支持 UTF-8 TXT、Markdown、JSON，最多 512 KiB。JSON 使用检查项名称作为键；文本可使用“数据集规模：1000 条”等格式，或标题后填写正文。</p>{assessmentDocument && <button className="reuse-link" disabled={busy} onClick={() => setDocument(undefined)}>移除说明文档</button>}</div>}
    {(mode === 'assessment' || mode === 'history') && !(run && 'after' in run.result && run.result.assessment) && <AssessmentRules selectedRules={selectedRules} onSelect={setSelectedRules} evidence={evidence} onChange={setEvidence} busy={busy} editable={mode === 'assessment'} />}
    {run && 'after' in run.result && run.result.assessment && <><AssessmentRules selectedRules={selectedRules} onSelect={setSelectedRules} evidence={evidence} onChange={setEvidence} busy={busy} editable={false} result={run.result.assessment} />{mode === 'assessment' && <button className="reuse-secondary" disabled={busy} onClick={() => { setDocument(run.rules?.document); setEvidence(run.rules?.evidence ?? {}); setSelectedRules(run.rules?.selectedRules ?? ('after' in run.result ? run.result.assessment?.results.filter(rule => rule.name !== '模型适配性').map(rule => rule.id) : undefined) ?? []); setReportId(''); }}>重新选择规则</button>}</>}
    {profile && <><div className="data-result-head"><h3>运行结果</h3><button className="reuse-secondary" onClick={exportReport}>导出报告</button></div><p>输入版本：v{detail?.versions.find(item => item.id === run?.input_id)?.version} {run?.output_id && `· 输出版本：v${detail?.versions.find(item => item.id === run.output_id)?.version}`}</p><div className="real-data-metrics"><span>记录数 <b>{profile.records}</b></span><span>完整率 <b>{profile.completeness}%</b></span><span>唯一率 <b>{profile.uniqueness}%</b></span><span>结构质量分 <b>{profile.score}</b></span><span>问题数 <b>{profile.issueCount}</b></span></div><p>{profile.formula}。此结果衡量结构完整性和记录唯一性。</p>{before && <p>处理前后：记录 {before.records} → {profile.records}；重复记录 {before.duplicates} → {profile.duplicates}；质量分 {before.score} → {profile.score}。</p>}{mode === 'profile' && <ProfileCharts key={run?.id} profile={profile} />}<h3>字段画像</h3><div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>字段</th><th>空值数量</th><th>唯一值数量</th></tr></thead><tbody>{profile.fields.map(field => <tr key={field.name}><td>{field.name}</td><td>{field.empty}</td><td>{field.unique}</td></tr>)}</tbody></table></div><h3>问题明细</h3><div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>输入数据行号</th><th>字段</th><th>问题</th></tr></thead><tbody>{profile.issues.map((issue, index) => <tr key={index}><td>{issue.row}</td><td>{issue.field}</td><td>{issue.rule}</td></tr>)}{!profile.issues.length && <tr><td colSpan={3} className="data-empty">未发现当前检查规则对应的问题</td></tr>}</tbody></table></div>{profile.issuesTruncated && <p>问题明细仅展示前 200 项，统计包含全部问题。</p>}</>}
    </>}
    {pickerOpen && <AssessmentRulePicker selectedRules={selectedRules} onDismiss={dismissPicker} onConfirm={ids => { setSelectedRules(ids); setReportId(''); dismissPicker(); }} />}
  </article>;
}
