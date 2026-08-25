import { getSessionUser } from "@/db/platform-store";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "未登录或会话已过期" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return Response.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
