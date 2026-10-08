import { changedCollections, businessCollections, validateSnapshot, type BusinessSnapshot } from "@/db/business-model";
import { modulePermission, visiblePlatformSnapshot, canWriteModule, clearPlatformSnapshot, getSessionUser, loadPlatformSnapshot, savePlatformSnapshot } from "@/db/platform-store";

const allowedModules = new Set(["home", "inventory", "governance", "assessment", "modelDev", "modelEval", "admin"]);

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "未登录" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return Response.json({ snapshot: visiblePlatformSnapshot(await loadPlatformSnapshot() as BusinessSnapshot | null, user) }, { headers: { "Cache-Control": "no-store" } });
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
  try { validateSnapshot(snapshot); } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
  const previous = await loadPlatformSnapshot() as BusinessSnapshot | null;
  if (!previous && user.roleId !== "role-admin") return Response.json({ error: "请管理员先初始化平台数据" }, { status: 409 });
  if (previous && user.roleId !== "role-admin") {
    const visible = visiblePlatformSnapshot(previous, user)!;
    for (const [key, module] of Object.entries(businessCollections)) {
      if (modulePermission(user, module, previous) !== "无权限") continue;
      if (JSON.stringify(snapshot.data[key]) !== JSON.stringify(visible.data[key])) {
        return Response.json({ error: `无权修改数据集合：${key}` }, { status: 403 });
      }
      // Preserve server-only collections when saving a redacted browser snapshot.
      snapshot.data[key] = previous.data[key];
    }
    snapshot.data.activeRoleId = user.roleId;
    for (const key of changedCollections(previous, snapshot)) {
      // Client activity logs are informational; authoritative audit lives in the database.
      if (key === "auditLogs" || key === "messages") continue;
      if (!(await canWriteModule(user, businessCollections[key as keyof typeof businessCollections]))) {
        return Response.json({ error: `无权修改数据集合：${key}` }, { status: 403 });
      }
    }
  }
  const expected = request.headers.get("x-platform-base") || null;
  if ((previous?.savedAt ?? null) !== expected) return Response.json({ error: "数据已被其他操作更新，请刷新后重试" }, { status: 409 });
  try { await savePlatformSnapshot(snapshot, user, expected); } catch (error) {
    if (String(error).includes("CHECK constraint failed")) return Response.json({ error: "并发更新冲突，请刷新后重试" }, { status: 409 });
    throw error;
  }
  return Response.json({ ok: true, savedAt: new Date().toISOString() });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });
  if (request.headers.get("x-platform-request") !== "1") return Response.json({ error: "请求来源无效" }, { status: 403 });
  if (!(await canWriteModule(user, "admin"))) return Response.json({ error: "仅平台管理员可清除业务数据" }, { status: 403 });
  await clearPlatformSnapshot(user);
  return Response.json({ ok: true });
}
