import { getSessionUser, canReadModule, canWriteModule } from '@/db/platform-store';
import { listDataProjects, createDataProject, dataProjectMembers, updateDataMember, assignDataProject, readProjectWorkflow, saveProjectWorkflow } from '@/db/project-store';
export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: '未登录' }, { status: 401 });
  const readable = await Promise.all(['inventory', 'governance', 'assessment'].map(module => canReadModule(user, module)));
  if (!readable.some(Boolean)) return Response.json({ error: '无数据模块访问权限' }, { status: 403 });
  const query = new URL(request.url).searchParams;
  const id = query.get('id');
  if (id && query.get('workflow') === '1') {
    const workflow = await readProjectWorkflow(user.id, id);
    return workflow ? Response.json(workflow, { headers: { 'Cache-Control': 'no-store' } }) : Response.json({ error: '无项目访问权限' }, { status: 403 });
  }
  if (id) {
    const members = await dataProjectMembers(user.id, id);
    return members ? Response.json({ members }, { headers: { 'Cache-Control': 'no-store' } }) : Response.json({ error: '无权查看项目成员' }, { status: 403 });
  }
  return Response.json({ projects: await listDataProjects(user.id), userId: user.id }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: '未登录' }, { status: 401 });
  if (request.headers.get('x-platform-request') !== '1') return Response.json({ error: '请求来源无效' }, { status: 403 });
  if (!(await canWriteModule(user, 'governance'))) return Response.json({ error: '无项目管理权限' }, { status: 403 });
  let payload;
  try { const body = await request.text(); if (body.length > 1500000) return Response.json({ error: '请求过大' }, { status: 413 }); payload = JSON.parse(body); }
  catch { return Response.json({ error: '请求格式无效' }, { status: 400 }); }
  if (!payload || typeof payload !== 'object') return Response.json({ error: '请求格式无效' }, { status: 400 });
  if (payload.mode === 'workflow') {
    const workspace = payload.workspace;
    if (typeof payload.projectId !== 'string' || !workspace || !Array.isArray(workspace.nodes) || !Array.isArray(workspace.edges) || workspace.nodes.length > 200 || workspace.edges.length > 400 || workspace.nodes.some((node: { id?: unknown; label?: unknown; kind?: unknown; position?: { left?: unknown; top?: unknown } }) => !node || typeof node.id !== 'string' || typeof node.label !== 'string' || !['dataset', 'recipe', 'annotation', 'output'].includes(String(node.kind)) || !Number.isFinite(node.position?.left) || !Number.isFinite(node.position?.top)) || workspace.edges.some((edge: { id?: unknown; from?: unknown; to?: unknown }) => !edge || typeof edge.id !== 'string' || typeof edge.from !== 'string' || typeof edge.to !== 'string')) return Response.json({ error: '流程配置无效' }, { status: 400 });
    const ok = await saveProjectWorkflow(user.id, payload.projectId, workspace);
    return ok ? Response.json({ ok: true }) : Response.json({ error: '无项目编辑权限' }, { status: 403 });
  }
  if (payload.mode === 'create') {
    if (typeof payload.name !== 'string' || !payload.name.trim() || payload.name.length > 120) return Response.json({ error: '项目名称无效' }, { status: 400 });
    return Response.json({ id: await createDataProject(user.id, payload.name.trim()) }, { status: 201 });
  }
  if (payload.mode === 'member') {
    if (typeof payload.projectId !== 'string' || typeof payload.username !== 'string' || !['viewer', 'editor', 'remove'].includes(payload.permission)) return Response.json({ error: '成员配置无效' }, { status: 400 });
    const result = await updateDataMember(user.id, payload.projectId, payload.username.trim(), payload.permission);
    return Response.json(result, { status: result.status ?? 200 });
  }
  if (payload.mode === 'assign') {
    if (typeof payload.assetId !== 'string' || (payload.projectId !== null && typeof payload.projectId !== 'string')) return Response.json({ error: '资产配置无效' }, { status: 400 });
    const ok = await assignDataProject(user.id, payload.assetId, payload.projectId);
    return ok ? Response.json({ ok }) : Response.json({ error: '仅资产和项目所有者可设置共享范围' }, { status: 403 });
  }
  return Response.json({ error: '未知操作' }, { status: 400 });
}
