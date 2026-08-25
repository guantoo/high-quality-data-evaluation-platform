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

test("server-renders the authenticated platform entry", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>高质量数据集评估平台<\/title>/i);
  assert.match(html, /aria-label="账号"/);
  assert.match(html, /密码登录/);
  assert.match(html, /验证码/);
  assert.match(html, /正在验证登录状态/);
});

test("keeps production metadata and core interactions in source", async () => {
  const [page, layout, css, workflow, store, loginRoute, stateRoute, schema] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../docs/平台操作流程与功能补全清单.md", import.meta.url), "utf8"),
    readFile(new URL("../db/platform-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/login/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/platform-state/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /^"use client";/);
  assert.match(page, /from "lucide-react"/);
  assert.match(page, /function UiIcon/);
  assert.match(page, /function animateButtonPress/);
  assert.match(page, /function HomeDashboard/);
  assert.match(page, /function exportDashboard/);
  assert.match(page, /function resolveRisk/);
  assert.match(page, /高数据质量评估决策看板/);
  assert.match(page, /120 \+ Math\.floor\(Math\.random\(\) \* 71\)/);
  assert.match(page, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(page, /function ProjectToolbar/);
  assert.doesNotMatch(page, /aria-label="切换项目"/);
  assert.match(page, /function DataExploration/);
  assert.match(page, /type CleaningTaskRow/);
  assert.match(page, /function submitCleaningTask/);
  assert.match(page, /function createTaskFromExploration/);
  assert.match(page, /生成清洗任务/);
  assert.match(page, /问题样本/);
  assert.match(page, /function LocalDataManager/);
  assert.match(page, /type MultimodalPreviewKind/);
  assert.match(page, /function inferPreviewKind/);
  assert.match(page, /function MultimodalPreview/);
  assert.match(page, /多模态在线预览能力/);
  assert.match(page, /浏览器本地安全预览/);
  assert.match(page, /video src=.*controls/);
  assert.match(page, /audio src=.*controls/);
  assert.match(page, /PDF 预览/);
  assert.match(page, /parseDelimitedPreview/);
  assert.match(page, /压缩包文件清单/);
  assert.match(page, /function SmartInventory/);
  assert.match(page, /function SmartCleaning/);
  assert.match(page, /type CleaningVersionRow/);
  assert.match(page, /function nextCleaningVersion/);
  assert.match(page, /版本结果对比/);
  assert.match(page, /回滚到此版本/);
  assert.match(page, /function testDraftConnection/);
  assert.match(page, /function testSource/);
  assert.match(page, /function syncSource/);
  assert.match(page, /function saveSourceConfiguration/);
  assert.match(page, /进入数据探查/);
  assert.match(page, /function GovernanceWorkbench/);
  assert.match(page, /deleteProject: \(project: ProjectRow\) => void/);
  assert.match(page, /确认删除项目/);
  assert.match(page, /从数据资产开始搭建质量治理链路/);
  assert.match(page, /empty-flow-steps/);
  assert.doesNotMatch(page, /自动布局/);
  assert.doesNotMatch(page, /empty-inspector-guide/);
  assert.match(page, /workbenchNodeProfiles/);
  assert.match(page, /type WorkbenchEdge/);
  assert.match(page, /function getWorkbenchEdgeStyle/);
  assert.match(page, /function addWorkbenchNode/);
  assert.match(page, /function removeWorkbenchNode/);
  assert.match(page, /function startConnecting/);
  assert.match(page, /重试失败节点/);
  assert.match(page, /type GovernanceNodeConfig/);
  assert.match(page, /governanceRecipeProfiles/);
  assert.match(page, /function getGovernanceConfigIssues/);
  assert.match(page, /function updateSelectedRecipeConfig/);
  assert.match(page, /function validateSelectedNodeConfiguration/);
  assert.match(page, /数据治理节点配置/);
  assert.match(page, /异常数据策略/);
  assert.match(page, /保留处理轨迹/);
  assert.match(page, /nodeConfigs/);
  assert.match(css, /\.recipe-config-state/);
  assert.match(page, /kind: "annotation"/);
  assert.match(page, /标注任务配置/);
  assert.match(page, /AI 预标注/);
  assert.match(page, /双人复核/);
  assert.match(page, /打开标注工作台/);
  assert.match(page, /function applyAiPrelabel/);
  assert.match(page, /function saveAnnotationSample/);
  assert.match(page, /function toggleSelectedAnnotationVisibility/);
  assert.match(page, /type AnnotationAssignment/);
  assert.match(page, /function openAssignmentDialog/);
  assert.match(page, /function confirmAnnotationAssignments/);
  assert.match(page, /分派剩余标注任务/);
  assert.match(page, /hq-annotation-assignments:/);
  assert.match(page, /type WorkbenchMediaAsset/);
  assert.match(page, /function readFileAsDataUrl/);
  assert.match(page, /URL\.createObjectURL\(file\)/);
  assert.match(page, /datasetMediaAssets/);
  assert.match(page, /autoConnectImages/);
  assert.match(page, /existingLocalNode/);
  assert.match(page, /已更新.*的.*张图片/);
  assert.match(page, /mediaAssets: datasetMediaAssets/);
  assert.match(page, /自动将导入的图片数据集连接到当前节点/);
  assert.match(page, /currentAnnotationAsset/);
  assert.match(page, /从上游数据集读取/);
  assert.doesNotMatch(page, /const samples = \["basketball-/);
  assert.match(page, /hq-annotation-shapes/);
  assert.match(page, /标注快捷键/);
  assert.match(page, /function GovernanceAlgorithms/);
  assert.match(page, /function GovernanceMarketplace/);
  assert.match(page, /高质量数据治理工作间/);
  assert.match(page, /治理算法管理/);
  assert.match(page, /治理算法市场/);
  assert.match(page, /enterWorkspace/);
  assert.match(page, /function AssessmentPage/);
  assert.match(page, /function AssessmentHistoryPage/);
  assert.match(page, /assessmentHistoryRows/);
  assert.match(page, /高质量数据评估历史\.csv/);
  assert.match(page, /组件执行结果/);
  assert.match(page, /assessmentTaskProfiles/);
  assert.match(page, /function changeAssessmentMode/);
  assert.doesNotMatch(page, /\["语句文件", "数据产品", "自定义审查", "多模态审查"\]/);
  assert.match(page, /type AssessmentConfig/);
  assert.match(page, /type AssessmentIssue/);
  assert.match(page, /function saveAssessmentConfig/);
  assert.match(page, /function openAssessmentRule/);
  assert.match(page, /assessmentRuleProfiles/);
  assert.match(page, /function advanceAssessmentIssue/);
  assert.match(page, /function exportAssessmentReport/);
  assert.match(page, /问题样本处置/);
  assert.match(page, /function ModelDevelopment/);
  assert.match(page, /type ModelJobConfig/);
  assert.match(page, /type ModelVersionRow/);
  assert.match(page, /function nextModelVersion/);
  assert.match(page, /function saveModelJobConfig/);
  assert.match(page, /function registerModelVersion/);
  assert.match(page, /训练检查点/);
  assert.match(page, /function ModelEvaluation/);
  assert.match(page, /type EvaluationConfig/);
  assert.match(page, /function buildEvaluationResult/);
  assert.match(page, /function getEvaluationGateChecks/);
  assert.match(page, /function saveEvaluationConfig/);
  assert.match(page, /function exportEvaluationReport/);
  assert.match(page, /综合能力评测口径/);
  assert.match(page, /统计口径/);
  assert.match(page, /模型给出正确结果的比例/);
  assert.match(page, /抵御指令覆盖与提示词注入/);
  assert.match(page, /统计评测请求 P95 响应时间/);
  assert.match(page, /新建评测任务/);
  assert.match(page, /pageMode.*"list".*"detail"/);
  assert.match(page, /先创建评测任务并确定候选模型/);
  assert.match(page, /返回评测任务/);
  assert.match(page, /发布门禁自动关联/);
  assert.match(page, /发布门禁判定/);
  assert.match(page, /模型评测对比报告\.csv/);
  assert.match(page, /type PlatformMessage/);
  assert.match(page, /type AuditLogRow/);
  assert.match(page, /type PlatformRole/);
  assert.match(page, /type LocalPlatformSnapshot/);
  assert.match(page, /function PlatformManagement/);
  assert.match(page, /function updateRolePermission/);
  assert.match(page, /function exportLocalBackup/);
  assert.match(page, /function importLocalBackup/);
  assert.match(page, /function clearLocalBackup/);
  assert.match(page, /\/api\/platform-state/);
  assert.match(page, /permission-locked/);
  assert.match(page, /resolvedRisks/);
  assert.match(page, /高质量数据评估平台本地备份/);
  assert.match(page, /function handleLogin/);
  assert.match(page, /function handleLogout/);
  assert.match(store, /PBKDF2/);
  assert.match(store, /HttpOnly; SameSite=Strict/);
  assert.match(store, /platform_snapshots/);
  assert.match(loginRoute, /authenticateUser/);
  assert.match(stateRoute, /canWriteModule/);
  assert.match(stateRoute, /x-platform-request/);
  assert.match(schema, /platformUsers/);
  assert.match(schema, /platformSessions/);
  assert.match(schema, /platformSnapshots/);
  assert.match(layout, /title: "高质量数据集评估平台"/);
  assert.match(layout, /\/og\.png/);
  assert.match(css, /\.icon-rail/);
  assert.match(css, /\.reuse-topbar/);
  assert.match(css, /\.quality-decision-dashboard/);
  assert.match(css, /\.decision-kpi-strip/);
  assert.match(css, /\.decision-trend-chart/);
  assert.match(css, /\.decision-risk-list/);
  assert.match(css, /\.inventory-workspace/);
  assert.match(css, /\.exploration-grid/);
  assert.match(css, /\.exploration-issue-panel/);
  assert.match(css, /\.cleaning-task-context/);
  assert.match(css, /\.local-dropzone/);
  assert.match(css, /\.local-preview-capabilities/);
  assert.match(css, /\.multimodal-preview-dialog/);
  assert.match(css, /\.multimodal-preview-stage/);
  assert.match(css, /\.audio-waveform/);
  assert.match(css, /\.pdf-native-preview/);
  assert.match(css, /\.structured-preview/);
  assert.match(css, /\.domain-grid/);
  assert.match(css, /\.cleaning-grid/);
  assert.match(css, /\.cleaning-mode-tabs/);
  assert.match(css, /\.version-compare-summary/);
  assert.match(css, /\.version-rollback-dialog/);
  assert.match(css, /\.governance-workbench/);
  assert.match(css, /\.flow-canvas/);
  assert.match(css, /\.flow-canvas-empty/);
  assert.match(css, /\.empty-flow-steps/);
  assert.doesNotMatch(css, /\.empty-inspector-guide/);
  assert.match(css, /\.workbench-body\.empty-workbench/);
  assert.match(css, /\.node-inspector/);
  assert.match(css, /\.annotation-label-section/);
  assert.match(css, /\.annotation-review-queue/);
  assert.match(css, /\.annotation-workspace/);
  assert.match(css, /\.annotation-svg/);
  assert.match(css, /\.annotation-canvas:not\(\.has-source-image\)/);
  assert.match(css, /上游数据集未包含可预览图像/);
  assert.match(css, /\.annotation-sample-empty/);
  assert.match(css, /\.annotation-shortcuts/);
  assert.match(css, /\.annotation-assignment-dialog/);
  assert.match(css, /\.annotation-operator-list/);
  assert.match(css, /\.annotation-assignment-preview/);
  assert.match(css, /\.assessment-view-tabs/);
  assert.match(css, /\.assessment-history-page/);
  assert.match(css, /\.assessment-history-table/);
  assert.match(css, /\.assessment-history-drawer/);
  assert.match(css, /\.assessment-issue-workspace/);
  assert.match(css, /\.assessment-config-dialog/);
  assert.match(css, /\.assessment-create-mode/);
  assert.match(css, /\.assessment-rule-drawer/);
  assert.match(css, /\.assessment-rule-conditions/);
  assert.match(css, /\.model-job-workspace/);
  assert.match(css, /\.model-metric-bars/);
  assert.match(css, /\.model-version-workspace/);
  assert.match(css, /\.evaluation-standard-strip/);
  assert.match(css, /\.evaluation-metric-standard/);
  assert.match(css, /\.evaluation-metric-columns/);
  assert.match(css, /\.eval-metric-name/);
  assert.match(css, /\.evaluation-progress-strip/);
  assert.match(css, /\.gate-check-list/);
  assert.match(css, /\.evaluation-config-dialog/);
  assert.match(css, /\.evaluation-create-dialog/);
  assert.match(css, /\.evaluation-task-home/);
  assert.match(css, /\.evaluation-detail-nav/);
  assert.match(css, /\.admin-management-page/);
  assert.match(css, /\.global-message-list/);
  assert.match(css, /\.audit-detail-drawer/);
  assert.match(css, /\.permission-matrix/);
  assert.match(css, /\.permission-locked/);
  assert.match(css, /\.storage-management-grid/);
  assert.match(css, /\.source-sync-state/);
  assert.match(css, /\.connection-config-summary/);
  assert.match(page, /治理流程执行进度/);
  assert.match(css, /\.workbench-run-dialog/);
  assert.doesNotMatch(css, /\.workbench-run-log/);
  assert.match(css, /\.connection-mode-banner/);
  assert.match(css, /\.flow-node\.run-失败/);
  assert.match(css, /\.workbench-delete-dialog/);
  assert.match(css, /\.project-delete-summary/);
  assert.match(css, /\.governance-algorithm-panel/);
  assert.match(css, /\.market-card-grid/);
  assert.match(css, /\.algorithm-detail-drawer/);
  assert.match(css, /\.ui-icon/);
  assert.match(workflow, /数据接入/);
  assert.match(workflow, /数据探查与盘点/);
  assert.match(workflow, /模型能力评测与交付/);
  assert.match(workflow, /数据接入闭环/);
  assert.match(workflow, /\[x\] 数据探查结果转清洗任务/);
  assert.match(workflow, /\[x\] 智能清洗版本管理、结果对比和回滚/);
  assert.match(workflow, /\[x\] 治理工作间节点增删、连线、运行失败与重试/);
  assert.match(workflow, /\[x\] 数据集评估配置、问题闭环和报告导出/);
  assert.match(workflow, /\[x\] 模型开发参数、运行指标和模型版本管理/);
  assert.match(workflow, /\[x\] 模型评测标准、门禁判定和对比报告/);
  assert.match(workflow, /\[x\] 全局消息、审计日志、权限控制和本地持久化/);
  assert.doesNotMatch(page, /sites-skeleton|codex-preview/);
});
