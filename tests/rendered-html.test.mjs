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
  const [page, layout, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /^"use client";/);
  assert.match(page, /function ProjectToolbar/);
  assert.match(page, /function AssessmentPage/);
  assert.match(page, /function ModelDevelopment/);
  assert.match(page, /function ModelEvaluation/);
  assert.match(page, /setLoggedIn\(false\)/);
  assert.match(layout, /title: "高质量数据集评估平台"/);
  assert.match(layout, /\/og\.png/);
  assert.match(css, /\.icon-rail/);
  assert.match(css, /\.reuse-topbar/);
  assert.match(css, /\.original-dashboard/);
  assert.doesNotMatch(page, /sites-skeleton|codex-preview/);
});
