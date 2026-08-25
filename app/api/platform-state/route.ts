import { canWriteModule, clearPlatformSnapshot, getSessionUser, loadPlatformSnapshot, savePlatformSnapshot } from "@/db/platform-store";

const allowedModules = new Set(["home", "inventory", "governance", "assessment", "modelDev", "modelEval", "admin"]);

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "未登录" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return Response.json({ snapshot: await loadPlatformSnapshot() }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });
  if (request.headers.get("x-platform-request") !== "1") return Response.json({ error: "请求来源无效" }, { status: 403 });
  const moduleId = request.headers.get("x-platform-module") || "home";
  if (!allowedModules.has(moduleId)) return Response.json({ error: "未知业务模块" }, { status: 400 });
  if (!(await canWriteModule(user, moduleId))) return Response.json({ error: "当前账号只有只读权限" }, { status: 403 });

  let snapshot: unknown;
  try {
    snapshot = await request.json();
  } catch {
    return Response.json({ error: "业务快照格式无效" }, { status: 400 });
  }
  if (!snapshot || typeof snapshot !== "object" || !("data" in snapshot)) {
    return Response.json({ error: "业务快照缺少数据" }, { status: 400 });
  }
  await savePlatformSnapshot(snapshot, user);
  return Response.json({ ok: true, savedAt: new Date().toISOString() });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });
  if (request.headers.get("x-platform-request") !== "1") return Response.json({ error: "请求来源无效" }, { status: 403 });
  if (!(await canWriteModule(user, "admin"))) return Response.json({ error: "仅平台管理员可清除业务数据" }, { status: 403 });
  await clearPlatformSnapshot();
  return Response.json({ ok: true });
}
