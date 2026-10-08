import { getSessionUser, canReadModule, canWriteModule } from '@/db/platform-store';
import { listAssessmentIssues, updateAssessmentIssue } from '@/db/assessment-issue-store';
export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error:'未登录' },{ status:401 });
  if (!(await canReadModule(user,'assessment'))) return Response.json({ error:'无评估查看权限' },{ status:403 });
  const page = Number(new URL(request.url).searchParams.get('page') ?? 1);
  if (!Number.isInteger(page) || page<1 || page>10000) return Response.json({ error:'页码无效' },{ status:400 });
  try { return Response.json({ ...await listAssessmentIssues(user.id,page), canWrite:await canWriteModule(user,'assessment') },{ headers:{ 'Cache-Control':'no-store' } }); }
  catch { return Response.json({ error:'评估问题加载失败，请重试' },{ status:500 }); }
}
export async function PATCH(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error:'未登录' },{ status:401 });
  if (request.headers.get('x-platform-request')!=='1' || !(await canWriteModule(user,'assessment'))) return Response.json({ error:'无问题处理权限' },{ status:403 });
  const text = await request.text();
  if (text.length>8192) return Response.json({ error:'处理记录过长' },{ status:413 });
  let body;
  try { body=JSON.parse(text); } catch { return Response.json({ error:'请求格式无效' },{ status:400 }); }
  if (!body || typeof body.id!=='string' || body.id.length>150 || typeof body.status!=='string' || typeof body.assignee!=='string' || body.assignee.length>120 || typeof body.note!=='string' || body.note.length>2000) return Response.json({ error:'问题处理信息无效' },{ status:400 });
  try { const result=await updateAssessmentIssue(user.id,body.id,body.status,body.assignee,body.note); return Response.json(result,{ status:'status' in result ? result.status : 200 }); }
  catch { return Response.json({ error:'处理记录保存失败，请刷新检查状态' },{ status:500 }); }
}
