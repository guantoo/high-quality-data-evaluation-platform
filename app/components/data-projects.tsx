"use client";
import { useEffect, useState, type ReactNode } from 'react';
type Project = { id: string; name: string; permission: 'owner' | 'viewer' | 'editor' };
type Member = { user_id: string; username: string; displayName: string; permission: 'viewer' | 'editor' };
type Asset = { id: string; name: string; owner_id: string; project_id: string | null; versions: number };
async function request(url: string, payload?: unknown) {
  const response = await fetch(url, payload ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-platform-request': '1' }, body: JSON.stringify(payload) } : { cache: 'no-store' });
  const result = await response.json(); if (!response.ok) throw new Error(result.error ?? '请求失败'); return result;
}
export default function DataProjects({ renderWorkflow }: { renderWorkflow: (project: Project, assets: Asset[], onBack: () => void) => ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]); const [name, setName] = useState('');
  const [selected, setSelected] = useState(''); const [view, setView] = useState('数据资产');
  const [members, setMembers] = useState<Member[]>([]); const [assets, setAssets] = useState<Asset[]>([]);
  const [userId, setUserId] = useState(''); const [assetId, setAssetId] = useState('');
  const [username, setUsername] = useState(''); const [permission, setPermission] = useState('viewer');
  const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [failed, setFailed] = useState(false);
  const project = projects.find(item => item.id === selected);
  useEffect(() => { let cancelled = false; request('/api/data-projects').then(result => { if (!cancelled) { setProjects(result.projects); setUserId(result.userId); } }).catch(error => { if (!cancelled) { setMessage(error.message); setFailed(true); } }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, []);
  async function open(project: Project, nextView = '数据资产') {
    setSelected(project.id); setView(nextView); setMembers([]); setAssets([]); setAssetId(''); setMessage(''); setFailed(false); setBusy(true);
    try {
      const result = await request('/api/datasets'); setAssets(result.assets);
      if (nextView === '成员管理') setMembers((await request(`/api/data-projects?id=${encodeURIComponent(project.id)}`)).members);
    } catch (error) { setMessage((error as Error).message); setFailed(true); } finally { setBusy(false); }
  }
  async function act(payload: { mode: string; [key: string]: unknown }) {
    setBusy(true); setMessage(''); setFailed(false);
    try {
      const result = await request('/api/data-projects', payload);
      const list = await request('/api/data-projects'); setProjects(list.projects);
      if (result.id) { setSelected(result.id); setView('数据资产'); setName(''); setMembers([]); setAssets((await request('/api/datasets')).assets); }
      else if (payload.mode === 'member') { setMembers((await request(`/api/data-projects?id=${encodeURIComponent(selected)}`)).members); setUsername(''); }
      else { setAssets((await request('/api/datasets')).assets); setAssetId(''); }
      setMessage(payload.mode === 'create' ? '数据治理项目已创建，可关联数据资产并管理成员。' : payload.mode === 'member' ? '项目成员配置已保存。' : '项目数据资产已更新。');
    } catch (error) { setMessage((error as Error).message); setFailed(true); } finally { setBusy(false); }
  }
  const projectAssets = assets.filter(asset => asset.project_id === selected);
  return <section className={`white-panel reuse-list-panel integrated-data-panel governance-projects${project && view === '数据清洗处理' ? '' : ' real-data-workbench'}`}>
    <header className="reuse-panel-head"><div><h2>{project ? project.name : '数据治理项目管理'}</h2>{(!project || view !== '数据清洗处理') && <p>{project ? '管理项目数据与成员权限。' : '统一管理项目数据、成员与清洗流程。'}</p>}</div>{project && <button className="reuse-secondary" disabled={busy} onClick={() => { setSelected(''); setMessage(''); }}>返回项目列表</button>}</header>
    {!project ? <><div className="real-data-controls"><label>搜索项目<input value={search} onChange={event => setSearch(event.target.value)} placeholder="按项目名称搜索" /></label><label>项目名称<input aria-label="项目名称" value={name} maxLength={120} disabled={busy} onChange={event => setName(event.target.value)} /></label><button className="reuse-primary" disabled={busy || loading || !name.trim()} onClick={() => act({ mode: 'create', name })}>新建数据治理项目</button></div>
    <div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>项目名称</th><th>我的权限</th><th>操作</th></tr></thead><tbody>{projects.filter(item => item.name.toLowerCase().includes(search.toLowerCase())).map(item => <tr key={item.id}><td><button className="reuse-link" disabled={busy} onClick={() => open(item)}>{item.name}</button></td><td><span className="data-badge">{({ owner: '所有者', viewer: '只读', editor: '编辑' })[item.permission]}</span></td><td><div className="merged-project-actions"><button disabled={busy} className="reuse-link" onClick={() => open(item)}>数据资产</button><button disabled={busy} className="reuse-link" onClick={() => open(item, '数据清洗处理')}>数据清洗处理</button>{item.permission === 'owner' && <button disabled={busy} className="reuse-link" onClick={() => open(item, '成员管理')}>成员管理</button>}</div></td></tr>)}{!projects.some(item => item.name.toLowerCase().includes(search.toLowerCase())) && <tr><td colSpan={3} className="data-empty">{loading ? '正在读取项目…' : failed ? '项目读取失败，请刷新页面重试。' : search ? '没有匹配的项目' : '暂无数据治理项目，请先新建项目。'}</td></tr>}</tbody></table></div>
    </> : <>
    <div className="reuse-page-tabs" aria-label="数据治理项目操作">{['数据资产', '数据清洗处理', ...(project.permission === 'owner' ? ['成员管理'] : [])].map(item => <button key={item} disabled={busy} aria-pressed={view === item} className={view === item ? 'active' : ''} onClick={() => open(project, item)}>{item}</button>)}</div>
    {view === '数据资产' && <>{project.permission === 'owner' && <div className="real-data-controls"><label>关联已有数据资产<select value={assetId} disabled={busy} onChange={event => setAssetId(event.target.value)}><option value="">请选择未归入项目的自有资产</option>{assets.filter(asset => asset.owner_id === userId && !asset.project_id).map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label><button className="reuse-primary" disabled={busy || !assetId} onClick={() => act({ mode: 'assign', assetId, projectId: selected })}>关联到项目</button></div>}<div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>数据资产</th><th>版本数</th><th>操作</th></tr></thead><tbody>{projectAssets.map(asset => <tr key={asset.id}><td>{asset.name}</td><td>{asset.versions}</td><td><div className="merged-project-actions"><button disabled={busy} className="reuse-link" onClick={() => open(project, '数据清洗处理')}>查看与清洗</button>{project.permission === 'owner' && asset.owner_id === userId && <button disabled={busy} className="reuse-link" onClick={() => act({ mode: 'assign', assetId: asset.id, projectId: null })}>移出项目</button>}</div></td></tr>)}{!projectAssets.length && <tr><td colSpan={3} className="data-empty">{busy ? '正在读取项目资产…' : '暂无项目数据资产。项目所有者可关联已导入的自有资产。'}</td></tr>}</tbody></table></div></>}
    {view === '数据清洗处理' && !busy && renderWorkflow(project, projectAssets, () => setView('数据资产'))}
    {view === '成员管理' && project.permission === 'owner' && <><div className="real-data-controls"><label>已有账号<input aria-label="项目成员账号" value={username} disabled={busy} onChange={event => setUsername(event.target.value)} placeholder="例如 wangmin@local" /></label><label>访问级别<select value={permission} disabled={busy} onChange={event => setPermission(event.target.value)}><option value="viewer">只读</option><option value="editor">编辑</option></select></label><button className="reuse-primary" disabled={busy || !username.trim()} onClick={() => act({ mode: 'member', projectId: selected, username, permission })}>保存项目成员</button></div><p>只读成员查看项目数据与处理记录；编辑成员可执行清洗。执行操作还需满足平台治理模块权限。</p><div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>成员</th><th>账号</th><th>权限</th><th>操作</th></tr></thead><tbody>{members.map(member => <tr key={member.user_id}><td>{member.displayName}</td><td>{member.username}</td><td>{member.permission === 'editor' ? '编辑' : '只读'}</td><td><button className="reuse-link" disabled={busy} onClick={() => act({ mode: 'member', projectId: selected, username: member.username, permission: 'remove' })}>移除成员</button></td></tr>)}{!members.length && <tr><td colSpan={4} className="data-empty">{busy ? '正在读取成员…' : '暂无项目成员。'}</td></tr>}</tbody></table></div></>}
    </>}
    <p className={`data-notice${failed ? ' is-error' : ''}`} role={failed ? 'alert' : 'status'}>{busy ? '正在处理项目配置…' : message}</p>
  </section>;
}
