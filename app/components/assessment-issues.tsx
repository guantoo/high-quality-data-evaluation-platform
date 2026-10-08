'use client';
import { useEffect, useRef, useState } from 'react';
import type { AssessmentFinding } from '@/lib/assessment-issues';
type Issue = AssessmentFinding & { status:string; assignee:string; closureNote:string; editable:boolean };
export default function AssessmentIssues() {
  const [page,setPage]=useState(1); const [revision,setRevision]=useState(0);
  const [data,setData]=useState<{ issues:Issue[]; totalRuns:number; pageSize:number; canWrite:boolean }|null>(null);
  const [error,setError]=useState(''); const [filter,setFilter]=useState('全部状态');
  const [editing,setEditing]=useState<Issue|null>(null); const [assignee,setAssignee]=useState(''); const [note,setNote]=useState(''); const [saving,setSaving]=useState(false);
  const assigneeInput=useRef<HTMLInputElement>(null);
  useEffect(()=>{ if(editing)assigneeInput.current?.focus(); },[editing]);
  useEffect(()=>{
    const controller=new AbortController();
    fetch(`/api/assessment-issues?page=${page}`,{cache:'no-store',signal:controller.signal}).then(async response=>{
      const result=await response.json(); if(!response.ok)throw new Error(result.error); if(!controller.signal.aborted)setData(result);
    }).catch(reason=>{if(!controller.signal.aborted)setError(reason.message);});
    return ()=>controller.abort();
  },[page,revision]);
  function reload(next=page){setData(null);setError('');setPage(next);setRevision(value=>value+1);}
  async function save(event:React.FormEvent){
    event.preventDefault();if(!editing)return;setSaving(true);setError('');
    try {const response=await fetch('/api/assessment-issues',{method:'PATCH',headers:{'Content-Type':'application/json','x-platform-request':'1'},body:JSON.stringify({id:editing.id,status:editing.status,assignee,note})});const result=await response.json();if(!response.ok)throw new Error(result.error);setEditing(null);reload();}
    catch(reason){setError((reason as Error).message);}finally{setSaving(false);}
  }
  const rows=data?.issues.filter(issue=>filter==='全部状态'||issue.status===filter)??[];
  const nextLabel:Record<string,string>={'待处理':'分派整改','已分派':'提交复核','待复核':'记录复核并关闭'};
  return <article className="white-panel reuse-list-panel real-data-workbench integrated-data-panel assessment-issue-panel" aria-busy={!data&&!error}>
    <header className="reuse-panel-head"><div><h2>历史问题闭环</h2><p>来自已保存的实际评估结果；问题保留资产、输入版本、运行时间和证据来源。</p></div><div className="assessment-issue-tools"><label>状态筛选<select aria-label="问题状态筛选" value={filter} onChange={event=>setFilter(event.target.value)}><option>全部状态</option><option>待处理</option><option>已分派</option><option>待复核</option><option>已关闭</option></select></label><button className="reuse-secondary" onClick={()=>reload()} disabled={!data&&!error}>刷新</button></div></header>
    <p className="assessment-issue-note">规则库未定义统一风险等级或通过阈值，以下为待核查项。关闭问题仅保存人工复核记录，不代表重新评估通过。</p>
    {error&&<p role="alert" className="assessment-issue-error">{error}</p>}
    {!data&&!error?<p role="status" className="data-empty">正在加载实际评估问题…</p>:data&&<><p>已保存评估 {data.totalRuns} 次 · 当前页涵盖最多 {data.pageSize} 次评估 · 显示 {rows.length} 条问题</p><div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>资产 / 评估来源</th><th>评估规则</th><th>问题描述</th><th>责任人</th><th>状态</th><th>处理记录</th><th>操作</th></tr></thead><tbody>{rows.map(issue=><tr key={issue.id}><td><strong>{issue.assetName}</strong><small>v{issue.version} · {new Date(issue.createdAt).toLocaleString('zh-CN')}</small><small>{issue.filename}</small><details><summary>评估来源</summary><p>评估编号：{issue.runId}</p><p>方法：{issue.method}</p><p>A={issue.numerator} / B={issue.denominator}</p>{issue.note&&<p>证据来源：{issue.note}</p>}</details></td><td>{issue.rule}<small>{issue.kind}</small></td><td>{issue.problem}</td><td>{issue.assignee||'未分派'}</td><td>{issue.status}</td><td>{issue.closureNote||'暂无处理记录'}</td><td><button className="reuse-link" disabled={saving||!data.canWrite||!issue.editable||issue.status==='已关闭'} onClick={()=>{setEditing(issue);setAssignee(issue.assignee);setNote('');setError('');}}>{nextLabel[issue.status]||'已闭环'}</button></td></tr>)}</tbody></table></div>{!rows.length&&<div className="assessment-issue-empty data-empty">{filter!=='全部状态'?'当前页没有匹配状态的问题。':data.totalRuns?'当前页评估未产生可核查的问题；缺少证据而未计算的指标不作为已检出问题。':'暂无实际评估问题。请在“评估执行”中使用业务数据执行并保存评估。'}</div>}<div className="assessment-issue-pagination"><button className="reuse-secondary" disabled={page<=1} onClick={()=>reload(page-1)}>上一页</button><span>第 {page} 页 / {Math.max(1,Math.ceil(data.totalRuns/data.pageSize))} 页</span><button className="reuse-secondary" disabled={page*data.pageSize>=data.totalRuns} onClick={()=>reload(page+1)}>下一页</button></div></>}
    {editing&&<form className="assessment-issue-editor" onSubmit={save}><h3>{nextLabel[editing.status]}</h3><p>{editing.assetName} · {editing.rule}</p><label>责任人<input ref={assigneeInput} value={assignee} onChange={event=>setAssignee(event.target.value)} required maxLength={120} disabled={saving}/></label><label>{editing.status==='待处理'?'整改要求':'处理说明与复核依据'}<textarea value={note} onChange={event=>setNote(event.target.value)} required maxLength={2000} rows={3} disabled={saving}/></label><div><button type="button" className="reuse-secondary" disabled={saving} onClick={()=>setEditing(null)}>取消</button><button type="submit" className="reuse-primary" disabled={saving}>{saving?'保存中…':'保存处理记录'}</button></div></form>}
  </article>;
}
