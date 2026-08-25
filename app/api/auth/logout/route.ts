import { destroySession, expiredSessionCookie } from "@/db/platform-store";

export async function POST(request: Request) {
  await destroySession(request);
  return Response.json({ ok: true }, { headers: { "Set-Cookie": expiredSessionCookie(request), "Cache-Control": "no-store" } });
}
