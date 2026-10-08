import { validateAssessmentDocument, inspectDocument } from '@/lib/assessment-document';
import { validateEvidence, validateSelectedRules } from '@/lib/assessment';
import { getSessionUser, canReadModule, canWriteModule } from '@/db/platform-store';
import { createDataset, getDataset, getVersion, listDatasets, runQuality } from '@/db/dataset-store';
import { canProcessProjectAsset } from '@/db/project-store';
import { parseDataset, exportCsv, maxFileBytes } from '@/lib/data-quality';

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: '未登录' }, { status: 401 });
  const readable = await Promise.all(['inventory', 'governance', 'assessment'].map(module => canReadModule(user, module)));
  if (!readable.some(Boolean)) return Response.json({ error: '无数据模块访问权限' }, { status: 403 });
  const query = new URL(request.url).searchParams; const id = query.get('id');
  if (!id) return Response.json({ assets: await listDatasets(user.id) }, { headers: { 'Cache-Control': 'no-store' } });
  if (query.get('version')) {
    const content = await getVersion(user.id, id, query.get('version')!);
    if (!content) return Response.json({ error: '数据版本不存在或无权访问' }, { status: 404 });
    return new Response(exportCsv(content), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="dataset.csv"', 'Cache-Control': 'no-store' } });
  }
  const detail = await getDataset(user.id, id);
  return detail ? Response.json(detail, { headers: { 'Cache-Control': 'no-store' } }) : Response.json({ error: '数据资产不存在或无权访问' }, { status: 404 });
}
export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: '未登录' }, { status: 401 });
  if (request.headers.get('x-platform-request') !== '1') return Response.json({ error: '请求来源无效' }, { status: 403 });
  // Bound the body before parsing, including chunked requests.
  const reader = request.body?.getReader(); if (!reader) return Response.json({ error: '请求为空' }, { status: 400 });
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const item = await reader.read(); if (item.done) break; size += item.value.byteLength;
    if (size > maxFileBytes * 2) { await reader.cancel(); return Response.json({ error: '请求超过大小限制' }, { status: 413 }); } chunks.push(item.value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(bytes)); } catch { return Response.json({ error: 'JSON 请求格式无效' }, { status: 400 }); }
  if (!payload || typeof payload !== 'object') return Response.json({ error: '请求格式无效' }, { status: 400 });
  const mode = payload.mode;
  if (!['import', 'profile', 'clean', 'assessment'].includes(mode)) return Response.json({ error: '操作类型无效' }, { status: 400 });
  const moduleId = mode === 'assessment' ? 'assessment' : mode === 'clean' && payload.projectId !== undefined ? 'governance' : 'inventory';
  if (!(await canWriteModule(user, moduleId))) return Response.json({ error: '当前账号无权执行此操作' }, { status: 403 });
  if (mode === 'import') {
    if (typeof payload.name !== 'string' || !payload.name.trim() || payload.name.length > 120 || typeof payload.filename !== 'string' || typeof payload.text !== 'string') return Response.json({ error: '请填写有效的数据集名称和文件' }, { status: 400 });
    let content;
    try { content = parseDataset(payload.filename, payload.text); } catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
    return Response.json({ id: await createDataset(user.id, payload.name.trim(), payload.filename, content) }, { status: 201 });
  }
  if (typeof payload.assetId !== 'string' || typeof payload.versionId !== 'string') return Response.json({ error: '请选择数据集和版本' }, { status: 400 });
  if (payload.projectId !== undefined && (typeof payload.projectId !== 'string' || !(await canProcessProjectAsset(user.id, payload.projectId, payload.assetId)))) return Response.json({ error: '资产不属于当前项目或无项目编辑权限' }, { status: 403 });
  if (mode === 'assessment') {
    const detail = await getDataset(user.id, payload.assetId);
    if (!detail) return Response.json({ error: '数据资产不存在或无权访问' }, { status: 404 });
    if (!detail.versions.some(version => version.id === payload.versionId && Boolean(version.parent_id))) return Response.json({ error: '请选择治理后生成的数据版本进行评估' }, { status: 400 });
  }
  const rules = payload.rules ?? { trim: true, deduplicate: true, maskSensitive: false };
  if (!rules || ['trim', 'deduplicate', 'maskSensitive'].some(key => typeof rules[key] !== 'boolean')) return Response.json({ error: '清洗规则无效' }, { status: 400 });
  let evidence; let selectedRules; let document;
  try { document = mode === 'assessment' ? validateAssessmentDocument(payload.document) : undefined; if (document) inspectDocument('基本信息完整性', document); if (mode === 'assessment' && payload.evidence !== undefined && (!payload.evidence || typeof payload.evidence !== 'object' || Array.isArray(payload.evidence))) throw new Error('评估证据格式无效'); selectedRules = mode === 'assessment' ? validateSelectedRules(payload.selectedRules) : undefined; evidence = mode === 'assessment' ? validateEvidence(Object.fromEntries(Object.entries(payload.evidence ?? {}).filter(([id]) => selectedRules!.includes(id)))) : {}; } catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
  const result = await runQuality(user.id, payload.assetId, payload.versionId, mode, rules, evidence, selectedRules, document);
  return result ? Response.json(result) : Response.json({ error: '数据版本不存在或无权访问' }, { status: 404 });
}
