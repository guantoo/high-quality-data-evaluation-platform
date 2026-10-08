import { databaseStatus, getSessionUser } from '@/db/platform-store';
export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: '未登录' }, { status: 401 });
  if (user.roleId !== 'role-admin') return Response.json({ error: '仅管理员可查看数据库审计' }, { status: 403 });
  return Response.json(await databaseStatus(), { headers: { 'Cache-Control': 'no-store' } });
}
