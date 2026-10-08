import { getSessionUser, canReadModule } from '@/db/platform-store';
import { getDashboard } from '@/db/dashboard-store';
import type { DashboardPeriod } from '@/lib/dashboard';

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: '未登录' }, { status: 401 });
  const readable = await Promise.all(['inventory', 'governance', 'assessment'].map(module => canReadModule(user, module)));
  if (!readable.some(Boolean)) return Response.json({ error: '无数据模块访问权限' }, { status: 403 });
  const period = new URL(request.url).searchParams.get('period') ?? '30d';
  if (!['7d', '30d', 'quarter'].includes(period)) return Response.json({ error: '统计周期无效' }, { status: 400 });
  try {
    return Response.json(await getDashboard(user.id, period as DashboardPeriod, readable[0]), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: '首页数据加载失败，请稍后重试' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
