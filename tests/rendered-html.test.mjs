import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the high-quality data assessment platform", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>高质量数据集评估平台<\/title>/i);
  assert.match(html, /高质量数据集评估演示/);
  assert.match(html, /智能数据盘点/);
  assert.match(html, /高质量数据治理/);
  assert.match(html, /高质量数据集评估/);
  assert.match(html, /可用不可见模型开发/);
  assert.match(html, /大模型能力评测/);
  assert.match(html, /篮球高质量数据集1/);
  assert.match(html, /唯一数据量/);
  assert.match(html, /检查执行次数/);
});

test("keeps production metadata and core interactions in source", async () => {
  const [page, layout, css, workflow] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../docs/平台操作流程与功能补全清单.md", import.meta.url), "utf8"),
  ]);

  assert.match(page, /^"use client";/);
  assert.match(page, /from "lucide-react"/);
  assert.match(page, /function UiIcon/);
  assert.match(page, /function animateButtonPress/);
  assert.match(page, /120 \+ Math\.floor\(Math\.random\(\) \* 71\)/);
  assert.match(page, /prefers-reduced-motion: reduce/);
  assert.match(page, /function ProjectToolbar/);
  assert.match(page, /function DataExploration/);
  assert.match(page, /function LocalDataManager/);
  assert.match(page, /function SmartInventory/);
  assert.match(page, /function SmartCleaning/);
  assert.match(page, /function testDraftConnection/);
  assert.match(page, /function testSource/);
  assert.match(page, /function syncSource/);
  assert.match(page, /function saveSourceConfiguration/);
  assert.match(page, /进入数据探查/);
  assert.match(page, /function GovernanceWorkbench/);
  assert.match(page, /workbenchNodeProfiles/);
  assert.match(page, /kind: "annotation"/);
  assert.match(page, /标注任务配置/);
  assert.match(page, /AI 预标注/);
  assert.match(page, /双人复核/);
  assert.match(page, /打开标注工作台/);
  assert.match(page, /function GovernanceAlgorithms/);
  assert.match(page, /function GovernanceMarketplace/);
  assert.match(page, /高质量数据治理工作间/);
  assert.match(page, /治理算法管理/);
  assert.match(page, /治理算法市场/);
  assert.match(page, /enterWorkspace/);
  assert.match(page, /function AssessmentPage/);
  assert.match(page, /function ModelDevelopment/);
  assert.match(page, /function ModelEvaluation/);
  assert.match(page, /setLoggedIn\(false\)/);
  assert.match(layout, /title: "高质量数据集评估平台"/);
  assert.match(layout, /\/og\.png/);
  assert.match(css, /\.icon-rail/);
  assert.match(css, /\.reuse-topbar/);
  assert.match(css, /\.original-dashboard/);
  assert.match(css, /\.inventory-workspace/);
  assert.match(css, /\.exploration-grid/);
  assert.match(css, /\.local-dropzone/);
  assert.match(css, /\.domain-grid/);
  assert.match(css, /\.cleaning-grid/);
  assert.match(css, /\.governance-workbench/);
  assert.match(css, /\.flow-canvas/);
  assert.match(css, /\.node-inspector/);
  assert.match(css, /\.annotation-label-section/);
  assert.match(css, /\.annotation-review-queue/);
  assert.match(css, /\.source-sync-state/);
  assert.match(css, /\.connection-config-summary/);
  assert.match(css, /\.workbench-run-log/);
  assert.match(css, /\.governance-algorithm-panel/);
  assert.match(css, /\.market-card-grid/);
  assert.match(css, /\.algorithm-detail-drawer/);
  assert.match(css, /\.ui-icon/);
  assert.match(workflow, /数据接入/);
  assert.match(workflow, /数据探查与盘点/);
  assert.match(workflow, /模型能力评测与交付/);
  assert.match(workflow, /数据接入闭环/);
  assert.doesNotMatch(page, /sites-skeleton|codex-preview/);
});
