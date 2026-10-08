import { env } from 'cloudflare:workers';
import { getSessionUser, canWriteModule } from '@/db/platform-store';
import { readProjectWorkflow, canProcessProjectAsset } from '@/db/project-store';
import { getDataset, getVersion, saveGovernanceResult } from '@/db/dataset-store';
import { parseDataset } from '@/lib/data-quality';

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: '未登录' }, { status: 401 });
  if (request.headers.get('x-platform-request') !== '1' || !await canWriteModule(user, 'governance')) return Response.json({ error: '无运行权限' }, { status: 403 });
  try {
    const reader = request.body?.getReader(); if (!reader) throw new Error('请求为空');
    let size = 0; const chunks: Uint8Array[] = [];
    while (true) { const item = await reader.read(); if (item.done) break; size += item.value.length; if (size > 12 * 1024 * 1024) { await reader.cancel(); throw new Error('运行请求超过 12 MiB'); } chunks.push(item.value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof payload.projectId !== 'string') throw new Error('请选择数据治理项目');
    const project = await readProjectWorkflow(user.id, payload.projectId);
    if (!project || project.permission === 'viewer') return Response.json({ error: '无项目执行权限' }, { status: 403 });
    const workspace = payload.workspace;
    if (!workspace || !Array.isArray(workspace.nodes) || workspace.nodes.length > 200 || !Array.isArray(workspace.edges)) throw new Error('流程配置无效');
    const sources: Record<string, unknown> = Object.create(null);
    const origins: Record<string, { assetId: string; versionId: string }> = Object.create(null);
    for (const node of workspace.nodes.filter((item: { kind: string; placed?: boolean }) => item.kind === 'dataset' && item.placed !== false)) {
      if (typeof node.id !== 'string') throw new Error('节点 ID 无效');
      if (node.id.startsWith('asset-')) {
        const assetId = node.id.slice(6);
        if (!await canProcessProjectAsset(user.id, payload.projectId, assetId)) return Response.json({ error: '数据资产不属于项目或无执行权限' }, { status: 403 });
        const detail = await getDataset(user.id, assetId); const versionId = workspace.nodeConfigs?.[node.id]?.parameters?.versionId || detail?.versions[0]?.id;
        const table = versionId ? await getVersion(user.id, assetId, String(versionId)) : null;
        if (!table) throw new Error('输入版本不存在');
        sources[node.id] = { table }; origins[node.id] = { assetId, versionId: String(versionId) };
      } else {
        const files = workspace.mediaAssets?.[node.id] ?? [];
        if (!Array.isArray(files) || files.length > 20) throw new Error('单个接入节点最多 20 个文件');
        if (node.templateId === 'table-input') {
          if (files.length !== 1 || typeof files[0].url !== 'string' || !/^data:[^,]*;base64,/.test(files[0].url)) throw new Error('结构化文件接入需上传一个 CSV、JSON 或 JSONL 文件');
          const raw = atob(files[0].url.split(',')[1]);
          sources[node.id] = { table: parseDataset(files[0].name, new TextDecoder().decode(Uint8Array.from(raw, char => char.charCodeAt(0)))) };
        } else sources[node.id] = { files };
      }
    }
    if (!env.DB_CONNECTOR_URL || !env.DB_CONNECTOR_TOKEN) throw new Error('执行服务未配置，请启动连接服务');
    const url = new URL(env.DB_CONNECTOR_URL);
    if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === '127.0.0.1'))) throw new Error('执行服务需使用 HTTPS 或本机地址');
    const response = await fetch(new URL('/v1/governance', url), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DB_CONNECTOR_TOKEN}` }, body: JSON.stringify({ workspace, sources, targetId: payload.targetId, annotations: payload.annotations }), signal: AbortSignal.timeout(180000) });
    const result = await response.json() as { error?: string; failedNodeId?: string; results: Array<{ id: string; status: string; outputId?: string }>; outputs: Record<string, { table?: import('@/lib/data-quality').DatasetContent; files?: unknown[] }> };
    if (!response.ok) throw new Error(result.error ?? '执行服务失败');
    // Only commit successful final table outputs. Never overwrite an input version.
    if (!result.failedNodeId) for (const node of workspace.nodes.filter((item: { templateId?: string }) => item.templateId === 'table-output')) {
      const output = result.outputs[node.id]; if (!output?.table) continue;
      let id = node.id; const seen = new Set();
      while (!origins[id] && !seen.has(id)) { seen.add(id); id = workspace.edges.find((edge: { to: string }) => edge.to === id)?.from; if (!id) break; }
      if (origins[id]) { const origin = origins[id]; const outputId = await saveGovernanceResult(user.id, origin.assetId, origin.versionId, output.table, result.results); const row = result.results.find(item => item.id === node.id); if (row) row.outputId = outputId; }
    }
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : '节点执行失败' }, { status: 400 }); }
}
