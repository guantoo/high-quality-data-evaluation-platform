import { authenticateUser, createSession, sessionCookie } from "@/db/platform-store";

export async function POST(request: Request) {
  let payload: { username?: string; password?: string; captcha?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "请求格式无效" }, { status: 400 });
  }

  const username = payload.username?.trim() || "";
  if (!username || !payload.password || !payload.captcha) {
    return Response.json({ error: "请完整填写账号、密码和验证码" }, { status: 400 });
  }
  if (payload.captcha.trim() !== "8") {
    return Response.json({ error: "验证码错误，请重新输入" }, { status: 400 });
  }

  const user = await authenticateUser(username, payload.password);
  if (!user) return Response.json({ error: "账号或密码错误" }, { status: 401 });

  const token = await createSession(user.id);
  return Response.json({ user }, { headers: { "Set-Cookie": sessionCookie(request, token), "Cache-Control": "no-store" } });
}
