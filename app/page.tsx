"use client";

import {
  ChangeEvent,
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Blocks,
  BookOpen,
  CalendarClock,
  Check,
  ChevronRight,
  CircleCheck,
  CircleAlert,
  ClipboardCheck,
  Database,
  Download,
  Eye,
  ExternalLink,
  FileArchive,
  FileAudio,
  FileDown,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileUp,
  FileVideo,
  Filter,
  FolderKanban,
  Gauge,
  GitBranch,
  Grid2X2,
  HardDrive,
  House,
  KeyRound,
  Layers3,
  Link2,
  ListChecks,
  LocateFixed,
  LogOut,
  Menu,
  MessageSquare,
  Minus,
  MoreHorizontal,
  PackageCheck,
  Play,
  Plus,
  RefreshCw,
  Redo2,
  RotateCcw,
  Rows3,
  Save,
  Search,
  ScanSearch,
  Server,
  Settings2,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Undo2,
  Upload,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  Workflow,
  X,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";

type ModuleId =
  | "home"
  | "inventory"
  | "governance"
  | "assessment"
  | "modelDev"
  | "modelEval"
  | "admin";
type DialogId =
  | "assessment"
  | "model"
  | "connection"
  | "project"
  | "evaluation"
  | null;
type TopPanelId = "guide" | "profile" | "messages" | null;
type GovernanceView = "projects" | "workspace" | "algorithms" | "marketplace";
type AdminView = "messages" | "audit" | "permissions" | "storage";
type Notify = (message: string) => void;

type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  roleId: string;
};

function UiIcon({ icon: Icon, size = 14 }: { icon: LucideIcon; size?: number }) {
  return <Icon className="ui-icon" size={size} strokeWidth={1.8} aria-hidden="true" />;
}

type ProjectRow = {
  name: string;
  overview: string;
  created: string;
  updated: string;
  isEmpty?: boolean;
  workspace?: {
    nodes: WorkbenchNode[];
    edges: WorkbenchEdge[];
    mediaAssets?: Record<string, WorkbenchMediaAsset[]>;
    nodeConfigs?: Record<string, GovernanceNodeConfig>;
  };
};

type SourceRow = {
  name: string;
  type: string;
  summary: string;
  scale: string;
  strategy: string;
  updated: string;
  endpoint: string;
  status: "正常" | "待验证" | "测试中" | "同步中" | "异常";
  progress: number;
  syncResult: string;
};

type CleaningIssueSample = {
  id: string;
  field: string;
  problem: string;
  original: string;
  suggestion: string;
  rule: string;
  confidence: string;
};

type CleaningVersionRow = {
  id: string;
  version: string;
  parent: string;
  created: string;
  operator: string;
  records: number;
  issues: number;
  quality: number;
  change: string;
};

type CleaningTaskRow = {
  id: string;
  name: string;
  dataset: string;
  source: string;
  table: string;
  fields: string[];
  recordCount: number;
  issueCount: number;
  rules: string[];
  samples: CleaningIssueSample[];
  status: "待执行" | "运行中" | "已完成" | "失败";
  progress: number;
  sourceVersion: string;
  outputVersion: string;
  activeVersion: string;
  versions: CleaningVersionRow[];
  created: string;
};

type CleaningTaskDraft = Omit<
  CleaningTaskRow,
  "id" | "status" | "progress" | "outputVersion" | "activeVersion" | "versions" | "created"
>;

type ModelJobConfig = {
  learningRate: string;
  epochs: number;
  batchSize: number;
  precision: string;
  maxSequence: number;
  compute: string;
};

type ModelVersionRow = {
  version: string;
  created: string;
  loss: string;
  accuracy: string;
  size: string;
  status: "待注册" | "已注册" | "已归档";
};

type JobRow = {
  name: string;
  type: string;
  model: string;
  dataset: string;
  progress: number;
  status: "排队中" | "训练中" | "已暂停" | "已完成" | "失败";
  config: ModelJobConfig;
  versions: ModelVersionRow[];
  registeredVersion: string;
};

type EvaluationStatus = "待评测" | "评测中" | "通过" | "未通过";

type EvaluationConfig = {
  standard: string;
  baseline: string;
  sampleSize: number;
  scoreThreshold: number;
  safetyThreshold: number;
  latencyThreshold: number;
  mode: string;
};

type EvaluationResult = {
  overall: number;
  quality: number;
  safety: number;
  performance: number;
  latency: number;
  testsPassed: number;
  testsTotal: number;
  coverage: number;
  completedAt: string;
};

type EvaluationRow = {
  name: string;
  model: string;
  dataset: string;
  score: string;
  date: string;
  status: EvaluationStatus;
  progress: number;
  config: EvaluationConfig;
  result: EvaluationResult | null;
};

type PlatformMessage = {
  id: string;
  title: string;
  detail: string;
  category: "质量" | "治理" | "模型" | "系统";
  level: "普通" | "重要" | "紧急";
  time: string;
  read: boolean;
  module: ModuleId;
};

type AuditLogRow = {
  id: string;
  time: string;
  user: string;
  module: string;
  action: string;
  target: string;
  result: "成功" | "失败";
  detail: string;
  address: string;
};

type PermissionLevel = "无权限" | "只读" | "管理";

type PlatformRole = {
  id: string;
  name: string;
  description: string;
  members: number;
  permissions: Record<ModuleId, PermissionLevel>;
};

type PlatformUser = {
  id: string;
  name: string;
  account: string;
  department: string;
  roleId: string;
  status: "正常" | "停用";
  lastLogin: string;
};

type LocalPlatformSnapshot = {
  version: 2;
  savedAt: string;
  data: {
    project: string;
    compact: boolean;
    projects: ProjectRow[];
    sources: SourceRow[];
    cleaningTasks: CleaningTaskRow[];
    reviewTasks: string[];
    jobs: JobRow[];
    evaluations: EvaluationRow[];
    messages: PlatformMessage[];
    auditLogs: AuditLogRow[];
    roles: PlatformRole[];
    users: PlatformUser[];
    activeRoleId: string;
    resolvedRisks: string[];
    assessmentIssues: AssessmentIssue[];
  };
};

type CreatePayload = {
  kind: Exclude<DialogId, null>;
  name: string;
  option: string;
  model: string;
  dataset: string;
  baseline?: string;
  standard?: string;
  mode?: string;
  sampleSize?: number;
  endpoint?: string;
  strategy?: string;
};

type AssessmentTaskMode = "语句文件" | "自定义审查" | "多模态审查";

const assessmentTaskProfiles: Record<AssessmentTaskMode, {
  title: string;
  description: string;
  datasetLabel: string;
  datasets: string[];
  standardLabel: string;
  standards: string[];
  extraLabel: string;
  extras: string[];
  tags: string[];
}> = {
  语句文件: {
    title: "语句文件质量审查",
    description: "面向问答、对话和指令数据，检查语言规范、语义一致性与敏感内容。",
    datasetLabel: "语句数据集",
    datasets: ["SFT 问答数据集 v2.1", "客服对话语料 v3.0", "金融年报问答集 v2.1"],
    standardLabel: "语言审查标准",
    standards: ["SFT 数据质量标准 v2", "多轮对话质量标准 v1.6", "金融问答一致性标准 v2.3"],
    extraLabel: "文本解析方式",
    extras: ["逐条语义解析", "问答对齐解析", "多轮上下文解析"],
    tags: ["语义一致性", "语言规范", "敏感信息"],
  },
  自定义审查: {
    title: "自定义规则审查",
    description: "组合平台规则与业务条件，适合特定字段、阈值及合规要求的专项审查。",
    datasetLabel: "目标数据集",
    datasets: ["客户服务对话集 v3.4", "金融年报问答集 v2.1", "业务事件样本集 v1.9"],
    standardLabel: "自定义规则包",
    standards: ["客户信息合规规则包", "金融业务质量规则包", "字段完整性专项规则"],
    extraLabel: "执行策略",
    extras: ["全量规则执行", "风险优先抽样", "仅检查新增数据"],
    tags: ["字段规则", "业务阈值", "合规校验"],
  },
  多模态审查: {
    title: "多模态数据审查",
    description: "联合检查图像、音频、视频与文本之间的质量及跨模态对齐关系。",
    datasetLabel: "多模态数据集",
    datasets: ["篮球高质量数据集1", "图文指令数据集 v2.4", "客服音视频语料 v1.7"],
    standardLabel: "多模态审查标准",
    standards: ["图像质量评估标准 v2", "图文对齐质量标准 v2.2", "音视频内容质量标准 v1.5"],
    extraLabel: "审查范围",
    extras: ["图像 + 文本", "音频 + 文本", "视频 + 音频 + 文本"],
    tags: ["内容质量", "模态对齐", "可用性"],
  },
};

const modules: Array<{
  id: ModuleId;
  label: string;
  short: string;
  icon: LucideIcon;
  children: string[];
}> = [
  { id: "home", label: "首页", short: "首页", icon: House, children: [] },
  {
    id: "inventory",
    label: "智能数据盘点",
    short: "盘点",
    icon: Database,
    children: ["数据库管理", "数据探查", "本地数据管理", "智能数据盘点", "智能数据清洗"],
  },
  {
    id: "governance",
    label: "高质量数据治理",
    short: "治理",
    icon: ShieldCheck,
    children: ["治理项目管理", "高质量数据治理工作间", "治理算法管理", "治理算法市场"],
  },
  {
    id: "assessment",
    label: "高质量数据集评估",
    short: "评估",
    icon: ClipboardCheck,
    children: ["高质量数据评估", "高质量数据评估历史"],
  },
  {
    id: "modelDev",
    label: "可用不可见模型开发",
    short: "开发",
    icon: Blocks,
    children: ["模型开发任务", "RAG 增强", "微调训练", "蒸馏量化", "模型注册"],
  },
  {
    id: "modelEval",
    label: "大模型能力评测",
    short: "评测",
    icon: Gauge,
    children: ["评测任务", "评测标准", "能力对比", "发布门禁"],
  },
  {
    id: "admin",
    label: "平台管理",
    short: "管理",
    icon: Settings2,
    children: ["全局消息", "审计日志", "权限控制", "本地数据"],
  },
];

const initialProjects: ProjectRow[] = [
  {
    name: "高质量数据集评估演示",
    overview: "5 Datasets  13 Recipes",
    created: "2026-02-26",
    updated: "2026-08-18",
  },
  {
    name: "高质量数据集测试",
    overview: "2 Datasets  2 Recipes",
    created: "2026-03-23",
    updated: "2026-03-23",
  },
  {
    name: "测试",
    overview: "5 Datasets  5 Recipes",
    created: "2026-03-22",
    updated: "2026-03-22",
  },
];

const initialSources: SourceRow[] = [
  {
    name: "生产业务库",
    type: "MySQL 8.0",
    summary: "42 张表",
    scale: "12.8 GB",
    strategy: "每 30 分钟",
    updated: "5 分钟前",
    endpoint: "10.20.8.16:3306 / production",
    status: "正常",
    progress: 100,
    syncResult: "最近同步 42 张表，新增 18,620 条记录",
  },
  {
    name: "数据评估文件仓",
    type: "本地文件",
    summary: "12 个数据集",
    scale: "36.4 GB",
    strategy: "手动触发",
    updated: "18 分钟前",
    endpoint: "/data/high-quality-datasets",
    status: "正常",
    progress: 100,
    syncResult: "最近导入 12 个数据集，共 36.4 GB",
  },
  {
    name: "知识文档仓",
    type: "SFTP",
    summary: "1,286 个文件",
    scale: "34 GB",
    strategy: "每日 02:00",
    updated: "2 小时前",
    endpoint: "sftp://10.20.8.32:22/knowledge",
    status: "正常",
    progress: 100,
    syncResult: "最近同步 1,286 个文件，失败 0 个",
  },
  {
    name: "业务事件接口",
    type: "REST API",
    summary: "2.4M 条/日",
    scale: "实时流",
    strategy: "准实时",
    updated: "刚刚",
    endpoint: "https://events.internal.example/v1",
    status: "正常",
    progress: 100,
    syncResult: "实时消费正常，当前 2.4M 条/日",
  },
];

const defaultCleaningSamples: CleaningIssueSample[] = [
  { id: "issue-3812", field: "customer_name", problem: "空值", original: "(空)", suggestion: "根据关联账户补全", rule: "空值智能填充", confidence: "96%" },
  { id: "issue-9218", field: "mobile_phone", problem: "格式异常", original: "138-0066-218", suggestion: "13800662180", rule: "格式标准化", confidence: "99%" },
  { id: "issue-186", field: "annual_value", problem: "异常值", original: "9,862,000,000", suggestion: "98,620.00", rule: "异常值处理", confidence: "92%" },
  { id: "issue-4207", field: "register_date", problem: "日期异常", original: "2026-13-42", suggestion: "转人工确认", rule: "格式标准化", confidence: "88%" },
];

const initialCleaningTasks: CleaningTaskRow[] = [
  {
    id: "clean-finance-v21",
    name: "金融年报问答集质量清洗-0822",
    dataset: "金融年报问答集 v2.1",
    source: "数据评估文件仓",
    table: "annual_report_qa",
    fields: ["question", "answer", "citation", "annual_value"],
    recordCount: 126842,
    issueCount: 3218,
    rules: ["重复数据识别", "空值智能填充", "格式标准化", "异常值处理"],
    samples: defaultCleaningSamples,
    status: "待执行",
    progress: 0,
    sourceVersion: "v2.1",
    outputVersion: "--",
    activeVersion: "v2.1",
    versions: [
      {
        id: "version-finance-v21",
        version: "v2.1",
        parent: "--",
        created: "2026-08-22 18:32",
        operator: "高质量数据评估演示",
        records: 126842,
        issues: 3218,
        quality: 93.7,
        change: "源数据版本",
      },
    ],
    created: "2026-08-22 18:32",
  },
];

const initialReviewTasks = [
  "篮球版本1审查任务",
  "结构化数据集审查",
  "文档数据质量评估",
  "图片数据质量评估",
  "视频数据质量评估",
  "文本内容多样性",
  "文本语言统一性",
  "数据日期格式规范性",
];

const defaultModelJobConfig: ModelJobConfig = {
  learningRate: "2e-5",
  epochs: 3,
  batchSize: 16,
  precision: "BF16",
  maxSequence: 4096,
  compute: "4 × A100 80GB",
};

const defaultEvaluationConfig: EvaluationConfig = {
  standard: "模型上线标准 v3.2",
  baseline: "qwen3-8b-base",
  sampleSize: 2000,
  scoreThreshold: 90,
  safetyThreshold: 98,
  latencyThreshold: 700,
  mode: "双盲评测",
};

function buildEvaluationResult(row: EvaluationRow): EvaluationResult {
  const seed = Array.from(`${row.name}${row.model}`).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const quality = Number((90.8 + (seed % 34) / 10).toFixed(1));
  const safety = Number((98.1 + (seed % 17) / 10).toFixed(1));
  const performance = Number((87.4 + (seed % 41) / 10).toFixed(1));
  const overall = Number((quality * 0.5 + safety * 0.3 + performance * 0.2).toFixed(1));
  return {
    overall,
    quality,
    safety,
    performance,
    latency: 510 + (seed % 17) * 11,
    testsPassed: 48,
    testsTotal: 48,
    coverage: 100,
    completedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
  };
}

function getEvaluationGateChecks(row: EvaluationRow) {
  const result = row.result;
  return [
    {
      name: "综合能力得分",
      required: `≥ ${row.config.scoreThreshold.toFixed(1)}`,
      actual: result ? result.overall.toFixed(1) : "--",
      passed: Boolean(result && result.overall >= row.config.scoreThreshold),
    },
    {
      name: "安全通过率",
      required: `≥ ${row.config.safetyThreshold.toFixed(1)}%`,
      actual: result ? `${result.safety.toFixed(1)}%` : "--",
      passed: Boolean(result && result.safety >= row.config.safetyThreshold),
    },
    {
      name: "P95 响应延迟",
      required: `≤ ${row.config.latencyThreshold}ms`,
      actual: result ? `${result.latency}ms` : "--",
      passed: Boolean(result && result.latency <= row.config.latencyThreshold),
    },
    {
      name: "自动化测试",
      required: "48 / 48",
      actual: result ? `${result.testsPassed} / ${result.testsTotal}` : "--",
      passed: Boolean(result && result.testsPassed === result.testsTotal),
    },
    {
      name: "评测样本覆盖",
      required: "≥ 99.0%",
      actual: result ? `${result.coverage.toFixed(1)}%` : "--",
      passed: Boolean(result && result.coverage >= 99),
    },
  ];
}

const initialJobs: JobRow[] = [
  {
    name: "finance-sft-lora-07",
    type: "大模型微调训练",
    model: "Qwen3-8B",
    dataset: "金融年报问答集 v2.1",
    progress: 68,
    status: "训练中",
    config: { ...defaultModelJobConfig },
    versions: [],
    registeredVersion: "--",
  },
  {
    name: "service-rag-index-12",
    type: "大模型 RAG 增强",
    model: "BGE-M3",
    dataset: "客服知识向量集 v3.4",
    progress: 100,
    status: "已完成",
    config: { ...defaultModelJobConfig, learningRate: "1e-5", epochs: 1, compute: "2 × A100 80GB" },
    versions: [{ version: "service-rag-v3.4.1", created: "2026-08-22 18:46", loss: "0.312", accuracy: "93.8%", size: "4.8 GB", status: "已注册" }],
    registeredVersion: "service-rag-v3.4.1",
  },
  {
    name: "vision-quant-int4-03",
    type: "大模型蒸馏轻量化",
    model: "Qwen2.5-VL",
    dataset: "篮球图像数据集 v1.3",
    progress: 24,
    status: "排队中",
    config: { ...defaultModelJobConfig, precision: "INT4", batchSize: 8, compute: "2 × A100 80GB" },
    versions: [],
    registeredVersion: "--",
  },
];

const initialEvaluations: EvaluationRow[] = [
  {
    name: "金融问答能力评测",
    model: "finance-assistant-v2.3",
    dataset: "金融问答评测集 v4.2",
    score: "90.7",
    date: "2026-08-22",
    status: "通过",
    progress: 100,
    config: { ...defaultEvaluationConfig },
    result: { overall: 90.7, quality: 91.8, safety: 99.4, performance: 88.1, latency: 620, testsPassed: 48, testsTotal: 48, coverage: 100, completedAt: "2026-08-22 17:36:20" },
  },
  {
    name: "RAG 召回质量评测",
    model: "service-rag-v3.4",
    dataset: "客服检索评测集 v3",
    score: "91.2",
    date: "2026-08-22",
    status: "通过",
    progress: 100,
    config: { ...defaultEvaluationConfig, standard: "RAG 效果标准 v2.4", baseline: "service-rag-v3.2", scoreThreshold: 89, sampleSize: 3000 },
    result: { overall: 91.2, quality: 92.4, safety: 98.9, performance: 87.6, latency: 674, testsPassed: 48, testsTotal: 48, coverage: 99.8, completedAt: "2026-08-22 18:12:45" },
  },
  {
    name: "图像理解安全评测",
    model: "vision-agent-v1.8",
    dataset: "多模态安全集 v2",
    score: "96.8",
    date: "2026-08-22",
    status: "通过",
    progress: 100,
    config: { ...defaultEvaluationConfig, standard: "多模态安全标准 v1.8", baseline: "qwen2.5-vl-7b", sampleSize: 1600, scoreThreshold: 94, safetyThreshold: 99 },
    result: { overall: 96.8, quality: 96.2, safety: 99.7, performance: 93.5, latency: 586, testsPassed: 48, testsTotal: 48, coverage: 100, completedAt: "2026-08-22 19:08:16" },
  },
];

const PLATFORM_STORAGE_KEY = "high-quality-data-platform:v1";

const initialMessages: PlatformMessage[] = [
  { id: "message-01", title: "篮球版本1评估已完成", detail: "五项质量审查全部通过，综合质量分 96.8。", category: "质量", level: "普通", time: "2 分钟前", read: false, module: "assessment" },
  { id: "message-02", title: "finance-sft-lora-07 运行至 68%", detail: "训练指标稳定，预计 22 分钟后生成候选版本。", category: "模型", level: "普通", time: "8 分钟前", read: false, module: "modelDev" },
  { id: "message-03", title: "金融问答模型安全门禁已通过", detail: "5 项发布检查全部达标，可进入版本审批。", category: "模型", level: "重要", time: "26 分钟前", read: false, module: "modelEval" },
  { id: "message-04", title: "客户主数据异常率超过阈值", detail: "手机号格式异常率 3.6%，超过质量红线 1.6 个百分点。", category: "质量", level: "紧急", time: "今天 09:42", read: true, module: "assessment" },
  { id: "message-05", title: "知识文档仓同步完成", detail: "最近同步 1,286 个文件，失败 0 个。", category: "系统", level: "普通", time: "今天 08:15", read: true, module: "inventory" },
  { id: "message-06", title: "治理流程等待人工复核", detail: "图像多模态标注节点有 36 条低置信度样本。", category: "治理", level: "重要", time: "昨天 18:32", read: true, module: "governance" },
];

const initialAuditLogs: AuditLogRow[] = [
  { id: "audit-01", time: "2026-08-24 11:42:18", user: "高质量数据评估演示", module: "模型评测", action: "执行评测", target: "金融问答能力评测", result: "成功", detail: "发布门禁 5/5 通过", address: "127.0.0.1" },
  { id: "audit-02", time: "2026-08-24 11:36:05", user: "高质量数据评估演示", module: "数据治理", action: "更新规则", target: "质量规则过滤", result: "成功", detail: "启用 13 条质量规则", address: "127.0.0.1" },
  { id: "audit-03", time: "2026-08-24 11:18:42", user: "高质量数据评估演示", module: "数据接入", action: "同步数据", target: "知识文档仓", result: "成功", detail: "同步文件 1,286 个", address: "127.0.0.1" },
  { id: "audit-04", time: "2026-08-24 10:56:21", user: "质量评估员-王敏", module: "数据评估", action: "处置问题", target: "customer_name #3812", result: "成功", detail: "根据关联账户补全", address: "10.20.18.24" },
  { id: "audit-05", time: "2026-08-24 10:42:09", user: "模型工程师-李成", module: "模型开发", action: "启动训练", target: "finance-sft-lora-07", result: "成功", detail: "计算资源 4 × A100 80GB", address: "10.20.18.31" },
  { id: "audit-06", time: "2026-08-24 10:15:37", user: "数据管理员-赵宁", module: "数据接入", action: "测试连接", target: "业务事件接口", result: "失败", detail: "连接超时，已自动重试", address: "10.20.18.16" },
];

const initialRoles: PlatformRole[] = [
  {
    id: "role-admin",
    name: "平台管理员",
    description: "管理平台设置、人员权限和全部业务模块",
    members: 2,
    permissions: { home: "管理", inventory: "管理", governance: "管理", assessment: "管理", modelDev: "管理", modelEval: "管理", admin: "管理" },
  },
  {
    id: "role-data",
    name: "数据管理员",
    description: "负责数据接入、盘点、清洗和治理流程",
    members: 5,
    permissions: { home: "只读", inventory: "管理", governance: "管理", assessment: "只读", modelDev: "无权限", modelEval: "只读", admin: "只读" },
  },
  {
    id: "role-quality",
    name: "质量评估员",
    description: "执行数据集质量评估、问题复核和报告导出",
    members: 8,
    permissions: { home: "只读", inventory: "只读", governance: "只读", assessment: "管理", modelDev: "无权限", modelEval: "管理", admin: "只读" },
  },
  {
    id: "role-model",
    name: "模型工程师",
    description: "运行模型开发任务并执行能力评测",
    members: 4,
    permissions: { home: "只读", inventory: "只读", governance: "只读", assessment: "只读", modelDev: "管理", modelEval: "管理", admin: "只读" },
  },
];

const initialUsers: PlatformUser[] = [
  { id: "user-01", name: "高质量数据评估演示", account: "admin@local", department: "平台管理组", roleId: "role-admin", status: "正常", lastLogin: "刚刚" },
  { id: "user-02", name: "赵宁", account: "zhaoning@local", department: "数据中台组", roleId: "role-data", status: "正常", lastLogin: "今天 10:12" },
  { id: "user-03", name: "王敏", account: "wangmin@local", department: "质量运营组", roleId: "role-quality", status: "正常", lastLogin: "今天 09:48" },
  { id: "user-04", name: "李成", account: "licheng@local", department: "模型工程组", roleId: "role-model", status: "正常", lastLogin: "今天 09:21" },
  { id: "user-05", name: "周悦", account: "zhouyue@local", department: "质量运营组", roleId: "role-quality", status: "停用", lastLogin: "2026-08-18" },
];

function Status({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "green" | "blue" | "orange" | "gray";
}) {
  return (
    <span className={`reuse-status ${tone}`}>
      <i />
      {children}
    </span>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="reuse-progress" aria-label={`进度 ${value}%`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

function Login({ onLogin, checking = false }: { onLogin: (credentials: { username: string; password: string; captcha: string }) => Promise<string | null>; checking?: boolean }) {
  const [loginMode, setLoginMode] = useState<"password" | "code">("password");
  const [seconds, setSeconds] = useState(0);
  const [username, setUsername] = useState("高质量数据评估演示");
  const [password, setPassword] = useState("123456");
  const [captcha, setCaptcha] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((current) => current - 1), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking || submitting) return;
    if (loginMode === "code") {
      setMessage("本地部署未配置短信网关，请使用密码登录");
      return;
    }
    setSubmitting(true);
    setMessage("");
    const error = await onLogin({ username, password, captcha });
    if (error) setMessage(error);
    setSubmitting(false);
  }

  return (
    <main className="login-page">
      <div className="login-art" aria-hidden="true">
        <header className="login-art-heading">
          <div className="login-art-eyebrow"><span>质</span><b>DATA QUALITY CONTROL</b></div>
          <h2>让数据从“可用”走向“可信”</h2>
          <p>覆盖数据盘点、治理、评估与交付的全流程质量闭环</p>
        </header>
        <div className="quality-blueprint">
          <div className="quality-blueprint-head">
            <span className="quality-live"><i />质量流水线运行正常</span>
            <time>最近评估&nbsp; 08-25&nbsp; 09:42</time>
          </div>
          <div className="quality-pipeline">
            <div className="quality-stage">
              <span><UiIcon icon={Database} size={19} /></span>
              <strong>数据接入</strong>
              <small>4 个来源</small>
            </div>
            <i className="quality-connector"><b /></i>
            <div className="quality-stage">
              <span><UiIcon icon={SlidersHorizontal} size={19} /></span>
              <strong>规则治理</strong>
              <small>42 条规则</small>
            </div>
            <i className="quality-connector"><b /></i>
            <div className="quality-stage active">
              <span><UiIcon icon={ClipboardCheck} size={19} /></span>
              <strong>质量评估</strong>
              <small>5 项指标</small>
            </div>
            <i className="quality-connector"><b /></i>
            <div className="quality-stage output">
              <span><UiIcon icon={PackageCheck} size={19} /></span>
              <strong>高质量交付</strong>
              <small>门禁已通过</small>
            </div>
          </div>
          <div className="quality-result">
            <div className="quality-score">
              <span>综合数据质量分</span>
              <strong>96.8<small>分</small></strong>
              <em><ArrowUpRight size={13} /> 较上期提升 1.8</em>
            </div>
            <div className="quality-dimensions">
              {[
                ["完整性", "98.6%"],
                ["准确性", "96.4%"],
                ["一致性", "94.8%"],
                ["时效性", "97.2%"],
                ["安全性", "100%"],
              ].map(([label, value]) => (
                <div key={label} style={{ "--quality-value": value } as React.CSSProperties}>
                  <span>{label}</span><i><b /></i><strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
          <footer className="quality-blueprint-foot">
            <span><b>1,286</b> 纳管资产</span>
            <span><b>18</b> 本月评估</span>
            <span><b>35</b> 待处置问题</span>
            <span><UiIcon icon={ShieldCheck} size={13} /> 质量门禁已启用</span>
          </footer>
        </div>
      </div>
      <form className="login-card" onSubmit={submit}>
        <header>
          <h1>高质量数据集评估平台</h1>
          <p>High quality dataset evaluation platform</p>
        </header>
        <div className="login-tabs">
          <button
            type="button"
            className={loginMode === "password" ? "active" : ""}
            onClick={() => { setLoginMode("password"); setMessage(""); }}
          >
            密码登录
          </button>
          <button
            type="button"
            className={loginMode === "code" ? "active" : ""}
            onClick={() => { setLoginMode("code"); setMessage("本地部署未配置短信网关"); }}
          >
            验证码登录
          </button>
        </div>
        <label>
          <span>♙ {loginMode === "password" ? "账 号" : "手机号"}：</span>
          <input
            required
            value={loginMode === "password" ? username : username.replace(/\D/g, "")}
            onChange={(event) => setUsername(event.target.value)}
            aria-label={loginMode === "password" ? "账号" : "手机号码"}
            placeholder={loginMode === "password" ? "请输入用户名称/手机号码/电子邮箱" : "请输入手机号码"}
          />
        </label>
        {loginMode === "password" ? (
          <>
            <label>
              <span>♙ 密 码：</span>
              <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} aria-label="密码" placeholder="请输入密码" />
            </label>
            <label className="captcha-row">
              <span>▣ 验证码：</span>
              <input required value={captcha} onChange={(event) => setCaptcha(event.target.value)} aria-label="验证码" placeholder="请输入验证码" />
              <b>3 + 5 =</b>
            </label>
          </>
        ) : (
          <label className="sms-row">
            <span>▣ 验证码：</span>
            <input required aria-label="短信验证码" placeholder="请输入短信验证码" />
            <button type="button" disabled={seconds > 0} onClick={() => { setSeconds(60); setMessage("本地部署未配置短信网关，未发送验证码"); }}>
              {seconds > 0 ? `${seconds}s` : "获取验证码"}
            </button>
          </label>
        )}
        {(checking || message) && <div className="login-message" role="status">{checking ? "正在验证登录状态…" : message}</div>}
        <button className="login-submit" disabled={checking || submitting}>{submitting ? "正在验证…" : checking ? "正在连接…" : "登 录"}</button>
        <div className="login-links">
          <button type="button" onClick={() => setMessage("账号由平台管理员统一创建，请联系管理员")}>注册账号</button>
          <button type="button" onClick={() => setMessage("请联系平台管理员重置密码")}>忘记密码？</button>
        </div>
        <footer>
          @WINNOW | 商标 | 官网<br />粤ICP备2021133988号
        </footer>
      </form>
    </main>
  );
}

function HomeDashboard({
  sources,
  cleaningTasks,
  reviewTaskCount,
  jobs,
  evaluations,
  notify,
  openModule,
  resolvedRisks,
  setResolvedRisks,
}: {
  sources: SourceRow[];
  cleaningTasks: CleaningTaskRow[];
  reviewTaskCount: number;
  jobs: JobRow[];
  evaluations: EvaluationRow[];
  notify: Notify;
  openModule: (id: ModuleId, label?: string) => void;
  resolvedRisks: string[];
  setResolvedRisks: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [period, setPeriod] = useState<"近 7 天" | "近 30 天" | "本季度">("近 30 天");
  const [selectedDomain, setSelectedDomain] = useState("金融数据");
  const [lastUpdated, setLastUpdated] = useState("刚刚");
  const trends = {
    "近 7 天": [91.8, 92.1, 92.4, 92.2, 93.1, 93.4, 93.7],
    "近 30 天": [88.6, 89.2, 90.1, 89.7, 90.8, 91.5, 91.2, 92.3, 92.9, 93.4, 93.7, 94.1],
    本季度: [84.2, 85.7, 87.1, 86.8, 88.5, 89.4, 90.2, 91.6, 92.1, 92.8, 93.4, 93.7],
  };
  const trendLabels = period === "近 7 天" ? ["18", "19", "20", "21", "22", "23", "24"] : period === "近 30 天" ? ["07-26", "07-29", "08-01", "08-04", "08-07", "08-10", "08-13", "08-16", "08-19", "08-21", "08-23", "08-24"] : ["6月", "", "", "7月", "", "", "8月", "", "", "", "", "当前"];
  const domainRows = [
    { name: "金融数据", datasets: 18, score: 96.2, change: 1.8, issues: 3, owner: "金融数据组" },
    { name: "客服知识", datasets: 12, score: 94.8, change: 0.9, issues: 5, owner: "智能客服组" },
    { name: "业务事件", datasets: 26, score: 92.6, change: 2.4, issues: 8, owner: "数据中台组" },
    { name: "图像多模态", datasets: 9, score: 89.4, change: -1.2, issues: 11, owner: "多模态实验室" },
    { name: "机构基础数据", datasets: 15, score: 87.9, change: 0.4, issues: 14, owner: "主数据组" },
  ];
  const riskItems = [
    { id: "risk-01", level: "高", title: "金融年报问答集存在 842 条重复记录", meta: "影响训练样本分布 · 2 小时前", module: "governance" as ModuleId },
    { id: "risk-02", level: "高", title: "客户主数据手机号格式异常率升至 3.6%", meta: "超过质量红线 1.6 个百分点 · 4 小时前", module: "assessment" as ModuleId },
    { id: "risk-03", level: "中", title: "图像多模态数据集标注一致性下降", meta: "复核一致率 89.4% · 今天 09:26", module: "governance" as ModuleId },
    { id: "risk-04", level: "中", title: "知识文档仓同步延迟超过 2 小时", meta: "SFTP 数据源 · 今天 08:42", module: "inventory" as ModuleId },
  ];
  const visibleRisks = riskItems.filter((item) => !resolvedRisks.includes(item.id));
  const runningJobs = jobs.filter((job) => job.status === "训练中").length;
  const passedEvaluations = evaluations.filter((item) => item.status === "通过").length;
  const waitingEvaluations = evaluations.filter((item) => item.status === "待评测" || item.status === "评测中").length;
  const openIssues = Math.max(18, 41 - resolvedRisks.length * 6);
  const qualityScore = (93.7 + resolvedRisks.length * 0.1).toFixed(1);
  const kpis: Array<{ label: string; value: string; unit: string; note: string; icon: LucideIcon; tone: string; module: ModuleId }> = [
    { label: "综合数据质量分", value: qualityScore, unit: "分", note: "较上期 +1.8", icon: TrendingUp, tone: "blue", module: "assessment" },
    { label: "纳管数据资产", value: "1,286", unit: "项", note: `${sources.length} 个数据源正常`, icon: Database, tone: "cyan", module: "inventory" },
    { label: "评估任务", value: String(reviewTaskCount), unit: "个", note: "本月已完成 18 个", icon: ClipboardCheck, tone: "violet", module: "assessment" },
    { label: "待处置质量问题", value: String(openIssues), unit: "项", note: "其中高风险 7 项", icon: CircleAlert, tone: "orange", module: "governance" },
    { label: "治理任务完成率", value: "84.6", unit: "%", note: `${cleaningTasks.length} 个清洗任务纳入`, icon: Workflow, tone: "green", module: "governance" },
    { label: "模型发布门禁", value: `${passedEvaluations}/${evaluations.length}`, unit: "通过", note: `${waitingEvaluations} 个任务待完成`, icon: ShieldCheck, tone: "navy", module: "modelEval" },
  ];

  function refreshDashboard() {
    setLastUpdated(new Date().toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" }));
    notify("决策看板指标已刷新");
  }

  function exportDashboard() {
    const lines = [["业务域", "数据集", "质量得分", "环比变化", "问题数", "责任团队"], ...domainRows.map((row) => [row.name, row.datasets, row.score, row.change, row.issues, row.owner])];
    const csv = `\uFEFF${lines.map((line) => line.map((cell) => `"${cell}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "高数据质量评估决策看板.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    notify("决策看板数据已导出");
  }

  function resolveRisk(id: string) {
    setResolvedRisks((current) => [...current, id]);
    notify("质量风险已转入处置并从待办中移除");
  }

  return (
    <section className="quality-decision-dashboard">
      <header className="decision-dashboard-head">
        <div><h1>高数据质量评估决策看板</h1><p>统一观察数据资产质量、治理进展与模型发布门禁，为重点问题处置提供决策依据</p></div>
        <div className="decision-dashboard-tools"><span>数据更新：{lastUpdated}</span><select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)} aria-label="选择统计周期"><option>近 7 天</option><option>近 30 天</option><option>本季度</option></select><button className="reuse-secondary" onClick={refreshDashboard}><UiIcon icon={RefreshCw} />刷新指标</button><button className="reuse-primary" onClick={exportDashboard}><UiIcon icon={Download} />导出看板</button></div>
      </header>

      <div className="decision-kpi-strip">
        {kpis.map((kpi) => <button key={kpi.label} onClick={() => openModule(kpi.module)}><span className={kpi.tone}><UiIcon icon={kpi.icon} size={19} /></span><div><small>{kpi.label}</small><strong>{kpi.value}<em>{kpi.unit}</em></strong><p>{kpi.note}</p></div><UiIcon icon={ChevronRight} /></button>)}
      </div>

      <div className="decision-upper-grid">
        <article className="white-panel decision-trend-panel">
          <header className="decision-section-head"><div><h2>全域质量趋势</h2><p>纳入完整性、准确性、一致性、时效性和安全性五类核心指标</p></div><div className="decision-trend-legend"><span>综合质量分</span><span>目标线 92.0</span></div></header>
          <div className="decision-trend-summary"><strong>{qualityScore}</strong><span><UiIcon icon={ArrowUpRight} />较期初提升 5.1 分</span><p>当前质量水平处于<strong>良好</strong>区间，图像多模态与机构基础数据仍需重点治理。</p></div>
          <div className="decision-trend-chart" role="img" aria-label={`${period}综合数据质量分趋势`}>
            <i className="decision-target-line"><span>目标 92.0</span></i>
            {trends[period].map((value, index) => <div key={`${period}-${index}`}><span><i style={{ height: `${Math.max(12, (value - 82) * 5.3)}%` }} /><b>{value.toFixed(1)}</b></span><small>{trendLabels[index]}</small></div>)}
          </div>
        </article>

        <article className="white-panel decision-risk-panel">
          <header className="decision-section-head"><div><h2>质量风险预警</h2><p>按业务影响和质量红线综合排序</p></div><button onClick={() => openModule("assessment")} className="reuse-link">查看全部</button></header>
          <div className="risk-overview"><span><strong>{openIssues}</strong>待处置</span><i><b style={{ width: "18%" }} /><b style={{ width: "34%" }} /><b style={{ width: "48%" }} /></i><small><em className="high" />高风险 7 · <em className="medium" />中风险 14 · <em className="low" />低风险 {Math.max(0, openIssues - 21)}</small></div>
          <div className="decision-risk-list">
            {visibleRisks.map((risk) => <div key={risk.id}><span className={risk.level === "高" ? "high" : "medium"}>{risk.level}</span><button onClick={() => openModule(risk.module)}><strong>{risk.title}</strong><small>{risk.meta}</small></button><button aria-label={`处置${risk.title}`} onClick={() => resolveRisk(risk.id)}>处置</button></div>)}
            {visibleRisks.length === 0 && <div className="decision-risk-empty"><UiIcon icon={CircleCheck} /><span>当前重点风险均已进入处置流程</span></div>}
          </div>
        </article>
      </div>

      <div className="decision-lower-grid">
        <article className="white-panel decision-domain-panel">
          <header className="decision-section-head"><div><h2>重点业务域质量表现</h2><p>选择业务域可查看当前质量判断和责任归属</p></div><button className="reuse-link" onClick={() => openModule("inventory")}>进入数据盘点</button></header>
          <div className="reuse-table-wrap"><table className="reuse-table decision-domain-table"><thead><tr><th>业务域</th><th>数据集</th><th>质量得分</th><th>环比</th><th>问题数</th><th>责任团队</th><th>决策</th></tr></thead><tbody>{domainRows.map((row) => <tr key={row.name} className={selectedDomain === row.name ? "selected-row" : ""} onClick={() => setSelectedDomain(row.name)}><td><strong>{row.name}</strong></td><td>{row.datasets}</td><td><span className={`domain-score ${row.score < 90 ? "risk" : ""}`}>{row.score.toFixed(1)}</span></td><td><span className={row.change < 0 ? "trend-down" : "trend-up"}><UiIcon icon={row.change < 0 ? ArrowDownRight : ArrowUpRight} />{Math.abs(row.change).toFixed(1)}</span></td><td>{row.issues}</td><td>{row.owner}</td><td><button className="reuse-link" onClick={(event) => { event.stopPropagation(); openModule(row.score < 90 ? "governance" : "assessment"); }}>{row.score < 90 ? "发起治理" : "查看评估"}</button></td></tr>)}</tbody></table></div>
          <footer className="domain-decision-note"><UiIcon icon={ScanSearch} /><span><strong>{selectedDomain}</strong>：{selectedDomain === "图像多模态" || selectedDomain === "机构基础数据" ? "质量得分低于平台目标，建议优先处理完整性与标注一致性问题。" : "质量表现稳定，建议保持现有评估频率并持续监控异常波动。"}</span></footer>
        </article>

        <article className="white-panel decision-action-panel">
          <header className="decision-section-head"><div><h2>决策待办</h2><p>跨治理、评估与模型门禁的优先事项</p></div><span>{runningJobs + waitingEvaluations + 3} 项</span></header>
          <div className="decision-action-list">
            <button onClick={() => openModule("governance")}><span className="governance"><UiIcon icon={Workflow} /></span><div><strong>处理高风险治理任务</strong><small>金融年报问答集 · 842 条重复记录</small></div><b>今日</b><UiIcon icon={ChevronRight} /></button>
            <button onClick={() => openModule("assessment")}><span className="assessment"><UiIcon icon={ListChecks} /></span><div><strong>复核质量评估问题</strong><small>客户主数据 · 6 条低置信度建议</small></div><b>今日</b><UiIcon icon={ChevronRight} /></button>
            <button onClick={() => openModule("modelEval")}><span className="evaluation"><UiIcon icon={ShieldCheck} /></span><div><strong>确认模型发布门禁</strong><small>{waitingEvaluations || 1} 个模型等待能力与安全评测</small></div><b>明日</b><UiIcon icon={ChevronRight} /></button>
            <button onClick={() => openModule("inventory")}><span className="inventory"><UiIcon icon={Server} /></span><div><strong>检查数据源同步状态</strong><small>{sources.filter((source) => source.status !== "正常").length || 1} 个连接需要确认同步时效</small></div><b>本周</b><UiIcon icon={ChevronRight} /></button>
          </div>
          <footer><button className="reuse-secondary" onClick={() => openModule("modelDev")}><UiIcon icon={Activity} />模型任务 {runningJobs} 个运行中</button><button className="reuse-secondary" onClick={() => openModule("governance", "治理项目管理")}><UiIcon icon={Layers3} />进入治理项目</button></footer>
        </article>
      </div>
    </section>
  );
}

function DataExploration({
  sources,
  notify,
  createCleaningTask,
}: {
  sources: SourceRow[];
  notify: Notify;
  createCleaningTask: (task: CleaningTaskDraft) => void;
}) {
  const columns = [
    { name: "customer_id", type: "BIGINT", completeness: 100, unique: "1,256,842", issue: "无" },
    { name: "customer_name", type: "VARCHAR", completeness: 99.8, unique: "1,238,407", issue: "2,516 个空值" },
    { name: "mobile_phone", type: "VARCHAR", completeness: 97.6, unique: "1,201,338", issue: "格式异常 186" },
    { name: "customer_level", type: "VARCHAR", completeness: 100, unique: "5", issue: "无" },
    { name: "register_date", type: "DATE", completeness: 98.7, unique: "2,845", issue: "日期异常 42" },
    { name: "annual_value", type: "DECIMAL", completeness: 96.4, unique: "842,039", issue: "极值 31" },
  ];
  const [source, setSource] = useState(sources[0]?.name ?? "生产业务库");
  const [table, setTable] = useState("customer_profile");
  const [selectedField, setSelectedField] = useState(columns[0].name);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(100);
  const progressRef = useRef(progress);
  const issueColumns = columns.filter((column) => column.issue !== "无");
  const [selectedIssueFields, setSelectedIssueFields] = useState(issueColumns.map((column) => column.name));
  const [selectedSampleIds, setSelectedSampleIds] = useState(defaultCleaningSamples.map((sample) => sample.id));

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!scanning) return;
    const timer = window.setInterval(() => {
      const next = Math.min(100, progressRef.current + 11);
      progressRef.current = next;
      setProgress(next);
      if (next === 100) {
        window.clearInterval(timer);
        setScanning(false);
        notify(`${table} 数据探查已完成`);
      }
    }, 280);
    return () => window.clearInterval(timer);
  }, [notify, scanning, table]);

  const selected = columns.find((column) => column.name === selectedField) ?? columns[0];
  const distribution = selectedField === "customer_level"
    ? [["战略客户", 18], ["重点客户", 31], ["普通客户", 42], ["潜在客户", 9]]
    : [["有效值", Math.round(selected.completeness)], ["空值", Math.max(1, Math.round(100 - selected.completeness))], ["异常值", selected.issue === "无" ? 0 : 3]];
  const selectedIssueCount = issueColumns.filter((column) => selectedIssueFields.includes(column.name)).reduce((total, column) => {
    const count = Number(column.issue.match(/[\d,]+/)?.[0].replaceAll(",", "") || 0);
    return total + count;
  }, 0);
  const visibleProblemSamples = defaultCleaningSamples.filter((sample) => selectedIssueFields.includes(sample.field));

  function toggleIssueField(field: string) {
    setSelectedIssueFields((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field]);
  }

  function toggleProblemSample(id: string) {
    setSelectedSampleIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function submitCleaningTask() {
    const selectedSamples = defaultCleaningSamples.filter((sample) => selectedSampleIds.includes(sample.id) && selectedIssueFields.includes(sample.field));
    if (!selectedIssueFields.length || !selectedSamples.length) {
      notify("请至少选择一个异常字段和一个问题样本");
      return;
    }
    const rules = Array.from(new Set(selectedSamples.map((sample) => sample.rule)));
    createCleaningTask({
      name: `${table} 探查问题清洗-${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", "")}`,
      dataset: `${table} 探查数据集`,
      source,
      table,
      fields: selectedIssueFields,
      recordCount: 1256842,
      issueCount: selectedIssueCount,
      rules,
      samples: selectedSamples,
      sourceVersion: "探查快照 v1",
    });
  }

  return (
    <article className="white-panel inventory-workspace exploration-workspace">
      <div className="reuse-panel-head inventory-head">
        <div><h2>数据探查</h2><p>对数据表执行结构识别、字段画像、质量扫描和样例预览</p></div>
        <div>
          <label className="inventory-select">数据源<select value={source} onChange={(event) => setSource(event.target.value)}>{sources.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
          <label className="inventory-select">数据表<select value={table} onChange={(event) => setTable(event.target.value)}><option>customer_profile</option><option>order_detail</option><option>service_record</option><option>product_catalog</option></select></label>
          <button className="reuse-primary" disabled={scanning} onClick={() => { setProgress(0); setScanning(true); }}><UiIcon icon={scanning ? RefreshCw : Play} />{scanning ? `探查中 ${progress}%` : "开始探查"}</button>
        </div>
      </div>
      {scanning && <div className="workspace-progress"><Progress value={progress} /><span>正在读取字段统计与样例数据...</span></div>}
      <div className="inventory-kpis">
        {[['记录总量', '1,256,842', '较上次 +12,608'], ['字段数量', '24', '6 个数值字段'], ['完整度', '98.7%', '高于标准 3.7%'], ['异常字段', '3', '建议进入清洗']].map((item, index) => (
          <div key={item[0]}><span className={`kpi-icon k${index}`}>{['数', '列', '完', '!'][index]}</span><p>{item[0]}</p><strong>{item[1]}</strong><small>{item[2]}</small></div>
        ))}
      </div>
      <div className="exploration-grid">
        <section className="sub-panel field-profile-panel">
          <header><div><h3>字段画像</h3><p>点击字段查看分布与质量问题</p></div><span>{columns.length} / 24 个重点字段</span></header>
          <div className="reuse-table-wrap">
            <table className="reuse-table compact-table">
              <thead><tr><th className="selection-cell">清洗</th><th>字段名称</th><th>类型</th><th>完整度</th><th>唯一值</th><th>问题</th></tr></thead>
              <tbody>{columns.map((column) => (
                <tr key={column.name} className={selectedField === column.name ? "selected-row" : ""}>
                  <td className="selection-cell"><input type="checkbox" aria-label={`选择${column.name}进入清洗`} disabled={column.issue === "无"} checked={selectedIssueFields.includes(column.name)} onChange={() => toggleIssueField(column.name)} /></td>
                  <td><button className="reuse-link field-button" onClick={() => setSelectedField(column.name)}>{column.name}</button></td>
                  <td><span className="field-type-tag">{column.type}</span></td><td><div className="inline-score"><Progress value={column.completeness} /><span>{column.completeness}%</span></div></td>
                  <td>{column.unique}</td><td className={column.issue === "无" ? "good-text" : "warning-text"}>{column.issue}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
        <section className="sub-panel field-insight-panel">
          <header><div><h3>{selected.name}</h3><p>{selected.type} · 字段分布</p></div><Status tone={selected.issue === "无" ? "green" : "orange"}>{selected.issue === "无" ? "质量正常" : "建议处理"}</Status></header>
          <div className="donut-score" style={{ "--score": `${selected.completeness * 3.6}deg` } as React.CSSProperties}><strong>{selected.completeness}%</strong><span>字段完整度</span></div>
          <div className="distribution-list">{distribution.map((item) => (
            <div key={item[0]}><span>{item[0]}</span><div><i style={{ width: `${item[1]}%` }} /></div><b>{item[1]}%</b></div>
          ))}</div>
          <button className="reuse-secondary" disabled={selected.issue === "无"} onClick={() => { if (!selectedIssueFields.includes(selected.name)) toggleIssueField(selected.name); notify(`${selected.name} 已加入待清洗字段`); }}><UiIcon icon={Plus} />{selectedIssueFields.includes(selected.name) ? "已加入清洗范围" : "加入清洗范围"}</button>
        </section>
      </div>
      <section className="sub-panel exploration-issue-panel">
        <header><div><h3>问题样本</h3><p>从探查结果中选择要进入清洗任务的问题记录</p></div><div><span>已选 {selectedSampleIds.filter((id) => visibleProblemSamples.some((sample) => sample.id === id)).length} 条样本 · {selectedIssueFields.length} 个字段 · {selectedIssueCount.toLocaleString()} 个问题</span><button className="reuse-primary" disabled={progress < 100 || !selectedIssueFields.length} onClick={submitCleaningTask}><UiIcon icon={Workflow} />生成清洗任务</button></div></header>
        <div className="reuse-table-wrap"><table className="reuse-table compact-table"><thead><tr><th className="selection-cell">选择</th><th>字段 / 记录</th><th>问题类型</th><th>原始值</th><th>建议修复</th><th>推荐规则</th><th>置信度</th></tr></thead><tbody>{visibleProblemSamples.map((sample) => <tr key={sample.id}><td className="selection-cell"><input type="checkbox" aria-label={`选择问题样本${sample.id}`} checked={selectedSampleIds.includes(sample.id)} onChange={() => toggleProblemSample(sample.id)} /></td><td><strong>{sample.field}</strong> #{sample.id.replace("issue-", "")}</td><td className="warning-text">{sample.problem}</td><td className="before-value">{sample.original}</td><td className="after-value">{sample.suggestion}</td><td>{sample.rule}</td><td>{sample.confidence}</td></tr>)}</tbody></table>{visibleProblemSamples.length === 0 && <div className="table-empty">请选择包含质量问题的字段</div>}</div>
      </section>
      <section className="sub-panel sample-panel">
        <header><div><h3>样例数据</h3><p>展示前 5 条脱敏记录</p></div><button className="reuse-link" onClick={() => notify("样例数据已重新抽样")}>换一批样例</button></header>
        <div className="reuse-table-wrap"><table className="reuse-table compact-table"><thead><tr><th>customer_id</th><th>customer_name</th><th>mobile_phone</th><th>customer_level</th><th>register_date</th><th>annual_value</th></tr></thead><tbody>
          {[['10032018', '赵*明', '138****7621', '重点客户', '2022-06-18', '¥ 86,420'], ['10032019', '陈*华', '186****1093', '普通客户', '2023-01-09', '¥ 31,806'], ['10032020', '王*', '139****5218', '战略客户', '2020-11-26', '¥ 268,500'], ['10032021', '刘*宁', '137****4802', '潜在客户', '2024-03-17', '¥ 9,630'], ['10032022', '周*宇', '158****3409', '重点客户', '2021-08-03', '¥ 112,780']].map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}
        </tbody></table></div>
      </section>
    </article>
  );
}

type MultimodalPreviewKind = "image" | "audio" | "video" | "pdf" | "table" | "json" | "text" | "archive" | "unsupported";

type LocalPreviewFile = {
  id: string;
  name: string;
  format: string;
  size: string;
  records: string;
  updated: string;
  status: "可用" | "待解析" | "解析中";
  kind: MultimodalPreviewKind;
  mime: string;
  objectUrl?: string;
  file?: File;
};

const previewKindLabel: Record<MultimodalPreviewKind, string> = {
  image: "图像",
  audio: "音频",
  video: "视频",
  pdf: "PDF 文档",
  table: "结构化表格",
  json: "JSON 数据",
  text: "文本",
  archive: "压缩包",
  unsupported: "通用文件",
};

const previewKindIcon: Record<MultimodalPreviewKind, LucideIcon> = {
  image: FileImage,
  audio: FileAudio,
  video: FileVideo,
  pdf: FileText,
  table: FileSpreadsheet,
  json: FileJson,
  text: FileText,
  archive: FileArchive,
  unsupported: FileText,
};

const defaultLocalPreviewFiles: LocalPreviewFile[] = [
  { id: "local-seed-image", name: "篮球扣篮样例.jpg", format: "JPG / 图像", size: "4.8 MB", records: "1 张 · 3840 × 2160", updated: "2026-08-25 09:42", status: "可用", kind: "image", mime: "image/jpeg" },
  { id: "local-seed-video", name: "赛事视频片段.mp4", format: "MP4 / 视频", size: "86.5 MB", records: "00:42 · 25 FPS", updated: "2026-08-25 09:36", status: "可用", kind: "video", mime: "video/mp4" },
  { id: "local-seed-audio", name: "客服录音样本.wav", format: "WAV / 音频", size: "118 MB", records: "1,865 段 · 16 kHz", updated: "2026-08-24 18:20", status: "可用", kind: "audio", mime: "audio/wav" },
  { id: "local-seed-table", name: "金融年报问答集.csv", format: "CSV / 结构化表格", size: "38.6 MB", records: "126,842 条 · 8 字段", updated: "2026-08-24 16:32", status: "可用", kind: "table", mime: "text/csv" },
  { id: "local-seed-pdf", name: "制度文档汇编.pdf", format: "PDF / PDF 文档", size: "124 MB", records: "380 页 · 可检索", updated: "2026-08-23 15:08", status: "可用", kind: "pdf", mime: "application/pdf" },
  { id: "local-seed-json", name: "多模态标注样例.jsonl", format: "JSONL / JSON 数据", size: "12.4 MB", records: "18,420 条", updated: "2026-08-23 11:26", status: "可用", kind: "json", mime: "application/x-ndjson" },
  { id: "local-seed-archive", name: "篮球图像数据集.zip", format: "ZIP / 压缩包", size: "286 MB", records: "2,480 个文件", updated: "2026-08-22 22:16", status: "可用", kind: "archive", mime: "application/zip" },
];

function getFileExtension(name: string) {
  const extension = name.includes(".") ? name.split(".").pop() : "文件";
  return (extension || "文件").toUpperCase();
}

function inferPreviewKind(name: string, mime: string): MultimodalPreviewKind {
  const extension = name.toLowerCase().split(".").pop() ?? "";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"].includes(extension)) return "image";
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(extension)) return "audio";
  if (mime.startsWith("video/") || ["mp4", "webm", "ogv", "mov", "m4v"].includes(extension)) return "video";
  if (mime === "application/pdf" || extension === "pdf") return "pdf";
  if (["csv", "tsv", "xls", "xlsx", "parquet"].includes(extension) || mime.includes("spreadsheet") || mime === "text/csv") return "table";
  if (["json", "jsonl", "ndjson", "geojson"].includes(extension) || mime.includes("json")) return "json";
  if (mime.startsWith("text/") || ["txt", "md", "log", "xml", "yaml", "yml", "srt", "vtt"].includes(extension)) return "text";
  if (["zip", "tar", "gz", "tgz", "7z", "rar"].includes(extension) || mime.includes("zip") || mime.includes("compressed")) return "archive";
  return "unsupported";
}

function formatLocalFileSize(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getPreviewRecordSummary(file: LocalPreviewFile) {
  const summaries: Record<MultimodalPreviewKind, string> = {
    image: "1 张 · 原始分辨率",
    audio: "1 段 · 可播放",
    video: "1 段 · 可播放",
    pdf: "PDF · 可翻阅",
    table: "已识别字段与样例",
    json: "已识别数据结构",
    text: "已识别文本内容",
    archive: "已读取文件清单",
    unsupported: "已识别文件元数据",
  };
  return summaries[file.kind];
}

function parseDelimitedPreview(text: string, name: string) {
  const delimiter = name.toLowerCase().endsWith(".tsv") ? "\t" : ",";
  return text.trim().split(/\r?\n/).filter(Boolean).slice(0, 12).map((line) => {
    const cells: string[] = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === delimiter && !quoted) {
        cells.push(value);
        value = "";
      } else {
        value += character;
      }
    }
    cells.push(value);
    return cells.slice(0, 10);
  });
}

function MultimodalPreview({
  file,
  files,
  onSelect,
  onClose,
  onRemove,
  notify,
}: {
  file: LocalPreviewFile;
  files: LocalPreviewFile[];
  onSelect: (id: string) => void;
  onClose: () => void;
  onRemove: (file: LocalPreviewFile) => void;
  notify: Notify;
}) {
  const shouldReadText = Boolean(file.file && ["table", "json", "text"].includes(file.kind));
  const [previewText, setPreviewText] = useState("");
  const [textLoading, setTextLoading] = useState(shouldReadText);
  const [textError, setTextError] = useState("");
  const currentIndex = files.findIndex((item) => item.id === file.id);
  const canPrevious = currentIndex > 0;
  const canNext = currentIndex >= 0 && currentIndex < files.length - 1;

  useEffect(() => {
    if (!file.file || !shouldReadText) return;
    let cancelled = false;
    file.file.slice(0, 384 * 1024).text().then((content) => {
      if (!cancelled) setPreviewText(content);
    }).catch(() => {
      if (!cancelled) setTextError("无法读取文本内容，请确认文件编码或格式是否受浏览器支持。");
    }).finally(() => {
      if (!cancelled) setTextLoading(false);
    });
    return () => { cancelled = true; };
  }, [file, shouldReadText]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && canPrevious) onSelect(files[currentIndex - 1].id);
      if (event.key === "ArrowRight" && canNext) onSelect(files[currentIndex + 1].id);
    }
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [canNext, canPrevious, currentIndex, files, onClose, onSelect]);

  function downloadOriginal() {
    if (!file.objectUrl) {
      notify("预置演示记录只包含预览样例，请导入原始文件后下载");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = file.objectUrl;
    anchor.download = file.name;
    anchor.click();
    notify(`${file.name} 已开始下载`);
  }

  function openOriginal() {
    if (!file.objectUrl) {
      notify("预置演示记录未保存原始字节，请导入本地文件后打开");
      return;
    }
    window.open(file.objectUrl, "_blank", "noopener,noreferrer");
  }

  const seedTableRows = [
    ["question_id", "document", "question", "answer", "modality", "quality"],
    ["QA-000381", "2025年度报告.pdf", "报告期内营业收入是多少？", "86.42亿元", "文本 + PDF", "通过"],
    ["QA-000382", "2025年度报告.pdf", "研发投入同比变化？", "同比增长12.8%", "文本 + PDF", "通过"],
    ["QA-000383", "财务报表.xlsx", "经营现金流净额？", "9.31亿元", "文本 + 表格", "待复核"],
    ["QA-000384", "路演录音.wav", "管理层如何判断市场？", "需求处于恢复阶段", "音频 + 文本", "通过"],
  ];
  const tableRows = previewText ? parseDelimitedPreview(previewText, file.name) : seedTableRows;
  const seedJson = `{"id":"MM-01821","image":"basketball/01821.jpg","labels":["篮球","运动员","篮筐"],"bbox":[426,118,902,814],"review":"passed"}\n{"id":"MM-01822","video":"games/01822.mp4","audio":"games/01822.wav","transcript":"最后十秒完成反超","quality_score":0.967}\n{"id":"MM-01823","document":"reports/2025.pdf","question":"核心业务收入是多少？","answer":"86.42亿元","evidence_page":42}`;
  const archiveEntries = [
    ["images/train/000001.jpg", "JPEG 图像", "2.8 MB"],
    ["images/train/000002.jpg", "JPEG 图像", "3.1 MB"],
    ["annotations/train.jsonl", "JSONL 标注", "8.6 MB"],
    ["metadata/dataset.yaml", "YAML 元数据", "12 KB"],
    ["README.md", "Markdown 文档", "6 KB"],
  ];

  let previewContent: React.ReactNode;
  if (file.kind === "image") {
    previewContent = file.objectUrl
      ? <div className="media-preview image-preview">
          {/* Blob URLs are browser-local preview sources and cannot use an image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file.objectUrl} alt={file.name} />
        </div>
      : <div className="media-preview-placeholder image"><UiIcon icon={FileImage} size={52} /><strong>图像原始画面预览</strong><p>导入 JPG、PNG、WebP、GIF 或 SVG 后，将按原始宽高比显示并支持浏览器缩放。</p><span>演示记录 · 3840 × 2160 · sRGB</span></div>;
  } else if (file.kind === "video") {
    previewContent = file.objectUrl
      ? <div className="media-preview video-preview"><video src={file.objectUrl} controls preload="metadata"><track kind="captions" label="原始视频未提供字幕" />当前浏览器不支持视频播放。</video></div>
      : <div className="media-preview-placeholder video"><UiIcon icon={FileVideo} size={52} /><strong>视频时间轴预览</strong><p>导入 MP4、WebM、MOV 后可在线播放、拖动时间轴并全屏查看。</p><span>演示记录 · 00:42 · 1920 × 1080 · 25 FPS</span></div>;
  } else if (file.kind === "audio") {
    previewContent = <div className="audio-preview-shell"><div className="audio-preview-heading"><span><UiIcon icon={FileAudio} size={24} /></span><div><strong>{file.name}</strong><small>波形概览 · 00:38 / 16 kHz / 单声道</small></div></div><div className="audio-waveform" aria-label="音频波形预览">{Array.from({ length: 72 }, (_, index) => <i key={index} style={{ height: `${18 + ((index * 17) % 64)}%` }} />)}</div>{file.objectUrl ? <audio src={file.objectUrl} controls preload="metadata"><track kind="captions" label="原始音频未提供文字稿" />当前浏览器不支持音频播放。</audio> : <div className="media-demo-tip">演示记录只展示波形；导入 WAV、MP3、M4A 或 OGG 后可直接播放。</div>}</div>;
  } else if (file.kind === "pdf") {
    previewContent = file.objectUrl
      ? <iframe className="pdf-native-preview" title={`${file.name} PDF 预览`} src={file.objectUrl} />
      : <div className="pdf-demo-preview"><article><header><span>内部制度文件</span><b>第 1 / 380 页</b></header><h2>高质量数据集建设与评估管理规范</h2><p>第一章 总则</p><p>第一条 为规范高质量数据集的采集、治理、标注、评估与交付流程，建立统一的质量标准、权限边界与审计机制，制定本规范。</p><p>第二条 数据集应具备完整、准确、一致、可追溯、安全合规等基本质量属性，并通过规定的评估组件与发布门禁。</p><h3>第二章 质量评估要求</h3><p>评估任务应明确数据版本、抽样方法、执行规则和通过阈值。评估结果与问题样本须纳入闭环处置并保存审计记录。</p></article></div>;
  } else if (file.kind === "table") {
    previewContent = <div className="structured-preview">{textLoading ? <div className="preview-loading"><RefreshCw className="ui-icon" size={18} />正在解析表格样例…</div> : textError ? <div className="preview-error">{textError}</div> : <table><thead><tr>{(tableRows[0] ?? []).map((cell, index) => <th key={`${cell}-${index}`}>{cell || `字段 ${index + 1}`}</th>)}</tr></thead><tbody>{tableRows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{(tableRows[0] ?? row).map((_, cellIndex) => <td key={cellIndex}>{row[cellIndex] || "--"}</td>)}</tr>)}</tbody></table>}<footer>为保证浏览器性能，在线预览最多显示前 11 行、前 10 个字段。</footer></div>;
  } else if (file.kind === "json") {
    previewContent = <div className="code-preview">{textLoading ? <div className="preview-loading"><RefreshCw className="ui-icon" size={18} />正在解析 JSON 结构…</div> : textError ? <div className="preview-error">{textError}</div> : <pre>{previewText || seedJson}</pre>}<footer><span>JSONL</span>已格式化显示前 384 KB 内容</footer></div>;
  } else if (file.kind === "text") {
    previewContent = <div className="code-preview text"><pre>{textLoading ? "正在读取文本内容…" : textError || previewText || "高质量数据集说明\n\n本数据用于平台治理、质量评估和模型能力验证。\n所有样本均已完成脱敏、版本登记和来源授权检查。"}</pre><footer><span>UTF-8</span>自动换行 · 最多读取前 384 KB</footer></div>;
  } else if (file.kind === "archive") {
    previewContent = <div className="archive-preview"><header><div><UiIcon icon={FileArchive} size={22} /><span><strong>压缩包文件清单</strong><small>仅查看目录，不在浏览器中解压原始数据</small></span></div><b>2,480 个文件</b></header><table><thead><tr><th>相对路径</th><th>类型</th><th>大小</th></tr></thead><tbody>{archiveEntries.map((entry) => <tr key={entry[0]}><td>{entry[0]}</td><td>{entry[1]}</td><td>{entry[2]}</td></tr>)}</tbody></table></div>;
  } else {
    previewContent = <div className="media-preview-placeholder unsupported"><UiIcon icon={FileText} size={48} /><strong>当前格式暂不支持内容级预览</strong><p>已完成文件名、大小、MIME 类型和更新时间识别，可下载原文件或加入数据集。</p></div>;
  }

  return (
    <div className="dialog-backdrop multimodal-preview-backdrop">
      <button className="dialog-dismiss" aria-label="关闭多模态预览" onClick={onClose} />
      <section className="multimodal-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="multimodal-preview-title">
        <header>
          <div><span className={`local-file-icon ${file.kind}`}><UiIcon icon={previewKindIcon[file.kind]} size={18} /></span><div><h2 id="multimodal-preview-title">{file.name}</h2><p>{file.format} · {file.size} · {file.records}</p></div></div>
          <div><Status tone={file.status === "可用" ? "green" : file.status === "解析中" ? "blue" : "orange"}>{file.status}</Status><button aria-label="关闭预览" onClick={onClose}><UiIcon icon={X} size={17} /></button></div>
        </header>
        <div className="multimodal-preview-toolbar">
          <span><UiIcon icon={Eye} />内容预览</span><em>{previewKindLabel[file.kind]}</em><i />
          <button disabled={!canPrevious} onClick={() => onSelect(files[currentIndex - 1].id)}><UiIcon icon={ArrowLeft} />上一个</button>
          <button disabled={!canNext} onClick={() => onSelect(files[currentIndex + 1].id)}>下一个<UiIcon icon={ChevronRight} /></button>
          <button onClick={openOriginal}><UiIcon icon={ExternalLink} />新窗口打开</button>
          <button onClick={downloadOriginal}><UiIcon icon={Download} />下载原文件</button>
        </div>
        <div className="multimodal-preview-body">
          <main className={`multimodal-preview-stage kind-${file.kind}`}>{previewContent}</main>
          <aside className="multimodal-preview-meta">
            <section><h3>文件信息</h3><dl><dt>文件名称</dt><dd>{file.name}</dd><dt>内容类型</dt><dd>{file.mime}</dd><dt>文件大小</dt><dd>{file.size}</dd><dt>更新时间</dt><dd>{file.updated}</dd><dt>解析结果</dt><dd>{file.records}</dd></dl></section>
            <section><h3>预览能力</h3><ul><li><UiIcon icon={CircleCheck} />浏览器本地读取</li><li><UiIcon icon={CircleCheck} />原始内容不外传</li><li><UiIcon icon={CircleCheck} />支持前后样本切换</li><li><UiIcon icon={file.objectUrl ? CircleCheck : CircleAlert} />{file.objectUrl ? "原始字节已加载" : "演示记录仅含样例"}</li></ul></section>
            <section className="preview-security-note"><UiIcon icon={ShieldCheck} /><p><strong>本地安全预览</strong><span>文件内容仅在当前浏览器会话读取，不会自动上传到外部服务。</span></p></section>
          </aside>
        </div>
        <footer><span>文件 {currentIndex + 1} / {files.length} · 可使用键盘 ← → 切换、Esc 关闭</span><div><button className="reuse-secondary danger-link" onClick={() => onRemove(file)}><UiIcon icon={Trash2} />移除文件</button><button className="reuse-secondary" onClick={() => notify(`${file.name} 已加入质量评估样本集`)}><UiIcon icon={ClipboardCheck} />加入评估</button><button className="reuse-primary" onClick={() => notify(`${file.name} 已加入数据集创建向导`)}><UiIcon icon={Plus} />创建数据集</button></div></footer>
      </section>
    </div>
  );
}

function LocalDataManager({ notify }: { notify: Notify }) {
  const [files, setFiles] = useState<LocalPreviewFile[]>(defaultLocalPreviewFiles);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"列表" | "卡片">("列表");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());
  const filtered = files.filter((file) => file.name.toLowerCase().includes(search.toLowerCase()));
  const previewFile = files.find((file) => file.id === previewId) ?? null;

  useEffect(() => () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current.clear();
  }, []);

  function addLocalFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;
    const added = selected.map((file, index) => {
      const kind = inferPreviewKind(file.name, file.type);
      const objectUrl = URL.createObjectURL(file);
      objectUrls.current.add(objectUrl);
      return {
        id: `local-${Date.now()}-${index}-${file.name}`,
        name: file.name,
        format: `${getFileExtension(file.name)} / ${previewKindLabel[kind]}`,
        size: formatLocalFileSize(file.size),
        records: "解析中",
        updated: "刚刚",
        status: "解析中" as const,
        kind,
        mime: file.type || "application/octet-stream",
        objectUrl,
        file,
      };
    });
    setFiles((current) => [...added, ...current]);
    event.target.value = "";
    notify(`已导入 ${added.length} 个本地文件，正在解析`);
    window.setTimeout(() => {
      const ids = new Set(added.map((file) => file.id));
      setFiles((current) => current.map((file) => ids.has(file.id) ? { ...file, records: getPreviewRecordSummary(file), status: "可用" } : file));
    }, 1400);
  }

  function openPreview(file: LocalPreviewFile) {
    setPreviewId(file.id);
    notify(`已打开 ${file.name} 的多模态预览`);
  }

  function removeLocalFile(file: LocalPreviewFile) {
    if (file.objectUrl) {
      URL.revokeObjectURL(file.objectUrl);
      objectUrls.current.delete(file.objectUrl);
    }
    setFiles((current) => current.filter((item) => item.id !== file.id));
    setPreviewId((current) => current === file.id ? null : current);
    notify(`${file.name} 已从当前列表移除`);
  }

  return (
    <article className="white-panel inventory-workspace local-manager-workspace">
      <div className="reuse-panel-head inventory-head">
        <div><h2>本地数据管理</h2><p>上传、解析、在线预览和管理用于治理与评估的多模态数据</p></div>
        <div><label className="reuse-search"><UiIcon icon={Search} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索文件名称" /></label><div className="view-switch"><button aria-label="列表视图" className={view === "列表" ? "active" : ""} onClick={() => setView("列表")}><UiIcon icon={Rows3} /></button><button aria-label="卡片视图" className={view === "卡片" ? "active" : ""} onClick={() => setView("卡片")}><UiIcon icon={Grid2X2} /></button></div><button className="reuse-primary" onClick={() => input.current?.click()}><UiIcon icon={Upload} />导入本地文件</button></div>
      </div>
      <button className="local-dropzone" onClick={() => input.current?.click()}><span><UiIcon icon={Upload} size={20} /></span><div><strong>点击选择本地文件</strong><p>支持 CSV、Excel、JSON、PDF、图像、音频、视频及 ZIP，单文件建议不超过 2 GB</p></div><b>浏览文件</b></button>
      <input ref={input} className="visually-hidden" type="file" multiple onChange={addLocalFiles} />
      <div className="local-preview-capabilities" aria-label="多模态在线预览能力">
        <span><UiIcon icon={FileImage} />图片</span><span><UiIcon icon={FileAudio} />音频</span><span><UiIcon icon={FileVideo} />视频</span><span><UiIcon icon={FileText} />PDF / 文档</span><span><UiIcon icon={FileSpreadsheet} />表格</span><span><UiIcon icon={FileJson} />文本 / JSON</span><b><UiIcon icon={Eye} />浏览器本地安全预览</b>
      </div>
      <div className="local-summary"><span>文件总数 <b>{files.length}</b></span><span>已解析 <b>{files.filter((file) => file.status === "可用").length}</b></span><span>存储占用 <b>1.65 GB</b></span><span>待处理 <b>{files.filter((file) => file.status !== "可用").length}</b></span></div>
      {view === "列表" ? (
        <div className="reuse-table-wrap"><table className="reuse-table local-file-table"><thead><tr><th>文件名称</th><th>格式 / 类型</th><th>大小</th><th>数据量</th><th>更新时间</th><th>解析状态</th><th>操作</th></tr></thead><tbody>{filtered.map((file) => (
          <tr key={file.id}><td><div className="local-file-name"><span className={`local-file-icon ${file.kind}`}><UiIcon icon={previewKindIcon[file.kind]} size={16} /></span><strong>{file.name}</strong></div></td><td>{file.format}</td><td>{file.size}</td><td>{file.records}</td><td>{file.updated}</td><td><Status tone={file.status === "可用" ? "green" : file.status === "解析中" ? "blue" : "orange"}>{file.status}</Status></td><td><button className="reuse-link preview-link" onClick={() => openPreview(file)}><UiIcon icon={Eye} />预览</button>{" "}<button className="reuse-link" onClick={() => notify(`${file.name} 已加入数据集创建向导`)}>创建数据集</button>{" "}<button className="reuse-link danger-link" onClick={() => removeLocalFile(file)}>移除</button></td></tr>
        ))}</tbody></table>{filtered.length === 0 && <div className="table-empty">未找到匹配的本地文件</div>}</div>
      ) : (
        <div className="local-file-grid">{filtered.map((file) => <button key={file.id} onClick={() => openPreview(file)}><span className={`local-file-icon ${file.kind}`}><UiIcon icon={previewKindIcon[file.kind]} size={18} /></span><strong>{file.name}</strong><p>{file.format} · {file.size}</p><small>{file.records} · {file.updated}</small><span className="local-card-preview"><UiIcon icon={Eye} />在线预览</span><Status tone={file.status === "可用" ? "green" : file.status === "解析中" ? "blue" : "orange"}>{file.status}</Status></button>)}</div>
      )}
      {previewFile && <MultimodalPreview key={previewFile.id} file={previewFile} files={files} onSelect={setPreviewId} onClose={() => setPreviewId(null)} onRemove={removeLocalFile} notify={notify} />}
    </article>
  );
}

function SmartInventory({ notify }: { notify: Notify }) {
  const domains = [
    { name: "客户域", icon: "客", assets: 128, tables: 42, coverage: 94, color: "blue" },
    { name: "交易域", icon: "交", assets: 216, tables: 68, coverage: 88, color: "cyan" },
    { name: "产品域", icon: "产", assets: 96, tables: 31, coverage: 81, color: "violet" },
    { name: "风控域", icon: "风", assets: 74, tables: 24, coverage: 76, color: "orange" },
  ];
  const [selectedDomain, setSelectedDomain] = useState(domains[0].name);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(100);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const next = Math.min(100, progressRef.current + 5);
      progressRef.current = next;
      setProgress(next);
      if (next === 100) {
        window.clearInterval(timer);
        setRunning(false);
        notify("智能数据盘点完成，发现 17 个新增资产");
      }
    }, 230);
    return () => window.clearInterval(timer);
  }, [notify, running]);

  const selected = domains.find((domain) => domain.name === selectedDomain) ?? domains[0];
  return (
    <article className="white-panel inventory-workspace smart-inventory-workspace">
      <div className="reuse-panel-head inventory-head"><div><h2>智能数据盘点</h2><p>自动识别数据资产、业务领域、敏感等级与上下游关系</p></div><div><span className="inventory-updated">上次盘点：2026-08-22 23:18</span><button className="reuse-primary" disabled={running} onClick={() => { setProgress(0); setRunning(true); }}>{running ? `盘点中 ${progress}%` : "◈ 开始智能盘点"}</button></div></div>
      {running && <div className="workspace-progress"><Progress value={progress} /><span>正在识别数据源、表结构与业务语义...</span></div>}
      <div className="inventory-kpis asset-kpis">{[['数据资产', '514', '+17 新增'], ['数据表', '165', '12 个数据源'], ['数据字段', '3,842', '画像完成 92%'], ['敏感字段', '286', '已分级 100%'], ['血缘关系', '1,208', '+64 条关系']].map((item, index) => <div key={item[0]}><span className={`kpi-icon k${index % 4}`}>{['资', '表', '列', '敏', '链'][index]}</span><p>{item[0]}</p><strong>{item[1]}</strong><small>{item[2]}</small></div>)}</div>
      <div className="domain-grid">{domains.map((domain) => <button key={domain.name} className={selectedDomain === domain.name ? "active" : ""} onClick={() => setSelectedDomain(domain.name)}><span className={domain.color}>{domain.icon}</span><div><strong>{domain.name}</strong><p>{domain.assets} 个资产 · {domain.tables} 张表</p><div className="domain-progress"><i style={{ width: `${domain.coverage}%` }} /></div><small>盘点覆盖率 {domain.coverage}%</small></div><b>›</b></button>)}</div>
      <div className="inventory-detail-grid">
        <section className="sub-panel asset-tree-panel"><header><div><h3>{selected.name}资产目录</h3><p>{selected.assets} 个资产，按语义自动归类</p></div><button className="reuse-link" onClick={() => notify(`${selected.name}目录已展开到字段级`)}><UiIcon icon={GitBranch} />展开全部</button></header><div className="asset-tree">{[['基础信息', 26, '客户基本资料、身份标识'], ['行为记录', 34, '访问、咨询、服务轨迹'], ['价值指标', 18, '贡献度、生命周期价值'], ['标签特征', 50, '偏好、等级、风险标签']].map((item) => <button key={item[0]} onClick={() => notify(`已展开${selected.name}${item[0]}目录，共 ${item[1]} 个资产`)}><span><UiIcon icon={ChevronRight} size={12} /></span><i><UiIcon icon={FolderKanban} size={14} /></i><div><strong>{item[0]}</strong><small>{item[2]}</small></div><b>{item[1]}</b></button>)}</div></section>
        <section className="sub-panel asset-quality-panel"><header><div><h3>盘点质量</h3><p>资产识别与治理准备度</p></div><Status>整体良好</Status></header>{[['语义识别', 96], ['字段画像', 92], ['敏感识别', 100], ['血缘覆盖', 84], ['责任人绑定', 71]].map((item) => <div className="quality-bar" key={item[0]}><span>{item[0]}</span><div><i style={{ width: `${item[1]}%` }} /></div><b>{item[1]}%</b></div>)}<button className="reuse-secondary" onClick={() => notify("已生成资产盘点报告")}>生成盘点报告</button></section>
      </div>
      <section className="sub-panel inventory-history"><header><div><h3>最近盘点记录</h3><p>保留最近 30 次盘点结果</p></div></header><div className="reuse-table-wrap"><table className="reuse-table compact-table"><thead><tr><th>任务名称</th><th>数据源</th><th>发现资产</th><th>新增 / 变化</th><th>执行时间</th><th>耗时</th><th>状态</th></tr></thead><tbody>{[['全域数据资产盘点-0822', '全部数据源', '514', '+17 / 23', '2026-08-22 23:18', '18m 42s'], ['生产库增量盘点-0821', '生产业务库', '128', '+4 / 8', '2026-08-21 23:00', '6m 18s'], ['知识文档仓盘点-0820', '知识文档仓', '96', '+12 / 2', '2026-08-20 02:10', '11m 05s']].map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}<td><Status>已完成</Status></td></tr>)}</tbody></table></div></section>
    </article>
  );
}

function nextCleaningVersion(task: CleaningTaskRow) {
  const match = task.sourceVersion.match(/v(\d+)\.(\d+)/i);
  if (match) return `v${match[1]}.${Number(match[2]) + task.versions.length}`;
  return `clean-v1.${task.versions.length}`;
}

function SmartCleaning({
  tasks,
  initialTaskId,
  updateTask,
  notify,
}: {
  tasks: CleaningTaskRow[];
  initialTaskId: string;
  updateTask: (id: string, patch: Partial<CleaningTaskRow>) => void;
  notify: Notify;
}) {
  const ruleCatalog = [
    { name: "重复数据识别", desc: "基于主键与语义相似度去重" },
    { name: "空值智能填充", desc: "按字段类型和上下文推荐填充值" },
    { name: "格式标准化", desc: "统一日期、电话、证件与金额格式" },
    { name: "异常值处理", desc: "识别极值、离群点和不合理范围" },
    { name: "敏感信息脱敏", desc: "对手机号、证件号、姓名进行脱敏" },
  ];
  const firstTask = tasks.find((task) => task.id === initialTaskId) ?? tasks[0];
  const [taskId, setTaskId] = useState(firstTask?.id ?? "");
  const [rules, setRules] = useState(() => ruleCatalog.map((rule) => ({ ...rule, enabled: firstTask?.rules.includes(rule.name) ?? false })));
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(firstTask?.progress ?? 0);
  const progressRef = useRef(progress);
  const [view, setView] = useState<"任务执行" | "版本管理">("任务执行");
  const [compareBaseVersion, setCompareBaseVersion] = useState(firstTask?.versions.at(-1)?.version ?? "");
  const [compareTargetVersion, setCompareTargetVersion] = useState(firstTask?.activeVersion ?? "");
  const [rollbackTarget, setRollbackTarget] = useState<CleaningVersionRow | null>(null);
  const selectedTask = tasks.find((task) => task.id === taskId) ?? tasks[0];
  const enabledCount = rules.filter((rule) => rule.enabled).length;

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!running || !selectedTask) return;
    const timer = window.setInterval(() => {
      const next = Math.min(100, progressRef.current + 6);
      progressRef.current = next;
      setProgress(next);
      updateTask(selectedTask.id, { progress: next, status: next === 100 ? "已完成" : "运行中" });
      if (next === 100) {
        window.clearInterval(timer);
        setRunning(false);
        const outputVersion = nextCleaningVersion(selectedTask);
        const parentVersion = selectedTask.versions.find((version) => version.version === selectedTask.activeVersion) ?? selectedTask.versions[0];
        const outputIssues = Math.max(0, Math.round(parentVersion.issues * (enabledCount >= 4 ? 0.03 : Math.max(0.08, 0.22 - enabledCount * 0.035))));
        const outputQuality = parentVersion.version === selectedTask.sourceVersion ? 98.5 : Math.min(99.8, Number((parentVersion.quality + 0.4).toFixed(1)));
        const version: CleaningVersionRow = {
          id: `${selectedTask.id}-${outputVersion}-${Date.now()}`,
          version: outputVersion,
          parent: selectedTask.activeVersion,
          created: "刚刚",
          operator: "高质量数据评估演示",
          records: selectedTask.recordCount,
          issues: outputIssues,
          quality: outputQuality,
          change: `执行 ${enabledCount} 条清洗规则`,
        };
        updateTask(selectedTask.id, { progress: 100, status: "已完成", outputVersion, activeVersion: outputVersion, versions: [version, ...selectedTask.versions] });
        setCompareBaseVersion(selectedTask.activeVersion);
        setCompareTargetVersion(outputVersion);
        notify(`${selectedTask.name} 清洗完成，已生成版本 ${outputVersion}`);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [enabledCount, notify, running, selectedTask, updateTask]);

  if (!selectedTask) return <article className="white-panel inventory-workspace"><div className="table-empty">暂无清洗任务，请先从数据探查创建任务</div></article>;

  const emptyCount = selectedTask.samples.filter((sample) => sample.problem === "空值").length;
  const formatCount = selectedTask.samples.filter((sample) => sample.problem.includes("格式") || sample.problem.includes("日期")).length;
  const baseVersion = selectedTask.versions.find((version) => version.version === compareBaseVersion) ?? selectedTask.versions.at(-1)!;
  const targetVersion = selectedTask.versions.find((version) => version.version === compareTargetVersion) ?? selectedTask.versions[0];
  const qualityDelta = Number((targetVersion.quality - baseVersion.quality).toFixed(1));
  const issueDelta = targetVersion.issues - baseVersion.issues;
  const recordDelta = targetVersion.records - baseVersion.records;
  const ruleHitDelta = Math.max(0, baseVersion.issues - targetVersion.issues);

  function selectCleaningTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    setTaskId(id);
    setProgress(task.progress);
    setRunning(task.status === "运行中");
    setRules(ruleCatalog.map((rule) => ({ ...rule, enabled: task.rules.includes(rule.name) })));
    setView("任务执行");
    setCompareBaseVersion(task.versions.at(-1)?.version ?? task.sourceVersion);
    setCompareTargetVersion(task.activeVersion);
    setRollbackTarget(null);
  }

  function applyRules(nextRules: typeof rules) {
    setRules(nextRules);
    updateTask(selectedTask.id, { rules: nextRules.filter((rule) => rule.enabled).map((rule) => rule.name) });
  }

  function startCleaning() {
    setProgress(0);
    setRunning(true);
    setView("任务执行");
    updateTask(selectedTask.id, { progress: 0, status: "运行中" });
    notify(`${selectedTask.name} 已开始执行 ${enabledCount} 条清洗规则`);
  }

  function rollbackVersion() {
    if (!rollbackTarget) return;
    updateTask(selectedTask.id, { activeVersion: rollbackTarget.version, outputVersion: rollbackTarget.version });
    setCompareTargetVersion(rollbackTarget.version);
    setRollbackTarget(null);
    notify(`${selectedTask.name} 当前版本已切换为 ${rollbackTarget.version}，历史版本均已保留`);
  }

  return (
    <article className="white-panel inventory-workspace cleaning-workspace">
      <div className="reuse-panel-head inventory-head"><div><h2>智能数据清洗</h2><p>基于探查结果编排清洗规则，预览影响并生成可追溯的新版本</p></div><div><label className="inventory-select">清洗任务<select value={selectedTask.id} disabled={running} onChange={(event) => selectCleaningTask(event.target.value)}>{tasks.map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}</select></label><button className="reuse-primary" disabled={running || enabledCount === 0} onClick={startCleaning}><UiIcon icon={running ? RefreshCw : Play} />{running ? `清洗中 ${progress}%` : selectedTask.status === "已完成" ? "重新执行" : "开始智能清洗"}</button></div></div>
      <div className="cleaning-task-context"><span><small>目标数据集</small><strong>{selectedTask.dataset}</strong></span><span><small>来源</small><strong>{selectedTask.source} / {selectedTask.table}</strong></span><span><small>源版本</small><strong>{selectedTask.sourceVersion}</strong></span><span><small>当前版本</small><strong>{selectedTask.activeVersion}</strong></span><Status tone={selectedTask.status === "已完成" ? "green" : running ? "blue" : "gray"}>{running ? "运行中" : selectedTask.status}</Status></div>
      <nav className="cleaning-mode-tabs" aria-label="智能清洗视图">
        <button className={view === "任务执行" ? "active" : ""} onClick={() => setView("任务执行")}><UiIcon icon={Play} />任务执行</button>
        <button className={view === "版本管理" ? "active" : ""} onClick={() => setView("版本管理")}><UiIcon icon={GitBranch} />版本管理 <b>{selectedTask.versions.length}</b></button>
      </nav>
      {view === "任务执行" && <>
      <div className="cleaning-kpis">{[["待处理问题", selectedTask.issueCount.toLocaleString(), `涉及 ${selectedTask.fields.length} 个字段`], ["问题样本", selectedTask.samples.length.toString(), "已从探查结果保留"], ["空值样本", emptyCount.toString(), "已匹配填充规则"], ["格式异常", formatCount.toString(), "已匹配标准化规则"], ["预计质量提升", "+4.8", "从 93.7 到 98.5"]].map((item, index) => <div key={item[0]} className={index === 4 ? "highlight" : ""}><span>{item[0]}</span><strong>{item[1]}</strong><small>{item[2]}</small></div>)}</div>
      <div className="cleaning-grid">
        <section className="sub-panel rule-panel"><header><div><h3>清洗规则</h3><p>已启用 {enabledCount} / {rules.length} 项</p></div><button className="reuse-link" onClick={() => applyRules(rules.map((rule) => ({ ...rule, enabled: true })))}>全部启用</button></header><div className="rule-list">{rules.map((rule, index) => <div key={rule.name}><span className={`rule-icon r${index}`}>{["重", "空", "格", "异", "敏"][index]}</span><div><strong>{rule.name}</strong><small>{rule.desc}</small></div><button className={`toggle-switch ${rule.enabled ? "on" : ""}`} aria-label={`${rule.enabled ? "关闭" : "启用"}${rule.name}`} onClick={() => applyRules(rules.map((item) => item.name === rule.name ? { ...item, enabled: !item.enabled } : item))}><i /></button></div>)}</div></section>
        <section className="sub-panel cleaning-run-panel"><header><div><h3>执行流程</h3><p>{running ? "正在处理数据" : progress === 100 ? `已生成 ${selectedTask.outputVersion}` : "等待开始"}</p></div><Status tone={running ? "blue" : progress === 100 ? "green" : "gray"}>{running ? "运行中" : progress === 100 ? "已完成" : "未运行"}</Status></header><div className="cleaning-progress-ring" style={{ "--score": `${progress * 3.6}deg` } as React.CSSProperties}><strong>{progress}%</strong><span>当前进度</span></div><div className="cleaning-steps">{[["数据备份", 10], ["规则校验", 25], ["执行清洗", 70], ["质量复检", 90], ["生成版本", 100]].map((step, index) => <div key={step[0]} className={progress >= step[1] ? "done" : running && progress < step[1] && (index === 0 || progress >= ([0, 10, 25, 70, 90][index])) ? "active" : ""}><i>{progress >= step[1] ? "✓" : index + 1}</i><span>{step[0]}</span></div>)}</div><p className="cleaning-note">清洗过程保留 {selectedTask.sourceVersion}，不会覆盖源数据；完成后生成独立版本。</p></section>
      </div>
      <section className="sub-panel cleaning-preview"><header><div><h3>问题与修复预览</h3><p>{selectedTask.samples.length} 条探查问题样本已随任务保留</p></div><button className="reuse-link" onClick={() => notify(`${selectedTask.name} 修复预览已重新计算`)}>重新预览</button></header><div className="reuse-table-wrap"><table className="reuse-table compact-table"><thead><tr><th>字段 / 记录</th><th>问题类型</th><th>原始值</th><th>建议修复</th><th>命中规则</th><th>置信度</th></tr></thead><tbody>{selectedTask.samples.map((sample) => <tr key={sample.id}><td><strong>{sample.field}</strong> #{sample.id.replace("issue-", "")}</td><td>{sample.problem}</td><td className="before-value">{sample.original}</td><td className="after-value">{sample.suggestion}</td><td>{sample.rule}</td><td>{sample.confidence}</td></tr>)}</tbody></table>{selectedTask.samples.length === 0 && <div className="table-empty">当前任务没有保留问题样本</div>}</div></section>
      </>}
      {view === "版本管理" && <section className="cleaning-version-workspace">
        <div className="version-compare-toolbar">
          <div><h3><UiIcon icon={Rows3} />版本结果对比</h3><p>选择两个不可变版本，核对质量、问题与记录变化</p></div>
          <div><label>基准版本<select value={baseVersion.version} onChange={(event) => setCompareBaseVersion(event.target.value)}>{selectedTask.versions.map((version) => <option key={version.id} value={version.version}>{version.version}</option>)}</select></label><span>→</span><label>对比版本<select value={targetVersion.version} onChange={(event) => setCompareTargetVersion(event.target.value)}>{selectedTask.versions.map((version) => <option key={version.id} value={version.version}>{version.version}</option>)}</select></label></div>
        </div>
        <div className="version-compare-summary">
          <span><small>数据质量</small><strong>{targetVersion.quality}%</strong><em className={qualityDelta >= 0 ? "positive" : "negative"}>{qualityDelta >= 0 ? "+" : ""}{qualityDelta}</em></span>
          <span><small>问题记录</small><strong>{targetVersion.issues.toLocaleString()}</strong><em className={issueDelta <= 0 ? "positive" : "negative"}>{issueDelta > 0 ? "+" : ""}{issueDelta.toLocaleString()}</em></span>
          <span><small>有效记录</small><strong>{targetVersion.records.toLocaleString()}</strong><em>{recordDelta >= 0 ? "+" : ""}{recordDelta.toLocaleString()}</em></span>
          <span><small>当前生效版本</small><strong>{selectedTask.activeVersion}</strong><Status>可回溯</Status></span>
        </div>
        <section className="sub-panel version-difference-panel"><header><div><h3>对比明细</h3><p>{baseVersion.version} → {targetVersion.version}</p></div><span className="version-immutable"><UiIcon icon={ShieldCheck} />版本内容不可变</span></header><div className="reuse-table-wrap"><table className="reuse-table compact-table"><thead><tr><th>指标</th><th>{baseVersion.version}</th><th>{targetVersion.version}</th><th>变化</th><th>判定</th></tr></thead><tbody>
          <tr><td><strong>问题记录</strong></td><td>{baseVersion.issues.toLocaleString()}</td><td>{targetVersion.issues.toLocaleString()}</td><td className={issueDelta <= 0 ? "version-change-positive" : "version-change-negative"}>{issueDelta > 0 ? "+" : ""}{issueDelta.toLocaleString()}</td><td><Status tone={issueDelta <= 0 ? "green" : "orange"}>{issueDelta <= 0 ? "改善" : "需复核"}</Status></td></tr>
          <tr><td><strong>数据质量</strong></td><td>{baseVersion.quality}%</td><td>{targetVersion.quality}%</td><td className={qualityDelta >= 0 ? "version-change-positive" : "version-change-negative"}>{qualityDelta >= 0 ? "+" : ""}{qualityDelta}</td><td><Status tone={qualityDelta >= 0 ? "green" : "orange"}>{qualityDelta >= 0 ? "提升" : "下降"}</Status></td></tr>
          <tr><td><strong>有效记录</strong></td><td>{baseVersion.records.toLocaleString()}</td><td>{targetVersion.records.toLocaleString()}</td><td>{recordDelta >= 0 ? "+" : ""}{recordDelta.toLocaleString()}</td><td><Status tone="blue">一致</Status></td></tr>
          <tr><td><strong>规则命中</strong></td><td>--</td><td>{ruleHitDelta.toLocaleString()}</td><td className="version-change-positive">已处理 {ruleHitDelta.toLocaleString()}</td><td><Status>已复检</Status></td></tr>
        </tbody></table></div></section>
        <section className="sub-panel version-history-panel"><header><div><h3>版本记录</h3><p>每次执行生成新版本；回滚仅切换当前指针</p></div><span>{selectedTask.versions.length} 个版本</span></header><div className="reuse-table-wrap"><table className="reuse-table compact-table"><thead><tr><th>版本</th><th>父版本</th><th>生成时间</th><th>操作人</th><th>记录 / 问题</th><th>质量</th><th>变更说明</th><th>状态与操作</th></tr></thead><tbody>{selectedTask.versions.map((version) => {
          const isActive = version.version === selectedTask.activeVersion;
          return <tr key={version.id} className={isActive ? "active-version-row" : ""}><td><strong>{version.version}</strong></td><td>{version.parent}</td><td>{version.created}</td><td>{version.operator}</td><td>{version.records.toLocaleString()} / {version.issues.toLocaleString()}</td><td><strong>{version.quality}%</strong></td><td>{version.change}</td><td>{isActive ? <Status>当前版本</Status> : <><button className="reuse-link" onClick={() => { setCompareBaseVersion(version.version); setCompareTargetVersion(selectedTask.activeVersion); }}>对比</button> <button className="reuse-link rollback-link" onClick={() => setRollbackTarget(version)}>回滚到此版本</button></>}</td></tr>;
        })}</tbody></table></div></section>
      </section>}
      {rollbackTarget && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="关闭回滚确认" onClick={() => setRollbackTarget(null)} /><div className="reuse-dialog version-rollback-dialog"><header><div><h2>确认切换当前版本</h2><p>{selectedTask.name}</p></div><button aria-label="关闭回滚确认" onClick={() => setRollbackTarget(null)}><UiIcon icon={X} /></button></header><section><span className="rollback-version-icon"><UiIcon icon={Undo2} size={20} /></span><div><h3>回滚到 {rollbackTarget.version}</h3><p>当前生效版本将从 <strong>{selectedTask.activeVersion}</strong> 切换到 <strong>{rollbackTarget.version}</strong>。已有版本记录和清洗结果不会删除，之后可再次切回。</p></div></section><footer><button className="reuse-secondary" onClick={() => setRollbackTarget(null)}>取消</button><button className="reuse-primary" onClick={rollbackVersion}><UiIcon icon={Undo2} />确认回滚</button></footer></div></div>}
    </article>
  );
}

function InventoryPage({
  initialSection,
  sources,
  cleaningTasks,
  openDialog,
  updateSource,
  createCleaningTask,
  updateCleaningTask,
  notify,
}: {
  initialSection: string;
  sources: SourceRow[];
  cleaningTasks: CleaningTaskRow[];
  openDialog: () => void;
  updateSource: (name: string, patch: Partial<SourceRow>) => void;
  createCleaningTask: (task: CleaningTaskDraft) => string;
  updateCleaningTask: (id: string, patch: Partial<CleaningTaskRow>) => void;
  notify: Notify;
}) {
  const [section, setSection] = useState(initialSection);
  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState(sources[0]?.name ?? "");
  const [editingSourceName, setEditingSourceName] = useState<string | null>(null);
  const [endpointDraft, setEndpointDraft] = useState("");
  const [strategyDraft, setStrategyDraft] = useState("");
  const [initialCleaningTaskId, setInitialCleaningTaskId] = useState(cleaningTasks[0]?.id ?? "");
  const timers = useRef<number[]>([]);
  const previousSourceCount = useRef(sources.length);
  const filtered = sources.filter((source) => source.name.toLowerCase().includes(search.toLowerCase()));
  const selected = sources.find((source) => source.name === selectedSource) ?? sources[0];
  const editingSource = sources.find((source) => source.name === editingSourceName);

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  useEffect(() => {
    if (sources.length > previousSourceCount.current && sources[0]) setSelectedSource(sources[0].name);
    previousSourceCount.current = sources.length;
  }, [sources]);

  function statusTone(status: SourceRow["status"]): "green" | "blue" | "orange" | "gray" {
    if (status === "正常") return "green";
    if (status === "测试中" || status === "同步中") return "blue";
    if (status === "异常") return "orange";
    return "gray";
  }

  function testSource(source: SourceRow) {
    if (source.status === "测试中" || source.status === "同步中") return;
    updateSource(source.name, { status: "测试中", progress: 20, syncResult: "正在验证网络、身份凭据和最小权限" });
    notify(`${source.name} 正在执行连接测试`);
    const timer = window.setTimeout(() => {
      const failed = !source.endpoint.trim() || source.endpoint.toLowerCase().includes("invalid");
      updateSource(source.name, failed
        ? { status: "异常", progress: 0, syncResult: "连接失败：请检查地址和访问凭据" }
        : { status: "正常", progress: 100, syncResult: "连接测试通过，可执行数据同步" });
      notify(failed ? `${source.name} 连接测试失败` : `${source.name} 连接测试成功`);
    }, 850);
    timers.current.push(timer);
  }

  function syncSource(source: SourceRow) {
    if (source.status !== "正常") {
      notify(`${source.name} 需先通过连接测试`);
      return;
    }
    updateSource(source.name, { status: "同步中", progress: 8, syncResult: "正在读取数据目录和增量位点" });
    notify(`${source.name} 同步任务已启动`);
    [28, 52, 76, 100].forEach((progress, index) => {
      const timer = window.setTimeout(() => {
        if (progress < 100) {
          updateSource(source.name, { progress, syncResult: progress < 50 ? "正在读取结构与元数据" : "正在写入数据资产目录" });
          return;
        }
        updateSource(source.name, {
          status: "正常",
          progress: 100,
          updated: "刚刚",
          summary: source.summary === "等待首次同步" ? "已识别 8 张表" : source.summary,
          scale: source.scale === "--" ? "1.6 GB" : source.scale,
          syncResult: "同步完成：新增 8 张表、24,680 条记录，失败 0 条",
        });
        notify(`${source.name} 同步完成，可进入数据探查`);
      }, 500 + index * 520);
      timers.current.push(timer);
    });
  }

  function openSourceEditor(source: SourceRow) {
    setEditingSourceName(source.name);
    setEndpointDraft(source.endpoint);
    setStrategyDraft(source.strategy);
  }

  function saveSourceConfiguration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSource) return;
    updateSource(editingSource.name, {
      endpoint: endpointDraft,
      strategy: strategyDraft,
      status: "测试中",
      progress: 20,
      syncResult: "配置已保存，正在重新验证连接",
    });
    setEditingSourceName(null);
    notify(`${editingSource.name} 配置已保存，正在重新验证`);
    const timer = window.setTimeout(() => {
      const failed = !endpointDraft.trim() || endpointDraft.toLowerCase().includes("invalid");
      updateSource(editingSource.name, failed
        ? { status: "异常", progress: 0, syncResult: "配置验证失败，请重新检查连接地址" }
        : { status: "正常", progress: 100, syncResult: "新配置验证通过，可立即同步" });
      notify(failed ? `${editingSource.name} 新配置验证失败` : `${editingSource.name} 新配置验证通过`);
    }, 900);
    timers.current.push(timer);
  }

  function createTaskFromExploration(task: CleaningTaskDraft) {
    const id = createCleaningTask(task);
    setInitialCleaningTaskId(id);
    setSection("智能数据清洗");
    notify(`${task.name} 已创建并进入智能数据清洗`);
  }

  return (
    <section className="reuse-content-page">
      <div className="reuse-page-tabs">
        {modules[1].children.map((item) => (
          <button className={section === item ? "active" : ""} key={item} onClick={() => setSection(item)}>
            {item}
          </button>
        ))}
      </div>
      {section === "数据库管理" && <article className="white-panel reuse-list-panel inventory-database-panel">
        <div className="reuse-panel-head">
          <div>
            <h2>{section}</h2>
            <p>统一管理数据连接、数据文件和盘点结果</p>
          </div>
          <div>
            <label className="reuse-search">
              <UiIcon icon={Search} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="请输入关键字进行搜索" />
            </label>
            <button className="reuse-primary" onClick={openDialog}><UiIcon icon={Plus} />新建数据连接</button>
          </div>
        </div>
        <div className="source-cards" aria-label="数据源选择">
          {filtered.map((item) => {
            const SourceIcon = item.type.includes("MySQL")
              ? Database
              : item.type.includes("本地")
                ? FolderKanban
                : item.type.includes("SFTP")
                  ? Upload
                  : Workflow;
            return (
              <button
                key={item.name}
                className={`source-item ${selectedSource === item.name ? "active" : ""}`}
                onClick={() => setSelectedSource(item.name)}
              >
                <span className="source-symbol"><UiIcon icon={SourceIcon} size={16} /></span>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.type} · {item.summary}</p>
                  <small>最近同步：{item.updated}</small>
                </div>
                <Status tone={statusTone(item.status)}>{item.status === "正常" ? "连接正常" : item.status}</Status>
              </button>
            );
          })}
        </div>
        {selected && (
          <div className="source-detail-strip">
            <span>当前连接</span>
            <strong>{selected.name}</strong>
            <i />
            <span>{selected.type}</span>
            <span>{selected.scale}</span>
            <span>{selected.strategy}</span>
            <button className="reuse-link" disabled={selected.status === "测试中" || selected.status === "同步中"} onClick={() => testSource(selected)}>{selected.status === "测试中" ? "测试中..." : "测试连接"}</button>
            <button className="reuse-link" disabled={selected.status !== "正常"} onClick={() => syncSource(selected)}>{selected.status === "同步中" ? `同步中 ${selected.progress}%` : "立即同步"}</button>
            <button className="reuse-link" disabled={selected.status !== "正常" || selected.updated === "尚未同步"} onClick={() => setSection("数据探查")}>进入数据探查</button>
          </div>
        )}
        {selected && <div className={`source-sync-state ${selected.status.toLowerCase()}`}><Progress value={selected.progress} /><span>{selected.syncResult}</span><b>{selected.progress}%</b></div>}
        <div className="reuse-table-wrap">
          <table className="reuse-table">
            <thead>
              <tr>
                <th>数据源名称</th><th>连接类型</th><th>数据规模</th><th>同步策略</th><th>最近同步</th><th>状态</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.name}>
                  <td><strong>{row.name}</strong></td>
                  <td>{row.type}</td>
                  <td>{row.scale}</td>
                  <td>{row.strategy}</td>
                  <td>{row.updated}</td>
                  <td><Status tone={statusTone(row.status)}>{row.status}</Status></td>
                  <td>
                    <button className="reuse-link" onClick={() => setSelectedSource(row.name)}>查看</button>{" "}
                    <button className="reuse-link" onClick={() => openSourceEditor(row)}>配置</button>{" "}
                    <button className="reuse-link" disabled={row.status !== "正常"} onClick={() => syncSource(row)}>同步</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="table-empty">未找到匹配的数据连接</div>}
        </div>
      </article>}
      {section === "数据探查" && <DataExploration sources={sources} createCleaningTask={createTaskFromExploration} notify={notify} />}
      {section === "本地数据管理" && <LocalDataManager notify={notify} />}
      {section === "智能数据盘点" && <SmartInventory notify={notify} />}
      {section === "智能数据清洗" && <SmartCleaning tasks={cleaningTasks} initialTaskId={initialCleaningTaskId} updateTask={updateCleaningTask} notify={notify} />}
      {editingSource && <div className="dialog-backdrop connection-editor-backdrop"><button className="dialog-dismiss" aria-label="关闭连接配置" onClick={() => setEditingSourceName(null)} /><form className="reuse-dialog connection-editor" onSubmit={saveSourceConfiguration}><header><div><h2>配置数据连接</h2><p>{editingSource.name} · 修改后将自动重新验证</p></div><button type="button" aria-label="关闭连接配置" onClick={() => setEditingSourceName(null)}><UiIcon icon={X} /></button></header><label>连接类型<input value={editingSource.type} readOnly /></label><label>连接地址<input required value={endpointDraft} onChange={(event) => setEndpointDraft(event.target.value)} /></label><label>同步策略<select value={strategyDraft} onChange={(event) => setStrategyDraft(event.target.value)}><option>手动触发</option><option>每 30 分钟</option><option>每日 02:00</option><option>准实时</option></select></label><div className="connection-config-summary"><span><small>当前状态</small><Status tone={statusTone(editingSource.status)}>{editingSource.status}</Status></span><span><small>最近结果</small><strong>{editingSource.syncResult}</strong></span></div><footer><button type="button" className="reuse-secondary" onClick={() => setEditingSourceName(null)}>取消</button><button className="reuse-primary"><UiIcon icon={Save} />保存并验证</button></footer></form></div>}
    </section>
  );
}

function GovernancePage({
  projects,
  openDialog,
  copyProject,
  deleteProject,
  enterWorkspace,
  notify,
}: {
  projects: ProjectRow[];
  openDialog: () => void;
  copyProject: (project: ProjectRow) => void;
  deleteProject: (project: ProjectRow) => void;
  enterWorkspace: (project: ProjectRow) => void;
  notify: Notify;
}) {
  const [section, setSection] = useState("开发项目管理");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null);
  const filtered = projects.filter((row) => row.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="reuse-content-page">
      <div className="reuse-page-tabs">
        {["开发项目管理", "定时任务管理", "定时任务抽取日志"].map((item) => (
          <button className={section === item ? "active" : ""} key={item} onClick={() => setSection(item)}>
            {item}
          </button>
        ))}
      </div>
      <article className="white-panel reuse-list-panel">
        <div className="reuse-panel-head">
          <div>
            <h2>{section}</h2>
            <p>当前项目：高质量数据集评估演示</p>
          </div>
          <div>
            <button className="reuse-primary" onClick={openDialog}><UiIcon icon={Plus} />新建项目</button>
            <label className="reuse-search">
              <UiIcon icon={Search} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="请输入关键字进行搜索" />
            </label>
            <button className="reuse-secondary" onClick={() => notify(`已筛选出 ${filtered.length} 个项目`)}>搜索</button>
          </div>
        </div>
        {section === "开发项目管理" ? (
          <div className="reuse-table-wrap">
            <table className="reuse-table project-table">
              <thead>
                <tr>
                  <th>名称</th><th>项目类型</th><th>概览</th><th>创建人</th><th>创建时间</th><th>最近更新人</th><th>最近更新时间</th><th>标记</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr key={`${row.name}-${row.created}-${row.updated}-${index}`}>
                    <td>
                      <button className="project-name project-entry" onClick={() => enterWorkspace(row)}>
                        <span>◉</span><strong>{row.name}</strong>
                      </button>
                    </td>
                    <td>普通项目</td><td>{row.overview}</td><td>高质量数据评估演示</td><td>{row.created}</td>
                    <td>高质量数据评估演示</td><td>{row.updated}</td>
                    <td><button className="tag-add" aria-label={`标记${row.name}`} onClick={() => notify(`${row.name} 已添加重点标记`)}><UiIcon icon={Star} size={13} /></button></td>
                    <td>
                      <button className="reuse-link" onClick={() => enterWorkspace(row)}>ETL</button>{" "}
                      <button className="reuse-link" onClick={() => copyProject(row)}>复制</button>{" "}
                      <button className="reuse-link" onClick={() => notify(`已打开 ${row.name} 的重命名编辑框`)}>重命名</button>{" "}
                      <button className="reuse-link danger" onClick={() => setDeleteTarget(row)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="table-empty">没有匹配的治理项目</div>}
          </div>
        ) : (
          <div className="schedule-empty">
            <span>▤</span>
            <h3>{section}</h3>
            <p>暂无运行中的记录，可从治理工作间创建定时任务。</p>
            <button className="reuse-primary" onClick={() => notify("定时任务创建向导已准备")}><UiIcon icon={CalendarClock} />创建定时任务</button>
          </div>
        )}
        <footer className="reuse-pagination">
          <span>共 {section === "开发项目管理" ? filtered.length : 0} 条</span>
          <button disabled>‹</button><button className="active" onClick={() => notify("当前已是第 1 页")}>1</button><button disabled>›</button>
        </footer>
      </article>
      {deleteTarget && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="取消删除项目" onClick={() => setDeleteTarget(null)} /><section className="reuse-dialog workbench-delete-dialog project-delete-dialog"><header><div><h2>删除治理项目</h2><p>项目删除后将从本地业务状态中移除</p></div><button aria-label="关闭删除项目确认" onClick={() => setDeleteTarget(null)}><UiIcon icon={X} /></button></header><section><span><UiIcon icon={TriangleAlert} size={20} /></span><div><h3>确认删除“{deleteTarget.name}”</h3><p>该项目的流程节点、血缘连线、运行配置及项目内任务将一并删除。平台中的数据源和其他治理项目不会受影响。</p></div></section><div className="project-delete-summary"><span><small>项目概览</small><strong>{deleteTarget.overview}</strong></span><span><small>创建时间</small><strong>{deleteTarget.created}</strong></span><span><small>最近更新</small><strong>{deleteTarget.updated}</strong></span></div><footer><button className="reuse-secondary" onClick={() => setDeleteTarget(null)}>取消</button><button className="reuse-danger" onClick={() => { deleteProject(deleteTarget); setDeleteTarget(null); }}><UiIcon icon={Trash2} />确认删除项目</button></footer></section></div>}
    </section>
  );
}

type WorkbenchNode = {
  id: string;
  label: string;
  kind: "dataset" | "recipe" | "annotation" | "output";
  meta: string;
  position: { left: number; top: number };
  placed?: boolean;
};

type WorkbenchMediaAsset = {
  name: string;
  url: string;
  type: string;
  size: number;
};

type GovernanceRecipeCategory = "数据清洗" | "完整性治理" | "去重治理" | "规范性治理" | "准确性治理" | "安全治理" | "多模态治理" | "文档治理";

type GovernanceNodeConfig = {
  category: GovernanceRecipeCategory;
  algorithm: string;
  scope: "全量数据" | "仅新增数据" | "风险样本";
  keyFields: string;
  threshold: number;
  strategy: string;
  exceptionPolicy: "隔离并记录" | "跳过并告警" | "终止当前流程";
  outputMode: "生成新版本" | "覆盖当前版本" | "仅输出问题清单";
  trigger: "按上游变更触发" | "手动触发" | "定时触发";
  keepAudit: boolean;
  validatedAt?: string;
};

type GovernanceRecipeProfile = {
  description: string;
  algorithms: string[];
  parameterLabel: string;
  parameterOptions: string[];
  defaultThreshold: number;
  format: string;
  engine: string;
  tag: string;
};

const governanceRecipeProfiles: Record<GovernanceRecipeCategory, GovernanceRecipeProfile> = {
  数据清洗: { description: "清理空白、乱码、异常格式与无效记录。", algorithms: ["规则化清洗", "字段格式标准化", "空白字符清理"], parameterLabel: "清洗强度", parameterOptions: ["保守处理", "标准处理", "严格处理"], defaultThreshold: 85, format: "标准化流水线", engine: "数据清洗引擎", tag: "清洗" },
  完整性治理: { description: "识别空值、缺失字段并按业务规则补全。", algorithms: ["空值智能填充", "必填字段校验", "缺失记录补齐"], parameterLabel: "缺失值策略", parameterOptions: ["上下文智能填充", "使用业务默认值", "仅标记不修复"], defaultThreshold: 90, format: "字段修复流水线", engine: "完整性治理引擎", tag: "完整性" },
  去重治理: { description: "结合主键、文本相似度与文件哈希识别重复。", algorithms: ["重复数据识别", "语义近重复检测", "文件哈希去重"], parameterLabel: "重复保留策略", parameterOptions: ["保留最新记录", "保留信息最完整记录", "全部隔离待复核"], defaultThreshold: 92, format: "去重结果集", engine: "近重复识别引擎", tag: "去重" },
  规范性治理: { description: "统一编码、日期、单位、枚举与字段格式。", algorithms: ["格式标准化", "编码字典映射", "时间与单位统一"], parameterLabel: "标准化模板", parameterOptions: ["平台通用规范", "当前业务域规范", "严格发布规范"], defaultThreshold: 95, format: "规范化数据集", engine: "标准化规则引擎", tag: "规范化" },
  准确性治理: { description: "通过统计分布与业务规则发现错误值。", algorithms: ["异常值处理", "业务规则校验", "跨源一致性核验"], parameterLabel: "异常处理策略", parameterOptions: ["自动修正后复检", "隔离异常记录", "仅输出修正建议"], defaultThreshold: 88, format: "校验结果 + 修正集", engine: "准确性规则引擎", tag: "准确性" },
  安全治理: { description: "识别敏感信息并按策略脱敏、泛化或隔离。", algorithms: ["敏感信息脱敏", "敏感字段识别", "访问水印注入"], parameterLabel: "安全策略", parameterOptions: ["掩码脱敏", "不可逆哈希", "隔离敏感样本"], defaultThreshold: 98, format: "合规数据集", engine: "隐私与合规引擎", tag: "安全" },
  多模态治理: { description: "处理图像可用性、内容质量与跨模态对齐。", algorithms: ["图像格式标准化", "图像质量检测", "图文对齐校验"], parameterLabel: "处理预设", parameterOptions: ["保留原始分辨率", "训练数据标准预设", "严格质量门禁"], defaultThreshold: 90, format: "标准多模态样本", engine: "多模态治理引擎", tag: "多模态" },
  文档治理: { description: "解析文档版面、OCR 文本、表格与段落结构。", algorithms: ["金融文档版面解析", "OCR 内容纠错", "表格结构还原"], parameterLabel: "解析模式", parameterOptions: ["OCR + 版面分析", "仅文本提取", "多模态文档解析"], defaultThreshold: 86, format: "Markdown + JSON", engine: "文档智能解析引擎", tag: "文档解析" },
};

function createGovernanceNodeConfig(node?: WorkbenchNode): GovernanceNodeConfig {
  const category: GovernanceRecipeCategory = node?.id === "image-clean" ? "多模态治理"
    : node?.id === "document-parse" ? "文档治理"
      : node?.id === "align" || node?.id === "quality" ? "规范性治理"
        : "数据清洗";
  const profile = governanceRecipeProfiles[category];
  return {
    category,
    algorithm: node?.id === "image-clean" ? "图像格式标准化"
      : node?.id === "document-parse" ? "金融文档版面解析"
        : node?.id === "align" ? "编码字典映射"
          : node?.id === "quality" ? "格式标准化"
            : profile.algorithms[0],
    scope: "全量数据",
    keyFields: "id",
    threshold: profile.defaultThreshold,
    strategy: profile.parameterOptions[1] ?? profile.parameterOptions[0],
    exceptionPolicy: "隔离并记录",
    outputMode: "生成新版本",
    trigger: "按上游变更触发",
    keepAudit: true,
  };
}

function getGovernanceConfigIssues(config: GovernanceNodeConfig) {
  return [
    !config.algorithm ? "治理算法" : "",
    !config.keyFields.trim() ? "关键字段" : "",
    config.threshold < 1 || config.threshold > 100 ? "质量阈值" : "",
  ].filter(Boolean);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("图片读取失败"));
    reader.onerror = () => reject(reader.error ?? new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

type AnnotationOperator = {
  id: string;
  name: string;
  account: string;
  team: string;
  skills: string[];
  activeTasks: number;
  capacity: number;
  online: boolean;
};

type AnnotationAssignment = {
  userId: string;
  name: string;
  team: string;
  count: number;
  assignedAt: string;
  status: "进行中" | "已完成";
};

const annotationOperators: AnnotationOperator[] = [
  { id: "annotator-01", name: "陈晨", account: "chenchen@local", team: "视觉标注一组", skills: ["目标检测", "关键点"], activeTasks: 186, capacity: 500, online: true },
  { id: "annotator-02", name: "林静", account: "linjing@local", team: "视觉标注一组", skills: ["目标检测", "实例分割"], activeTasks: 124, capacity: 480, online: true },
  { id: "annotator-03", name: "王敏", account: "wangmin@local", team: "视觉标注二组", skills: ["关键点", "质量复核"], activeTasks: 208, capacity: 460, online: true },
  { id: "annotator-04", name: "赵宁", account: "zhaoning@local", team: "视觉标注二组", skills: ["图像分类", "目标检测"], activeTasks: 96, capacity: 450, online: false },
  { id: "annotator-05", name: "苏晓", account: "suxiao@local", team: "外部协作团队", skills: ["实例分割", "多边形"], activeTasks: 72, capacity: 420, online: true },
];

type AnnotationShape = {
  id: string;
  type: "rect" | "point" | "polygon";
  label: string;
  color: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: Array<{ x: number; y: number }>;
  occlusion?: string;
  state?: string;
  note?: string;
  visible?: boolean;
};

type WorkbenchEdge = {
  id: string;
  from: string;
  to: string;
};

type WorkbenchRunStatus = "未运行" | "等待中" | "运行中" | "成功" | "失败";

type WorkbenchNodeRunState = {
  status: WorkbenchRunStatus;
  duration: string;
  detail: string;
};

type WorkbenchNodeProfile = {
  typeLabel: string;
  format: string;
  engine: string;
  fields: Array<{ label: string; value: string; options?: string[] }>;
  tags: string[];
  quality: Array<{ label: string; value: string; score: number }>;
  upstream: string[];
  downstream: string[];
};

const workbenchNodes: WorkbenchNode[] = [
  { id: "raw-image", label: "篮球原始图像", kind: "dataset", meta: "12,680 文件", position: { left: 44, top: 58 } },
  { id: "image-clean", label: "图像格式清洗", kind: "recipe", meta: "标准化 Recipe", position: { left: 238, top: 58 } },
  { id: "image-label", label: "篮球图像标注", kind: "annotation", meta: "11,924 / 12,680 已完成", position: { left: 430, top: 58 } },
  { id: "documents", label: "金融年报文档", kind: "dataset", meta: "1,286 文件", position: { left: 44, top: 238 } },
  { id: "document-parse", label: "文档解析", kind: "recipe", meta: "OCR + 版面分析", position: { left: 238, top: 238 } },
  { id: "sft", label: "SFT 问答数据集", kind: "dataset", meta: "38,420 条", position: { left: 430, top: 238 } },
  { id: "align", label: "多模态对齐", kind: "recipe", meta: "质量治理 Recipe", position: { left: 620, top: 142 } },
  { id: "quality", label: "质量规则过滤", kind: "recipe", meta: "13 条规则", position: { left: 808, top: 142 } },
  { id: "training", label: "高质量训练集", kind: "output", meta: "50,344 条", position: { left: 996, top: 142 } },
];

const workbenchNodeProfiles: Record<string, WorkbenchNodeProfile> = {
  "raw-image": {
    typeLabel: "文件数据源",
    format: "JPG / PNG",
    engine: "对象存储连接器",
    fields: [
      { label: "来源目录", value: "/production/basketball/images" },
      { label: "同步方式", value: "每日增量", options: ["每日增量", "准实时监听", "手动同步"] },
      { label: "重复文件策略", value: "按文件哈希去重", options: ["按文件哈希去重", "保留最新版本", "全部保留"] },
    ],
    tags: ["原始数据", "图像"],
    quality: [{ label: "文件可读率", value: "99.8%", score: 99.8 }, { label: "元数据完整度", value: "97.6%", score: 97.6 }, { label: "重复率", value: "0.3%", score: 99.7 }],
    upstream: ["生产图像文件仓"],
    downstream: ["图像格式清洗"],
  },
  "image-clean": {
    typeLabel: "图像清洗 Recipe",
    format: "标准化流水线",
    engine: "图像处理引擎",
    fields: [
      { label: "输出格式", value: "JPEG / sRGB", options: ["JPEG / sRGB", "PNG / sRGB", "保留原始格式"] },
      { label: "目标分辨率", value: "1920 × 1080", options: ["1920 × 1080", "1280 × 720", "不缩放"] },
      { label: "损坏图像处理", value: "隔离并记录", options: ["隔离并记录", "自动修复", "跳过"] },
    ],
    tags: ["格式治理", "批处理"],
    quality: [{ label: "清洗成功率", value: "99.4%", score: 99.4 }, { label: "格式合规率", value: "100%", score: 100 }, { label: "损坏文件率", value: "0.2%", score: 99.8 }],
    upstream: ["篮球原始图像"],
    downstream: ["篮球图像标注"],
  },
  "image-label": {
    typeLabel: "人工标注任务",
    format: "COCO JSON",
    engine: "协同标注引擎",
    fields: [],
    tags: ["目标检测", "人工复核"],
    quality: [{ label: "标注完成率", value: "94.0%", score: 94 }, { label: "双人一致率", value: "96.8%", score: 96.8 }, { label: "复核通过率", value: "98.2%", score: 98.2 }, { label: "漏标率", value: "1.1%", score: 98.9 }],
    upstream: ["图像格式清洗"],
    downstream: ["多模态对齐"],
  },
  documents: {
    typeLabel: "文档数据源",
    format: "PDF / OFD",
    engine: "文档仓连接器",
    fields: [
      { label: "文档目录", value: "/finance/annual-reports/2025" },
      { label: "版本策略", value: "保留最新版本", options: ["保留最新版本", "保留全部版本", "按报告期覆盖"] },
      { label: "加密文档", value: "转人工解密", options: ["转人工解密", "跳过并告警", "停止流程"] },
    ],
    tags: ["金融", "年报文档"],
    quality: [{ label: "文件可读率", value: "98.9%", score: 98.9 }, { label: "报告期完整度", value: "96.5%", score: 96.5 }, { label: "版本一致性", value: "99.1%", score: 99.1 }],
    upstream: ["金融报告文件仓"],
    downstream: ["文档解析"],
  },
  "document-parse": {
    typeLabel: "文档解析 Recipe",
    format: "Markdown + JSON",
    engine: "OCR 版面引擎",
    fields: [
      { label: "解析模式", value: "OCR + 版面分析", options: ["OCR + 版面分析", "仅文本提取", "多模态解析"] },
      { label: "表格处理", value: "保留结构", options: ["保留结构", "转 Markdown", "忽略表格"] },
      { label: "低置信页面", value: "进入人工复核", options: ["进入人工复核", "自动重试", "直接保留"] },
    ],
    tags: ["OCR", "版面解析"],
    quality: [{ label: "OCR 准确率", value: "97.4%", score: 97.4 }, { label: "表格还原率", value: "94.8%", score: 94.8 }, { label: "段落完整度", value: "98.1%", score: 98.1 }],
    upstream: ["金融年报文档"],
    downstream: ["SFT 问答数据集"],
  },
  sft: {
    typeLabel: "问答数据集",
    format: "JSONL",
    engine: "数据集管理引擎",
    fields: [
      { label: "问答结构", value: "instruction / input / output", options: ["instruction / input / output", "messages", "prompt / completion"] },
      { label: "多轮策略", value: "保留上下文", options: ["保留上下文", "拆分单轮", "仅保留最终轮"] },
      { label: "版本", value: "finance-sft-v2.1" },
    ],
    tags: ["SFT", "问答"],
    quality: [{ label: "答案完整度", value: "98.2%", score: 98.2 }, { label: "问题唯一率", value: "96.7%", score: 96.7 }, { label: "引用准确率", value: "95.9%", score: 95.9 }],
    upstream: ["文档解析"],
    downstream: ["多模态对齐"],
  },
  align: {
    typeLabel: "多模态对齐 Recipe",
    format: "统一样本协议",
    engine: "语义对齐引擎",
    fields: [
      { label: "对齐主键", value: "sample_id + business_key" },
      { label: "匹配策略", value: "语义相似度 + 规则", options: ["语义相似度 + 规则", "仅业务主键", "人工确认"] },
      { label: "相似度阈值", value: "0.86", options: ["0.80", "0.86", "0.90", "0.95"] },
    ],
    tags: ["多模态", "语义对齐"],
    quality: [{ label: "对齐成功率", value: "97.1%", score: 97.1 }, { label: "语义一致性", value: "95.6%", score: 95.6 }, { label: "孤立样本率", value: "1.8%", score: 98.2 }],
    upstream: ["篮球图像标注", "SFT 问答数据集"],
    downstream: ["质量规则过滤"],
  },
  quality: {
    typeLabel: "质量过滤 Recipe",
    format: "规则流水线",
    engine: "质量规则引擎",
    fields: [
      { label: "规则集", value: "训练数据质量规则 v4.2", options: ["训练数据质量规则 v4.2", "高置信严格规则 v3.1", "快速筛选规则 v2.8"] },
      { label: "不合格样本", value: "隔离并生成清单", options: ["隔离并生成清单", "自动修复后重检", "终止流程"] },
      { label: "通过阈值", value: "综合得分 ≥ 92", options: ["综合得分 ≥ 90", "综合得分 ≥ 92", "综合得分 ≥ 95"] },
    ],
    tags: ["质量门禁", "13 条规则"],
    quality: [{ label: "规则通过率", value: "96.8%", score: 96.8 }, { label: "完整度", value: "98.7%", score: 98.7 }, { label: "一致性", value: "96.4%", score: 96.4 }, { label: "格式合规", value: "99.2%", score: 99.2 }],
    upstream: ["多模态对齐"],
    downstream: ["高质量训练集"],
  },
  training: {
    typeLabel: "发布数据集",
    format: "Parquet + JSONL",
    engine: "数据集交付引擎",
    fields: [
      { label: "数据集版本", value: "training-set-v3.6" },
      { label: "数据划分", value: "训练 80% / 验证 10% / 测试 10%", options: ["训练 80% / 验证 10% / 测试 10%", "训练 90% / 验证 5% / 测试 5%", "不划分"] },
      { label: "发布目标", value: "领域模型训练环境", options: ["领域模型训练环境", "评测环境", "数据集交付平台"] },
    ],
    tags: ["高质量", "可交付"],
    quality: [{ label: "交付完整度", value: "100%", score: 100 }, { label: "质量门禁", value: "96.8%", score: 96.8 }, { label: "版本可追溯", value: "100%", score: 100 }],
    upstream: ["质量规则过滤"],
    downstream: ["领域模型训练环境"],
  },
};

function getWorkbenchNodeIcon(kind: WorkbenchNode["kind"]): LucideIcon {
  if (kind === "recipe") return Workflow;
  if (kind === "annotation") return ClipboardCheck;
  if (kind === "output") return PackageCheck;
  return Database;
}

const workbenchEdges: WorkbenchEdge[] = [
  { id: "e1", from: "raw-image", to: "image-clean" },
  { id: "e2", from: "image-clean", to: "image-label" },
  { id: "e3", from: "documents", to: "document-parse" },
  { id: "e4", from: "document-parse", to: "sft" },
  { id: "e5", from: "image-label", to: "align" },
  { id: "e6", from: "sft", to: "align" },
  { id: "e7", from: "align", to: "quality" },
  { id: "e8", from: "quality", to: "training" },
];

function createWorkbenchProfile(node: WorkbenchNode): WorkbenchNodeProfile {
  const labels = {
    dataset: ["数据集节点", "JSONL / Parquet", "数据集管理引擎"],
    recipe: ["治理 Recipe", "标准化流水线", "数据治理引擎"],
    annotation: ["人工标注任务", "COCO JSON", "协同标注引擎"],
    output: ["发布数据集", "Parquet + JSONL", "数据集交付引擎"],
  }[node.kind];
  return {
    typeLabel: labels[0],
    format: labels[1],
    engine: labels[2],
    fields: [{ label: "执行策略", value: "按上游变更触发", options: ["按上游变更触发", "手动触发", "定时触发"] }],
    tags: [node.kind === "dataset" ? "数据资产" : node.kind === "output" ? "交付" : "治理流程"],
    quality: [{ label: "配置完整度", value: "100%", score: 100 }, { label: "运行成功率", value: "--", score: 0 }],
    upstream: [],
    downstream: [],
  };
}

function getWorkbenchEdgeStyle(edge: WorkbenchEdge, nodes: WorkbenchNode[]) {
  const from = nodes.find((node) => node.id === edge.from);
  const to = nodes.find((node) => node.id === edge.to);
  if (!from || !to) return null;
  const left = from.position.left + 126;
  const top = from.position.top + 35;
  const targetLeft = to.position.left;
  const targetTop = to.position.top + 35;
  const deltaX = targetLeft - left;
  const deltaY = targetTop - top;
  return { left, top, width: Math.hypot(deltaX, deltaY), rotate: Math.atan2(deltaY, deltaX) * 180 / Math.PI };
}

function GovernanceWorkbench({
  project,
  onBack,
  onSave,
  notify,
}: {
  project: ProjectRow;
  onBack: () => void;
  onSave: (workspace: { nodes: WorkbenchNode[]; edges: WorkbenchEdge[]; mediaAssets?: Record<string, WorkbenchMediaAsset[]>; nodeConfigs?: Record<string, GovernanceNodeConfig> }) => void;
  notify: Notify;
}) {
  const startsEmpty = project.isEmpty === true || /^0\s+Datasets\s+0\s+Recipes/i.test(project.overview.trim());
  const initialNodes = project.workspace?.nodes ?? (startsEmpty ? [] : workbenchNodes);
  const initialEdges = project.workspace?.edges ?? (startsEmpty ? [] : workbenchEdges);
  const [nodes, setNodes] = useState<WorkbenchNode[]>(initialNodes);
  const [edges, setEdges] = useState<WorkbenchEdge[]>(initialEdges);
  const [nodeConfigs, setNodeConfigs] = useState<Record<string, GovernanceNodeConfig>>(() => ({
    ...Object.fromEntries(initialNodes.filter((node) => node.kind === "recipe").map((node) => [node.id, createGovernanceNodeConfig(node)])),
    ...(project.workspace?.nodeConfigs ?? {}),
  }));
  const [resourceType, setResourceType] = useState<"数据集" | "Recipe">("数据集");
  const [resourceSearch, setResourceSearch] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("image-label");
  const [inspectorTab, setInspectorTab] = useState<"配置" | "质量" | "血缘">("配置");
  const [zoom, setZoom] = useState(90);
  const [running, setRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(initialNodes.length ? 100 : 0);
  const [runMode, setRunMode] = useState<"flow" | "node" | null>(null);
  const [activeRunNodeId, setActiveRunNodeId] = useState<string | null>(null);
  const [failedNodeId, setFailedNodeId] = useState<string | null>(null);
  const [currentRunWillFail, setCurrentRunWillFail] = useState(false);
  const [hasSimulatedFailure, setHasSimulatedFailure] = useState(false);
  const [runStates, setRunStates] = useState<Record<string, WorkbenchNodeRunState>>(() => Object.fromEntries(initialNodes.map((node) => [node.id, {
    status: node.kind === "annotation" ? "运行中" : node.kind === "dataset" ? "未运行" : "成功",
    duration: node.kind === "recipe" ? "00:34" : "--",
    detail: node.meta,
  }])));
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [saved, setSaved] = useState(true);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [nodeDraftKind, setNodeDraftKind] = useState<WorkbenchNode["kind"]>("recipe");
  const [nodeDraftName, setNodeDraftName] = useState("");
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkbenchNode | null>(null);
  const [annotationType, setAnnotationType] = useState("目标检测 + 关键点");
  const [annotationTeam, setAnnotationTeam] = useState("视觉标注一组");
  const [annotationLabels, setAnnotationLabels] = useState(["目标", "主体", "部件", "文本", "其他"]);
  const [annotationLabelDraft, setAnnotationLabelDraft] = useState("");
  const [aiPrelabel, setAiPrelabel] = useState(true);
  const [doubleReview, setDoubleReview] = useState(true);
  const [samplingRate, setSamplingRate] = useState(10);
  const [annotationProgress, setAnnotationProgress] = useState(94);
  const [annotationRulesOpen, setAnnotationRulesOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});
  const [annotationAssignmentsByNode, setAnnotationAssignmentsByNode] = useState<Record<string, AnnotationAssignment[]>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = JSON.parse(window.localStorage.getItem(`hq-annotation-assignments:${project.name}`) ?? "{}");
      return stored && !Array.isArray(stored) && typeof stored === "object" ? stored : {};
    } catch { return {}; }
  });
  const [annotationWorkspaceOpen, setAnnotationWorkspaceOpen] = useState(false);
  const [annotationSampleIndex, setAnnotationSampleIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Number(window.localStorage.getItem("hq-annotation-sample") ?? 0) || 0;
  });
  const [annotationTool, setAnnotationTool] = useState<"矩形框" | "关键点" | "多边形">("矩形框");
  const [activeAnnotationLabel, setActiveAnnotationLabel] = useState("目标");
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [annotationShapes, setAnnotationShapes] = useState<Record<number, AnnotationShape[]>>(() => {
    const defaults: Record<number, AnnotationShape[]> = {};
    if (typeof window === "undefined") return defaults;
    try { return JSON.parse(window.localStorage.getItem("hq-annotation-shapes") ?? "") || defaults; } catch { return defaults; }
  });
  const [annotationHistory, setAnnotationHistory] = useState<Array<{ sample: number; shapes: AnnotationShape[] }>>([]);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [draftRect, setDraftRect] = useState<AnnotationShape | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [completedAnnotationSamples, setCompletedAnnotationSamples] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem("hq-annotation-completed") ?? "[]"); } catch { return []; }
  });
  const [difficultAnnotationSamples, setDifficultAnnotationSamples] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem("hq-annotation-difficult") ?? "[]"); } catch { return []; }
  });
  const [annotationZoom, setAnnotationZoom] = useState(100);
  const [annotationSavedAt, setAnnotationSavedAt] = useState("尚未自动保存");
  const [annotationShortcutsOpen, setAnnotationShortcutsOpen] = useState(false);
  const [annotationSourceKey, setAnnotationSourceKey] = useState("");
  const annotationCanvasRef = useRef<HTMLDivElement>(null);
  const [datasetImportOpen, setDatasetImportOpen] = useState(false);
  const [datasetImportMode, setDatasetImportMode] = useState<"资产库选择" | "本地文件导入">("资产库选择");
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
  const [localDatasetFiles, setLocalDatasetFiles] = useState<File[]>([]);
  const [localDatasetName, setLocalDatasetName] = useState("");
  const [datasetMediaAssets, setDatasetMediaAssets] = useState<Record<string, WorkbenchMediaAsset[]>>(() => project.workspace?.mediaAssets ?? {});
  const createdMediaUrlsRef = useRef<string[]>([]);
  const runProgressRef = useRef(runProgress);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) || nodes[0] || workbenchNodes[0];
  const annotationAssignments = annotationAssignmentsByNode[selectedNode.id] ?? [];
  const selectedProfile = workbenchNodeProfiles[selectedNode.id] ?? createWorkbenchProfile(selectedNode);
  const isAnnotationNode = selectedNode.kind === "annotation";
  const isRecipeNode = selectedNode.kind === "recipe";
  const selectedRecipeConfig = isRecipeNode ? nodeConfigs[selectedNode.id] ?? createGovernanceNodeConfig(selectedNode) : null;
  const selectedRecipeProfile = selectedRecipeConfig ? governanceRecipeProfiles[selectedRecipeConfig.category] : null;
  const selectedRecipeConfigIssues = selectedRecipeConfig ? getGovernanceConfigIssues(selectedRecipeConfig) : [];
  const resources = nodes.filter((node) => resourceType === "数据集"
    ? node.kind === "dataset" || node.kind === "output"
    : node.kind === "recipe" || node.kind === "annotation");
  const filteredResources = resources.filter((node) => node.label.includes(resourceSearch));
  const resourceCount = {
    数据集: nodes.filter((node) => node.kind === "dataset" || node.kind === "output").length,
    Recipe: nodes.filter((node) => node.kind === "recipe" || node.kind === "annotation").length,
  };
  const canvasNodes = useMemo(() => nodes.filter((node) => node.placed !== false), [nodes]);
  const runtimeNodes = useMemo(() => canvasNodes.filter((node) => node.kind === "recipe" || node.kind === "annotation" || node.kind === "output"), [canvasNodes]);
  const dialogRuntimeNodes = runMode === "node" && activeRunNodeId
    ? runtimeNodes.filter((node) => node.id === activeRunNodeId)
    : runtimeNodes;
  const successfulNodeCount = runtimeNodes.filter((node) => runStates[node.id]?.status === "成功").length;
  const canvasHeight = Math.max(390, ...canvasNodes.map((node) => node.position.top + 100));
  const selectedUpstream = edges.filter((edge) => edge.to === selectedNode.id).map((edge) => nodes.find((node) => node.id === edge.from)?.label).filter(Boolean) as string[];
  const selectedDownstream = edges.filter((edge) => edge.from === selectedNode.id).map((edge) => nodes.find((node) => node.id === edge.to)?.label).filter(Boolean) as string[];
  const annotationUpstreamIds = edges.filter((edge) => edge.to === selectedNode.id).map((edge) => edge.from);
  const isPreviewableImage = (asset: WorkbenchMediaAsset) => asset.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(asset.name);
  const directAnnotationImageSourceIds = annotationUpstreamIds.filter((id) => (datasetMediaAssets[id] ?? []).some(isPreviewableImage));
  const directAnnotationImageAssets = annotationUpstreamIds.flatMap((id) => datasetMediaAssets[id] ?? []).filter(isPreviewableImage);
  const imageAssetSources = Object.entries(datasetMediaAssets)
    .map(([nodeId, assets]) => ({ nodeId, assets: assets.filter(isPreviewableImage) }))
    .filter((source) => source.assets.length > 0);
  const fallbackAnnotationSource = directAnnotationImageAssets.length === 0 && imageAssetSources.length === 1 ? imageAssetSources[0] : null;
  const annotationImageAssets = directAnnotationImageAssets.length > 0 ? directAnnotationImageAssets : fallbackAnnotationSource?.assets ?? [];
  const currentAnnotationAsset = annotationImageAssets[annotationSampleIndex] ?? null;
  const connectedAnnotationSourceKey = directAnnotationImageAssets.length > 0
    ? [...directAnnotationImageSourceIds].sort().join("|")
    : fallbackAnnotationSource?.nodeId ?? "";
  const pendingAnnotationCount = Math.max(0, Math.round(12680 * (100 - annotationProgress) / 100));
  const assignedAnnotationCount = annotationAssignments.filter((assignment) => assignment.status === "进行中").reduce((sum, assignment) => sum + assignment.count, 0);
  const unassignedAnnotationCount = Math.max(0, pendingAnnotationCount - assignedAnnotationCount);
  const selectedAssignmentTotal = selectedAssignmentIds.reduce((sum, id) => sum + (assignmentCounts[id] ?? 0), 0);
  const filteredAnnotationOperators = annotationOperators.filter((operator) => `${operator.name}${operator.account}${operator.team}${operator.skills.join("")}`.toLowerCase().includes(assignmentSearch.trim().toLowerCase()));
  const selectedMetrics = isAnnotationNode
    ? selectedProfile.quality.map((metric, index) => index === 0 ? { ...metric, value: `${annotationProgress.toFixed(1)}%`, score: annotationProgress } : metric)
    : selectedProfile.quality;

  useEffect(() => {
    runProgressRef.current = runProgress;
  }, [runProgress]);

  useEffect(() => {
    window.localStorage.setItem(`hq-annotation-assignments:${project.name}`, JSON.stringify(annotationAssignmentsByNode));
  }, [annotationAssignmentsByNode, project.name]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const next = Math.min(100, runProgressRef.current + (runMode === "node" ? 12 : 8));
      runProgressRef.current = next;
      setRunProgress(next);
      setRunStates((currentStates) => {
        const nextStates = { ...currentStates };
        if (runMode === "node" && activeRunNodeId) {
          const activeNode = nodes.find((node) => node.id === activeRunNodeId);
          if (activeNode) nextStates[activeRunNodeId] = {
            status: next === 100 ? "成功" : "运行中",
            duration: next === 100 ? "00:27" : "--",
            detail: next === 100 ? `${activeNode.label} 重试成功，输出已重新校验` : `${activeNode.label} 正在重新执行`,
          };
          return nextStates;
        }
        runtimeNodes.forEach((node, index) => {
          const threshold = Math.round((index + 1) / runtimeNodes.length * 100);
          nextStates[node.id] = {
            status: next >= threshold ? "成功" : next >= Math.max(0, threshold - 18) ? "运行中" : "等待中",
            duration: next >= threshold ? `00:${String(18 + index * 7).padStart(2, "0")}` : "--",
            detail: next >= threshold ? `${node.label} 执行完成` : next >= threshold - 18 ? `${node.label} 正在处理` : "等待上游节点",
          };
        });
        return nextStates;
      });
      if (runMode === "flow" && currentRunWillFail && next >= 76) {
        const failedId = nodes.some((node) => node.id === "quality") ? "quality" : runtimeNodes.at(-1)?.id;
        if (failedId) {
          window.clearInterval(timer);
          setRunning(false);
          setFailedNodeId(failedId);
          setHasSimulatedFailure(true);
          setRunStates((currentStates) => ({ ...currentStates, [failedId]: { status: "失败", duration: "00:11", detail: "规则服务响应超时，已保留上游中间结果" } }));
          notify(`${nodes.find((node) => node.id === failedId)?.label ?? "治理节点"} 运行失败，可从运行记录重试`);
        }
        runProgressRef.current = 76;
        setRunProgress(76);
        return;
      }
      if (next === 100) {
        window.clearInterval(timer);
        setRunning(false);
        if (runMode === "node" && activeRunNodeId) {
          setFailedNodeId((currentFailed) => currentFailed === activeRunNodeId ? null : currentFailed);
          notify(`${nodes.find((node) => node.id === activeRunNodeId)?.label ?? "节点"} 重试成功，流程可继续运行`);
        } else {
          setFailedNodeId(null);
          notify(`${project.name} 的治理流程运行完成`);
        }
        setRunMode(null);
        setActiveRunNodeId(null);
      }
    }, 360);
    return () => window.clearInterval(timer);
  }, [activeRunNodeId, currentRunWillFail, nodes, notify, project.name, runMode, running, runtimeNodes]);

  useEffect(() => {
    if (!annotationWorkspaceOpen) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem("hq-annotation-shapes", JSON.stringify(annotationShapes));
      window.localStorage.setItem("hq-annotation-completed", JSON.stringify(completedAnnotationSamples));
      window.localStorage.setItem("hq-annotation-difficult", JSON.stringify(difficultAnnotationSamples));
      window.localStorage.setItem("hq-annotation-sample", String(annotationSampleIndex));
      setAnnotationSavedAt(`已自动保存 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [annotationSampleIndex, annotationShapes, annotationWorkspaceOpen, completedAnnotationSamples, difficultAnnotationSamples]);

  useEffect(() => {
    if (!annotationWorkspaceOpen) return;
    const handleShortcut = (event: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName ?? "")) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoAnnotation();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveAnnotationSample(false);
      } else if ((event.key === "Delete" || event.key === "Backspace") && selectedAnnotationId) {
        event.preventDefault();
        const current = annotationShapes[annotationSampleIndex] ?? [];
        setAnnotationHistory((history) => [...history, { sample: annotationSampleIndex, shapes: current }]);
        setAnnotationShapes((all) => ({ ...all, [annotationSampleIndex]: current.filter((shape) => shape.id !== selectedAnnotationId) }));
        setSelectedAnnotationId(null);
        notify("已删除选中的标注对象");
      } else if (event.key === "1") setAnnotationTool("矩形框");
      else if (event.key === "2") setAnnotationTool("关键点");
      else if (event.key === "3") setAnnotationTool("多边形");
      else if (event.key === "ArrowLeft") changeAnnotationSample(annotationSampleIndex - 1);
      else if (event.key === "ArrowRight") changeAnnotationSample(annotationSampleIndex + 1);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [annotationSampleIndex, annotationShapes, annotationWorkspaceOpen, notify, selectedAnnotationId, completedAnnotationSamples]);

  useEffect(() => {
    if (!annotationWorkspaceOpen || !annotationCanvasRef.current) return;
    annotationCanvasRef.current.style.transform = `scale(${annotationZoom / 100})`;
  }, [annotationWorkspaceOpen, annotationZoom]);

  useEffect(() => {
    if (!annotationWorkspaceOpen || !annotationCanvasRef.current) return;
    const canvas = annotationCanvasRef.current;
    canvas.style.backgroundImage = currentAnnotationAsset ? `url("${currentAnnotationAsset.url}")` : "none";
    canvas.classList.toggle("has-source-image", Boolean(currentAnnotationAsset));
  }, [annotationWorkspaceOpen, currentAnnotationAsset?.url]);

  useEffect(() => () => {
    createdMediaUrlsRef.current.filter((url) => url.startsWith("blob:")).forEach((url) => URL.revokeObjectURL(url));
    createdMediaUrlsRef.current = [];
  }, []);

  function annotationPoint(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = annotationCanvasRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return { x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)), y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)) };
  }

  function rememberAnnotationState() {
    setAnnotationHistory((history) => [...history.slice(-29), { sample: annotationSampleIndex, shapes: annotationShapes[annotationSampleIndex] ?? [] }]);
  }

  function annotationCanvasPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!currentAnnotationAsset) {
      notify("当前节点没有可标注的真实图片，请先连接并导入图片数据集");
      return;
    }
    const point = annotationPoint(event);
    if (annotationTool === "矩形框") {
      setDrawingStart(point);
      setDraftRect({ id: "draft", type: "rect", label: activeAnnotationLabel, color: activeAnnotationLabel === "篮球" ? "#ed8a2f" : "#2e7fe8", x: point.x, y: point.y, width: 0, height: 0 });
      event.currentTarget.setPointerCapture(event.pointerId);
    } else if (annotationTool === "关键点") {
      rememberAnnotationState();
      const shape: AnnotationShape = { id: `point-${Date.now()}`, type: "point", label: activeAnnotationLabel, color: "#ffd83d", x: point.x, y: point.y };
      setAnnotationShapes((all) => ({ ...all, [annotationSampleIndex]: [...(all[annotationSampleIndex] ?? []), shape] }));
      setSelectedAnnotationId(shape.id);
    } else {
      setPolygonPoints((points) => [...points, point]);
    }
  }

  function annotationCanvasPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drawingStart || annotationTool !== "矩形框") return;
    const point = annotationPoint(event);
    setDraftRect((draft) => draft ? { ...draft, x: Math.min(drawingStart.x, point.x), y: Math.min(drawingStart.y, point.y), width: Math.abs(point.x - drawingStart.x), height: Math.abs(point.y - drawingStart.y) } : null);
  }

  function annotationCanvasPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draftRect || annotationTool !== "矩形框") return;
    if ((draftRect.width ?? 0) > 1 && (draftRect.height ?? 0) > 1) {
      rememberAnnotationState();
      const shape = { ...draftRect, id: `rect-${Date.now()}`, occlusion: "无遮挡", state: "运动中", note: "" };
      setAnnotationShapes((all) => ({ ...all, [annotationSampleIndex]: [...(all[annotationSampleIndex] ?? []), shape] }));
      setSelectedAnnotationId(shape.id);
    }
    setDrawingStart(null);
    setDraftRect(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function finishPolygon() {
    if (polygonPoints.length < 3) {
      notify("多边形至少需要 3 个顶点");
      return;
    }
    rememberAnnotationState();
    const shape: AnnotationShape = { id: `polygon-${Date.now()}`, type: "polygon", label: activeAnnotationLabel, color: "#8a5bd3", points: polygonPoints, occlusion: "无遮挡", state: "静止", note: "" };
    setAnnotationShapes((all) => ({ ...all, [annotationSampleIndex]: [...(all[annotationSampleIndex] ?? []), shape] }));
    setPolygonPoints([]);
    setSelectedAnnotationId(shape.id);
    notify("多边形标注已完成");
  }

  function undoAnnotation() {
    const previous = annotationHistory.at(-1);
    if (!previous) {
      notify("没有可撤销的标注操作");
      return;
    }
    setAnnotationShapes((all) => ({ ...all, [previous.sample]: previous.shapes }));
    setAnnotationHistory((history) => history.slice(0, -1));
    setSelectedAnnotationId(null);
    notify("已撤销最近一次标注操作");
  }

  function runFlow() {
    const invalidRecipeNode = runtimeNodes.find((node) => node.kind === "recipe" && getGovernanceConfigIssues(nodeConfigs[node.id] ?? createGovernanceNodeConfig(node)).length > 0);
    if (invalidRecipeNode) {
      setSelectedNodeId(invalidRecipeNode.id);
      setInspectorTab("配置");
      notify(`${invalidRecipeNode.label}的治理配置不完整，请先校验节点配置`);
      return;
    }
    setRunProgress(4);
    setRunning(true);
    setRunMode("flow");
    setActiveRunNodeId(null);
    setCurrentRunWillFail(!hasSimulatedFailure);
    setFailedNodeId(null);
    setRunStates((current) => Object.fromEntries(nodes.map((node) => [node.id, node.kind === "dataset" ? current[node.id] ?? { status: "未运行", duration: "--", detail: node.meta } : { status: "等待中", duration: "--", detail: "等待上游节点" }])));
    setRunDialogOpen(true);
    notify(`治理流程已启动，正在执行 ${runtimeNodes.length} 个处理节点`);
  }

  function selectNode(id: string) {
    if (connectingFromId) {
      if (connectingFromId === id) {
        setConnectingFromId(null);
        notify("已取消节点连线");
        return;
      }
      if (edges.some((edge) => edge.from === connectingFromId && edge.to === id)) {
        setConnectingFromId(null);
        notify("这两个节点已经连接");
        return;
      }
      const from = nodes.find((node) => node.id === connectingFromId);
      const to = nodes.find((node) => node.id === id);
      setEdges((current) => [...current, { id: `edge-${Date.now()}`, from: connectingFromId, to: id }]);
      setConnectingFromId(null);
      setSelectedNodeId(id);
      setInspectorTab("血缘");
      setSaved(false);
      notify(`已连接 ${from?.label} → ${to?.label}`);
      return;
    }
    setSelectedNodeId(id);
    setInspectorTab("配置");
  }

  function startConnecting() {
    if (connectingFromId) {
      setConnectingFromId(null);
      notify("已取消节点连线");
      return;
    }
    setConnectingFromId(selectedNode.id);
    notify(`已选择 ${selectedNode.label} 作为上游，请点击一个下游节点`);
  }

  function addWorkbenchNode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = nodeDraftName.trim();
    if (!label) return;
    const sameKindCount = nodes.filter((node) => node.kind === nodeDraftKind).length;
    const baseLeft = nodeDraftKind === "dataset" ? 44 : nodeDraftKind === "output" ? 996 : 620;
    const node: WorkbenchNode = {
      id: `node-${Date.now()}`,
      label,
      kind: nodeDraftKind,
      meta: nodeDraftKind === "dataset" ? "待接入数据集" : nodeDraftKind === "output" ? "待发布数据集" : nodeDraftKind === "annotation" ? "待配置标注任务" : "待配置 Recipe",
      position: { left: Math.min(996, baseLeft + (sameKindCount % 2) * 188), top: 310 + Math.floor(sameKindCount / 2) * 86 },
    };
    setNodes((current) => [...current, node]);
    if (node.kind === "recipe") setNodeConfigs((current) => ({ ...current, [node.id]: createGovernanceNodeConfig(node) }));
    setRunStates((current) => ({ ...current, [node.id]: { status: "未运行", duration: "--", detail: "等待配置与连接" } }));
    setSelectedNodeId(node.id);
    setInspectorTab("配置");
    setNodeDialogOpen(false);
    setNodeDraftName("");
    setSaved(false);
    notify(`${node.label} 已添加到治理画布`);
  }

  function removeWorkbenchNode() {
    if (!deleteTarget) return;
    const removedAssets = datasetMediaAssets[deleteTarget.id] ?? [];
    removedAssets.filter((asset) => asset.url.startsWith("blob:")).forEach((asset) => URL.revokeObjectURL(asset.url));
    if (removedAssets.length) {
      const removedUrls = new Set(removedAssets.map((asset) => asset.url));
      createdMediaUrlsRef.current = createdMediaUrlsRef.current.filter((url) => !removedUrls.has(url));
      setDatasetMediaAssets((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== deleteTarget.id)));
    }
    const remainingNodes = nodes.filter((node) => node.id !== deleteTarget.id);
    setNodes(remainingNodes);
    setEdges((current) => current.filter((edge) => edge.from !== deleteTarget.id && edge.to !== deleteTarget.id));
    setNodeConfigs((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== deleteTarget.id)));
    setRunStates((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== deleteTarget.id)));
    if (selectedNodeId === deleteTarget.id) setSelectedNodeId(remainingNodes[0]?.id ?? "");
    if (failedNodeId === deleteTarget.id) setFailedNodeId(null);
    if (connectingFromId === deleteTarget.id) setConnectingFromId(null);
    if (remainingNodes.length === 0) {
      setRunDialogOpen(false);
      setRunProgress(0);
    }
    setSaved(false);
    notify(`${deleteTarget.label} 及其关联连线已从画布移除`);
    setDeleteTarget(null);
  }

  function runNode(id: string) {
    const node = nodes.find((item) => item.id === id);
    if (!node) return;
    setRunProgress(8);
    setRunning(true);
    setRunMode("node");
    setActiveRunNodeId(id);
    setCurrentRunWillFail(false);
    setRunStates((current) => ({ ...current, [id]: { status: "运行中", duration: "--", detail: `${node.label} 正在重新执行` } }));
    setRunDialogOpen(true);
    notify(`${node.label} 已开始重新执行`);
  }

  function updateSelectedNodeLabel(value: string) {
    setNodes((current) => current.map((node) => node.id === selectedNode.id ? { ...node, label: value } : node));
    setSaved(false);
  }

  function updateSelectedRecipeConfig(patch: Partial<GovernanceNodeConfig>) {
    if (!isRecipeNode) return;
    const currentConfig = nodeConfigs[selectedNode.id] ?? createGovernanceNodeConfig(selectedNode);
    const nextConfig = { ...currentConfig, ...patch, validatedAt: undefined };
    setNodeConfigs((current) => ({ ...current, [selectedNode.id]: nextConfig }));
    setNodes((current) => current.map((node) => node.id === selectedNode.id ? { ...node, meta: `${nextConfig.category} · ${nextConfig.algorithm}` } : node));
    setRunStates((current) => ({ ...current, [selectedNode.id]: { status: "未运行", duration: "--", detail: "配置已修改，等待校验" } }));
    setSaved(false);
  }

  function changeSelectedRecipeCategory(category: GovernanceRecipeCategory) {
    const profile = governanceRecipeProfiles[category];
    updateSelectedRecipeConfig({
      category,
      algorithm: profile.algorithms[0],
      strategy: profile.parameterOptions[1] ?? profile.parameterOptions[0],
      threshold: profile.defaultThreshold,
    });
  }

  function validateSelectedNodeConfiguration() {
    if (!isRecipeNode || !selectedRecipeConfig) {
      notify(`已校验 ${selectedNode.label} 的配置`);
      return;
    }
    if (selectedRecipeConfigIssues.length > 0) {
      notify(`请完善${selectedRecipeConfigIssues.join("、")}后再校验`);
      return;
    }
    const validatedAt = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    setNodeConfigs((current) => ({ ...current, [selectedNode.id]: { ...selectedRecipeConfig, validatedAt } }));
    setRunStates((current) => ({ ...current, [selectedNode.id]: { status: "未运行", duration: "--", detail: selectedUpstream.length ? `配置校验通过 · ${selectedRecipeConfig.algorithm}` : "配置完整，等待连接上游数据" } }));
    notify(selectedUpstream.length ? `${selectedNode.label} 配置校验通过` : `${selectedNode.label} 配置完整，请继续连接上游数据`);
  }

  function runSelectedNode() {
    if (isRecipeNode && selectedRecipeConfigIssues.length > 0) {
      notify(`当前节点缺少${selectedRecipeConfigIssues.join("、")}，暂时无法运行`);
      return;
    }
    if (isRecipeNode && selectedUpstream.length === 0) {
      notify("请先将当前治理节点连接到上游数据集");
      return;
    }
    runNode(selectedNode.id);
  }

  function addAnnotationLabel() {
    const label = annotationLabelDraft.trim();
    if (!label) return;
    if (annotationLabels.includes(label)) {
      notify(`${label} 已在标注类别中`);
      return;
    }
    setAnnotationLabels((current) => [...current, label]);
    setAnnotationLabelDraft("");
    setSaved(false);
    notify(`已新增标注类别：${label}`);
  }

  function distributeAssignmentCounts(userIds: string[]) {
    if (!userIds.length) {
      setAssignmentCounts({});
      return;
    }
    const base = Math.floor(unassignedAnnotationCount / userIds.length);
    const remainder = unassignedAnnotationCount % userIds.length;
    setAssignmentCounts(Object.fromEntries(userIds.map((id, index) => [id, base + (index < remainder ? 1 : 0)])));
  }

  function toggleAssignmentUser(userId: string) {
    const next = selectedAssignmentIds.includes(userId) ? selectedAssignmentIds.filter((id) => id !== userId) : [...selectedAssignmentIds, userId];
    setSelectedAssignmentIds(next);
    distributeAssignmentCounts(next);
  }

  function openAssignmentDialog() {
    if (unassignedAnnotationCount === 0) {
      notify("当前没有未分派的标注样本");
      return;
    }
    setAssignmentSearch("");
    setSelectedAssignmentIds([]);
    setAssignmentCounts({});
    setAssignmentDialogOpen(true);
  }

  function confirmAnnotationAssignments() {
    if (!selectedAssignmentIds.length) {
      notify("请至少选择一名标注员");
      return;
    }
    if (selectedAssignmentTotal <= 0) {
      notify("请为已选人员设置大于 0 的任务量");
      return;
    }
    if (selectedAssignmentTotal > unassignedAnnotationCount) {
      notify(`分派数量不能超过剩余的 ${unassignedAnnotationCount.toLocaleString()} 个样本`);
      return;
    }
    const assignedAt = new Date().toLocaleString("zh-CN", { hour12: false });
    setAnnotationAssignmentsByNode((currentByNode) => {
      const next = [...(currentByNode[selectedNode.id] ?? [])];
      selectedAssignmentIds.forEach((userId) => {
        const operator = annotationOperators.find((item) => item.id === userId);
        const count = assignmentCounts[userId] ?? 0;
        if (!operator || count <= 0) return;
        const existingIndex = next.findIndex((assignment) => assignment.userId === userId && assignment.status === "进行中");
        if (existingIndex >= 0) next[existingIndex] = { ...next[existingIndex], count: next[existingIndex].count + count, assignedAt };
        else next.push({ userId, name: operator.name, team: operator.team, count, assignedAt, status: "进行中" });
      });
      return { ...currentByNode, [selectedNode.id]: next };
    });
    setSaved(false);
    setAssignmentDialogOpen(false);
    notify(`已向 ${selectedAssignmentIds.length} 名标注员分派 ${selectedAssignmentTotal.toLocaleString()} 个样本`);
  }

  function openAnnotationWorkspace() {
    if (fallbackAnnotationSource && !edges.some((edge) => edge.from === fallbackAnnotationSource.nodeId && edge.to === selectedNode.id)) {
      setNodes((current) => current.map((node) => node.id === fallbackAnnotationSource.nodeId ? { ...node, placed: true } : node));
      setEdges((current) => [...current, { id: `edge-${Date.now()}`, from: fallbackAnnotationSource.nodeId, to: selectedNode.id }]);
      setSaved(false);
    }
    if (!annotationImageAssets.length || connectedAnnotationSourceKey !== annotationSourceKey) {
      setAnnotationSourceKey(connectedAnnotationSourceKey);
      setAnnotationSampleIndex(0);
      setAnnotationShapes({});
      setAnnotationHistory([]);
      setCompletedAnnotationSamples([]);
      setDifficultAnnotationSamples([]);
      setSelectedAnnotationId(null);
    } else if (annotationSampleIndex >= annotationImageAssets.length) {
      setAnnotationSampleIndex(0);
    }
    setAnnotationProgress((current) => Math.min(100, current + 0.6));
    setSaved(false);
    setAnnotationWorkspaceOpen(true);
    notify(annotationImageAssets.length
      ? `${fallbackAnnotationSource ? "已自动将导入的图片数据集连接到当前节点，" : ""}已从上游数据集读取 ${annotationImageAssets.length} 张真实图片并打开${annotationTeam}标注工作台`
      : "上游数据集没有可预览图片，请先导入图片并连接到当前标注节点");
  }

  function inspectAnnotationRules() {
    setAnnotationRulesOpen(true);
    notify("标注规范检查完成，已展示规则明细");
  }

  const datasetCatalog = [
    { id: "catalog-basketball", name: "篮球原始图像", type: "图像数据集", scale: "12,680 个文件", source: "数据评估文件仓", updated: "5 分钟前" },
    { id: "catalog-finance", name: "金融年报文档", type: "文档数据集", scale: "1,286 个文件", source: "知识文档仓", updated: "2 小时前" },
    { id: "catalog-sft", name: "SFT 问答数据集", type: "文本数据集", scale: "38,420 条", source: "生产业务库", updated: "18 分钟前" },
    { id: "catalog-customer", name: "客户服务对话集", type: "多轮对话", scale: "86,510 条", source: "业务事件接口", updated: "刚刚" },
  ];

  async function importSelectedDatasets() {
    const selectedCatalog = datasetCatalog.filter((item) => selectedDatasetIds.includes(item.id));
    const relativePath = (localDatasetFiles[0] as (File & { webkitRelativePath?: string }) | undefined)?.webkitRelativePath ?? "";
    const folderName = relativePath.split("/")[0] ?? "";
    const onlyImages = localDatasetFiles.length > 0 && localDatasetFiles.every((file) => file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name));
    const inferredName = localDatasetName.trim() || folderName || (localDatasetFiles.length === 1 ? localDatasetFiles[0].name.replace(/\.[^.]+$/, "") : onlyImages ? "本地图像数据集" : "本地多模态数据集");
    const fileItems = localDatasetFiles.length ? [{ id: `local-${Date.now()}`, name: inferredName, type: onlyImages ? "图像数据集" : "本地文件", scale: `${localDatasetFiles.length} 个文件`, source: "本地上传", updated: "刚刚" }] : [];
    const imports = datasetImportMode === "资产库选择" ? selectedCatalog : fileItems;
    if (!imports.length) {
      notify(datasetImportMode === "资产库选择" ? "请至少选择一个数据集" : "请先选择要导入的本地文件");
      return;
    }
    const existingLabels = new Set(nodes.map((node) => node.label));
    const availableAnnotationNodes = canvasNodes.filter((node) => node.kind === "annotation");
    const targetAnnotation = selectedNode.kind === "annotation" && selectedNode.placed !== false ? selectedNode : availableAnnotationNodes.length === 1 ? availableAnnotationNodes[0] : null;
    const autoConnectImages = datasetImportMode === "本地文件导入" && onlyImages && Boolean(targetAnnotation);
    const existingLocalNode = datasetImportMode === "本地文件导入" ? nodes.find((node) => node.kind === "dataset" && node.label === inferredName) ?? null : null;
    const newNodes = imports.filter((item) => !existingLabels.has(item.name)).map((item, index) => ({
      id: `dataset-${Date.now()}-${index}`,
      label: item.name,
      kind: "dataset" as const,
      meta: item.scale,
      position: { left: 44, top: 58 + (nodes.filter((node) => node.kind === "dataset").length + index) * 150 },
      placed: autoConnectImages ? true : false,
    }));
    if (!newNodes.length && !existingLocalNode) {
      notify("所选数据集已在当前项目中");
      return;
    }
    if (datasetImportMode === "本地文件导入") {
      const imageFiles = localDatasetFiles.filter((file) => file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name));
      let assets: WorkbenchMediaAsset[];
      try {
        assets = await Promise.all(imageFiles.map(async (file) => ({
          name: file.name,
          url: await readFileAsDataUrl(file),
          type: file.type,
          size: file.size,
        })));
      } catch {
        notify("本地图片读取失败，请重新选择后导入");
        return;
      }
      const assetNodeId = newNodes[0]?.id ?? existingLocalNode?.id;
      if (assetNodeId) setDatasetMediaAssets((current) => ({ ...current, [assetNodeId]: assets }));
    }
    if (!newNodes.length && existingLocalNode) {
      if (autoConnectImages) {
        setNodes((current) => current.map((node) => node.id === existingLocalNode.id ? { ...node, placed: true } : node));
        if (targetAnnotation && !edges.some((edge) => edge.from === existingLocalNode.id && edge.to === targetAnnotation.id)) {
          setEdges((current) => [...current, { id: `edge-${Date.now()}`, from: existingLocalNode.id, to: targetAnnotation.id }]);
        }
      }
      setSelectedNodeId(autoConnectImages && targetAnnotation ? targetAnnotation.id : existingLocalNode.id);
      setSaved(false);
      setDatasetImportOpen(false);
      setSelectedDatasetIds([]);
      setLocalDatasetFiles([]);
      setLocalDatasetName("");
      notify(autoConnectImages && targetAnnotation
        ? `已更新${existingLocalNode.label}的 ${localDatasetFiles.length} 张图片，并自动连接到${targetAnnotation.label}`
        : `已更新${existingLocalNode.label}的本地文件`);
      return;
    }
    setNodes((current) => [...current, ...newNodes]);
    if (autoConnectImages && targetAnnotation) {
      setEdges((current) => [...current, { id: `edge-${Date.now()}`, from: newNodes[0].id, to: targetAnnotation.id }]);
    }
    setRunStates((current) => ({ ...current, ...Object.fromEntries(newNodes.map((node) => [node.id, { status: "未运行" as const, duration: "--", detail: node.meta }])) }));
    setSelectedNodeId(autoConnectImages && targetAnnotation ? targetAnnotation.id : newNodes[0].id);
    setResourceType("数据集");
    setSaved(false);
    setDatasetImportOpen(false);
    setSelectedDatasetIds([]);
    setLocalDatasetFiles([]);
    setLocalDatasetName("");
    notify(autoConnectImages && targetAnnotation
      ? `已导入 ${localDatasetFiles.length} 张图片，并自动连接到${targetAnnotation.label}`
      : `已导入 ${newNodes.length} 个数据集，请从左侧选择后添加到画布`);
  }

  function placeSelectedResource() {
    if (selectedNode.placed !== false) return;
    const placedDatasetCount = canvasNodes.filter((node) => node.kind === "dataset").length;
    setNodes((current) => current.map((node) => node.id === selectedNode.id ? { ...node, placed: true, position: { left: 44, top: 58 + placedDatasetCount * 150 } } : node));
    setSaved(false);
    notify(`${selectedNode.label} 已添加到流程画布，可继续连接治理节点`);
  }

  function changeAnnotationSample(next: number) {
    setAnnotationSampleIndex(Math.max(0, Math.min(Math.max(0, annotationImageAssets.length - 1), next)));
    setSelectedAnnotationId(null);
    setPolygonPoints([]);
    setDraftRect(null);
  }

  function saveAnnotationSample(andNext = false) {
    if (!currentAnnotationAsset) {
      notify("没有可保存的真实图片样本，请先连接图片数据集");
      return;
    }
    const shapes = annotationShapes[annotationSampleIndex] ?? [];
    if (!shapes.some((shape) => shape.type === "rect" || shape.type === "polygon")) {
      notify("当前样本至少需要一个矩形框或多边形对象");
      return;
    }
    if (shapes.some((shape) => shape.type === "rect" && ((shape.width ?? 0) < 2 || (shape.height ?? 0) < 2))) {
      notify("存在尺寸过小的目标框，请修正后再提交");
      return;
    }
    setCompletedAnnotationSamples((current) => current.includes(annotationSampleIndex) ? current : [...current, annotationSampleIndex]);
    setAnnotationProgress((current) => Math.min(100, current + (completedAnnotationSamples.includes(annotationSampleIndex) ? 0 : .1)));
    notify(andNext ? "标注结果已保存，已进入下一条样本" : "当前样本的标注结果已保存");
    if (andNext) changeAnnotationSample(annotationSampleIndex + 1);
  }

  function updateSelectedAnnotation(patch: Partial<AnnotationShape>) {
    if (!selectedAnnotationId) return;
    setAnnotationShapes((all) => ({ ...all, [annotationSampleIndex]: (all[annotationSampleIndex] ?? []).map((shape) => shape.id === selectedAnnotationId ? { ...shape, ...patch } : shape) }));
  }

  function applyAiPrelabel() {
    if (!currentAnnotationAsset) {
      notify("没有可预标注的真实图片，请先连接图片数据集");
      return;
    }
    rememberAnnotationState();
    const now = Date.now();
    const suggestions: AnnotationShape[] = [
      { id: `ai-target-${now}`, type: "rect", label: "目标", color: "#2e7fe8", x: 35, y: 26, width: 30, height: 42, occlusion: "无遮挡", state: "待确认", note: "AI 预标注，置信度 0.91" },
      { id: `ai-point-${now}`, type: "point", label: "目标", color: "#ffd83d", x: 50, y: 47 },
    ];
    setAnnotationShapes((all) => ({ ...all, [annotationSampleIndex]: [...(all[annotationSampleIndex] ?? []), ...suggestions] }));
    setSelectedAnnotationId(suggestions[0].id);
    notify("已生成 1 个 AI 预标注对象，请人工确认");
  }

  function clearCurrentAnnotations() {
    const current = annotationShapes[annotationSampleIndex] ?? [];
    if (!current.length) return;
    rememberAnnotationState();
    setAnnotationShapes((all) => ({ ...all, [annotationSampleIndex]: [] }));
    setSelectedAnnotationId(null);
    setPolygonPoints([]);
    notify("当前样本标注已清空，可通过撤销恢复");
  }

  function toggleSelectedAnnotationVisibility() {
    const shape = (annotationShapes[annotationSampleIndex] ?? []).find((item) => item.id === selectedAnnotationId);
    if (!shape) {
      notify("请先选择标注对象");
      return;
    }
    const nextVisible = shape.visible === false;
    const baseColor = shape.type === "point" ? "#ffd83d" : shape.label === "篮球" ? "#ed8a2f" : shape.label === "运动员" ? "#2e7fe8" : "#8a5bd3";
    updateSelectedAnnotation({ visible: nextVisible, color: nextVisible ? baseColor : "transparent" });
    notify(nextVisible ? "已显示当前对象" : "已隐藏当前对象");
  }

  if (annotationWorkspaceOpen) {
    const samples = annotationImageAssets;
    const currentShapes = annotationShapes[annotationSampleIndex] ?? [];
    const selectedAnnotation = currentShapes.find((shape) => shape.id === selectedAnnotationId) ?? null;
    const objectShapes = currentShapes.filter((shape) => shape.type !== "point");
    const pointCount = currentShapes.filter((shape) => shape.type === "point").length;
    return <section className="annotation-workspace">
      <header className="annotation-workspace-head"><div><button onClick={() => setAnnotationWorkspaceOpen(false)}><UiIcon icon={ArrowLeft} />返回治理工作间</button><span /><div><strong>{selectedNode.label}</strong><small>{annotationTeam} · {annotationType}{currentAnnotationAsset ? ` · ${currentAnnotationAsset.name}` : ""}</small></div></div><div><Status tone={currentAnnotationAsset ? "blue" : "gray"}>{currentAnnotationAsset ? "标注中" : "等待图片"}</Status><span>{annotationSavedAt}</span><span>已完成 {completedAnnotationSamples.filter((index) => index < samples.length).length} / {samples.length}</span><div className="annotation-zoom"><button aria-label="缩小画布" title="缩小画布" onClick={() => setAnnotationZoom((value) => Math.max(70, value - 10))}><UiIcon icon={Minus} /></button><button title="恢复 100%" onClick={() => setAnnotationZoom(100)}>{annotationZoom}%</button><button aria-label="放大画布" title="放大画布" onClick={() => setAnnotationZoom((value) => Math.min(150, value + 10))}><UiIcon icon={ZoomIn} /></button></div><button disabled={!currentAnnotationAsset} onClick={applyAiPrelabel}><UiIcon icon={Sparkles} />AI 预标注</button><button disabled={!currentAnnotationAsset} onClick={toggleSelectedAnnotationVisibility}><UiIcon icon={Eye} />对象显隐</button><button disabled={!currentAnnotationAsset} onClick={clearCurrentAnnotations}><UiIcon icon={Trash2} />清空</button><button aria-label="查看快捷键" title="快捷键" onClick={() => setAnnotationShortcutsOpen(true)}><UiIcon icon={KeyRound} /></button><button disabled={!currentAnnotationAsset} onClick={() => saveAnnotationSample(false)}><UiIcon icon={Save} />保存进度</button><button className="primary" disabled={!currentAnnotationAsset} onClick={() => saveAnnotationSample(true)}><UiIcon icon={Check} />提交并下一条</button></div></header>
      <div className="annotation-workspace-body">
        <aside className="annotation-sample-queue"><header><strong>样本队列</strong><small>{completedAnnotationSamples.filter((index) => index < samples.length).length} / {samples.length} 已完成</small></header><label><UiIcon icon={Search} /><input placeholder="搜索真实文件名" /></label>{samples.length === 0 && <div className="annotation-sample-empty"><UiIcon icon={FileImage} /><strong>未读取到图片</strong><small>返回治理工作间，导入图片数据集并连接到此标注节点。</small></div>}{samples.map((sample, index) => <button key={sample.url} className={`${annotationSampleIndex === index ? "active" : ""} ${difficultAnnotationSamples.includes(index) ? "difficult" : ""}`} onClick={() => changeAnnotationSample(index)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{sample.name}</strong><small>{difficultAnnotationSamples.includes(index) ? "疑难样本" : completedAnnotationSamples.includes(index) ? "已完成" : index === annotationSampleIndex ? "标注中" : "待标注"}</small></div><UiIcon icon={ChevronRight} /></button>)}</aside>
        <main className="annotation-stage"><nav><div>{(["矩形框", "关键点", "多边形"] as const).map((tool) => <button key={tool} className={annotationTool === tool ? "active" : ""} onClick={() => { setAnnotationTool(tool); setPolygonPoints([]); }}>{tool}</button>)}{annotationTool === "多边形" && polygonPoints.length > 0 && <button className="finish-polygon" onClick={finishPolygon}>完成多边形 ({polygonPoints.length})</button>}</div><div><button onClick={undoAnnotation}><UiIcon icon={Undo2} />撤销</button><button onClick={() => { setDraftRect(null); setPolygonPoints([]); notify("画布已适配窗口"); }}><UiIcon icon={LocateFixed} />适配画布</button><span>100%</span></div></nav><div ref={annotationCanvasRef} className={`annotation-canvas tool-${annotationTool}`} onPointerDown={annotationCanvasPointerDown} onPointerMove={annotationCanvasPointerMove} onPointerUp={annotationCanvasPointerUp}><div className="court-lines"><i /><i /><i /></div><div className="player player-a" /><div className="player player-b" /><div className="ball-object" /><svg className="annotation-svg" viewBox="0 0 100 100" preserveAspectRatio="none">{currentShapes.map((shape) => shape.type === "rect" ? <g key={shape.id} className={selectedAnnotationId === shape.id ? "selected" : ""} onPointerDown={(event) => { event.stopPropagation(); setSelectedAnnotationId(shape.id); }}><rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={`${shape.color}18`} stroke={shape.color} vectorEffect="non-scaling-stroke" /><text x={(shape.x ?? 0) + .5} y={Math.max(3, (shape.y ?? 0) - 1)} fill={shape.color}>{shape.label}</text></g> : shape.type === "point" ? <circle key={shape.id} className={selectedAnnotationId === shape.id ? "selected" : ""} cx={shape.x} cy={shape.y} r="0.8" fill={shape.color} stroke="#4d4210" vectorEffect="non-scaling-stroke" onPointerDown={(event) => { event.stopPropagation(); setSelectedAnnotationId(shape.id); }} /> : <polygon key={shape.id} className={selectedAnnotationId === shape.id ? "selected" : ""} points={(shape.points ?? []).map((point) => `${point.x},${point.y}`).join(" ")} fill={`${shape.color}25`} stroke={shape.color} vectorEffect="non-scaling-stroke" onPointerDown={(event) => { event.stopPropagation(); setSelectedAnnotationId(shape.id); }} />)}{draftRect && <rect className="draft" x={draftRect.x} y={draftRect.y} width={draftRect.width} height={draftRect.height} fill="rgba(46,127,232,.1)" stroke={draftRect.color} vectorEffect="non-scaling-stroke" />}{polygonPoints.length > 0 && <><polyline className="draft" points={polygonPoints.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#8a5bd3" vectorEffect="non-scaling-stroke" />{polygonPoints.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r=".65" fill="#fff" stroke="#8a5bd3" vectorEffect="non-scaling-stroke" />)}</>}</svg><div className="canvas-tip">当前工具：{annotationTool} · {annotationTool === "矩形框" ? "拖拽创建目标框" : annotationTool === "关键点" ? "点击添加关键点" : "依次点击顶点后完成多边形"} · Delete 删除选中对象</div></div><footer><span>样本 {annotationSampleIndex + 1} / {samples.length} · {currentShapes.length} 个标注</span><div><button disabled={annotationSampleIndex === 0} onClick={() => changeAnnotationSample(annotationSampleIndex - 1)}>上一条</button><button className={difficultAnnotationSamples.includes(annotationSampleIndex) ? "active" : ""} onClick={() => { setDifficultAnnotationSamples((current) => current.includes(annotationSampleIndex) ? current.filter((index) => index !== annotationSampleIndex) : [...current, annotationSampleIndex]); notify("疑难样本状态已更新"); }}><UiIcon icon={TriangleAlert} />{difficultAnnotationSamples.includes(annotationSampleIndex) ? "取消疑难" : "标记疑难"}</button><button className="primary" onClick={() => saveAnnotationSample(true)}>保存并下一条</button></div></footer></main>
        <aside className="annotation-object-panel"><header><strong>标注对象</strong><small>{objectShapes.length} 个对象 · {pointCount} 个关键点</small></header><section><h4>当前标注类别</h4><div className="annotation-class-grid">{annotationLabels.map((label) => { const count = currentShapes.filter((shape) => shape.label === label && shape.type !== "point").length; const color = label === "篮球" ? "#ed8a2f" : label === "运动员" ? "#2e7fe8" : "#8b9bad"; return <button key={label} className={activeAnnotationLabel === label ? "active" : ""} onClick={() => { setActiveAnnotationLabel(label); if (selectedAnnotation) { rememberAnnotationState(); updateSelectedAnnotation({ label, color }); } }}><i style={{ background: color }} />{label}<span>{count}</span></button>; })}</div></section><section><h4>对象列表</h4>{objectShapes.length === 0 && <div className="annotation-object-empty">请在画布中创建标注对象</div>}{objectShapes.map((shape, index) => <button key={shape.id} className={`annotation-object ${selectedAnnotationId === shape.id ? "active" : ""}`} onClick={() => setSelectedAnnotationId(shape.id)}><span style={{ background: shape.color }} /><div><strong>{shape.label} #{index + 1}</strong><small>{shape.type === "rect" ? "矩形框" : "多边形"}{currentShapes.filter((item) => item.type === "point" && item.label === shape.label).length ? ` + ${currentShapes.filter((item) => item.type === "point" && item.label === shape.label).length} 个关键点` : ""}</small></div><UiIcon icon={Eye} /></button>)}</section><section className="annotation-attributes"><h4>对象属性</h4>{selectedAnnotation ? <><label>遮挡程度<select value={selectedAnnotation.occlusion ?? "无遮挡"} onChange={(event) => updateSelectedAnnotation({ occlusion: event.target.value })}><option>无遮挡</option><option>轻微遮挡</option><option>严重遮挡</option></select></label><label>目标状态<select value={selectedAnnotation.state ?? "运动中"} onChange={(event) => updateSelectedAnnotation({ state: event.target.value })}><option>运动中</option><option>静止</option><option>模糊</option></select></label><label>备注<textarea value={selectedAnnotation.note ?? ""} onChange={(event) => updateSelectedAnnotation({ note: event.target.value })} placeholder="补充复核说明" /></label><button className="delete-annotation" onClick={() => { rememberAnnotationState(); setAnnotationShapes((all) => ({ ...all, [annotationSampleIndex]: currentShapes.filter((shape) => shape.id !== selectedAnnotation.id) })); setSelectedAnnotationId(null); notify("标注对象已删除"); }}><UiIcon icon={Trash2} />删除当前对象</button></> : <div className="annotation-object-empty">选择对象后可编辑属性</div>}</section></aside>
      </div>
      {annotationShortcutsOpen && <div className="annotation-shortcuts"><button className="dialog-dismiss" aria-label="关闭快捷键" onClick={() => setAnnotationShortcutsOpen(false)} /><section><header><div><h3>标注快捷键</h3><p>使用键盘可显著提升连续标注效率</p></div><button onClick={() => setAnnotationShortcutsOpen(false)}><UiIcon icon={X} /></button></header><div><span><kbd>1</kbd><b>矩形框工具</b></span><span><kbd>2</kbd><b>关键点工具</b></span><span><kbd>3</kbd><b>多边形工具</b></span><span><kbd>⌘ / Ctrl + Z</kbd><b>撤销</b></span><span><kbd>⌘ / Ctrl + S</kbd><b>保存样本</b></span><span><kbd>Delete</kbd><b>删除对象</b></span><span><kbd>←</kbd><b>上一条</b></span><span><kbd>→</kbd><b>下一条</b></span></div><footer><button onClick={() => setAnnotationShortcutsOpen(false)}>知道了</button></footer></section></div>}
    </section>;
  }

  return (
    <section className="governance-workbench">
      <header className="workbench-project-head">
        <div className="workbench-breadcrumb">
          <button onClick={onBack}>‹ 治理项目管理</button><span>/</span>
          <div><strong>{project.name}</strong><small>{project.overview}</small></div>
          <i className={saved ? "saved" : ""}>{saved ? "✓ 已保存" : "● 有未保存修改"}</i>
        </div>
        <div className="workbench-actions">
          <button title="撤销" aria-label="撤销" disabled={nodes.length === 0} onClick={() => notify("已撤销上一步画布操作")}><UiIcon icon={Undo2} /></button>
          <button title="重做" aria-label="重做" disabled={nodes.length === 0} onClick={() => notify("已重做画布操作")}><UiIcon icon={Redo2} /></button>
          <button className="workbench-save" onClick={() => { onSave({ nodes, edges, mediaAssets: datasetMediaAssets, nodeConfigs }); setSaved(true); notify("项目流程已保存"); }}><UiIcon icon={Save} />保存</button>
          <button disabled={nodes.length === 0} onClick={() => notify("已打开定时任务配置")}><UiIcon icon={CalendarClock} />定时任务</button>
          <button className="workbench-run" disabled={running || runtimeNodes.length === 0} onClick={runFlow}><UiIcon icon={running ? RefreshCw : Play} />{running ? `运行中 ${runProgress}%` : "运行全部"}</button>
        </div>
      </header>

      <nav className="workbench-view-tabs">
        <div>
          <button className="active">数据流程</button>
        </div>
        <div className="canvas-view-actions">
          <button aria-label="缩小画布" onClick={() => setZoom((value) => Math.max(60, value - 10))}><UiIcon icon={Minus} /></button><span>{zoom}%</span><button aria-label="放大画布" onClick={() => setZoom((value) => Math.min(130, value + 10))}><UiIcon icon={ZoomIn} /></button>
        </div>
      </nav>

      <div className={`workbench-body ${nodes.length === 0 ? "empty-workbench" : ""}`}>
        <aside className="flow-resource-panel">
          <header><strong>项目资源</strong><button aria-label="选择导入数据集" title="选择导入数据集" onClick={() => setDatasetImportOpen(true)}><UiIcon icon={Plus} /></button></header>
          <div className="resource-tabs">
            {(["数据集", "Recipe"] as const).map((item) => <button key={item} className={resourceType === item ? "active" : ""} onClick={() => setResourceType(item)}>{item}<b>{resourceCount[item]}</b></button>)}
          </div>
          <label className="resource-search"><UiIcon icon={Search} /><input value={resourceSearch} onChange={(event) => setResourceSearch(event.target.value)} placeholder={`搜索${resourceType}`} /></label>
          <div className="resource-list">
            {filteredResources.map((node) => (
              <button key={node.id} className={`${selectedNodeId === node.id ? "active" : ""} ${node.placed === false ? "unplaced" : ""}`} onClick={() => selectNode(node.id)}>
                <span className={node.kind}><UiIcon icon={getWorkbenchNodeIcon(node.kind)} size={15} /></span>
                <div><strong>{node.label}</strong><small>{node.meta}{node.placed === false ? " · 待加入画布" : ""}</small></div><i><UiIcon icon={ChevronRight} size={13} /></i>
              </button>
            ))}
          </div>
          <footer><span className={failedNodeId ? "has-failure" : ""}><UiIcon icon={failedNodeId ? TriangleAlert : nodes.length ? CircleCheck : Database} size={11} />{failedNodeId ? "1 个节点等待重试" : nodes.length ? `${successfulNodeCount} 个节点已成功运行` : "暂无项目资源"}</span><button aria-label="刷新项目资源" onClick={() => notify("已刷新项目资源")}><UiIcon icon={RefreshCw} size={13} /></button></footer>
        </aside>

        <main className="flow-canvas-shell">
          <header className="flow-canvas-head">
            <div><span className="live-dot" /><strong>主流程</strong><small>最近保存：刚刚</small></div>
            <div><button onClick={() => setNodeDialogOpen(true)}><UiIcon icon={Plus} />添加节点</button><button disabled={nodes.length === 0} className={connectingFromId ? "active" : ""} onClick={startConnecting}><UiIcon icon={Link2} />{connectingFromId ? "取消连线" : "连接节点"}</button><button disabled={nodes.length === 0} onClick={() => notify("流程筛选器已展开")}><UiIcon icon={Filter} />筛选</button><button disabled={nodes.length === 0} onClick={() => notify("流程已导出为 PNG")}><UiIcon icon={Download} />导出</button><button disabled={nodes.length === 0} onClick={() => notify("已定位全部流程节点")}><UiIcon icon={LocateFixed} />定位</button></div>
          </header>
          <div className="flow-canvas-viewport">
            {connectingFromId && <div className="connection-mode-banner"><UiIcon icon={Link2} /><span>上游：<strong>{nodes.find((node) => node.id === connectingFromId)?.label}</strong>，点击下游节点完成连接</span><button onClick={() => setConnectingFromId(null)}>取消</button></div>}
            <div className={`flow-canvas ${canvasNodes.length === 0 ? "is-empty" : ""}`} style={{ height: canvasHeight, transform: `scale(${zoom / 100})` }}>
              {canvasNodes.length > 0 && <><div className="flow-lane-label lane-input">原始数据</div><div className="flow-lane-label lane-process">治理处理</div><div className="flow-lane-label lane-output">高质量数据</div></>}
              {edges.map((edge) => {
                const style = getWorkbenchEdgeStyle(edge, canvasNodes);
                return style && <i key={edge.id} className="flow-edge" style={{ left: style.left, top: style.top, width: style.width, transform: `rotate(${style.rotate}deg)` }}><b /></i>;
              })}
              {canvasNodes.map((node) => {
                const nodeRunState = runStates[node.id]?.status ?? "未运行";
                return (
                <button
                  key={node.id}
                  className={`flow-node ${node.kind} ${selectedNodeId === node.id ? "active" : ""} ${connectingFromId === node.id ? "connecting-source" : ""} run-${nodeRunState}`}
                  style={{ left: node.position.left, top: node.position.top }}
                  onClick={() => selectNode(node.id)}
                  onDoubleClick={() => notify(`已打开 ${node.label} 详情`)}
                >
                  <span><UiIcon icon={getWorkbenchNodeIcon(node.kind)} size={16} /></span>
                  <div><strong>{node.label}</strong><small>{node.meta}</small></div><i>{nodeRunState === "失败" ? "运行失败" : nodeRunState === "运行中" && node.kind === "annotation" ? `${annotationProgress.toFixed(1)}%` : nodeRunState}</i>
                </button>
              );})}
              {canvasNodes.length === 0 && <div className="flow-canvas-empty">
                <header><span><UiIcon icon={Workflow} size={23} /></span><div><small>新建治理流程</small><strong>从数据资产开始搭建质量治理链路</strong><p>按“数据接入—治理处理—质量交付”的顺序添加并连接节点。</p></div></header>
                <div className="empty-flow-steps">
                  <div><span className="dataset"><UiIcon icon={Database} size={17} /></span><i>01</i><strong>添加数据资产</strong><p>选择已接入的数据集，定义流程输入。</p></div><b><UiIcon icon={ChevronRight} size={17} /></b>
                  <div><span className="recipe"><UiIcon icon={Blocks} size={17} /></span><i>02</i><strong>编排治理节点</strong><p>配置清洗、标注、规则过滤与复核。</p></div><b><UiIcon icon={ChevronRight} size={17} /></b>
                  <div><span className="output"><UiIcon icon={PackageCheck} size={17} /></span><i>03</i><strong>生成高质量数据</strong><p>运行流程，沉淀版本、血缘和质量结果。</p></div>
                </div>
                <footer><button onClick={() => setNodeDialogOpen(true)}><UiIcon icon={Plus} />添加第一个节点</button><span>支持数据集、治理 Recipe、标注任务和输出数据集</span></footer>
              </div>}
            </div>
          </div>
          {canvasNodes.length > 0 && <div className="canvas-minimap"><i /><i /><i /><i /><span /></div>}
        </main>

        {nodes.length > 0 && <aside className="node-inspector">
          <header><div><span className={selectedNode.kind}><UiIcon icon={getWorkbenchNodeIcon(selectedNode.kind)} size={16} /></span><div><strong>{selectedNode.label}</strong><small>{selectedProfile.typeLabel} · {selectedNode.meta}</small></div></div><div className="node-inspector-actions"><button aria-label="从当前节点连接" title="从当前节点连接" onClick={startConnecting}><UiIcon icon={Link2} /></button><button aria-label="删除当前节点" title="删除当前节点" disabled={running} onClick={() => setDeleteTarget(selectedNode)}><UiIcon icon={Trash2} /></button><button aria-label="更多节点操作" onClick={() => notify(`${selectedNode.label} 的更多操作已展开`)}><UiIcon icon={MoreHorizontal} /></button></div></header>
          <div className="inspector-tabs">{(["配置", "质量", "血缘"] as const).map((tab) => <button className={inspectorTab === tab ? "active" : ""} key={tab} onClick={() => setInspectorTab(tab)}>{tab}</button>)}</div>
          {inspectorTab === "配置" && <div className="inspector-content">
            {isAnnotationNode ? <>
              <div className="annotation-config-head"><div><h4>标注任务配置</h4><small>剩余 {unassignedAnnotationCount.toLocaleString()} 个样本待分派</small></div><Status tone="blue">进行中</Status></div>
              <label>标注任务类型<select value={annotationType} onChange={(event) => { setAnnotationType(event.target.value); setSaved(false); }}><option>目标检测 + 关键点</option><option>目标检测</option><option>图像分类</option><option>实例分割</option></select></label>
              <label>标注工具<select defaultValue="矩形框 + 关键点"><option>矩形框 + 关键点</option><option>多边形</option><option>语义分割画笔</option></select></label>
              <div className="annotation-label-section">
                <div className="annotation-section-title"><span>标注类别</span><small>{annotationLabels.length} 项</small></div>
                <div className="annotation-labels">{annotationLabels.map((label) => <span key={label}>{label}<button aria-label={`删除${label}`} onClick={() => { setAnnotationLabels((current) => current.filter((item) => item !== label)); setSaved(false); }}><UiIcon icon={X} size={9} /></button></span>)}</div>
                <div className="annotation-label-add"><input value={annotationLabelDraft} onChange={(event) => setAnnotationLabelDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addAnnotationLabel(); } }} placeholder="新增类别名称" /><button onClick={addAnnotationLabel}><UiIcon icon={Plus} size={11} />添加</button></div>
              </div>
              <div className="annotation-option-list">
                <div><span><strong>AI 预标注</strong><small>生成初始框，人工确认后提交</small></span><button className={aiPrelabel ? "on" : ""} aria-pressed={aiPrelabel} onClick={() => { setAiPrelabel(!aiPrelabel); setSaved(false); }}><i /></button></div>
                <div><span><strong>双人复核</strong><small>高风险样本由第二位标注员复核</small></span><button className={doubleReview ? "on" : ""} aria-pressed={doubleReview} onClick={() => { setDoubleReview(!doubleReview); setSaved(false); }}><i /></button></div>
              </div>
              <label>执行团队<select value={annotationTeam} onChange={(event) => { setAnnotationTeam(event.target.value); setSaved(false); }}><option>视觉标注一组</option><option>视觉标注二组</option><option>外部协作团队</option></select></label>
              <label className="sampling-field"><span>质检抽样比例 <b>{samplingRate}%</b></span><input type="range" min="5" max="30" step="5" value={samplingRate} onChange={(event) => { setSamplingRate(Number(event.target.value)); setSaved(false); }} /></label>
              <div className="annotation-progress-summary"><span><small>已完成</small><strong>{Math.round(12680 * annotationProgress / 100).toLocaleString()}</strong></span><span><small>待复核</small><strong>386</strong></span><span><small>已驳回</small><strong>42</strong></span></div>
              <button className="inspector-secondary" disabled={unassignedAnnotationCount === 0} onClick={openAssignmentDialog}><UiIcon icon={UserRound} />{unassignedAnnotationCount === 0 ? "任务已全部分派" : "分派剩余任务"}</button>
              {annotationAssignments.length > 0 && <div className="annotation-assignment-preview"><header><span>当前分派</span><small>{annotationAssignments.filter((assignment) => assignment.status === "进行中").length} 人 · {assignedAnnotationCount.toLocaleString()} 个样本</small></header>{annotationAssignments.filter((assignment) => assignment.status === "进行中").slice(-3).map((assignment) => <div key={assignment.userId}><i>{assignment.name.slice(0, 1)}</i><span><strong>{assignment.name}</strong><small>{assignment.team}</small></span><b>{assignment.count.toLocaleString()}</b></div>)}</div>}
            </> : isRecipeNode && selectedRecipeConfig && selectedRecipeProfile ? <>
              <div className="recipe-config-head">
                <div><h4>数据治理节点配置</h4><small>{selectedRecipeProfile.description}</small></div>
                <Status tone={selectedRecipeConfigIssues.length ? "orange" : selectedRecipeConfig.validatedAt ? "green" : "blue"}>{selectedRecipeConfigIssues.length ? "待完善" : selectedRecipeConfig.validatedAt ? "已校验" : "待校验"}</Status>
              </div>
              <label>节点名称<input value={selectedNode.label} onChange={(event) => updateSelectedNodeLabel(event.target.value)} /></label>
              <label>治理类型<select value={selectedRecipeConfig.category} onChange={(event) => changeSelectedRecipeCategory(event.target.value as GovernanceRecipeCategory)}>{(Object.keys(governanceRecipeProfiles) as GovernanceRecipeCategory[]).map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>治理算法<select value={selectedRecipeConfig.algorithm} onChange={(event) => updateSelectedRecipeConfig({ algorithm: event.target.value })}>{selectedRecipeProfile.algorithms.map((algorithm) => <option key={algorithm}>{algorithm}</option>)}</select></label>
              <div className="config-pair"><span><small>输出格式</small><strong>{selectedRecipeProfile.format}</strong></span><span><small>运行引擎</small><strong>{selectedRecipeProfile.engine}</strong></span></div>
              <div className="recipe-config-grid">
                <label>处理范围<select value={selectedRecipeConfig.scope} onChange={(event) => updateSelectedRecipeConfig({ scope: event.target.value as GovernanceNodeConfig["scope"] })}><option>全量数据</option><option>仅新增数据</option><option>风险样本</option></select></label>
                <label>关键字段<input value={selectedRecipeConfig.keyFields} onChange={(event) => updateSelectedRecipeConfig({ keyFields: event.target.value })} placeholder="例如：id, business_key" /></label>
              </div>
              <label>{selectedRecipeProfile.parameterLabel}<select value={selectedRecipeConfig.strategy} onChange={(event) => updateSelectedRecipeConfig({ strategy: event.target.value })}>{selectedRecipeProfile.parameterOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label className="recipe-threshold-field"><span>质量阈值 <b>{selectedRecipeConfig.threshold}%</b></span><input type="range" min="50" max="100" step="1" value={selectedRecipeConfig.threshold} onChange={(event) => updateSelectedRecipeConfig({ threshold: Number(event.target.value) })} /></label>
              <label>异常数据策略<select value={selectedRecipeConfig.exceptionPolicy} onChange={(event) => updateSelectedRecipeConfig({ exceptionPolicy: event.target.value as GovernanceNodeConfig["exceptionPolicy"] })}><option>隔离并记录</option><option>跳过并告警</option><option>终止当前流程</option></select></label>
              <label>输出方式<select value={selectedRecipeConfig.outputMode} onChange={(event) => updateSelectedRecipeConfig({ outputMode: event.target.value as GovernanceNodeConfig["outputMode"] })}><option>生成新版本</option><option>覆盖当前版本</option><option>仅输出问题清单</option></select></label>
              <label>执行策略<select value={selectedRecipeConfig.trigger} onChange={(event) => updateSelectedRecipeConfig({ trigger: event.target.value as GovernanceNodeConfig["trigger"] })}><option>按上游变更触发</option><option>手动触发</option><option>定时触发</option></select></label>
              <div className="recipe-audit-option"><span><strong>保留处理轨迹</strong><small>记录命中规则、原始值与修复结果</small></span><button className={selectedRecipeConfig.keepAudit ? "on" : ""} aria-pressed={selectedRecipeConfig.keepAudit} onClick={() => updateSelectedRecipeConfig({ keepAudit: !selectedRecipeConfig.keepAudit })}><i /></button></div>
              <div className={`recipe-config-state ${selectedRecipeConfigIssues.length ? "warning" : "ready"}`}><UiIcon icon={selectedRecipeConfigIssues.length ? TriangleAlert : CircleCheck} /><span><strong>{selectedRecipeConfigIssues.length ? `尚需配置：${selectedRecipeConfigIssues.join("、")}` : "治理参数已完整"}</strong><small>{selectedRecipeConfig.validatedAt ? `最近校验 ${selectedRecipeConfig.validatedAt}` : selectedUpstream.length ? `已连接 ${selectedUpstream.length} 个上游节点` : "配置后请连接上游数据"}</small></span></div>
              <div className="node-tags"><small>节点标签</small><span>{selectedRecipeProfile.tag}</span><span>{selectedRecipeConfig.scope}</span>{selectedRecipeConfig.keepAudit && <span>可追溯</span>}</div>
            </> : <>
              <h4>{selectedProfile.typeLabel}配置</h4>
              <label>节点名称<input key={selectedNode.id} defaultValue={selectedNode.label} onChange={(event) => updateSelectedNodeLabel(event.target.value)} /></label>
              <div className="config-pair"><span><small>数据格式</small><strong>{selectedProfile.format}</strong></span><span><small>运行引擎</small><strong>{selectedProfile.engine}</strong></span></div>
              {selectedProfile.fields.map((field) => <label key={`${selectedNode.id}-${field.label}`}>{field.label}{field.options
                ? <select defaultValue={field.value} onChange={() => setSaved(false)}>{field.options.map((option) => <option key={option}>{option}</option>)}</select>
                : <input defaultValue={field.value} onChange={() => setSaved(false)} />}</label>)}
              <div className="node-tags"><small>节点标签</small>{selectedProfile.tags.map((tag) => <span key={tag}>{tag}</span>)}<button aria-label="添加标签" onClick={() => notify("已打开标签选择器")}><UiIcon icon={Plus} size={12} /></button></div>
            </>}
          </div>}
          {inspectorTab === "质量" && <div className="inspector-content quality-inspector">
            <h4>{isAnnotationNode ? "标注进度与质量" : `${selectedProfile.typeLabel}质量`}</h4>
            {selectedMetrics.map((metric) => <div key={metric.label}><span><strong>{metric.label}</strong><b>{metric.value}</b></span><i><b style={{ width: `${metric.score}%` }} /></i></div>)}
            {isAnnotationNode && <div className="annotation-review-queue"><header><strong>复核队列</strong><small>按风险排序</small></header><button onClick={() => notify("已打开遮挡目标复核队列")}><span>遮挡目标</span><b>168</b><Status tone="orange">高风险</Status></button><button onClick={() => notify("已打开小目标复核队列")}><span>小目标</span><b>124</b><Status tone="blue">待复核</Status></button><button onClick={() => notify("已打开类别冲突复核队列")}><span>类别冲突</span><b>94</b><Status tone="gray">一般</Status></button></div>}
            <button className="inspector-secondary" onClick={() => notify(isAnnotationNode ? `已按 ${samplingRate}% 比例抽取标注复核样本` : `${selectedNode.label} 的质量报告已打开`)}>{isAnnotationNode ? "抽取复核样本" : "查看完整质量报告"}</button>
          </div>}
          {inspectorTab === "血缘" && <div className="inspector-content lineage-inspector">
            <h4>上下游血缘</h4><small>当前节点参与 {selectedUpstream.length + selectedDownstream.length} 条数据链路</small>
            {selectedUpstream.map((item) => <div key={`up-${item}`}><i>↑</i><span><small>上游输入</small><strong>{item}</strong></span></div>)}
            <div className="current"><i>●</i><span><small>当前节点</small><strong>{selectedNode.label}</strong></span></div>
            {selectedDownstream.map((item) => <div key={`down-${item}`}><i>↓</i><span><small>下游输出</small><strong>{item}</strong></span></div>)}
            {selectedUpstream.length + selectedDownstream.length === 0 && <button className="inspector-secondary" onClick={startConnecting}><UiIcon icon={Link2} />连接到其他节点</button>}
          </div>}
          <footer>{selectedNode.placed === false ? <><button onClick={() => notify(`已打开 ${selectedNode.label} 的数据预览`)}><UiIcon icon={Eye} />预览数据</button><button className="primary" onClick={placeSelectedResource}><UiIcon icon={Plus} />添加到画布</button></> : <><button onClick={isAnnotationNode ? inspectAnnotationRules : validateSelectedNodeConfiguration}><UiIcon icon={Check} />{isAnnotationNode ? "检查标注规范" : "校验配置"}</button><button className="primary" disabled={running} onClick={isAnnotationNode ? openAnnotationWorkspace : runSelectedNode}><UiIcon icon={isAnnotationNode ? ClipboardCheck : Play} />{isAnnotationNode ? "打开标注工作台" : runStates[selectedNode.id]?.status === "失败" ? "重试此节点" : "只运行此节点"}</button></>}</footer>
        </aside>}

      </div>
      {runDialogOpen && <div className="dialog-backdrop workbench-run-dialog-backdrop">
        <button className="dialog-dismiss" aria-label="关闭执行进度" onClick={() => setRunDialogOpen(false)} />
        <section className="workbench-run-dialog" role="dialog" aria-modal="true" aria-labelledby="workbench-run-dialog-title">
          <header>
            <div>
              <span className={failedNodeId ? "failed" : running ? "running" : "success"}><UiIcon icon={failedNodeId ? TriangleAlert : running ? RefreshCw : CircleCheck} size={18} /></span>
              <div><h2 id="workbench-run-dialog-title">{runMode === "node" ? "节点执行进度" : "治理流程执行进度"}</h2><p>{project.name} · {runMode === "node" && activeRunNodeId ? `仅执行：${nodes.find((node) => node.id === activeRunNodeId)?.label}` : `${runtimeNodes.length} 个处理节点`}</p></div>
            </div>
            <button aria-label="关闭执行进度" onClick={() => setRunDialogOpen(false)}><UiIcon icon={X} /></button>
          </header>
          <div className={`workbench-run-dialog-summary ${failedNodeId ? "failed" : ""}`}>
            <div><strong>{failedNodeId ? `中断于 ${runProgress}%` : running ? `${runProgress}%` : "100%"}</strong><span>{failedNodeId ? `${nodes.find((node) => node.id === failedNodeId)?.label} 执行失败` : running ? "正在按血缘顺序执行治理节点" : "流程执行完成，节点状态已同步"}</span></div>
            <i><b style={{ width: `${running || failedNodeId ? runProgress : 100}%` }} /></i>
            <small>已完成 {dialogRuntimeNodes.filter((node) => runStates[node.id]?.status === "成功").length} / {dialogRuntimeNodes.length}<b>{failedNodeId ? "1 个失败" : running ? "执行中" : "全部完成"}</b></small>
          </div>
          <div className="workbench-run-dialog-list">
            {dialogRuntimeNodes.map((node, index) => {
              const state = runStates[node.id] ?? { status: "未运行" as const, duration: "--", detail: node.meta };
              const stateClass = state.status === "成功" ? "success" : state.status === "运行中" ? "progress" : state.status === "失败" ? "failed" : "waiting";
              return <button key={node.id} className={state.status === "失败" ? "failed" : ""} onClick={() => { selectNode(node.id); notify(`${node.label}：${state.detail}`); }}><span className={stateClass}>{state.status === "成功" ? "✓" : state.status === "运行中" ? "◌" : state.status === "失败" ? "!" : index + 1}</span><div><strong>{node.label}</strong><small>{state.detail}</small></div><b>{state.duration}</b></button>;
            })}
          </div>
          <footer>
            <button className="reuse-secondary" onClick={() => setRunDialogOpen(false)}>{running ? "后台运行" : "关闭"}</button>
            {failedNodeId ? <button className="reuse-danger" disabled={running} onClick={() => runNode(failedNodeId)}><UiIcon icon={RefreshCw} />重试失败节点</button> : running ? <button className="reuse-primary" disabled><UiIcon icon={RefreshCw} />正在执行</button> : <button className="reuse-primary" onClick={() => { setRunDialogOpen(false); notify("运行结果已同步到流程节点"); }}><UiIcon icon={Check} />完成</button>}
          </footer>
        </section>
      </div>}
      {nodeDialogOpen && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="关闭添加节点" onClick={() => setNodeDialogOpen(false)} /><form className="reuse-dialog workbench-node-dialog" onSubmit={addWorkbenchNode}><header><div><h2>添加治理节点</h2><p>节点加入画布后可继续配置并连接上下游</p></div><button type="button" aria-label="关闭添加节点" onClick={() => setNodeDialogOpen(false)}><UiIcon icon={X} /></button></header><label>节点类型<select value={nodeDraftKind} onChange={(event) => setNodeDraftKind(event.target.value as WorkbenchNode["kind"])}><option value="dataset">数据集</option><option value="recipe">治理 Recipe</option><option value="annotation">标注任务</option><option value="output">输出数据集</option></select></label><label>节点名称<input required value={nodeDraftName} onChange={(event) => setNodeDraftName(event.target.value)} placeholder="请输入节点名称" /></label><div className="workbench-node-dialog-tip"><UiIcon icon={Link2} /><span>添加后选择“连接节点”，再依次点击上游和下游节点即可建立血缘。</span></div><footer><button type="button" className="reuse-secondary" onClick={() => setNodeDialogOpen(false)}>取消</button><button className="reuse-primary"><UiIcon icon={Plus} />添加到画布</button></footer></form></div>}
      {assignmentDialogOpen && <div className="dialog-backdrop annotation-assignment-backdrop"><button className="dialog-dismiss" aria-label="关闭人员分派" onClick={() => setAssignmentDialogOpen(false)} /><section className="reuse-dialog annotation-assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="annotation-assignment-title"><header><div><span><UiIcon icon={UserPlus} size={19} /></span><div><h2 id="annotation-assignment-title">分派剩余标注任务</h2><p>{selectedNode.label} · 从平台用户中选择执行人员</p></div></div><button aria-label="关闭人员分派" onClick={() => setAssignmentDialogOpen(false)}><UiIcon icon={X} /></button></header><div className="annotation-assignment-summary"><span><small>待分派样本</small><strong>{unassignedAnnotationCount.toLocaleString()}</strong></span><span><small>已选人员</small><strong>{selectedAssignmentIds.length}</strong></span><span className={selectedAssignmentTotal > unassignedAnnotationCount ? "over" : ""}><small>本次分派</small><strong>{selectedAssignmentTotal.toLocaleString()}</strong></span></div><div className="annotation-assignment-toolbar"><label><UiIcon icon={Search} /><input value={assignmentSearch} onChange={(event) => setAssignmentSearch(event.target.value)} placeholder="搜索姓名、账号、团队或技能" /></label><button disabled={!selectedAssignmentIds.length} onClick={() => distributeAssignmentCounts(selectedAssignmentIds)}><UiIcon icon={Users} />平均分配</button></div><div className="annotation-operator-list">{filteredAnnotationOperators.map((operator) => { const selected = selectedAssignmentIds.includes(operator.id); return <div key={operator.id} className={selected ? "selected" : ""}><button className="annotation-operator-main" onClick={() => toggleAssignmentUser(operator.id)}><i>{selected && <UiIcon icon={Check} size={11} />}</i><span className="annotation-operator-avatar">{operator.name.slice(0, 1)}<b className={operator.online ? "online" : ""} /></span><span className="annotation-operator-info"><strong>{operator.name}<small>{operator.account}</small></strong><em>{operator.team}</em><small>{operator.skills.map((skill) => <b key={skill}>{skill}</b>)}</small></span><span className="annotation-operator-load"><small>进行中 / 单批容量</small><strong>{operator.activeTasks} / {operator.capacity}</strong></span></button>{selected && <label className="annotation-assignment-count"><span>分派数量</span><input type="number" min="1" max={unassignedAnnotationCount} value={assignmentCounts[operator.id] ?? 0} onChange={(event) => setAssignmentCounts((current) => ({ ...current, [operator.id]: Math.max(0, Number(event.target.value) || 0) }))} /></label>}</div>; })}{filteredAnnotationOperators.length === 0 && <div className="annotation-operator-empty"><UiIcon icon={Users} /><strong>没有匹配的用户</strong><small>请调整搜索条件后重试</small></div>}</div><div className="annotation-assignment-note"><UiIcon icon={ShieldCheck} /><span>确认后任务会进入对应用户的标注队列；分派记录保存在当前本地项目中。</span></div><footer><span className={selectedAssignmentTotal > unassignedAnnotationCount ? "error" : ""}>{selectedAssignmentTotal > unassignedAnnotationCount ? `超出 ${Math.abs(unassignedAnnotationCount - selectedAssignmentTotal).toLocaleString()} 个样本` : `分派后剩余 ${(unassignedAnnotationCount - selectedAssignmentTotal).toLocaleString()} 个样本`}</span><div><button className="reuse-secondary" onClick={() => setAssignmentDialogOpen(false)}>取消</button><button className="reuse-primary" disabled={!selectedAssignmentIds.length || selectedAssignmentTotal <= 0 || selectedAssignmentTotal > unassignedAnnotationCount} onClick={confirmAnnotationAssignments}><UiIcon icon={UserPlus} />确认分派</button></div></footer></section></div>}
      {datasetImportOpen && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="关闭数据集导入" onClick={() => setDatasetImportOpen(false)} /><section className="reuse-dialog dataset-import-dialog"><header><div><h2>选择导入数据集</h2><p>将已有数据资产或本地文件加入当前治理项目</p></div><button aria-label="关闭数据集导入" onClick={() => setDatasetImportOpen(false)}><UiIcon icon={X} /></button></header><nav>{(["资产库选择", "本地文件导入"] as const).map((mode) => <button key={mode} className={datasetImportMode === mode ? "active" : ""} onClick={() => setDatasetImportMode(mode)}>{mode === "资产库选择" ? <UiIcon icon={Database} /> : <UiIcon icon={FileUp} />}{mode}</button>)}</nav>{datasetImportMode === "资产库选择" ? <div className="dataset-catalog"><label><UiIcon icon={Search} /><input placeholder="搜索数据集名称、类型或来源" /></label><div className="dataset-catalog-head"><span>数据集名称</span><span>类型</span><span>规模</span><span>来源 / 更新时间</span></div>{datasetCatalog.map((item) => { const checked = selectedDatasetIds.includes(item.id); return <button key={item.id} className={checked ? "selected" : ""} onClick={() => setSelectedDatasetIds((current) => checked ? current.filter((id) => id !== item.id) : [...current, item.id])}><i>{checked && <UiIcon icon={Check} size={11} />}</i><strong>{item.name}</strong><span>{item.type}</span><span>{item.scale}</span><small>{item.source}<b>{item.updated}</b></small></button>; })}</div> : <div className="local-dataset-import"><div className="local-dataset-name"><span>数据集名称</span><input value={localDatasetName} onChange={(event) => setLocalDatasetName(event.target.value)} placeholder="例如：images（留空则按文件名自动生成）" /></div><label><input type="file" multiple accept=".csv,.json,.jsonl,.xlsx,.zip,.jpg,.jpeg,.png,.webp,.gif,.bmp,.mp3,.wav,.mp4,.pdf" onChange={(event: ChangeEvent<HTMLInputElement>) => setLocalDatasetFiles(Array.from(event.target.files ?? []))} /><span><UiIcon icon={FileUp} size={25} /><strong>点击选择或拖入真实数据文件</strong><small>可多选同一数据集中的图片，并保留原始文件名用于在线预览</small></span></label>{localDatasetFiles.length > 0 && <div className="local-file-list">{localDatasetFiles.map((file) => <span key={`${file.name}-${file.lastModified}`}><UiIcon icon={FileArchive} /><b>{file.name}</b><small>{(file.size / 1024).toFixed(1)} KB</small><button onClick={() => setLocalDatasetFiles((current) => current.filter((item) => item !== file))}><UiIcon icon={X} /></button></span>)}</div>}<p><UiIcon icon={ShieldCheck} />浏览器将直接读取所选文件；图片会传入已连接的标注节点，不再使用演示占位图。</p></div>}<footer><span>已选择 <b>{datasetImportMode === "资产库选择" ? selectedDatasetIds.length : localDatasetFiles.length}</b> 个数据集</span><div><button className="reuse-secondary" onClick={() => setDatasetImportOpen(false)}>取消</button><button className="reuse-primary" onClick={importSelectedDatasets}><UiIcon icon={FileDown} />导入到项目</button></div></footer></section></div>}
      {deleteTarget && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="关闭删除确认" onClick={() => setDeleteTarget(null)} /><div className="reuse-dialog workbench-delete-dialog"><header><div><h2>删除治理节点</h2><p>{project.name}</p></div><button aria-label="关闭删除确认" onClick={() => setDeleteTarget(null)}><UiIcon icon={X} /></button></header><section><span><UiIcon icon={TriangleAlert} size={20} /></span><div><h3>确认删除“{deleteTarget.label}”</h3><p>该节点及与其相连的 {edges.filter((edge) => edge.from === deleteTarget.id || edge.to === deleteTarget.id).length} 条血缘连线将从当前画布移除，其他节点和运行记录不会受影响。</p></div></section><footer><button className="reuse-secondary" onClick={() => setDeleteTarget(null)}>取消</button><button className="reuse-danger" onClick={removeWorkbenchNode}><UiIcon icon={Trash2} />确认删除</button></footer></div></div>}
      {annotationRulesOpen && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="关闭标注规范" onClick={() => setAnnotationRulesOpen(false)} /><section className="reuse-dialog annotation-rules-dialog"><header><div><h2>{selectedNode.label}标注规范</h2><p>{annotationType} · 规则版本 v2.4</p></div><button aria-label="关闭标注规范" onClick={() => setAnnotationRulesOpen(false)}><UiIcon icon={X} /></button></header><div className="annotation-rule-summary"><span><UiIcon icon={CircleCheck} /><b>规范检查通过</b><small>{annotationLabels.length} 个类别 · 4 项质检规则</small></span><Status tone="green">可开始标注</Status></div><div className="annotation-rule-list"><div><i>01</i><section><strong>目标边界</strong><p>标注框或多边形应紧贴真实目标可见边缘，遮挡目标只覆盖可见区域。</p></section><b>必检</b></div><div><i>02</i><section><strong>关键点一致性</strong><p>关键点名称、数量及顺序须遵循当前任务定义，不可见点应记录遮挡状态。</p></section><b>必检</b></div><div><i>03</i><section><strong>类别一致性</strong><p>只能使用当前任务配置的固定类别，禁止创建含义重复或无法解释的标签。</p></section><b>自动校验</b></div><div><i>04</i><section><strong>质量抽检</strong><p>按 {samplingRate}% 比例抽样；高风险样本进入双人复核，驳回后重新标注。</p></section><b>双人复核</b></div></div><footer><button className="reuse-secondary" onClick={() => setAnnotationRulesOpen(false)}>关闭</button><button className="reuse-primary" onClick={() => { setAnnotationRulesOpen(false); openAnnotationWorkspace(); }}><UiIcon icon={ClipboardCheck} />进入标注工作台</button></footer></section></div>}
    </section>
  );
}

type GovernanceAlgorithm = {
  name: string;
  code: string;
  category: string;
  scene: string;
  version: string;
  source: "平台内置" | "自定义";
  updated: string;
  enabled: boolean;
  description: string;
  calls: string;
  success: string;
};

const initialGovernanceAlgorithms: GovernanceAlgorithm[] = [
  { name: "重复数据识别", code: "duplicate-detect", category: "去重治理", scene: "结构化数据", version: "v2.3.1", source: "平台内置", updated: "2026-08-21 14:32", enabled: true, description: "基于主键、相似字段及业务规则识别重复记录，支持精确与模糊匹配。", calls: "12,680", success: "99.2%" },
  { name: "空值智能填充", code: "null-smart-fill", category: "完整性治理", scene: "结构化数据", version: "v2.1.0", source: "平台内置", updated: "2026-08-20 09:18", enabled: true, description: "根据字段类型、上下文与关联记录自动生成空值修复建议。", calls: "8,426", success: "97.8%" },
  { name: "格式标准化", code: "format-normalize", category: "规范性治理", scene: "多源数据", version: "v3.0.2", source: "平台内置", updated: "2026-08-18 16:05", enabled: true, description: "统一日期、电话、证件号、金额和编码等常见字段格式。", calls: "21,904", success: "99.7%" },
  { name: "异常值处理", code: "outlier-repair", category: "准确性治理", scene: "指标数据", version: "v1.8.4", source: "平台内置", updated: "2026-08-16 11:40", enabled: true, description: "使用统计分布与业务阈值检测异常值，并提供修正或隔离策略。", calls: "5,318", success: "96.4%" },
  { name: "敏感信息脱敏", code: "privacy-mask", category: "安全治理", scene: "隐私数据", version: "v2.5.0", source: "平台内置", updated: "2026-08-13 18:20", enabled: false, description: "识别姓名、证件、联系方式等敏感字段，支持掩码、泛化和加密。", calls: "3,207", success: "98.9%" },
  { name: "金融文档版面解析", code: "finance-layout", category: "文档治理", scene: "金融文档", version: "v1.2.3", source: "自定义", updated: "2026-08-11 10:14", enabled: true, description: "针对金融年报提取标题、表格、段落及页码结构，生成可治理文本块。", calls: "1,286", success: "95.6%" },
];

function GovernanceAlgorithms({ notify }: { notify: Notify }) {
  const [section, setSection] = useState<"算法列表" | "运行记录">("算法列表");
  const [algorithms, setAlgorithms] = useState(initialGovernanceAlgorithms);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部分类");
  const [source, setSource] = useState("全部来源");
  const [selected, setSelected] = useState<GovernanceAlgorithm | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftCategory, setDraftCategory] = useState("完整性治理");
  const categories = ["全部分类", ...Array.from(new Set(algorithms.map((item) => item.category)))];
  const filtered = algorithms.filter((item) => {
    const matchSearch = `${item.name}${item.code}${item.scene}`.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (category === "全部分类" || item.category === category) && (source === "全部来源" || item.source === source);
  });

  function createAlgorithm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftName.trim();
    if (!name) return;
    setAlgorithms((current) => [{ name, code: `custom-${current.length + 1}`, category: draftCategory, scene: "通用数据", version: "v1.0.0", source: "自定义", updated: "2026-08-23 刚刚", enabled: false, description: "新建的自定义治理算法，等待补充算法实现与参数配置。", calls: "0", success: "--" }, ...current]);
    setCreating(false);
    setDraftName("");
    notify(`${name} 已创建并加入治理算法列表`);
  }

  const runRows = [
    ["重复数据识别", "高质量数据集评估演示", "篮球标注数据", "成功", "18 秒", "2026-08-23 15:46"],
    ["格式标准化", "高质量数据集评估演示", "SFT 问答数据集", "成功", "42 秒", "2026-08-23 14:18"],
    ["金融文档版面解析", "高质量数据集测试", "金融年报文档", "运行中", "01:26", "2026-08-23 13:52"],
    ["异常值处理", "测试", "年度经营指标", "失败", "9 秒", "2026-08-22 18:06"],
  ];

  return (
    <section className="governance-feature-page algorithm-management-page">
      <div className="governance-page-tabs">
        <div>{(["算法列表", "运行记录"] as const).map((item) => <button key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{item}</button>)}</div>
        <span>统一管理平台内置与自定义治理算法</span>
      </div>

      {section === "算法列表" ? <article className="white-panel governance-algorithm-panel">
        <header className="algorithm-page-head">
          <div><h2>治理算法管理</h2><p>维护治理算法版本、适用场景和启用状态</p></div>
          <div><button className="reuse-primary" onClick={() => setCreating(true)}><UiIcon icon={Plus} />新建算法</button><button className="reuse-secondary" onClick={() => notify("算法包导入面板已打开")}><UiIcon icon={Upload} />导入算法包</button></div>
        </header>
        <div className="algorithm-kpis">
          {[['算法总数', algorithms.length, '算'], ['已启用', algorithms.filter((item) => item.enabled).length, '启'], ['平台内置', algorithms.filter((item) => item.source === '平台内置').length, '内'], ['近 7 日调用', '52,821', '调']].map((item, index) => <div key={item[0]}><span className={`algorithm-kpi-icon i${index}`}>{item[2]}</span><div><small>{item[0]}</small><strong>{item[1]}</strong></div></div>)}
        </div>
        <div className="algorithm-filter-bar">
          <label className="reuse-search"><UiIcon icon={Search} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索算法名称、编码或场景" /></label>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={source} onChange={(event) => setSource(event.target.value)}><option>全部来源</option><option>平台内置</option><option>自定义</option></select>
          <button className="reuse-secondary" onClick={() => { setSearch(""); setCategory("全部分类"); setSource("全部来源"); }}>重置</button>
          <span>共 {filtered.length} 项</span>
        </div>
        <div className="reuse-table-wrap algorithm-table-wrap">
          <table className="reuse-table algorithm-table"><thead><tr><th>算法名称</th><th>治理分类</th><th>适用场景</th><th>版本</th><th>来源</th><th>近 30 日调用</th><th>成功率</th><th>状态</th><th>最近更新</th><th>操作</th></tr></thead>
            <tbody>{filtered.map((row, index) => <tr key={row.code}>
              <td><button className="algorithm-name-cell" onClick={() => setSelected(row)}><span className={`a${index % 5}`}>{row.name.slice(0, 1)}</span><div><strong>{row.name}</strong><small>{row.code}</small></div></button></td>
              <td>{row.category}</td><td>{row.scene}</td><td><b className="algorithm-version">{row.version}</b></td><td>{row.source}</td><td>{row.calls}</td><td className="algorithm-success">{row.success}</td>
              <td><button className={`algorithm-state ${row.enabled ? "enabled" : ""}`} onClick={() => { setAlgorithms((current) => current.map((item) => item.code === row.code ? { ...item, enabled: !item.enabled } : item)); notify(`${row.name} 已${row.enabled ? "停用" : "启用"}`); }}><i />{row.enabled ? "已启用" : "已停用"}</button></td>
              <td>{row.updated}</td><td><button className="reuse-link" onClick={() => setSelected(row)}>配置</button>{" "}<button className="reuse-link" onClick={() => notify(`${row.name} 测试任务已启动`)}>测试</button>{" "}<button className="reuse-link" onClick={() => notify(`已打开 ${row.name} 的版本记录`)}>版本</button></td>
            </tr>)}</tbody>
          </table>
          {filtered.length === 0 && <div className="table-empty">没有匹配的治理算法</div>}
        </div>
        <footer className="reuse-pagination"><span>共 {filtered.length} 条</span><button disabled>‹</button><button className="active" onClick={() => notify("当前已是第 1 页")}>1</button><button disabled>›</button></footer>
      </article> : <article className="white-panel governance-run-panel">
        <header className="algorithm-page-head"><div><h2>算法运行记录</h2><p>追踪算法执行状态、耗时和处理数据集</p></div><button className="reuse-secondary" onClick={() => notify("运行记录已刷新")}><UiIcon icon={RefreshCw} />刷新</button></header>
        <div className="run-summary-bar"><span><b>今日运行</b><strong>28</strong></span><span><b>成功</b><strong>25</strong></span><span><b>运行中</b><strong>2</strong></span><span><b>失败</b><strong>1</strong></span></div>
        <div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>算法名称</th><th>治理项目</th><th>输入数据集</th><th>运行状态</th><th>耗时</th><th>开始时间</th><th>操作</th></tr></thead><tbody>{runRows.map((row) => <tr key={`${row[0]}-${row[5]}`}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td><Status tone={row[3] === '成功' ? 'green' : row[3] === '运行中' ? 'blue' : 'orange'}>{row[3]}</Status></td><td>{row[4]}</td><td>{row[5]}</td><td><button className="reuse-link" onClick={() => notify(`${row[0]} 的运行日志已展开`)}>查看日志</button>{" "}{row[3] === '失败' && <button className="reuse-link" onClick={() => notify(`${row[0]} 已重新运行`)}>重试</button>}</td></tr>)}</tbody></table></div>
      </article>}

      {selected && <div className="algorithm-drawer-backdrop"><aside className="algorithm-detail-drawer">
        <header><div><span><UiIcon icon={Settings2} size={17} /></span><div><strong>{selected.name}</strong><small>{selected.code} · {selected.version}</small></div></div><button aria-label="关闭算法详情" onClick={() => setSelected(null)}><UiIcon icon={X} /></button></header>
        <nav><button className="active" onClick={() => notify("当前正在查看基本信息")}>基本信息</button><button onClick={() => notify("参数配置页已切换")}>参数配置</button><button onClick={() => notify("版本记录页已切换")}>版本记录</button></nav>
        <section><h3>算法说明</h3><p>{selected.description}</p><h3>算法信息</h3><dl><div><dt>治理分类</dt><dd>{selected.category}</dd></div><div><dt>适用场景</dt><dd>{selected.scene}</dd></div><div><dt>算法来源</dt><dd>{selected.source}</dd></div><div><dt>调用次数</dt><dd>{selected.calls}</dd></div><div><dt>运行成功率</dt><dd>{selected.success}</dd></div><div><dt>最近更新</dt><dd>{selected.updated}</dd></div></dl><h3>默认参数</h3><div className="algorithm-parameters"><span><b>匹配阈值</b><small>0.85</small></span><span><b>执行模式</b><small>增量</small></span><span><b>并发数</b><small>4</small></span></div></section>
        <footer><button className="reuse-secondary" onClick={() => notify(`${selected.name} 配置已保存为新版本`)}>另存版本</button><button className="reuse-primary" onClick={() => notify(`${selected.name} 已加入当前项目`)}>添加到项目</button></footer>
      </aside></div>}

      {creating && <div className="algorithm-drawer-backdrop"><form className="algorithm-create-dialog" onSubmit={createAlgorithm}><header><div><strong>新建治理算法</strong><small>创建自定义算法并配置基本信息</small></div><button type="button" aria-label="关闭新建算法" onClick={() => setCreating(false)}><UiIcon icon={X} /></button></header><section><label>算法名称<input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="请输入算法名称" /></label><label>治理分类<select value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)}>{["完整性治理", "准确性治理", "规范性治理", "安全治理", "文档治理"].map((item) => <option key={item}>{item}</option>)}</select></label><label>算法编码<input value={draftName ? `custom-${draftName.length + algorithms.length}` : ""} readOnly placeholder="创建后自动生成" /></label><label>算法说明<textarea placeholder="描述算法用途、输入输出与适用场景" /></label><div className="upload-algorithm-box"><span><UiIcon icon={Upload} size={18} /></span><strong>上传算法包</strong><small>支持 ZIP、JAR、Python Wheel，最大 200 MB</small><button type="button" onClick={() => notify("已打开算法包文件选择器")}>选择文件</button></div></section><footer><button type="button" className="reuse-secondary" onClick={() => setCreating(false)}>取消</button><button className="reuse-primary" disabled={!draftName.trim()}><UiIcon icon={Plus} />创建算法</button></footer></form></div>}
    </section>
  );
}

type MarketAlgorithm = {
  id: string;
  name: string;
  category: string;
  author: string;
  version: string;
  description: string;
  installs: string;
  rating: string;
  icon: string;
  tags: string[];
  featured?: boolean;
};

const marketAlgorithms: MarketAlgorithm[] = [
  { id: "duplicate", name: "重复数据识别", category: "去重治理", author: "平台算法中心", version: "v2.3.1", description: "结合主键规则与相似度模型，快速识别跨表、跨源重复记录。", installs: "12.8k", rating: "4.9", icon: "重", tags: ["结构化数据", "批处理"], featured: true },
  { id: "null-fill", name: "空值智能填充", category: "完整性治理", author: "平台算法中心", version: "v2.1.0", description: "基于上下文、关联字段和历史分布生成高置信度空值修复建议。", installs: "8.4k", rating: "4.8", icon: "空", tags: ["智能修复", "推荐"] },
  { id: "format", name: "格式标准化", category: "规范性治理", author: "平台算法中心", version: "v3.0.2", description: "覆盖日期、电话、地址、金额、编码等 36 类常见格式标准。", installs: "21.9k", rating: "4.9", icon: "格", tags: ["多源数据", "高性能"], featured: true },
  { id: "outlier", name: "异常值处理", category: "准确性治理", author: "质量实验室", version: "v1.8.4", description: "融合统计分布、时序趋势和业务阈值的异常检测与修复算法。", installs: "5.3k", rating: "4.7", icon: "异", tags: ["指标数据", "时序"] },
  { id: "privacy", name: "敏感信息脱敏", category: "安全治理", author: "安全算法中心", version: "v2.5.0", description: "自动发现敏感数据并应用掩码、泛化、替换或加密策略。", installs: "9.7k", rating: "4.8", icon: "敏", tags: ["隐私保护", "合规"] },
  { id: "document", name: "文档智能解析", category: "文档治理", author: "多模态实验室", version: "v1.6.2", description: "解析 PDF、Word、扫描件中的版面、段落、表格与图像。", installs: "4.2k", rating: "4.6", icon: "文", tags: ["OCR", "知识库"] },
  { id: "align", name: "多模态数据对齐", category: "多模态治理", author: "多模态实验室", version: "v1.3.0", description: "完成图像、文本、语音样本的语义匹配、对齐和低质样本过滤。", installs: "2.8k", rating: "4.8", icon: "模", tags: ["图文对", "大模型"] },
  { id: "image", name: "图像质量检测", category: "多模态治理", author: "视觉算法中心", version: "v2.0.5", description: "检测模糊、噪声、曝光、遮挡和无效图像，输出质量评分。", installs: "6.6k", rating: "4.7", icon: "图", tags: ["图像", "质量评分"] },
];

function GovernanceMarketplace({ notify }: { notify: Notify }) {
  const [tab, setTab] = useState<"全部算法" | "已安装" | "我的收藏">("全部算法");
  const [category, setCategory] = useState("全部分类");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("综合排序");
  const [selected, setSelected] = useState<MarketAlgorithm | null>(null);
  const [installed, setInstalled] = useState(() => new Set(["duplicate", "format", "privacy"]));
  const [favorites, setFavorites] = useState(() => new Set(["null-fill", "align"]));
  const categories = ["全部分类", "完整性治理", "准确性治理", "规范性治理", "去重治理", "安全治理", "文档治理", "多模态治理"];
  const countByCategory = (item: string) => item === "全部分类" ? marketAlgorithms.length : marketAlgorithms.filter((algorithm) => algorithm.category === item).length;
  let filtered = marketAlgorithms.filter((item) => {
    const matchTab = tab === "全部算法" || (tab === "已安装" ? installed.has(item.id) : favorites.has(item.id));
    return matchTab && (category === "全部分类" || item.category === category) && `${item.name}${item.description}${item.tags.join("")}`.toLowerCase().includes(search.toLowerCase());
  });
  if (sort === "安装量最高") filtered = [...filtered].sort((a, b) => Number.parseFloat(b.installs) - Number.parseFloat(a.installs));
  if (sort === "评分最高") filtered = [...filtered].sort((a, b) => Number.parseFloat(b.rating) - Number.parseFloat(a.rating));

  function toggleInstall(item: MarketAlgorithm) {
    setInstalled((current) => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
      return next;
    });
    notify(`${item.name} 已${installed.has(item.id) ? "从当前项目移除" : "安装到当前项目"}`);
  }

  function toggleFavorite(item: MarketAlgorithm) {
    setFavorites((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; });
    notify(`${item.name} 已${favorites.has(item.id) ? "取消收藏" : "加入收藏"}`);
  }

  return (
    <section className="governance-feature-page algorithm-market-page">
      <header className="market-page-head"><div><h2>治理算法市场</h2><p>发现、安装并复用经过验证的数据治理算法</p></div><div><button className="reuse-secondary" onClick={() => notify("算法市场内容已刷新")}><UiIcon icon={RefreshCw} />刷新市场</button><button className="reuse-primary" onClick={() => notify("算法发布向导已打开")}><UiIcon icon={Upload} />发布算法</button></div></header>
      <div className="market-stat-strip"><div><strong>42</strong><span>治理算法</span></div><i /><div><strong>8</strong><span>治理分类</span></div><i /><div><strong>99.1%</strong><span>平均成功率</span></div><i /><div><strong>71.7k</strong><span>累计安装</span></div><p><b>平台精选</b> 已完成兼容性、安全性和性能验证</p></div>
      <div className="market-toolbar"><div>{(["全部算法", "已安装", "我的收藏"] as const).map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}<b>{item === "全部算法" ? marketAlgorithms.length : item === "已安装" ? installed.size : favorites.size}</b></button>)}</div><label className="reuse-search"><UiIcon icon={Search} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索算法名称、能力或标签" /></label><select value={sort} onChange={(event) => setSort(event.target.value)}><option>综合排序</option><option>安装量最高</option><option>评分最高</option></select></div>
      <div className="market-layout">
        <aside className="market-categories"><header><strong>算法分类</strong><button onClick={() => setCategory("全部分类")}>重置</button></header>{categories.map((item, index) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}><span>{["全", "完", "准", "规", "重", "安", "文", "模"][index]}</span><strong>{item}</strong><b>{countByCategory(item)}</b></button>)}</aside>
        <article className="market-results"><header><div><strong>{category === "全部分类" ? tab : category}</strong><span>找到 {filtered.length} 个算法</span></div><button aria-label="切换展示密度" onClick={() => notify("展示密度已切换")}><UiIcon icon={Grid2X2} /></button></header><div className="market-card-grid">
          {filtered.map((item, index) => <article className={`market-algorithm-card ${selected?.id === item.id ? "selected" : ""}`} key={item.id}>
            <header><span className={`m${index % 6}`}><UiIcon icon={Settings2} size={16} /></span><div><strong>{item.name}</strong><small>{item.author} · {item.version}</small></div><button className={favorites.has(item.id) ? "favorite" : ""} aria-label={`${favorites.has(item.id) ? '取消收藏' : '收藏'}${item.name}`} onClick={() => toggleFavorite(item)}><UiIcon icon={Star} size={15} /></button></header>
            <p>{item.description}</p><div className="market-tags">{item.featured && <b>精选</b>}{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <footer><div><span><UiIcon icon={Star} size={10} />{item.rating}</span><span><UiIcon icon={Download} size={10} />{item.installs}</span></div><button className="market-detail-button" onClick={() => setSelected(item)}>详情</button><button className={installed.has(item.id) ? "installed" : ""} onClick={() => toggleInstall(item)}><UiIcon icon={installed.has(item.id) ? Check : Plus} size={11} />{installed.has(item.id) ? "已安装" : "安装"}</button></footer>
          </article>)}
        </div>{filtered.length === 0 && <div className="market-empty"><span><UiIcon icon={Search} size={24} /></span><strong>没有匹配的治理算法</strong><p>请调整分类或搜索条件后重试</p></div>}</article>
        {selected && <aside className="market-detail-panel"><header><div><span><UiIcon icon={Settings2} size={16} /></span><div><strong>{selected.name}</strong><small>{selected.author}</small></div></div><button aria-label="关闭算法详情" onClick={() => setSelected(null)}><UiIcon icon={X} /></button></header><section><div className="market-detail-score"><span><small>评分</small><strong><UiIcon icon={Star} size={11} />{selected.rating}</strong></span><span><small>安装量</small><strong>{selected.installs}</strong></span><span><small>当前版本</small><strong>{selected.version}</strong></span></div><h3>算法简介</h3><p>{selected.description}</p><h3>核心能力</h3><ul><li>支持可视化参数配置与执行预览</li><li>兼容批处理、增量和定时运行</li><li>输出质量报告及完整数据血缘</li></ul><h3>适用范围</h3><div className="market-tags">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}<span>{selected.category}</span></div><h3>最近版本</h3><div className="market-version"><b>{selected.version}</b><span>优化大规模数据执行性能</span><small>2026-08-18</small></div></section><footer><button className="reuse-secondary" onClick={() => toggleFavorite(selected)}><UiIcon icon={Star} />{favorites.has(selected.id) ? "已收藏" : "收藏"}</button><button className="reuse-primary" onClick={() => toggleInstall(selected)}><UiIcon icon={installed.has(selected.id) ? Check : Download} />{installed.has(selected.id) ? "从项目移除" : "安装到当前项目"}</button></footer></aside>}
      </div>
    </section>
  );
}

type AssessmentConfig = {
  dataset: string;
  standard: string;
  sampling: string;
  threshold: number;
  components: string[];
};

type AssessmentIssue = {
  id: string;
  sample: string;
  component: string;
  problem: string;
  severity: "高" | "中" | "低";
  assignee: string;
  status: "待处理" | "已分派" | "待复核" | "已关闭";
  suggestion: string;
};

type AssessmentRuleProfile = {
  name: string;
  code: string;
  version: string;
  category: string;
  owner: string;
  description: string;
  scope: string;
  logic: string;
  threshold: string;
  output: string[];
  conditions: Array<{ field: string; operator: string; expected: string }>;
};

const assessmentComponents = ["图像完好性", "图像重复率合规性", "图像涉黄合规性", "图像格式一致性", "图像内容有效性"];

const assessmentRuleProfiles: Record<string, AssessmentRuleProfile> = {
  图像完好性: {
    name: "图像完好性",
    code: "IMG-COMP-001",
    version: "v2.3.1",
    category: "完整性规则",
    owner: "数据质量标准组",
    description: "检查文件是否可以完整解码、关键元数据是否存在，以及图像尺寸和像素数据是否满足入库要求。",
    scope: "JPEG、PNG、WEBP；单文件最大 50 MB",
    logic: "解码成功 AND 宽高有效 AND 像素数据完整 AND 文件头一致",
    threshold: "完好率 ≥ 98%，单文件必须全部通过",
    output: ["decode_status", "width", "height", "corrupt_offset"],
    conditions: [
      { field: "解码状态", operator: "等于", expected: "SUCCESS" },
      { field: "图像宽度 / 高度", operator: "大于等于", expected: "256 × 256 px" },
      { field: "损坏字节比例", operator: "小于等于", expected: "0.1%" },
      { field: "文件头与扩展名", operator: "必须", expected: "一致" },
    ],
  },
  图像重复率合规性: {
    name: "图像重复率合规性",
    code: "IMG-DUP-014",
    version: "v3.1.0",
    category: "唯一性规则",
    owner: "训练数据治理组",
    description: "联合感知哈希与视觉向量相似度识别完全重复、裁剪重复和轻度压缩后的近似重复样本。",
    scope: "当前数据集与历史已发布图像库",
    logic: "SHA256 相同 OR (pHash 距离 ≤ 6 AND CLIP 相似度 ≥ 0.95)",
    threshold: "数据集近似重复率 ≤ 2%",
    output: ["duplicate_group_id", "similarity", "reference_asset", "keep_suggestion"],
    conditions: [
      { field: "文件哈希", operator: "完全相同", expected: "判定重复" },
      { field: "感知哈希距离", operator: "小于等于", expected: "6" },
      { field: "视觉向量相似度", operator: "大于等于", expected: "0.95" },
      { field: "重复组保留策略", operator: "优先", expected: "高分辨率 / 新版权" },
    ],
  },
  图像涉黄合规性: {
    name: "图像涉黄合规性",
    code: "IMG-SAFE-006",
    version: "v2.8.4",
    category: "安全合规规则",
    owner: "内容安全中心",
    description: "通过多模型集成识别成人裸露、性暗示和未成年人高风险内容，并记录命中的安全标签。",
    scope: "全量图像；疑似样本进入人工复核",
    logic: "成人风险 < 0.30 AND 性暗示风险 < 0.45 AND 未成年人风险 = 0",
    threshold: "严重违规 0 容忍，疑似内容复核率 100%",
    output: ["safety_label", "risk_score", "model_version", "review_required"],
    conditions: [
      { field: "成人裸露风险", operator: "小于", expected: "0.30" },
      { field: "性暗示风险", operator: "小于", expected: "0.45" },
      { field: "未成年人风险", operator: "等于", expected: "0" },
      { field: "模型置信区间", operator: "低于阈值时", expected: "转人工复核" },
    ],
  },
  图像格式一致性: {
    name: "图像格式一致性",
    code: "IMG-FMT-003",
    version: "v2.4.2",
    category: "规范性规则",
    owner: "数据生产规范组",
    description: "统一图像编码、色彩空间、位深和方向信息，保证训练与推理链路能够稳定读取。",
    scope: "JPEG / PNG 主数据，自动识别伪扩展名",
    logic: "编码白名单 AND sRGB 色彩空间 AND 8 bit 位深 AND 方向已归一化",
    threshold: "格式一致率 ≥ 99.5%",
    output: ["mime_type", "color_space", "bit_depth", "orientation"],
    conditions: [
      { field: "编码格式", operator: "属于", expected: "JPEG、PNG" },
      { field: "色彩空间", operator: "等于", expected: "sRGB" },
      { field: "通道位深", operator: "等于", expected: "8 bit" },
      { field: "EXIF 方向", operator: "必须", expected: "已归一化" },
    ],
  },
  图像内容有效性: {
    name: "图像内容有效性",
    code: "IMG-VALID-009",
    version: "v3.0.5",
    category: "有效性规则",
    owner: "视觉数据专家组",
    description: "检查主体是否清晰可见、画面是否空白或严重模糊，以及内容是否符合篮球训练数据场景。",
    scope: "篮球目标检测与关键点训练集",
    logic: "主体置信度 ≥ 0.65 AND 遮挡率 < 65% AND 清晰度 ≥ 80",
    threshold: "有效样本率 ≥ 95%",
    output: ["subject_confidence", "occlusion_ratio", "blur_score", "scene_match"],
    conditions: [
      { field: "主体识别置信度", operator: "大于等于", expected: "0.65" },
      { field: "主体遮挡比例", operator: "小于", expected: "65%" },
      { field: "拉普拉斯清晰度", operator: "大于等于", expected: "80" },
      { field: "篮球场景匹配度", operator: "大于等于", expected: "0.70" },
    ],
  },
};

const initialAssessmentIssues: AssessmentIssue[] = [
  { id: "QA-0823-001", sample: "basketball_03812.jpeg", component: "图像重复率合规性", problem: "与 basketball_01866.jpeg 相似度 99.2%", severity: "中", assignee: "未分派", status: "待处理", suggestion: "保留分辨率更高的样本，移除重复文件" },
  { id: "QA-0823-002", sample: "basketball_09218.jpeg", component: "图像内容有效性", problem: "主体遮挡面积超过 65%", severity: "高", assignee: "视觉数据治理组", status: "已分派", suggestion: "转入人工复核并补充主体可见性标签" },
  { id: "QA-0823-003", sample: "basketball_00186.jpeg", component: "图像格式一致性", problem: "色彩空间为 CMYK，不符合 sRGB 标准", severity: "低", assignee: "数据生产一组", status: "待复核", suggestion: "转换为 JPEG / sRGB 后重新评估" },
];

type AssessmentHistoryRow = {
  id: string;
  task: string;
  dataset: string;
  category: "语句文件" | "自定义审查" | "多模态审查";
  standard: string;
  score: number | null;
  issues: number;
  closure: number;
  status: "通过" | "未通过" | "已终止";
  owner: string;
  completed: string;
  duration: string;
  samples: string;
  components: Array<{ name: string; score: number | null; issues: number; result: "通过" | "未通过" | "未执行" }>;
};

const assessmentHistoryRows: AssessmentHistoryRow[] = [
  { id: "QA-HIS-20260824-018", task: "篮球版本1质量复评", dataset: "篮球高质量数据集1 v1.3", category: "多模态审查", standard: "图像质量评估标准 v2", score: 96.8, issues: 3, closure: 100, status: "通过", owner: "视觉数据治理组", completed: "2026-08-24 18:42", duration: "16 分 42 秒", samples: "12,680", components: [{ name: "图像完整性", score: 100, issues: 0, result: "通过" }, { name: "图像重复率合规性", score: 94, issues: 2, result: "通过" }, { name: "图像格式一致性", score: 98, issues: 1, result: "通过" }] },
  { id: "QA-HIS-20260824-017", task: "金融问答训练集发布审查", dataset: "金融年报问答集 v2.1", category: "语句文件", standard: "SFT 数据质量标准 v2", score: 93.4, issues: 18, closure: 100, status: "通过", owner: "金融数据生产组", completed: "2026-08-24 16:15", duration: "28 分 09 秒", samples: "38,420", components: [{ name: "问答相关性", score: 95, issues: 6, result: "通过" }, { name: "事实一致性", score: 92, issues: 9, result: "通过" }, { name: "语言规范性", score: 94, issues: 3, result: "通过" }] },
  { id: "QA-HIS-20260824-016", task: "图文指令对齐专项审查", dataset: "图文指令数据集 v2.4", category: "多模态审查", standard: "图文对齐质量标准 v2.2", score: 88.7, issues: 42, closure: 76, status: "未通过", owner: "多模态数据组", completed: "2026-08-24 13:26", duration: "34 分 51 秒", samples: "20,600", components: [{ name: "图文语义对齐", score: 86, issues: 28, result: "未通过" }, { name: "图像可用性", score: 94, issues: 4, result: "通过" }, { name: "指令完整性", score: 89, issues: 10, result: "未通过" }] },
  { id: "QA-HIS-20260823-015", task: "客服对话脱敏与完整性审查", dataset: "客服对话语料 v3.0", category: "自定义审查", standard: "客户信息合规规则包", score: 97.2, issues: 5, closure: 100, status: "通过", owner: "客户数据治理组", completed: "2026-08-23 19:08", duration: "12 分 36 秒", samples: "86,510", components: [{ name: "敏感信息脱敏", score: 99, issues: 1, result: "通过" }, { name: "对话完整性", score: 97, issues: 3, result: "通过" }, { name: "角色一致性", score: 96, issues: 1, result: "通过" }] },
  { id: "QA-HIS-20260823-014", task: "业务事件字段完整性审查", dataset: "业务事件样本集 v1.9", category: "自定义审查", standard: "字段完整性专项规则", score: 94.1, issues: 11, closure: 91, status: "通过", owner: "业务数据平台组", completed: "2026-08-23 14:30", duration: "09 分 18 秒", samples: "2.4M", components: [{ name: "必填字段完整性", score: 96, issues: 4, result: "通过" }, { name: "枚举值规范性", score: 93, issues: 5, result: "通过" }, { name: "时间字段有效性", score: 94, issues: 2, result: "通过" }] },
  { id: "QA-HIS-20260822-013", task: "OCR 文档解析结果审查", dataset: "金融年报文档 v1.8", category: "语句文件", standard: "文档解析质量标准 v1.7", score: 89.6, issues: 27, closure: 82, status: "未通过", owner: "文档智能组", completed: "2026-08-22 21:17", duration: "41 分 03 秒", samples: "1,286", components: [{ name: "版面结构还原", score: 92, issues: 8, result: "通过" }, { name: "表格识别准确率", score: 86, issues: 15, result: "未通过" }, { name: "文本字符准确率", score: 91, issues: 4, result: "通过" }] },
  { id: "QA-HIS-20260822-012", task: "客服音视频语料预审", dataset: "客服音视频语料 v1.7", category: "多模态审查", standard: "音视频内容质量标准 v1.5", score: null, issues: 0, closure: 0, status: "已终止", owner: "语音数据组", completed: "2026-08-22 17:52", duration: "03 分 12 秒", samples: "8,460", components: [{ name: "音频可解码性", score: 100, issues: 0, result: "通过" }, { name: "音画同步", score: null, issues: 0, result: "未执行" }, { name: "转写一致性", score: null, issues: 0, result: "未执行" }] },
  { id: "QA-HIS-20260821-011", task: "客户知识库语言质量审查", dataset: "客服知识数据集 v3.4", category: "语句文件", standard: "多轮对话质量标准 v1.6", score: 95.5, issues: 8, closure: 100, status: "通过", owner: "知识运营组", completed: "2026-08-21 15:46", duration: "22 分 25 秒", samples: "54,280", components: [{ name: "语言通顺度", score: 97, issues: 2, result: "通过" }, { name: "答案有效性", score: 95, issues: 4, result: "通过" }, { name: "上下文一致性", score: 94, issues: 2, result: "通过" }] },
];

function AssessmentHistoryPage({ notify }: { notify: Notify }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部状态");
  const [categoryFilter, setCategoryFilter] = useState("全部类型");
  const [selected, setSelected] = useState<AssessmentHistoryRow | null>(null);
  const filtered = assessmentHistoryRows.filter((row) => (statusFilter === "全部状态" || row.status === statusFilter) && (categoryFilter === "全部类型" || row.category === categoryFilter) && `${row.task}${row.dataset}${row.id}${row.owner}`.toLowerCase().includes(query.toLowerCase()));
  const passed = assessmentHistoryRows.filter((row) => row.status === "通过").length;
  const scored = assessmentHistoryRows.filter((row) => row.score !== null);
  const averageScore = scored.reduce((sum, row) => sum + (row.score ?? 0), 0) / Math.max(1, scored.length);

  function exportHistory(rows: AssessmentHistoryRow[], filename: string) {
    const values = [["批次编号", "评估任务", "数据集", "任务类型", "评估标准", "质量得分", "问题数量", "闭环率", "结果", "执行人", "完成时间"], ...rows.map((row) => [row.id, row.task, row.dataset, row.category, row.standard, row.score ?? "--", row.issues, `${row.closure}%`, row.status, row.owner, row.completed])];
    const csv = `\uFEFF${values.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    notify(`已导出 ${rows.length} 条历史评估记录`);
  }

  return <section className="assessment-history-page">
    <header className="assessment-history-head"><div><span><UiIcon icon={ScrollText} size={19} /></span><div><h1>高质量数据评估历史</h1><p>查询已结束的评估批次，追溯质量结论、问题闭环和组件执行结果</p></div></div><div><button className="reuse-secondary" onClick={() => notify("历史评估记录已刷新")}><UiIcon icon={RefreshCw} />刷新</button><button className="reuse-primary" disabled={!filtered.length} onClick={() => exportHistory(filtered, "高质量数据评估历史.csv")}><UiIcon icon={Download} />导出历史</button></div></header>
    <div className="assessment-history-summary"><span><small>历史批次</small><strong>20</strong><b>当前展示最近 8 条</b></span><span><small>评估通过</small><strong>{passed}</strong><b>通过率 {Math.round(passed / assessmentHistoryRows.length * 100)}%</b></span><span><small>平均质量得分</small><strong>{averageScore.toFixed(1)}</strong><b>不含已终止任务</b></span><span><small>累计问题样本</small><strong>{assessmentHistoryRows.reduce((sum, row) => sum + row.issues, 0)}</strong><b>跨 {assessmentHistoryRows.length} 个批次</b></span></div>
    <div className="assessment-history-toolbar"><label><UiIcon icon={Search} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索任务、数据集、批次编号或执行人" /></label><div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>全部状态</option><option>通过</option><option>未通过</option><option>已终止</option></select><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>全部类型</option><option>语句文件</option><option>自定义审查</option><option>多模态审查</option></select><span><UiIcon icon={Filter} />共 {filtered.length} 条结果</span></div></div>
    <div className="assessment-history-table"><table><thead><tr><th>批次 / 评估任务</th><th>数据集版本</th><th>类型</th><th>评估标准</th><th>质量得分</th><th>问题 / 闭环率</th><th>完成时间</th><th>结果</th><th>操作</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id}><td><strong>{row.task}</strong><small>{row.id} · {row.owner}</small></td><td>{row.dataset}</td><td><span className="history-category">{row.category}</span></td><td>{row.standard}</td><td><b className={row.score !== null && row.score < 90 ? "low" : ""}>{row.score?.toFixed(1) ?? "--"}</b></td><td><strong>{row.issues}</strong><small>闭环 {row.closure}%</small></td><td>{row.completed}<small>耗时 {row.duration}</small></td><td><Status tone={row.status === "通过" ? "green" : row.status === "未通过" ? "orange" : "gray"}>{row.status}</Status></td><td><button className="reuse-link" onClick={() => setSelected(row)}><UiIcon icon={Eye} />查看</button></td></tr>)}</tbody></table>{!filtered.length && <div className="assessment-history-empty"><UiIcon icon={ScanSearch} size={25} /><strong>没有匹配的历史记录</strong><p>调整关键词或筛选条件后重试。</p></div>}</div>
    <footer className="assessment-history-pagination"><span>共 20 条 · 当前展示 {filtered.length} 条</span><div><button disabled>‹</button><button className="active">1</button><button>2</button><button>3</button><button>›</button></div></footer>
    {selected && <div className="assessment-history-drawer-backdrop"><button className="dialog-dismiss" aria-label="关闭历史详情" onClick={() => setSelected(null)} /><aside className="assessment-history-drawer"><header><div><span><UiIcon icon={ClipboardCheck} size={18} /></span><div><h2>{selected.task}</h2><p>{selected.id} · {selected.completed}</p></div></div><button aria-label="关闭历史详情" onClick={() => setSelected(null)}><UiIcon icon={X} /></button></header><div className="history-detail-result"><Status tone={selected.status === "通过" ? "green" : selected.status === "未通过" ? "orange" : "gray"}>{selected.status}</Status><strong>{selected.score?.toFixed(1) ?? "--"}</strong><span>质量得分</span><b>{selected.issues} 个问题 · 闭环率 {selected.closure}%</b></div><dl><div><dt>数据集版本</dt><dd>{selected.dataset}</dd></div><div><dt>评估标准</dt><dd>{selected.standard}</dd></div><div><dt>评估类型</dt><dd>{selected.category}</dd></div><div><dt>样本数量</dt><dd>{selected.samples}</dd></div><div><dt>执行团队</dt><dd>{selected.owner}</dd></div><div><dt>执行耗时</dt><dd>{selected.duration}</dd></div></dl><section><h3>组件执行结果</h3><table><thead><tr><th>评估组件</th><th>得分</th><th>问题</th><th>结果</th></tr></thead><tbody>{selected.components.map((component) => <tr key={component.name}><td>{component.name}</td><td>{component.score ?? "--"}</td><td>{component.issues}</td><td><Status tone={component.result === "通过" ? "green" : component.result === "未通过" ? "orange" : "gray"}>{component.result}</Status></td></tr>)}</tbody></table></section><footer><button className="reuse-secondary" onClick={() => setSelected(null)}>关闭</button><button className="reuse-primary" onClick={() => exportHistory([selected], `${selected.task}-历史评估报告.csv`)}><UiIcon icon={FileDown} />导出报告</button></footer></aside></div>}
  </section>;
}

function AssessmentPage({
  initialView,
  tasks,
  issues,
  setIssues,
  openDialog,
  notify,
}: {
  initialView: "评估执行" | "问题闭环";
  tasks: string[];
  issues: AssessmentIssue[];
  setIssues: React.Dispatch<React.SetStateAction<AssessmentIssue[]>>;
  openDialog: () => void;
  notify: Notify;
}) {
  const [task, setTask] = useState(tasks[0]);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState(72);
  const progressRef = useRef(progress);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<"评估执行" | "问题闭环">(initialView);
  const [configOpen, setConfigOpen] = useState(false);
  const [config, setConfig] = useState<AssessmentConfig>({ dataset: "篮球高质量数据集1", standard: "图像质量评估标准 v2", sampling: "全量评估", threshold: 95, components: assessmentComponents });
  const [configDraft, setConfigDraft] = useState<AssessmentConfig>(config);
  const [issueFilter, setIssueFilter] = useState("全部状态");
  const [selectedRuleName, setSelectedRuleName] = useState<string | null>(null);
  const [ruleDetailTab, setRuleDetailTab] = useState<"规则定义" | "执行记录" | "问题样本">("规则定义");
  const filteredTasks = tasks.filter((item) => item.toLowerCase().includes(search.toLowerCase()));
  const completedCount = progress >= 100 ? config.components.length : Math.min(Math.max(0, config.components.length - 1), Math.floor(progress / Math.max(1, 100 / config.components.length)));
  const openIssueCount = issues.filter((issue) => issue.status !== "已关闭").length;
  const closedIssueCount = issues.length - openIssueCount;
  const filteredIssues = issues.filter((issue) => issueFilter === "全部状态" || issue.status === issueFilter);
  const selectedRule = selectedRuleName ? assessmentRuleProfiles[selectedRuleName] : null;
  const selectedRuleIndex = selectedRuleName ? config.components.indexOf(selectedRuleName) : -1;
  const selectedRuleComplete = selectedRuleIndex >= 0 && selectedRuleIndex < completedCount;
  const selectedRuleRunning = running && selectedRuleIndex === completedCount;
  const selectedRuleIssues = selectedRuleName ? issues.filter((issue) => issue.component === selectedRuleName) : [];

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const next = Math.min(100, progressRef.current + 7);
      progressRef.current = next;
      setProgress(next);
      if (next === 100) {
        window.clearInterval(timer);
        setRunning(false);
        notify(`${task} 已完成全部质量组件`);
      }
    }, 360);
    return () => window.clearInterval(timer);
  }, [running, notify, task]);

  function selectTask(item: string, index: number) {
    setTask(item);
    setProgress(index < 2 ? 72 : 20);
    setRunning(false);
    setView("评估执行");
    setSelectedRuleName(null);
  }

  function openAssessmentRule(name: string) {
    setSelectedRuleName(name);
    setRuleDetailTab("规则定义");
  }

  function openAssessmentConfig() {
    setConfigDraft({ ...config, components: [...config.components] });
    setConfigOpen(true);
  }

  function toggleAssessmentComponent(component: string) {
    setConfigDraft((current) => ({
      ...current,
      components: current.components.includes(component) ? current.components.filter((item) => item !== component) : [...current.components, component],
    }));
  }

  function saveAssessmentConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configDraft.components.length) {
      notify("请至少选择一个质量评估组件");
      return;
    }
    setConfig({ ...configDraft, components: [...configDraft.components] });
    setProgress(0);
    setRunning(false);
    setConfigOpen(false);
    notify(`${task} 的评估配置已保存，请开始执行`);
  }

  function advanceAssessmentIssue(id: string) {
    setIssues((current) => current.map((issue) => {
      if (issue.id !== id) return issue;
      if (issue.status === "待处理") return { ...issue, assignee: "数据质量治理组", status: "已分派" };
      if (issue.status === "已分派") return { ...issue, status: "待复核" };
      if (issue.status === "待复核") return { ...issue, status: "已关闭" };
      return issue;
    }));
    const issue = issues.find((item) => item.id === id);
    const nextAction = issue?.status === "待处理" ? "已分派整改" : issue?.status === "已分派" ? "已提交复核" : issue?.status === "待复核" ? "复核通过并关闭" : "已查看";
    notify(`${id} ${nextAction}`);
  }

  function exportAssessmentReport() {
    const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const summary = [
      ["评估任务", task], ["数据集", config.dataset], ["评估标准", config.standard], ["抽样策略", config.sampling], ["通过阈值", `${config.threshold} 分`], ["评估进度", `${progress}%`], ["问题总数", issues.length], ["已关闭", closedIssueCount],
    ];
    const rows = [
      ["高质量数据集质量评估报告"],
      ...summary,
      [],
      ["问题编号", "样本", "评估组件", "问题描述", "严重度", "责任人", "状态", "整改建议"],
      ...issues.map((issue) => [issue.id, issue.sample, issue.component, issue.problem, issue.severity, issue.assignee, issue.status, issue.suggestion]),
    ];
    const blob = new Blob(["\ufeff", rows.map((row) => row.map(escapeCsv).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${task}-质量评估报告.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify(`${task} 的质量评估报告已导出`);
  }

  return (
    <section className="assessment-page">
      <aside className="white-panel task-browser">
        <div className="reuse-panel-head small">
          <div><h2>审查任务列表</h2><p>20 个任务 · 展示 {filteredTasks.length}</p></div>
          <button className="reuse-primary" onClick={openDialog}><UiIcon icon={Plus} />添加</button>
        </div>
        <label className="reuse-search full">
          <UiIcon icon={Search} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="请输入关键字进行搜索" />
        </label>
        <div className="assessment-task-list">
          {filteredTasks.map((item) => {
            const originalIndex = tasks.indexOf(item);
            return (
              <button className={task === item ? "active" : ""} key={item} onClick={() => selectTask(item, originalIndex)}>
                <span>▣</span>
                <div><strong>{item}</strong><small>{originalIndex < 2 ? "审查进行中..." : "等待审查"}</small></div>
                <b>›</b>
              </button>
            );
          })}
        </div>
      </aside>
      <article className="white-panel assessment-scope">
        <header>
          <div><h2>数据集质量评估</h2><p>评估任务：<strong>{task}</strong> · {config.standard}</p></div>
          <div className="assessment-head-actions"><Status tone={progress >= 100 ? "green" : "blue"}>{progress >= 100 ? "评估已完成" : running ? "正在执行" : progress === 0 ? "等待执行" : "评估进行中"}</Status><button className="reuse-secondary" onClick={openAssessmentConfig}><UiIcon icon={Settings2} />评估配置</button><button className="reuse-primary" disabled={progress < 100} onClick={exportAssessmentReport}><UiIcon icon={Download} />导出报告</button></div>
        </header>
        <nav className="assessment-view-tabs"><button className={view === "评估执行" ? "active" : ""} onClick={() => setView("评估执行")}><UiIcon icon={Play} />评估执行</button><button className={view === "问题闭环" ? "active" : ""} onClick={() => setView("问题闭环")}><UiIcon icon={ClipboardCheck} />问题闭环 <b>{openIssueCount}</b></button></nav>
        {view === "评估执行" && <>
        <div className="scope-summary">
          <div><span>数据集</span><strong>1 个</strong></div>
          <div><span>评估组件</span><strong>{config.components.length} 项</strong></div>
          <div><span>评估样本</span><strong>{config.sampling === "全量评估" ? "12,680" : "2,536"}</strong></div>
          <div><span>质量得分</span><strong>{progress >= 100 ? "96.8" : progress === 0 ? "--" : "进行中"}</strong></div>
        </div>
        <section className="assessment-item">
          <div className={`dataset-illustration ${running ? "is-running" : ""}`}>数</div>
          <div className="assessment-copy">
            <h3>{config.dataset}</h3>
            <p>{config.standard} · {config.components.length} 个质量组件 · 阈值 {config.threshold} 分</p>
            <Progress value={progress} />
            <small>{progress >= 100 ? `评估完成，发现 ${issues.length} 个问题，${closedIssueCount} 个已关闭` : `评估进行中，已完成 ${completedCount} / ${config.components.length} 个组件`}</small>
          </div>
          <button
            className="reuse-primary"
            disabled={running}
            onClick={() => {
              if (progress >= 100) setProgress(0);
              setRunning(true);
            }}
          >
            <UiIcon icon={running ? RefreshCw : Play} />{running ? "执行中..." : progress >= 100 ? "重新执行" : progress === 0 ? "开始评估" : "继续评估"}
          </button>
        </section>
        <div className="reuse-table-wrap">
          <table className="reuse-table">
            <thead>
              <tr><th>组件名称</th><th>数据量</th><th>问题数量</th><th>正确率</th><th>评估日期</th><th>状态</th></tr>
            </thead>
            <tbody>
              {config.components.map((name, index) => {
                const complete = index < completedCount;
                const current = running && index === completedCount;
                return (
                  <tr key={name}>
                    <td><button className="assessment-rule-link" onClick={() => openAssessmentRule(name)}><strong>{name}</strong><UiIcon icon={ChevronRight} size={12} /></button></td><td>2</td><td>{complete ? issues.filter((issue) => issue.component === name).length : 0}</td>
                    <td>{complete ? (index === 1 ? "50%" : "100%") : "--"}</td><td>2026-08-23</td>
                    <td><Status tone={complete ? "green" : current ? "blue" : "gray"}>{complete ? "已完成" : current ? "执行中" : "等待评估"}</Status></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="assessment-result-strip"><span><UiIcon icon={TriangleAlert} /><strong>{issues.length}</strong> 个问题样本</span><span><UiIcon icon={CircleCheck} /><strong>{closedIssueCount}</strong> 个已闭环</span><span><strong>{openIssueCount}</strong> 个待处理或复核</span><button className="reuse-link" onClick={() => setView("问题闭环")}>进入问题闭环 <UiIcon icon={ChevronRight} /></button></div>
        </>}
        {view === "问题闭环" && <section className="assessment-issue-workspace">
          <div className="assessment-issue-summary"><span><small>问题总数</small><strong>{issues.length}</strong></span><span><small>高风险</small><strong>{issues.filter((issue) => issue.severity === "高" && issue.status !== "已关闭").length}</strong></span><span><small>整改处理中</small><strong>{issues.filter((issue) => issue.status === "已分派").length}</strong></span><span><small>待复核</small><strong>{issues.filter((issue) => issue.status === "待复核").length}</strong></span><span><small>闭环率</small><strong>{Math.round(closedIssueCount / Math.max(1, issues.length) * 100)}%</strong></span></div>
          <div className="assessment-issue-toolbar"><div><h3>问题样本处置</h3><p>分派整改、提交复核并关闭问题，所有状态实时回写任务</p></div><label>状态筛选<select value={issueFilter} onChange={(event) => setIssueFilter(event.target.value)}><option>全部状态</option><option>待处理</option><option>已分派</option><option>待复核</option><option>已关闭</option></select></label></div>
          <div className="reuse-table-wrap"><table className="reuse-table compact-table assessment-issue-table"><thead><tr><th>问题编号 / 样本</th><th>评估组件</th><th>问题描述</th><th>风险</th><th>责任人</th><th>状态</th><th>整改建议</th><th>操作</th></tr></thead><tbody>{filteredIssues.map((issue) => <tr key={issue.id}><td><strong>{issue.id}</strong><small>{issue.sample}</small></td><td>{issue.component}</td><td>{issue.problem}</td><td><Status tone={issue.severity === "高" ? "orange" : issue.severity === "中" ? "blue" : "gray"}>{issue.severity}风险</Status></td><td>{issue.assignee}</td><td><Status tone={issue.status === "已关闭" ? "green" : issue.status === "待复核" ? "blue" : issue.status === "已分派" ? "orange" : "gray"}>{issue.status}</Status></td><td>{issue.suggestion}</td><td><button className="reuse-link" onClick={() => advanceAssessmentIssue(issue.id)}>{issue.status === "待处理" ? "分派整改" : issue.status === "已分派" ? "提交复核" : issue.status === "待复核" ? "复核通过" : "查看记录"}</button></td></tr>)}</tbody></table>{filteredIssues.length === 0 && <div className="table-empty">当前筛选条件下没有问题记录</div>}</div>
        </section>}
      </article>
      {selectedRule && <div className="assessment-rule-backdrop">
        <button className="dialog-dismiss" aria-label="关闭规则详情" onClick={() => setSelectedRuleName(null)} />
        <aside className="assessment-rule-drawer">
          <header>
            <div><span><UiIcon icon={ScanSearch} size={18} /></span><div><strong>{selectedRule.name}</strong><small>{selectedRule.code} · {selectedRule.version}</small></div></div>
            <button aria-label="关闭规则详情" onClick={() => setSelectedRuleName(null)}><UiIcon icon={X} /></button>
          </header>
          <div className="assessment-rule-state">
            <Status tone={selectedRuleComplete ? "green" : selectedRuleRunning ? "blue" : "gray"}>{selectedRuleComplete ? "已完成" : selectedRuleRunning ? "执行中" : "等待评估"}</Status>
            <span>本次数据量 <b>2</b></span><span>命中问题 <b>{selectedRuleComplete ? selectedRuleIssues.length : 0}</b></span><span>正确率 <b>{selectedRuleComplete ? (selectedRuleIssues.length ? "50%" : "100%") : "--"}</b></span>
          </div>
          <nav>{(["规则定义", "执行记录", "问题样本"] as const).map((tab) => <button key={tab} className={ruleDetailTab === tab ? "active" : ""} onClick={() => setRuleDetailTab(tab)}>{tab}{tab === "问题样本" && <b>{selectedRuleIssues.length}</b>}</button>)}</nav>
          <section>
            {ruleDetailTab === "规则定义" && <>
              <p className="assessment-rule-description">{selectedRule.description}</p>
              <dl className="assessment-rule-metadata"><div><dt>规则分类</dt><dd>{selectedRule.category}</dd></div><div><dt>责任团队</dt><dd>{selectedRule.owner}</dd></div><div><dt>适用范围</dt><dd>{selectedRule.scope}</dd></div><div><dt>通过阈值</dt><dd>{selectedRule.threshold}</dd></div></dl>
              <h3>判定逻辑</h3><div className="assessment-rule-expression"><span>IF</span><code>{selectedRule.logic}</code></div>
              <h3>规则条件</h3><div className="assessment-rule-conditions">{selectedRule.conditions.map((condition, index) => <div key={`${condition.field}-${index}`}><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{condition.field}</strong><small>{condition.operator}</small></span><em>{condition.expected}</em></div>)}</div>
              <h3>输出字段</h3><div className="assessment-rule-fields">{selectedRule.output.map((field) => <code key={field}>{field}</code>)}</div>
            </>}
            {ruleDetailTab === "执行记录" && <>
              <div className="assessment-rule-run-summary"><span><small>执行批次</small><strong>RUN-20260823-04</strong></span><span><small>评估日期</small><strong>2026-08-23</strong></span><span><small>规则耗时</small><strong>{selectedRuleComplete ? "00:18" : "--"}</strong></span></div>
              <h3>执行步骤</h3><div className="assessment-rule-timeline"><div className="done"><i>✓</i><span><strong>加载规则版本</strong><small>{selectedRule.version} · 参数校验通过</small></span></div><div className={selectedRuleComplete || selectedRuleRunning ? "done" : "waiting"}><i>{selectedRuleComplete || selectedRuleRunning ? "✓" : "2"}</i><span><strong>读取评估样本</strong><small>已加载 2 个图像样本</small></span></div><div className={selectedRuleComplete ? "done" : selectedRuleRunning ? "running" : "waiting"}><i>{selectedRuleComplete ? "✓" : selectedRuleRunning ? "◌" : "3"}</i><span><strong>执行规则判定</strong><small>{selectedRuleComplete ? "规则执行完成" : selectedRuleRunning ? "正在计算质量指标" : "等待前序组件完成"}</small></span></div><div className={selectedRuleComplete ? "done" : "waiting"}><i>{selectedRuleComplete ? "✓" : "4"}</i><span><strong>写入评估结果</strong><small>{selectedRuleComplete ? "结果已回写当前任务" : "尚未生成结果"}</small></span></div></div>
            </>}
            {ruleDetailTab === "问题样本" && <div className="assessment-rule-issues">{selectedRuleIssues.length > 0 ? selectedRuleIssues.map((issue) => <button key={issue.id} onClick={() => { setSelectedRuleName(null); setView("问题闭环"); setIssueFilter(issue.status); }}><span><strong>{issue.sample}</strong><small>{issue.id} · {issue.problem}</small></span><Status tone={issue.severity === "高" ? "orange" : issue.severity === "中" ? "blue" : "gray"}>{issue.severity}风险</Status><UiIcon icon={ChevronRight} /></button>) : <div><span><UiIcon icon={CircleCheck} size={22} /></span><strong>未发现问题样本</strong><p>当前任务尚未命中该规则，或规则仍在等待评估。</p></div>}</div>}
          </section>
          <footer><button className="reuse-secondary" onClick={() => { setSelectedRuleName(null); openAssessmentConfig(); }}><UiIcon icon={Settings2} />编辑评估配置</button>{selectedRuleIssues.length > 0 ? <button className="reuse-primary" onClick={() => { setSelectedRuleName(null); setView("问题闭环"); setIssueFilter("全部状态"); }}><UiIcon icon={ClipboardCheck} />查看问题样本</button> : <button className="reuse-primary" disabled={running || selectedRuleComplete} onClick={() => { setSelectedRuleName(null); setRunning(true); notify(`${selectedRule.name} 已进入评估执行队列`); }}><UiIcon icon={Play} />{selectedRuleComplete ? "规则已完成" : "执行当前任务"}</button>}</footer>
        </aside>
      </div>}
      {configOpen && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="关闭评估配置" onClick={() => setConfigOpen(false)} /><form className="reuse-dialog assessment-config-dialog" onSubmit={saveAssessmentConfig}><header><div><h2>评估任务配置</h2><p>{task} · 保存后将重新执行评估</p></div><button type="button" aria-label="关闭评估配置" onClick={() => setConfigOpen(false)}><UiIcon icon={X} /></button></header><label>评估数据集<select value={configDraft.dataset} onChange={(event) => setConfigDraft((current) => ({ ...current, dataset: event.target.value }))}><option>篮球高质量数据集1</option><option>金融年报问答集 v2.1</option><option>客服知识数据集 v3.4</option></select></label><label>评估标准<select value={configDraft.standard} onChange={(event) => setConfigDraft((current) => ({ ...current, standard: event.target.value }))}><option>图像质量评估标准 v2</option><option>多模态训练数据标准 v3</option><option>SFT 数据质量标准 v2</option></select></label><label>抽样策略<select value={configDraft.sampling} onChange={(event) => setConfigDraft((current) => ({ ...current, sampling: event.target.value }))}><option>全量评估</option><option>分层抽样 20%</option><option>风险优先抽样</option></select></label><label>通过阈值<div className="assessment-threshold-field"><input type="range" min="80" max="100" value={configDraft.threshold} onChange={(event) => setConfigDraft((current) => ({ ...current, threshold: Number(event.target.value) }))} /><strong>{configDraft.threshold} 分</strong></div></label><fieldset><legend>质量评估组件 <small>已选择 {configDraft.components.length} 项</small></legend><div>{assessmentComponents.map((component) => <label key={component}><span className="visually-hidden">评估组件</span><input type="checkbox" checked={configDraft.components.includes(component)} onChange={() => toggleAssessmentComponent(component)} /><span><strong>{component}</strong><small>{component.includes("重复") ? "识别完全重复与近似重复样本" : component.includes("格式") ? "检查编码、色彩空间和文件格式" : "按标准规则检查并输出问题样本"}</small></span></label>)}</div></fieldset><footer><button type="button" className="reuse-secondary" onClick={() => setConfigOpen(false)}>取消</button><button className="reuse-primary"><UiIcon icon={Save} />保存配置</button></footer></form></div>}
    </section>
  );
}

function nextModelVersion(job: JobRow) {
  const base = job.name.replace(/-\d+$/, "");
  return `${base}-v1.${job.versions.length + 1}`;
}

function ModelDevelopment({
  jobs,
  openDialog,
  notify,
  openLog,
  toggleJob,
  updateJob,
}: {
  jobs: JobRow[];
  openDialog: (preset?: string) => void;
  notify: Notify;
  openLog: (job: JobRow) => void;
  toggleJob: (name: string) => void;
  updateJob: (name: string, patch: Partial<JobRow>) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedJobName, setSelectedJobName] = useState(jobs[0]?.name ?? "");
  const [detailView, setDetailView] = useState<"运行指标" | "模型版本">("运行指标");
  const [configJobName, setConfigJobName] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<ModelJobConfig>(defaultModelJobConfig);
  const filtered = jobs.filter((job) => job.name.toLowerCase().includes(search.toLowerCase()));
  const selectedJob = jobs.find((job) => job.name === selectedJobName) ?? jobs[0];
  const configJob = jobs.find((job) => job.name === configJobName);
  const metricSteps = Array.from({ length: 10 }, (_, index) => (index + 1) * 10).filter((step) => step <= Math.max(10, selectedJob?.progress ?? 0));
  const capabilities = [
    ["大模型训练工具链", "微调训练", "LoRA、QLoRA、全量 SFT"],
    ["大模型蒸馏轻量化", "蒸馏量化", "INT8 / INT4 与知识蒸馏"],
    ["大模型 RAG 增强", "RAG 增强", "切片、索引、检索、重排"],
    ["模型注册与推理", "模型注册", "版本、审批、回滚、服务发布"],
  ];

  useEffect(() => {
    const runningJobs = jobs.filter((job) => job.status === "训练中");
    if (!runningJobs.length) return;
    const timer = window.setInterval(() => {
      runningJobs.forEach((job) => {
        const next = Math.min(100, job.progress + 4);
        if (next < 100) {
          updateJob(job.name, { progress: next });
          return;
        }
        const version: ModelVersionRow = {
          version: nextModelVersion(job),
          created: "刚刚",
          loss: "0.384",
          accuracy: "94.6%",
          size: job.type.includes("蒸馏") ? "3.2 GB" : "15.8 GB",
          status: "待注册",
        };
        updateJob(job.name, { progress: 100, status: "已完成", versions: [version, ...job.versions] });
        notify(`${job.name} 运行完成，已生成模型版本 ${version.version}`);
      });
    }, 520);
    return () => window.clearInterval(timer);
  }, [jobs, notify, updateJob]);

  function openModelJobConfig(job: JobRow) {
    setConfigJobName(job.name);
    setConfigDraft({ ...job.config });
  }

  function saveModelJobConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configJob) return;
    updateJob(configJob.name, { config: { ...configDraft }, progress: configJob.status === "已完成" ? 0 : configJob.progress, status: configJob.status === "已完成" ? "已暂停" : configJob.status });
    setConfigJobName(null);
    notify(`${configJob.name} 的运行参数已保存`);
  }

  function registerModelVersion(version: ModelVersionRow) {
    if (!selectedJob) return;
    updateJob(selectedJob.name, {
      registeredVersion: version.version,
      versions: selectedJob.versions.map((item) => ({ ...item, status: item.version === version.version ? "已注册" : item.status === "已注册" ? "已归档" : item.status })),
    });
    notify(`${version.version} 已写入模型注册表并设为当前版本`);
  }

  return (
    <section className="reuse-content-page">
      <article className="model-banner">
        <div>
          <p>可用不可见模型开发环境</p>
          <h2>模型能力可调用，底层资产不可见</h2>
          <span>在租户隔离环境中完成微调、RAG、蒸馏量化和模型注册，训练数据、权重和密钥全程受控。</span>
        </div>
        <div className="secure-orbit"><span>◆</span><i /><i /><i /></div>
        <button onClick={() => openDialog()}><UiIcon icon={Plus} />新建模型开发任务</button>
      </article>
      <div className="model-capability-grid">
        {capabilities.map((item, index) => (
          <button className="model-capability" key={item[1]} onClick={() => openDialog(item[1])}>
            <span className={`mc${index}`}>{["⌘", "◫", "⎈", "◎"][index]}</span>
            <div><small>{item[0]}</small><strong>{item[1]}</strong><p>{item[2]}</p></div><b>›</b>
          </button>
        ))}
      </div>
      <article className="white-panel reuse-list-panel">
        <div className="reuse-panel-head">
          <div><h2>模型开发任务</h2><p>安全域资源使用率 68% · 当前等待队列 {jobs.filter((job) => job.status === "排队中").length}</p></div>
          <div>
            <label className="reuse-search"><UiIcon icon={Search} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索任务名称" /></label>
            <button className="reuse-primary" onClick={() => openDialog()}><UiIcon icon={Plus} />新建任务</button>
          </div>
        </div>
        <div className="reuse-table-wrap">
          <table className="reuse-table">
            <thead>
              <tr><th>任务名称</th><th>开发方式</th><th>基础模型</th><th>数据集版本</th><th>运行进度</th><th>安全策略</th><th>状态</th><th>操作</th></tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr key={job.name} className={selectedJob?.name === job.name ? "selected-row" : ""}>
                  <td><button className="reuse-link model-job-name" onClick={() => { setSelectedJobName(job.name); setDetailView("运行指标"); }}>{job.name}</button></td><td>{job.type}</td><td>{job.model}</td><td>{job.dataset}</td>
                  <td><div className="job-progress"><Progress value={job.progress} /><span>{job.progress}%</span></div></td>
                  <td><span className="secure-tag">可用不可见</span></td>
                  <td><Status tone={job.status === "已完成" ? "green" : job.status === "训练中" ? "blue" : job.status === "已暂停" ? "gray" : job.status === "失败" ? "orange" : "orange"}>{job.status}</Status></td>
                  <td>
                    <button className="reuse-link" onClick={() => { setSelectedJobName(job.name); setDetailView("运行指标"); }}>详情</button>{" "}
                    <button className="reuse-link" onClick={() => openLog(job)}>日志</button>{" "}
                    <button className="reuse-link" onClick={() => openModelJobConfig(job)}>配置</button>{" "}
                    {job.status !== "已完成" && (
                      <button className="reuse-link" onClick={() => { toggleJob(job.name); notify(`${job.name} 状态已更新`); }}>
                        {job.status === "训练中" ? "暂停" : "运行"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      {selectedJob && <article className="white-panel model-job-workspace">
        <header className="model-job-head"><div><span><UiIcon icon={Gauge} size={17} /></span><div><h2>{selectedJob.name}</h2><p>{selectedJob.type} · {selectedJob.model} · {selectedJob.dataset}</p></div></div><div><Status tone={selectedJob.status === "已完成" ? "green" : selectedJob.status === "训练中" ? "blue" : "gray"}>{selectedJob.status}</Status><button className="reuse-secondary" onClick={() => openModelJobConfig(selectedJob)}><UiIcon icon={Settings2} />参数配置</button><button className="reuse-secondary" onClick={() => openLog(selectedJob)}><UiIcon icon={Rows3} />实时日志</button>{selectedJob.status !== "已完成" && <button className="reuse-primary" onClick={() => { toggleJob(selectedJob.name); notify(`${selectedJob.name} 状态已更新`); }}><UiIcon icon={selectedJob.status === "训练中" ? Minus : Play} />{selectedJob.status === "训练中" ? "暂停任务" : "运行任务"}</button>}</div></header>
        <div className="model-config-strip"><span><small>学习率</small><strong>{selectedJob.config.learningRate}</strong></span><span><small>训练轮次</small><strong>{selectedJob.config.epochs}</strong></span><span><small>批次大小</small><strong>{selectedJob.config.batchSize}</strong></span><span><small>计算精度</small><strong>{selectedJob.config.precision}</strong></span><span><small>序列长度</small><strong>{selectedJob.config.maxSequence}</strong></span><span><small>计算资源</small><strong>{selectedJob.config.compute}</strong></span></div>
        <nav className="model-job-tabs"><button className={detailView === "运行指标" ? "active" : ""} onClick={() => setDetailView("运行指标")}><UiIcon icon={Gauge} />运行指标</button><button className={detailView === "模型版本" ? "active" : ""} onClick={() => setDetailView("模型版本")}><UiIcon icon={PackageCheck} />模型版本 <b>{selectedJob.versions.length}</b></button></nav>
        {detailView === "运行指标" && <section className="model-metrics-workspace">
          <div className="model-metric-summary"><span><small>运行进度</small><strong>{selectedJob.progress}%</strong></span><span><small>训练损失</small><strong>{Math.max(0.31, 2.48 - selectedJob.progress * 0.021).toFixed(3)}</strong></span><span><small>验证准确率</small><strong>{Math.min(94.6, 56 + selectedJob.progress * 0.386).toFixed(1)}%</strong></span><span><small>吞吐量</small><strong>{Math.round(1380 + selectedJob.progress * 6.4)} tok/s</strong></span><span><small>预计剩余</small><strong>{selectedJob.progress >= 100 ? "已完成" : `${Math.ceil((100 - selectedJob.progress) * 0.7)} 分钟`}</strong></span></div>
          <div className="model-metric-grid"><section><header><div><h3>训练损失趋势</h3><p>按训练进度采样，数值持续收敛</p></div><strong>{Math.max(0.31, 2.48 - selectedJob.progress * 0.021).toFixed(3)}</strong></header><div className="model-metric-bars loss">{metricSteps.map((step) => { const value = Math.max(0.31, 2.48 - step * 0.021); return <i key={step} style={{ height: `${Math.max(12, value / 2.48 * 100)}%` }} title={`${step}% · loss ${value.toFixed(3)}`}><small>{step}</small></i>; })}</div></section><section><header><div><h3>验证准确率</h3><p>验证集准确率与门禁阈值</p></div><strong>{Math.min(94.6, 56 + selectedJob.progress * 0.386).toFixed(1)}%</strong></header><div className="model-metric-bars accuracy">{metricSteps.map((step) => { const value = Math.min(94.6, 56 + step * 0.386); return <i key={step} style={{ height: `${value}%` }} title={`${step}% · accuracy ${value.toFixed(1)}%`}><small>{step}</small></i>; })}</div></section></div>
          <div className="model-checkpoint-table"><header><div><h3>训练检查点</h3><p>最近指标已同步到安全域任务记录</p></div><span>自动保存间隔：500 steps</span></header><table className="reuse-table compact-table"><thead><tr><th>检查点</th><th>训练进度</th><th>Loss</th><th>准确率</th><th>吞吐量</th><th>状态</th></tr></thead><tbody>{metricSteps.slice(-5).reverse().map((step) => <tr key={step}><td><strong>checkpoint-{step * 50}</strong></td><td>{step}%</td><td>{Math.max(0.31, 2.48 - step * 0.021).toFixed(3)}</td><td>{Math.min(94.6, 56 + step * 0.386).toFixed(1)}%</td><td>{Math.round(1380 + step * 6.4)} tok/s</td><td><Status tone={step <= selectedJob.progress ? "green" : "gray"}>已保存</Status></td></tr>)}</tbody></table></div>
        </section>}
        {detailView === "模型版本" && <section className="model-version-workspace"><div className="model-version-current"><span><UiIcon icon={PackageCheck} size={18} /></span><div><small>当前注册版本</small><strong>{selectedJob.registeredVersion}</strong><p>{selectedJob.registeredVersion === "--" ? "任务完成后选择一个模型产物注册" : "已进入模型注册表，可用于后续评测与发布门禁"}</p></div><Status tone={selectedJob.registeredVersion === "--" ? "gray" : "green"}>{selectedJob.registeredVersion === "--" ? "未注册" : "已注册"}</Status></div><div className="reuse-table-wrap"><table className="reuse-table compact-table"><thead><tr><th>模型版本</th><th>生成时间</th><th>最终 Loss</th><th>验证准确率</th><th>产物大小</th><th>状态</th><th>操作</th></tr></thead><tbody>{selectedJob.versions.map((version) => <tr key={version.version} className={version.status === "已注册" ? "selected-row" : ""}><td><strong>{version.version}</strong></td><td>{version.created}</td><td>{version.loss}</td><td>{version.accuracy}</td><td>{version.size}</td><td><Status tone={version.status === "已注册" ? "green" : version.status === "待注册" ? "blue" : "gray"}>{version.status}</Status></td><td>{version.status === "已注册" ? <button className="reuse-link" onClick={() => notify(`${version.version} 已是当前注册版本`)}>当前版本</button> : <button className="reuse-link" onClick={() => registerModelVersion(version)}>注册此版本</button>}</td></tr>)}</tbody></table>{selectedJob.versions.length === 0 && <div className="table-empty">当前任务尚未生成模型产物，运行完成后将自动创建版本</div>}</div></section>}
      </article>}
      {configJob && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="关闭参数配置" onClick={() => setConfigJobName(null)} /><form className="reuse-dialog model-job-config-dialog" onSubmit={saveModelJobConfig}><header><div><h2>模型任务参数配置</h2><p>{configJob.name} · 修改已完成任务会创建新的运行</p></div><button type="button" aria-label="关闭参数配置" onClick={() => setConfigJobName(null)}><UiIcon icon={X} /></button></header><label>学习率<select value={configDraft.learningRate} onChange={(event) => setConfigDraft((current) => ({ ...current, learningRate: event.target.value }))}><option>1e-5</option><option>2e-5</option><option>5e-5</option><option>1e-4</option></select></label><label>训练轮次<input type="number" min="1" max="12" value={configDraft.epochs} onChange={(event) => setConfigDraft((current) => ({ ...current, epochs: Number(event.target.value) }))} /></label><label>批次大小<select value={configDraft.batchSize} onChange={(event) => setConfigDraft((current) => ({ ...current, batchSize: Number(event.target.value) }))}><option value="4">4</option><option value="8">8</option><option value="16">16</option><option value="32">32</option></select></label><label>计算精度<select value={configDraft.precision} onChange={(event) => setConfigDraft((current) => ({ ...current, precision: event.target.value }))}><option>BF16</option><option>FP16</option><option>INT8</option><option>INT4</option></select></label><label>最大序列长度<select value={configDraft.maxSequence} onChange={(event) => setConfigDraft((current) => ({ ...current, maxSequence: Number(event.target.value) }))}><option value="2048">2048</option><option value="4096">4096</option><option value="8192">8192</option><option value="16384">16384</option></select></label><label>计算资源<select value={configDraft.compute} onChange={(event) => setConfigDraft((current) => ({ ...current, compute: event.target.value }))}><option>2 × A100 80GB</option><option>4 × A100 80GB</option><option>8 × H800 80GB</option></select></label><div className="model-config-security"><UiIcon icon={ShieldCheck} /><span><strong>安全域策略</strong> 参数可见可编辑，训练数据和模型权重不可下载。</span></div><footer><button type="button" className="reuse-secondary" onClick={() => setConfigJobName(null)}>取消</button><button className="reuse-primary"><UiIcon icon={Save} />保存参数</button></footer></form></div>}
    </section>
  );
}

function ModelEvaluation({
  evaluations,
  openDialog,
  notify,
  runEvaluation,
  updateEvaluation,
}: {
  evaluations: EvaluationRow[];
  openDialog: () => void;
  notify: Notify;
  runEvaluation: (name: string) => void;
  updateEvaluation: (name: string, patch: Partial<EvaluationRow>) => void;
}) {
  const [view, setView] = useState<"综合" | "安全" | "性能">("综合");
  const [pageMode, setPageMode] = useState<"list" | "detail">("list");
  const [selectedName, setSelectedName] = useState(evaluations[0]?.name ?? "");
  const [configOpen, setConfigOpen] = useState(false);
  const [configDraft, setConfigDraft] = useState<EvaluationConfig>(defaultEvaluationConfig);
  const evaluationCountRef = useRef(evaluations.length);
  const selected = evaluations.find((item) => item.name === selectedName) ?? evaluations[0];
  const gateChecks = selected ? getEvaluationGateChecks(selected) : [];
  const gatePassed = gateChecks.filter((check) => check.passed).length;
  const metrics = useMemo(() => {
    const result = selected?.result;
    const candidate = (value: number) => result ? Math.max(0, Math.min(100, value)) : null;
    if (view === "安全") return [
      { name: "越权防护", description: "未授权请求被正确拒绝的能力", formula: "阻断越权用例 ÷ 越权用例总数", standard: "≥ 95%", baseline: 91.2, candidate: candidate((result?.safety ?? 0) - 1.2) },
      { name: "敏感内容", description: "识别并阻断敏感或违规内容", formula: "安全通过用例 ÷ 敏感用例总数", standard: `≥ ${selected?.config.safetyThreshold.toFixed(1) ?? "98.0"}%`, baseline: 95.3, candidate: candidate(result?.safety ?? 0) },
      { name: "提示注入", description: "抵御指令覆盖与提示词注入", formula: "防护成功用例 ÷ 注入用例总数", standard: "≥ 95%", baseline: 88.6, candidate: candidate((result?.safety ?? 0) - 2.1) },
      { name: "隐私保护", description: "避免输出个人信息与业务密钥", formula: "无泄露用例 ÷ 隐私用例总数", standard: "≥ 99%", baseline: 94.2, candidate: candidate((result?.safety ?? 0) - 0.5) },
      { name: "内容合规", description: "输出符合内容安全与业务规范", formula: "合规输出数 ÷ 有效输出总数", standard: "≥ 98%", baseline: 96.1, candidate: candidate((result?.safety ?? 0) + 0.2) },
    ];
    if (view === "性能") return [
      { name: "响应效率", description: "请求从接收到返回的尾部延迟", formula: "统计评测请求 P95 响应时间", standard: `≤ ${selected?.config.latencyThreshold ?? 700}ms`, baseline: 72.4, candidate: candidate(result?.performance ?? 0) },
      { name: "吞吐能力", description: "单位时间内稳定生成的 Token 数", formula: "有效生成 Token ÷ 运行秒数", standard: "≥ 1,200 tok/s", baseline: 68.7, candidate: candidate((result?.performance ?? 0) + 2.6) },
      { name: "并发稳定", description: "高并发条件下请求成功率", formula: "成功请求数 ÷ 并发请求总数", standard: "≥ 99%", baseline: 81.2, candidate: candidate((result?.performance ?? 0) + 1.3) },
      { name: "长文本处理", description: "长上下文任务的准确与完整程度", formula: "长文本有效得分的加权平均", standard: "≥ 90 分", baseline: 79.8, candidate: candidate((result?.performance ?? 0) - 0.8) },
      { name: "资源效率", description: "单位算力与显存的有效产出", formula: "吞吐量 ÷ 计算资源占用", standard: "≥ 80 分", baseline: 75.6, candidate: candidate((result?.performance ?? 0) + 0.7) },
    ];
    return [
      { name: "准确率", description: "模型给出正确结果的比例", formula: "正确结果数 ÷ 有效评测样本数", standard: "≥ 90%", baseline: 83.4, candidate: candidate((result?.quality ?? 0) - 0.4) },
      { name: "召回率", description: "目标答案与关键信息的覆盖程度", formula: "正确命中数 ÷ 应命中样本数", standard: "≥ 88%", baseline: 78.6, candidate: candidate((result?.quality ?? 0) - 2.1) },
      { name: "F1 值", description: "准确率与召回率的综合平衡", formula: "2 × 准确率 × 召回率 ÷ 二者之和", standard: `≥ ${selected?.config.scoreThreshold.toFixed(1) ?? "90.0"}`, baseline: 80.9, candidate: candidate(result?.overall ?? 0) },
      { name: "事实忠实度", description: "回答与依据材料无事实冲突", formula: "忠实回答数 ÷ 可核验回答总数", standard: "≥ 90%", baseline: 86.2, candidate: candidate((result?.quality ?? 0) + 2.3) },
      { name: "安全通过率", description: "安全测试中未触发风险行为", formula: "通过安全用例 ÷ 安全用例总数", standard: `≥ ${selected?.config.safetyThreshold.toFixed(1) ?? "98.0"}%`, baseline: 98.1, candidate: candidate(result?.safety ?? 0) },
    ];
  }, [selected, view]);

  const metricStandardExplanation = {
    综合: { title: "综合能力评测口径", scope: "任务正确性、覆盖度、事实一致性与安全性", method: "按当前评测标准对样本逐条评分后加权汇总", direction: "归一化至 0–100 分，分值越高越好" },
    安全: { title: "安全专项评测口径", scope: "越权、敏感内容、提示注入、隐私与内容合规", method: "使用对抗样本与安全规则计算用例通过率", direction: "通过率越高越好，任一红线失败即阻断发布" },
    性能: { title: "性能专项评测口径", scope: "响应延迟、吞吐、并发稳定、长文本与资源效率", method: "在统一硬件和固定并发条件下重复压测并归一化", direction: "性能得分越高越好；延迟指标数值越低越好" },
  }[view];

  useEffect(() => {
    if (evaluations.length > evaluationCountRef.current && evaluations[0]) {
      setSelectedName(evaluations[0].name);
      setView("综合");
      setPageMode("detail");
    }
    evaluationCountRef.current = evaluations.length;
  }, [evaluations]);

  function openEvaluationDetail(row: EvaluationRow) {
    setSelectedName(row.name);
    setView("综合");
    setPageMode("detail");
  }

  function openEvaluationConfig(row: EvaluationRow) {
    setSelectedName(row.name);
    setPageMode("detail");
    setConfigDraft({ ...row.config });
    setConfigOpen(true);
  }

  function saveEvaluationConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    updateEvaluation(selected.name, { config: { ...configDraft }, status: "待评测", progress: 0, score: "--", result: null });
    setConfigOpen(false);
    notify(`${selected.name} 的评测标准已保存，请重新执行评测`);
  }

  function startEvaluation(row: EvaluationRow) {
    openEvaluationDetail(row);
    runEvaluation(row.name);
  }

  function exportEvaluationReport(row: EvaluationRow) {
    if (!row.result) {
      notify("评测完成后才能导出对比报告");
      return;
    }
    const checks = getEvaluationGateChecks(row);
    const lines = [
      ["评测任务", row.name],
      ["候选模型", row.model],
      ["基线模型", row.config.baseline],
      ["评测标准", row.config.standard],
      ["评测数据", row.dataset],
      ["样本数量", row.config.sampleSize],
      ["综合得分", row.result.overall],
      ["质量得分", row.result.quality],
      ["安全通过率", `${row.result.safety}%`],
      ["性能得分", row.result.performance],
      ["P95 延迟", `${row.result.latency}ms`],
      ["门禁结果", row.status],
      ["完成时间", row.result.completedAt],
      [],
      ["门禁检查项", "要求", "实际", "结果"],
      ...checks.map((check) => [check.name, check.required, check.actual, check.passed ? "通过" : "未通过"]),
    ];
    const csv = `\uFEFF${lines.map((line) => line.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${row.name}-模型评测对比报告.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify(`${row.name} 对比报告已导出`);
  }

  if (pageMode === "list") {
    const pendingCount = evaluations.filter((item) => item.status === "待评测").length;
    const runningCount = evaluations.filter((item) => item.status === "评测中").length;
    const passedCount = evaluations.filter((item) => item.status === "通过").length;
    return (
      <section className="reuse-content-page model-eval-page evaluation-task-list-page">
        <article className="white-panel evaluation-task-home">
          <header className="evaluation-task-home-head">
            <div className="evaluation-task-title">
              <span><UiIcon icon={ClipboardCheck} size={20} /></span>
              <div><h1>模型能力评测任务</h1><p>先创建评测任务并确定候选模型、评测数据和执行标准，再进入能力对比与发布门禁页面。</p></div>
            </div>
            <button className="reuse-primary" onClick={openDialog}><UiIcon icon={Plus} />新建评测任务</button>
          </header>
          <div className="evaluation-task-steps" aria-label="评测任务操作流程">
            {["创建评测任务", "配置评测标准", "执行能力评测", "查看门禁结果"].map((item, index) => <span key={item}><b>{index + 1}</b><small>{item}</small>{index < 3 && <UiIcon icon={ChevronRight} />}</span>)}
          </div>
          <div className="evaluation-task-summary">
            <span><small>全部任务</small><strong>{evaluations.length}</strong></span>
            <span><small>待评测</small><strong>{pendingCount}</strong></span>
            <span><small>执行中</small><strong>{runningCount}</strong></span>
            <span><small>已通过</small><strong>{passedCount}</strong></span>
          </div>
          <div className="reuse-panel-head evaluation-task-table-head">
            <div><h2>评测任务列表</h2><p>选择已有任务查看详情，或创建一项新的模型评测任务</p></div>
          </div>
          <div className="reuse-table-wrap">
            <table className="reuse-table evaluation-task-table">
              <thead><tr><th>评测任务</th><th>候选模型</th><th>评测数据</th><th>评测标准</th><th>综合得分</th><th>创建时间</th><th>门禁结果</th><th>操作</th></tr></thead>
              <tbody>
                {evaluations.map((row) => (
                  <tr key={row.name}>
                    <td><button className="reuse-link evaluation-task-name" onClick={() => openEvaluationDetail(row)}>{row.name}</button></td>
                    <td>{row.model}</td><td>{row.dataset}</td><td>{row.config.standard}</td><td><strong>{row.score}</strong></td><td>{row.date}</td>
                    <td><Status tone={row.status === "通过" ? "green" : row.status === "未通过" ? "orange" : row.status === "评测中" ? "blue" : "gray"}>{row.status}</Status>{row.status === "评测中" && <small className="table-progress">{row.progress}%</small>}</td>
                    <td><button className="reuse-link" onClick={() => openEvaluationDetail(row)}>查看详情</button>{" "}<button className="reuse-link" onClick={() => openEvaluationConfig(row)}>配置</button>{" "}{row.status !== "评测中" && <button className="reuse-link" onClick={() => startEvaluation(row)}>{row.result ? "重新评测" : "开始评测"}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {evaluations.length === 0 && <div className="evaluation-task-empty"><span><UiIcon icon={ClipboardCheck} size={24} /></span><strong>尚未建立评测任务</strong><p>点击“新建评测任务”，完成模型、数据集和评测标准配置后进入评测详情。</p><button className="reuse-primary" onClick={openDialog}><UiIcon icon={Plus} />新建评测任务</button></div>}
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="reuse-content-page model-eval-page">
      <div className="evaluation-detail-nav"><button onClick={() => { setConfigOpen(false); setPageMode("list"); }}><UiIcon icon={ArrowLeft} />返回评测任务</button><span>{selected?.name}</span></div>
      <article className="white-panel evaluation-overview">
        <div className="evaluation-overview-main">
          <div>
            <p>评测任务 · {selected?.date}</p>
            <h2>{selected?.model} <span>对比</span> {selected?.config.baseline}</h2>
            <small>{selected?.dataset} · {selected?.config.sampleSize.toLocaleString()} 条样本 · {selected?.config.mode}</small>
          </div>
          <div className="evaluation-overview-actions">
            {selected && <><button className="reuse-secondary" onClick={() => openEvaluationConfig(selected)}><UiIcon icon={Settings2} />评测标准</button>
            <button className="reuse-secondary" disabled={!selected.result} onClick={() => exportEvaluationReport(selected)}><UiIcon icon={Download} />导出报告</button>
            <button className="reuse-primary" disabled={selected.status === "评测中"} onClick={() => startEvaluation(selected)}><UiIcon icon={Play} />{selected.status === "评测中" ? "评测执行中" : selected.result ? "重新评测" : "开始评测"}</button></>}
          </div>
        </div>
        {selected && <div className="evaluation-standard-strip">
          <span><small>执行标准</small><strong>{selected.config.standard}</strong></span>
          <span><small>综合阈值</small><strong>≥ {selected.config.scoreThreshold.toFixed(1)}</strong></span>
          <span><small>安全阈值</small><strong>≥ {selected.config.safetyThreshold.toFixed(1)}%</strong></span>
          <span><small>延迟阈值</small><strong>≤ {selected.config.latencyThreshold}ms</strong></span>
          <span><small>当前得分</small><strong>{selected.score}</strong></span>
          <div className={`gate-pass ${selected.status !== "通过" ? "waiting" : ""}`}>
            <span>发布门禁</span><strong>{selected.status}</strong><small>{selected.result ? `${gatePassed} / 5 检查项通过` : "等待评测任务完成"}</small>
          </div>
        </div>}
        {selected?.status === "评测中" && <div className="evaluation-progress-strip"><span>正在执行评测用例</span><Progress value={selected.progress} /><strong>{selected.progress}%</strong><small>完成后自动判定发布门禁</small></div>}
      </article>
      <div className="model-eval-grid">
        <article className="white-panel metric-panel">
          <div className="reuse-panel-head small">
            <div><h2>能力指标对比</h2><p>灰色为基线模型，蓝色为候选模型</p></div>
            <div className="eval-switch">
              {(["综合", "安全", "性能"] as const).map((item) => (
                <button className={view === item ? "active" : ""} key={item} onClick={() => setView(item)}>{item}</button>
              ))}
            </div>
          </div>
          <div className="evaluation-metric-standard">
            <span><UiIcon icon={ScrollText} size={17} /></span>
            <div><strong>{metricStandardExplanation.title}</strong><p>{metricStandardExplanation.scope}</p></div>
            <dl><div><dt>统计口径</dt><dd>{metricStandardExplanation.method}</dd></div><div><dt>判定方向</dt><dd>{metricStandardExplanation.direction}</dd></div></dl>
          </div>
          <div className="evaluation-metric-columns"><span>指标与定义</span><span>得分对比</span><span>基线</span><span>候选</span><span>达标标准</span></div>
          {metrics.map((metric) => (
            <div className="eval-metric-row" key={metric.name} title={`${metric.description}；计算方式：${metric.formula}`}>
              <div className="eval-metric-name"><strong>{metric.name}</strong><small>{metric.description}</small><em>{metric.formula}</em></div>
              <div><i className="base" style={{ width: `${metric.baseline}%` }} /><i className="candidate" style={{ width: `${metric.candidate ?? 0}%` }} /></div>
              <span>{metric.baseline.toFixed(1)}</span><b>{metric.candidate?.toFixed(1) ?? "--"}</b><mark>{metric.standard}</mark>
            </div>
          ))}
        </article>
        <article className="white-panel gate-panel">
          <div className="reuse-panel-head small"><div><h2>发布门禁判定</h2><p>{selected?.config.standard}</p></div><Status tone={selected?.status === "通过" ? "green" : selected?.status === "未通过" ? "orange" : selected?.status === "评测中" ? "blue" : "gray"}>{selected?.status ?? "待评测"}</Status></div>
          <div className="gate-check-list">
            {gateChecks.map((check) => <div className={`gate-check-row ${selected?.result ? check.passed ? "passed" : "failed" : "pending"}`} key={check.name}><span><UiIcon icon={selected?.result ? check.passed ? CircleCheck : TriangleAlert : CalendarClock} /></span><div><strong>{check.name}</strong><small>要求 {check.required}</small></div><b>{check.actual}</b></div>)}
          </div>
          <div className="evaluation-test-summary">
            {["功能测试", "性能测试", "安全测试", "鲁棒性测试"].map((name, index) => <button key={name} onClick={() => notify(`${name}详情已定位到当前评测记录`)}><UiIcon icon={[ClipboardCheck, Gauge, ShieldCheck, CircleCheck][index]} /><span>{name}<small>{selected?.result ? ["48 / 48", `P95 ${selected.result.latency}ms`, `${selected.config.sampleSize.toLocaleString()} 条`, `${selected.result.quality.toFixed(1)} 分`][index] : "等待执行"}</small></span></button>)}
          </div>
        </article>
      </div>
      {configOpen && selected && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="关闭评测标准配置" onClick={() => setConfigOpen(false)} /><form className="reuse-dialog evaluation-config-dialog" onSubmit={saveEvaluationConfig}><header><div><h2>评测标准配置</h2><p>{selected.name} · 保存后需要重新执行评测</p></div><button type="button" aria-label="关闭评测标准配置" onClick={() => setConfigOpen(false)}><UiIcon icon={X} /></button></header><label>标准模板<select value={configDraft.standard} onChange={(event) => setConfigDraft((current) => ({ ...current, standard: event.target.value }))}><option>模型上线标准 v3.2</option><option>RAG 效果标准 v2.4</option><option>多模态安全标准 v1.8</option><option>高并发服务标准 v2.1</option></select></label><label>基线模型<select value={configDraft.baseline} onChange={(event) => setConfigDraft((current) => ({ ...current, baseline: event.target.value }))}><option>qwen3-8b-base</option><option>service-rag-v3.2</option><option>qwen2.5-vl-7b</option><option>finance-assistant-v2.1</option></select></label><label>评测样本量<input type="number" min="500" max="10000" step="100" value={configDraft.sampleSize} onChange={(event) => setConfigDraft((current) => ({ ...current, sampleSize: Number(event.target.value) }))} /></label><label>综合得分阈值<input type="number" min="60" max="100" step="0.1" value={configDraft.scoreThreshold} onChange={(event) => setConfigDraft((current) => ({ ...current, scoreThreshold: Number(event.target.value) }))} /></label><label>安全通过率阈值<input type="number" min="80" max="100" step="0.1" value={configDraft.safetyThreshold} onChange={(event) => setConfigDraft((current) => ({ ...current, safetyThreshold: Number(event.target.value) }))} /></label><label>P95 延迟阈值（ms）<input type="number" min="100" max="5000" step="10" value={configDraft.latencyThreshold} onChange={(event) => setConfigDraft((current) => ({ ...current, latencyThreshold: Number(event.target.value) }))} /></label><label>评测方式<select value={configDraft.mode} onChange={(event) => setConfigDraft((current) => ({ ...current, mode: event.target.value }))}><option>双盲评测</option><option>自动评测</option><option>自动 + 人工复核</option></select></label><div className="evaluation-config-note"><UiIcon icon={ShieldCheck} /><span><strong>门禁策略</strong> 所有检查项必须同时通过；任一指标未达阈值，候选模型将被阻止发布。</span></div><footer><button type="button" className="reuse-secondary" onClick={() => setConfigOpen(false)}>取消</button><button className="reuse-primary"><UiIcon icon={Save} />保存评测标准</button></footer></form></div>}
    </section>
  );
}

function PlatformManagement({
  view,
  messages,
  auditLogs,
  roles,
  users,
  activeRoleId,
  persistenceReady,
  lastSavedAt,
  storageBytes,
  recordCounts,
  notify,
  openModule,
  markMessageRead,
  markAllMessagesRead,
  updateRolePermission,
  addRole,
  updateUserRole,
  toggleUserStatus,
  exportLocalBackup,
  importLocalBackup,
  clearLocalBackup,
}: {
  view: AdminView;
  messages: PlatformMessage[];
  auditLogs: AuditLogRow[];
  roles: PlatformRole[];
  users: PlatformUser[];
  activeRoleId: string;
  persistenceReady: boolean;
  lastSavedAt: string;
  storageBytes: number;
  recordCounts: Array<{ name: string; count: number; description: string }>;
  notify: Notify;
  openModule: (id: ModuleId, label?: string) => void;
  markMessageRead: (id: string) => void;
  markAllMessagesRead: () => void;
  updateRolePermission: (roleId: string, moduleId: ModuleId, level: PermissionLevel) => void;
  addRole: () => void;
  updateUserRole: (userId: string, roleId: string) => void;
  toggleUserStatus: (userId: string) => void;
  exportLocalBackup: () => void;
  importLocalBackup: (file: File) => void;
  clearLocalBackup: () => void;
}) {
  const [messageFilter, setMessageFilter] = useState<"全部" | PlatformMessage["category"] | "未读">("全部");
  const [auditQuery, setAuditQuery] = useState("");
  const [auditModule, setAuditModule] = useState("全部模块");
  const [selectedAudit, setSelectedAudit] = useState<AuditLogRow | null>(null);
  const [permissionView, setPermissionView] = useState<"角色权限" | "成员账号">("角色权限");
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? "");
  const [resetConfirm, setResetConfirm] = useState(false);
  const backupInput = useRef<HTMLInputElement>(null);
  const currentRole = roles.find((role) => role.id === activeRoleId) ?? roles[0];
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0];
  const canManage = currentRole?.permissions.admin === "管理";
  const unreadCount = messages.filter((message) => !message.read).length;
  const visibleMessages = messages.filter((message) => messageFilter === "全部" || messageFilter === "未读" ? messageFilter === "全部" || !message.read : message.category === messageFilter);
  const visibleAudits = auditLogs.filter((log) => {
    const matchesModule = auditModule === "全部模块" || log.module === auditModule;
    const text = `${log.user}${log.module}${log.action}${log.target}${log.detail}`.toLowerCase();
    return matchesModule && text.includes(auditQuery.toLowerCase());
  });
  const viewMeta: Record<AdminView, { title: string; description: string; icon: LucideIcon }> = {
    messages: { title: "全局消息", description: "集中查看质量、治理、模型与系统通知", icon: MessageSquare },
    audit: { title: "审计日志", description: "追踪平台关键操作、执行结果和访问来源", icon: ScrollText },
    permissions: { title: "权限控制", description: "按角色配置模块访问范围与操作级别", icon: UserCog },
    storage: { title: "本地持久化", description: "管理本机数据库中的平台数据、备份和恢复", icon: HardDrive },
  };
  const meta = viewMeta[view];
  const permissionModules = modules.map((item) => ({ id: item.id, label: item.label, icon: item.icon }));

  function exportAuditLogs() {
    const lines = [["时间", "用户", "模块", "操作", "对象", "结果", "详情", "来源地址"], ...visibleAudits.map((log) => [log.time, log.user, log.module, log.action, log.target, log.result, log.detail, log.address])];
    const csv = `\uFEFF${lines.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "平台审计日志.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    notify(`已导出 ${visibleAudits.length} 条审计日志`);
  }

  return (
    <section className="reuse-content-page admin-management-page">
      <header className="white-panel admin-page-head">
        <div><span><UiIcon icon={meta.icon} size={18} /></span><div><h1>{meta.title}</h1><p>{meta.description}</p></div></div>
        <label>登录角色<select value={activeRoleId} disabled aria-label="登录角色">{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
      </header>

      {view === "messages" && <>
        <div className="admin-summary-strip message-summary-strip"><span><small>全部消息</small><strong>{messages.length}</strong></span><span><small>未读消息</small><strong>{unreadCount}</strong></span><span><small>重要及紧急</small><strong>{messages.filter((message) => message.level !== "普通").length}</strong></span><span><small>今日更新</small><strong>{messages.filter((message) => !message.time.includes("昨天")).length}</strong></span><button className="reuse-secondary" disabled={!unreadCount} onClick={() => { markAllMessagesRead(); notify("全部消息已标记为已读"); }}><UiIcon icon={CircleCheck} />全部已读</button></div>
        <article className="white-panel admin-list-panel">
          <div className="admin-list-toolbar"><div className="admin-filter-tabs">{(["全部", "未读", "质量", "治理", "模型", "系统"] as const).map((item) => <button className={messageFilter === item ? "active" : ""} key={item} onClick={() => setMessageFilter(item)}>{item}<b>{item === "全部" ? messages.length : item === "未读" ? unreadCount : messages.filter((message) => message.category === item).length}</b></button>)}</div><span>消息保存于本机数据库</span></div>
          <div className="global-message-list">{visibleMessages.map((message) => <div className={message.read ? "read" : "unread"} key={message.id}><span className={`message-category ${message.category}`}>{message.category.slice(0, 1)}</span><button onClick={() => markMessageRead(message.id)}><strong>{message.title}{message.level !== "普通" && <em className={message.level}>{message.level}</em>}</strong><p>{message.detail}</p><small>{message.time}</small></button><div><Status tone={message.read ? "gray" : "blue"}>{message.read ? "已读" : "未读"}</Status><button className="reuse-link" onClick={() => { markMessageRead(message.id); openModule(message.module); }}>查看业务</button></div></div>)}</div>
          {!visibleMessages.length && <div className="admin-empty-state"><UiIcon icon={MessageSquare} size={22} /><strong>当前筛选下没有消息</strong><p>新的任务状态和平台事件会显示在这里。</p></div>}
        </article>
      </>}

      {view === "audit" && <article className="white-panel admin-list-panel audit-panel">
        <div className="admin-list-toolbar"><div className="admin-search-group"><label><UiIcon icon={Search} /><input value={auditQuery} onChange={(event) => setAuditQuery(event.target.value)} placeholder="搜索用户、操作或对象" /></label><select value={auditModule} onChange={(event) => setAuditModule(event.target.value)}><option>全部模块</option>{Array.from(new Set(auditLogs.map((log) => log.module))).map((moduleName) => <option key={moduleName}>{moduleName}</option>)}</select></div><button className="reuse-secondary" onClick={exportAuditLogs}><UiIcon icon={Download} />导出日志</button></div>
        <div className="audit-stat-strip"><span><small>操作总量</small><strong>{auditLogs.length}</strong></span><span><small>成功操作</small><strong>{auditLogs.filter((log) => log.result === "成功").length}</strong></span><span><small>失败操作</small><strong>{auditLogs.filter((log) => log.result === "失败").length}</strong></span><span><small>活跃用户</small><strong>{new Set(auditLogs.map((log) => log.user)).size}</strong></span></div>
        <div className="reuse-table-wrap"><table className="reuse-table audit-table"><thead><tr><th>操作时间</th><th>操作用户</th><th>业务模块</th><th>操作类型</th><th>操作对象</th><th>结果</th><th>来源地址</th><th>详情</th></tr></thead><tbody>{visibleAudits.map((log) => <tr key={log.id}><td>{log.time}</td><td><strong>{log.user}</strong></td><td>{log.module}</td><td>{log.action}</td><td>{log.target}</td><td><Status tone={log.result === "成功" ? "green" : "orange"}>{log.result}</Status></td><td>{log.address}</td><td><button className="reuse-link" onClick={() => setSelectedAudit(log)}><UiIcon icon={Eye} />查看</button></td></tr>)}</tbody></table></div>
        {selectedAudit && <aside className="audit-detail-drawer"><header><div><span>审计详情</span><strong>{selectedAudit.action}</strong></div><button aria-label="关闭审计详情" onClick={() => setSelectedAudit(null)}><UiIcon icon={X} /></button></header><dl><dt>操作时间</dt><dd>{selectedAudit.time}</dd><dt>操作用户</dt><dd>{selectedAudit.user}</dd><dt>业务模块</dt><dd>{selectedAudit.module}</dd><dt>操作对象</dt><dd>{selectedAudit.target}</dd><dt>执行结果</dt><dd><Status tone={selectedAudit.result === "成功" ? "green" : "orange"}>{selectedAudit.result}</Status></dd><dt>来源地址</dt><dd>{selectedAudit.address}</dd><dt>操作说明</dt><dd>{selectedAudit.detail}</dd></dl><footer><button className="reuse-secondary" onClick={() => setSelectedAudit(null)}>关闭</button></footer></aside>}
      </article>}

      {view === "permissions" && <article className="white-panel permission-panel">
        <div className="admin-list-toolbar"><div className="admin-filter-tabs">{(["角色权限", "成员账号"] as const).map((item) => <button className={permissionView === item ? "active" : ""} key={item} onClick={() => setPermissionView(item)}>{item}</button>)}</div><span><UiIcon icon={KeyRound} />当前身份：{currentRole?.name} · {canManage ? "可编辑权限" : "只读查看"}</span></div>
        {permissionView === "角色权限" && <div className="permission-layout"><aside className="role-list"><header><strong>平台角色</strong><button disabled={!canManage} onClick={addRole} aria-label="新增角色"><UiIcon icon={Plus} /></button></header>{roles.map((role) => <button className={selectedRole?.id === role.id ? "active" : ""} key={role.id} onClick={() => setSelectedRoleId(role.id)}><span><UiIcon icon={role.id === "role-admin" ? ShieldCheck : Users} /></span><div><strong>{role.name}</strong><small>{role.members} 名成员</small></div><UiIcon icon={ChevronRight} /></button>)}</aside><section className="permission-matrix"><header><div><h2>{selectedRole?.name}</h2><p>{selectedRole?.description}</p></div><Status tone={canManage ? "green" : "gray"}>{canManage ? "可编辑" : "只读"}</Status></header><table><thead><tr><th>功能模块</th><th>无权限</th><th>只读</th><th>管理</th><th>当前范围</th></tr></thead><tbody>{selectedRole && permissionModules.map((moduleItem) => <tr key={moduleItem.id}><td><span><UiIcon icon={moduleItem.icon} /></span><strong>{moduleItem.label}</strong></td>{(["无权限", "只读", "管理"] as const).map((level) => <td key={level}><input type="radio" name={`${selectedRole.id}-${moduleItem.id}`} checked={selectedRole.permissions[moduleItem.id] === level} disabled={!canManage || selectedRole.id === "role-admin" && moduleItem.id === "admin"} onChange={() => updateRolePermission(selectedRole.id, moduleItem.id, level)} aria-label={`${moduleItem.label}${level}`} /></td>)}<td><Status tone={selectedRole.permissions[moduleItem.id] === "管理" ? "green" : selectedRole.permissions[moduleItem.id] === "只读" ? "blue" : "gray"}>{selectedRole.permissions[moduleItem.id]}</Status></td></tr>)}</tbody></table></section></div>}
        {permissionView === "成员账号" && <div className="user-management"><div className="user-management-head"><div><h2>成员账号</h2><p>角色调整和账号状态会立即写入本地权限配置</p></div><button className="reuse-primary" disabled={!canManage} onClick={() => notify("本地演示环境通过导入成员清单新增账号")}><UiIcon icon={UserPlus} />新增成员</button></div><div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>成员</th><th>账号</th><th>所属部门</th><th>角色</th><th>状态</th><th>最近登录</th><th>操作</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.name}</strong></td><td>{user.account}</td><td>{user.department}</td><td><select value={user.roleId} disabled={!canManage || user.id === "user-01"} onChange={(event) => updateUserRole(user.id, event.target.value)}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></td><td><Status tone={user.status === "正常" ? "green" : "gray"}>{user.status}</Status></td><td>{user.lastLogin}</td><td><button className="reuse-link" disabled={!canManage || user.id === "user-01"} onClick={() => toggleUserStatus(user.id)}>{user.status === "正常" ? "停用" : "启用"}</button></td></tr>)}</tbody></table></div></div>}
      </article>}

      {view === "storage" && <>
        <div className="admin-summary-strip storage-summary-strip"><span><small>持久化状态</small><strong>{persistenceReady ? "已启用" : "初始化中"}</strong></span><span><small>保存位置</small><strong>本机数据库</strong></span><span><small>快照大小</small><strong>{(storageBytes / 1024).toFixed(1)} KB</strong></span><span><small>最近保存</small><strong>{lastSavedAt}</strong></span><Status tone={persistenceReady ? "green" : "blue"}>{persistenceReady ? "自动保存中" : "正在连接"}</Status></div>
        <div className="storage-management-grid"><article className="white-panel storage-data-panel"><header className="decision-section-head"><div><h2>本地数据清单</h2><p>以下数据会在刷新或重新打开页面后恢复</p></div><UiIcon icon={HardDrive} /></header><div className="storage-record-list">{recordCounts.map((record) => <div key={record.name}><span><UiIcon icon={Database} /></span><div><strong>{record.name}</strong><small>{record.description}</small></div><b>{record.count}</b></div>)}</div></article><article className="white-panel storage-action-panel"><header className="decision-section-head"><div><h2>备份与恢复</h2><p>备份文件仅包含本地平台配置和演示数据</p></div><UiIcon icon={RotateCcw} /></header><button onClick={exportLocalBackup}><span><UiIcon icon={FileDown} /></span><div><strong>导出本地备份</strong><small>生成 JSON 文件，用于迁移或归档</small></div><UiIcon icon={ChevronRight} /></button><button onClick={() => backupInput.current?.click()}><span><UiIcon icon={FileUp} /></span><div><strong>导入本地备份</strong><small>校验版本后覆盖当前浏览器数据</small></div><UiIcon icon={ChevronRight} /></button><input ref={backupInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) importLocalBackup(file); event.target.value = ""; }} /><button className="danger" onClick={() => setResetConfirm(true)}><span><UiIcon icon={Trash2} /></span><div><strong>清除本地数据</strong><small>恢复平台预置演示数据，不影响程序文件</small></div><UiIcon icon={ChevronRight} /></button></article></div>
        <article className="white-panel storage-policy-panel"><header><UiIcon icon={ShieldCheck} /><div><strong>本地持久化策略</strong><p>当前平台按照本地化部署要求，将业务状态写入服务端本机数据库；同一部署中的授权账号共享业务快照，数据不会自动上传到外部云端。</p></div></header><div><span>自动保存</span><strong>每次业务变更后写入数据库</strong><span>恢复策略</span><strong>登录后读取最后一次完整快照</strong><span>数据范围</span><strong>项目、任务、消息、日志、权限与风险处置</strong></div></article>
        {resetConfirm && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="取消清除本地数据" onClick={() => setResetConfirm(false)} /><div className="reuse-dialog local-reset-dialog"><header><div><h2>确认清除本地数据</h2><p>此操作会移除本机数据库保存的共享业务状态</p></div><button aria-label="关闭确认框" onClick={() => setResetConfirm(false)}><UiIcon icon={X} /></button></header><div><span><UiIcon icon={TriangleAlert} size={22} /></span><p>清除后平台将恢复预置演示数据。建议先导出备份，以便需要时恢复。</p></div><footer><button className="reuse-secondary" onClick={() => setResetConfirm(false)}>取消</button><button className="reuse-primary danger-button" onClick={async () => { await clearLocalBackup(); setResetConfirm(false); }}>确认清除</button></footer></div></div>}
      </>}
    </section>
  );
}

function CreateDialog({
  id,
  preset,
  onClose,
  onCreated,
}: {
  id: Exclude<DialogId, null>;
  preset: string;
  onClose: () => void;
  onCreated: (payload: CreatePayload) => void;
}) {
  const defaultOption =
    preset ||
    (id === "assessment"
      ? "多模态审查"
      : id === "model"
        ? "大模型微调训练"
        : id === "connection"
          ? "MySQL"
          : id === "project"
            ? "普通项目"
            : "综合能力评测");
  const defaultAssessmentProfile = assessmentTaskProfiles[defaultOption as AssessmentTaskMode] ?? assessmentTaskProfiles.多模态审查;
  const [name, setName] = useState("");
  const [option, setOption] = useState(defaultOption);
  const [model, setModel] = useState(id === "evaluation" ? "finance-assistant-v2.3" : "Qwen3-8B");
  const [dataset, setDataset] = useState(id === "evaluation" ? "金融问答评测集 v4.2" : id === "assessment" ? defaultAssessmentProfile.datasets[0] : "金融年报问答集 v2.1");
  const [assessmentStandard, setAssessmentStandard] = useState(defaultAssessmentProfile.standards[0]);
  const [assessmentExtra, setAssessmentExtra] = useState(defaultAssessmentProfile.extras[0]);
  const [baseline, setBaseline] = useState("qwen3-8b-base");
  const [evaluationStandard, setEvaluationStandard] = useState("模型上线标准 v3.2");
  const [evaluationMode, setEvaluationMode] = useState("双盲评测");
  const [evaluationSampleSize, setEvaluationSampleSize] = useState(2000);
  const [saving, setSaving] = useState(false);
  const [connectionAddress, setConnectionAddress] = useState("");
  const [connectionStrategy, setConnectionStrategy] = useState("手动触发");
  const [connectionTest, setConnectionTest] = useState<"idle" | "testing" | "success" | "error">("idle");

  const titles: Record<Exclude<DialogId, null>, [string, string]> = {
    assessment: ["添加审查任务", "复用原平台数据审查流程"],
    model: ["新建模型开发任务", "任务将在可用不可见安全域运行"],
    connection: ["新建数据连接", "连接信息仅用于当前本地演示"],
    project: ["新建治理项目", "创建项目后可进入 ETL 工作间"],
    evaluation: ["新建评测任务", "模型版本需通过评测门禁后发布"],
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (id === "connection" && connectionTest !== "success") return;
    setSaving(true);
    window.setTimeout(() => onCreated({ kind: id, name, option, model, dataset, baseline, standard: id === "assessment" ? assessmentStandard : evaluationStandard, mode: id === "assessment" ? assessmentExtra : evaluationMode, sampleSize: evaluationSampleSize, endpoint: connectionAddress, strategy: connectionStrategy }), 520);
  }

  function changeAssessmentMode(mode: AssessmentTaskMode) {
    const profile = assessmentTaskProfiles[mode];
    setOption(mode);
    setDataset(profile.datasets[0]);
    setAssessmentStandard(profile.standards[0]);
    setAssessmentExtra(profile.extras[0]);
  }

  function testDraftConnection() {
    if (!connectionAddress.trim()) {
      setConnectionTest("error");
      return;
    }
    setConnectionTest("testing");
    window.setTimeout(() => {
      setConnectionTest(connectionAddress.toLowerCase().includes("invalid") ? "error" : "success");
    }, 700);
  }

  return (
    <div className="dialog-backdrop">
      <button className="dialog-dismiss" aria-label="关闭弹窗" onClick={onClose} />
      <form className={`reuse-dialog ${id === "evaluation" ? "evaluation-create-dialog" : ""}`} onSubmit={submit}>
        <header>
          <div><h2>{titles[id][0]}</h2><p>{titles[id][1]}</p></div>
          <button type="button" aria-label="关闭创建窗口" onClick={onClose}><UiIcon icon={X} /></button>
        </header>
        <label>
          {id === "connection" ? "连接名称" : id === "project" ? "项目名称" : "任务名称"}
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={id === "assessment" ? "请输入审查任务名称" : id === "model" ? "例如：finance-sft-lora-08" : id === "evaluation" ? "例如：金融助手 v2.4 发布评测" : "请输入名称"}
          />
        </label>
        {id === "assessment" && (
          <>
            <div className="dialog-tabs">
              {(["语句文件", "自定义审查", "多模态审查"] as AssessmentTaskMode[]).map((item) => (
                <button type="button" className={option === item ? "active" : ""} key={item} onClick={() => changeAssessmentMode(item)}>{item}</button>
              ))}
            </div>
            {(() => { const profile = assessmentTaskProfiles[option as AssessmentTaskMode] ?? assessmentTaskProfiles.多模态审查; return <>
              <div className="assessment-create-mode"><span>{option === "语句文件" ? <UiIcon icon={FileText} size={18} /> : option === "自定义审查" ? <UiIcon icon={SlidersHorizontal} size={18} /> : <UiIcon icon={Layers3} size={18} />}</span><div><strong>{profile.title}</strong><p>{profile.description}</p><small>{profile.tags.map((tag) => <b key={tag}>{tag}</b>)}</small></div></div>
              <label>{profile.datasetLabel}<select value={dataset} onChange={(event) => setDataset(event.target.value)}>{profile.datasets.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>{profile.standardLabel}<select value={assessmentStandard} onChange={(event) => setAssessmentStandard(event.target.value)}>{profile.standards.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>{profile.extraLabel}<select value={assessmentExtra} onChange={(event) => setAssessmentExtra(event.target.value)}>{profile.extras.map((item) => <option key={item}>{item}</option>)}</select></label>
            </>; })()}
          </>
        )}
        {id === "model" && (
          <>
            <label>开发方式<select value={option} onChange={(event) => setOption(event.target.value)}><option>大模型微调训练</option><option>大模型 RAG 增强</option><option>大模型蒸馏轻量化</option><option>模型注册</option></select></label>
            <label>基础模型<select value={model} onChange={(event) => setModel(event.target.value)}><option>Qwen3-8B</option><option>Qwen2.5-VL</option><option>BGE-M3</option></select></label>
            <label>训练数据版本<select value={dataset} onChange={(event) => setDataset(event.target.value)}><option>金融年报问答集 v2.1</option><option>篮球图像数据集 v1.3</option></select></label>
            <div className="dialog-security"><span>◆</span><p><strong>安全域策略已启用</strong><br />模型权重、训练数据和运行密钥不可下载。</p></div>
          </>
        )}
        {id === "connection" && (
          <>
            <label>连接类型<select value={option} onChange={(event) => { setOption(event.target.value); setConnectionTest("idle"); }}><option>MySQL</option><option>PostgreSQL</option><option>SFTP</option><option>REST API</option><option>本地文件</option></select></label>
            <label>连接地址<input required value={connectionAddress} onChange={(event) => { setConnectionAddress(event.target.value); setConnectionTest("idle"); }} placeholder={option === "本地文件" ? "例如：/data/datasets" : option === "REST API" ? "例如：https://api.example/v1" : "例如：127.0.0.1:3306"} /></label>
            <label>同步策略<select value={connectionStrategy} onChange={(event) => setConnectionStrategy(event.target.value)}><option>手动触发</option><option>每 30 分钟</option><option>每日 02:00</option><option>准实时</option></select></label>
            <div className={`connection-check ${connectionTest}`}><span>{connectionTest === "testing" ? "…" : connectionTest === "success" ? "✓" : connectionTest === "error" ? "!" : "○"}</span><p><strong>{connectionTest === "testing" ? "正在测试连接" : connectionTest === "success" ? "连接与权限验证通过" : connectionTest === "error" ? "连接验证失败" : "保存前需要验证连接"}</strong><br />{connectionTest === "success" ? "网络可达、身份凭据有效，并满足最小读取权限。" : connectionTest === "error" ? "请填写有效地址；地址中包含 invalid 时会模拟失败。" : "将检查网络可达性、身份凭据和最小权限。"}</p><button type="button" disabled={connectionTest === "testing"} onClick={testDraftConnection}>{connectionTest === "testing" ? "测试中..." : connectionTest === "success" ? "重新测试" : "测试连接"}</button></div>
          </>
        )}
        {id === "project" && (
          <>
            <label>项目类型<select value={option} onChange={(event) => setOption(event.target.value)}><option>普通项目</option><option>治理模板项目</option></select></label>
            <label>项目说明<input placeholder="请输入项目用途（可选）" /></label>
          </>
        )}
        {id === "evaluation" && (
          <>
            <label>评测类型<select value={option} onChange={(event) => { const value = event.target.value; setOption(value); setEvaluationStandard(value === "安全专项评测" ? "多模态安全标准 v1.8" : value === "性能专项评测" ? "高并发服务标准 v2.1" : "模型上线标准 v3.2"); }}><option>综合能力评测</option><option>安全专项评测</option><option>性能专项评测</option></select></label>
            <label>候选模型<select value={model} onChange={(event) => setModel(event.target.value)}><option>finance-assistant-v2.3</option><option>service-rag-v3.4</option><option>vision-agent-v1.8</option></select></label>
            <label>基线模型<select value={baseline} onChange={(event) => setBaseline(event.target.value)}><option>qwen3-8b-base</option><option>service-rag-v3.2</option><option>qwen2.5-vl-7b</option><option>finance-assistant-v2.1</option></select></label>
            <label>评测数据<select value={dataset} onChange={(event) => setDataset(event.target.value)}><option>金融问答评测集 v4.2</option><option>客服检索评测集 v3</option><option>多模态安全集 v2</option></select></label>
            <label>评测标准<select value={evaluationStandard} onChange={(event) => setEvaluationStandard(event.target.value)}><option>模型上线标准 v3.2</option><option>RAG 效果标准 v2.4</option><option>多模态安全标准 v1.8</option><option>高并发服务标准 v2.1</option></select></label>
            <label>样本数量<input type="number" min="500" max="10000" step="100" value={evaluationSampleSize} onChange={(event) => setEvaluationSampleSize(Number(event.target.value))} /></label>
            <label>运行方式<select value={evaluationMode} onChange={(event) => setEvaluationMode(event.target.value)}><option>双盲评测</option><option>自动评测</option><option>自动 + 人工复核</option></select></label>
            <div className="evaluation-create-note"><UiIcon icon={ShieldCheck} /><span><strong>发布门禁自动关联</strong> 创建后任务处于“待评测”状态；执行完成后将按所选标准判断模型是否允许发布。</span></div>
          </>
        )}
        <footer>
          <button type="button" className="reuse-secondary" onClick={onClose}>取消</button>
          <button className="reuse-primary" disabled={saving || (id === "connection" && connectionTest !== "success")}>{saving ? "创建中..." : id === "connection" ? "保存连接" : id === "evaluation" ? "创建评测任务" : "确定"}</button>
        </footer>
      </form>
    </div>
  );
}

function LogDrawer({ job, onClose }: { job: JobRow; onClose: () => void }) {
  const logs = [
    `[00:00:01] 已加载安全域运行环境：${job.model}`,
    `[00:00:04] 数据集校验通过：${job.dataset}`,
    "[00:00:12] 可用不可见策略已生效，下载能力已关闭",
    `[00:03:28] 当前运行进度 ${job.progress}%` ,
    job.status === "已完成" ? "[00:16:42] 任务完成，模型版本已写入注册表" : "[00:03:29] 正在等待下一批次指标...",
  ];
  return (
    <aside className="log-drawer">
      <header><div><span>实时日志</span><strong>{job.name}</strong></div><button aria-label="关闭实时日志" onClick={onClose}><UiIcon icon={X} /></button></header>
      <div className="log-meta"><Status tone={job.status === "已完成" ? "green" : "blue"}>{job.status}</Status><span>{job.model}</span><span>{job.progress}%</span></div>
      <pre>{logs.join("\n\n")}</pre>
      <footer><span className="live-dot" />日志自动刷新中<button className="reuse-secondary" onClick={onClose}>关闭</button></footer>
    </aside>
  );
}

export default function Home() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [active, setActive] = useState<ModuleId>("home");
  const [tabs, setTabs] = useState<Array<{ id: ModuleId; label: string }>>([{ id: "home", label: "首页" }]);
  const [menuOpen, setMenuOpen] = useState<ModuleId | null>(null);
  const [project, setProject] = useState("高质量数据集评估演示");
  const [dialog, setDialog] = useState<DialogId>(null);
  const [dialogPreset, setDialogPreset] = useState("");
  const [toast, setToast] = useState("");
  const [assistant, setAssistant] = useState(false);
  const [topPanel, setTopPanel] = useState<TopPanelId>(null);
  const [adminView, setAdminView] = useState<AdminView>("messages");
  const [compact, setCompact] = useState(false);
  const [projects, setProjects] = useState(initialProjects);
  const [workspaceProject, setWorkspaceProject] = useState<ProjectRow | null>(null);
  const [governanceView, setGovernanceView] = useState<GovernanceView>("projects");
  const [sources, setSources] = useState(initialSources);
  const [cleaningTasks, setCleaningTasks] = useState(initialCleaningTasks);
  const [reviewTasks, setReviewTasks] = useState(initialReviewTasks);
  const [jobs, setJobs] = useState(initialJobs);
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [messages, setMessages] = useState(initialMessages);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [roles, setRoles] = useState(initialRoles);
  const [users, setUsers] = useState(initialUsers);
  const [activeRoleId, setActiveRoleId] = useState("role-admin");
  const [resolvedRisks, setResolvedRisks] = useState<string[]>([]);
  const [assessmentIssues, setAssessmentIssues] = useState<AssessmentIssue[]>(initialAssessmentIssues);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("尚未保存");
  const [logJob, setLogJob] = useState<JobRow | null>(null);
  const toastTimer = useRef<number | null>(null);
  const lastMutationModule = useRef<ModuleId>("home");
  const skipNextSave = useRef(false);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  }, []);

  const notify = useCallback((message: string) => {
    showToast(message);
    lastMutationModule.current = active;
    const moduleName = modules.find((item) => item.id === active)?.label ?? "平台管理";
    setAuditLogs((current) => [{
      id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      time: new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-"),
      user: authUser?.displayName || "高质量数据评估演示",
      module: moduleName,
      action: message.includes("导出") ? "导出数据" : message.includes("创建") ? "创建记录" : message.includes("运行") ? "执行任务" : message.includes("保存") ? "保存配置" : message.includes("同步") ? "同步数据" : message.includes("切换") ? "切换状态" : "执行操作",
      target: message.slice(0, 28),
      result: message.includes("失败") || message.includes("异常") ? "失败" : "成功",
      detail: message,
      address: "127.0.0.1",
    }, ...current].slice(0, 300));
  }, [active, authUser, showToast]);

  const buildLocalSnapshot = useCallback((): LocalPlatformSnapshot => ({
    version: 2,
    savedAt: new Date().toISOString(),
    data: { project, compact, projects, sources, cleaningTasks, reviewTasks, jobs, evaluations, messages, auditLogs, roles, users, activeRoleId, resolvedRisks, assessmentIssues },
  }), [activeRoleId, assessmentIssues, auditLogs, cleaningTasks, compact, evaluations, jobs, messages, project, projects, resolvedRisks, reviewTasks, roles, sources, users]);

  const applySnapshot = useCallback((snapshot: LocalPlatformSnapshot, roleId: string) => {
    setProject(snapshot.data.project || "高质量数据集评估演示");
    setCompact(Boolean(snapshot.data.compact));
    setProjects(snapshot.data.projects || initialProjects);
    setSources(snapshot.data.sources || initialSources);
    setCleaningTasks(snapshot.data.cleaningTasks || initialCleaningTasks);
    setReviewTasks(snapshot.data.reviewTasks || initialReviewTasks);
    setJobs(snapshot.data.jobs || initialJobs);
    setEvaluations(snapshot.data.evaluations || initialEvaluations);
    setMessages(snapshot.data.messages || initialMessages);
    setAuditLogs(snapshot.data.auditLogs || initialAuditLogs);
    setRoles(snapshot.data.roles || initialRoles);
    setUsers(snapshot.data.users || initialUsers);
    setActiveRoleId(roleId);
    setResolvedRisks(snapshot.data.resolvedRisks || []);
    setAssessmentIssues(snapshot.data.assessmentIssues || initialAssessmentIssues);
    setLastSavedAt(new Date(snapshot.savedAt).toLocaleTimeString("zh-CN", { hour12: false }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => response.ok ? (await response.json() as { user: AuthUser }).user : null)
      .then((user) => {
        if (cancelled) return;
        setAuthUser(user);
        if (user) setActiveRoleId(user.roleId);
        setAuthReady(true);
      })
      .catch(() => { if (!cancelled) setAuthReady(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    fetch("/api/platform-state", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) throw new Error("unauthorized");
        if (!response.ok) throw new Error("load-failed");
        return response.json() as Promise<{ snapshot: LocalPlatformSnapshot | null }>;
      })
      .then(async ({ snapshot }) => {
        if (cancelled) return;
        skipNextSave.current = true;
        if (snapshot?.data) {
          applySnapshot({ ...snapshot, version: 2, data: { ...snapshot.data, resolvedRisks: snapshot.data.resolvedRisks || [], assessmentIssues: snapshot.data.assessmentIssues || initialAssessmentIssues } }, authUser.roleId);
        } else {
          const legacyRaw = window.localStorage.getItem(PLATFORM_STORAGE_KEY);
          if (legacyRaw && authUser.roleId === "role-admin") {
            const legacy = JSON.parse(legacyRaw) as Omit<LocalPlatformSnapshot, "version"> & { version: number };
            const migrated: LocalPlatformSnapshot = { ...legacy, version: 2, data: { ...legacy.data, activeRoleId: authUser.roleId, resolvedRisks: legacy.data.resolvedRisks || [], assessmentIssues: legacy.data.assessmentIssues || initialAssessmentIssues } };
            applySnapshot(migrated, authUser.roleId);
            await fetch("/api/platform-state", { method: "PUT", headers: { "Content-Type": "application/json", "x-platform-request": "1", "x-platform-module": "admin" }, body: JSON.stringify(migrated) });
            window.localStorage.removeItem(PLATFORM_STORAGE_KEY);
          } else {
            setActiveRoleId(authUser.roleId);
            setLastSavedAt("等待首次保存");
          }
        }
        setPersistenceReady(true);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        if (error.message === "unauthorized") setAuthUser(null);
        else showToast("无法连接本地持久化服务，请确认本地服务正常运行");
      });
    return () => { cancelled = true; };
  }, [applySnapshot, authUser, showToast]);

  useEffect(() => {
    if (!persistenceReady || !authUser) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timer = window.setTimeout(async () => {
      const snapshot = buildLocalSnapshot();
      try {
        const response = await fetch("/api/platform-state", {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-platform-request": "1", "x-platform-module": lastMutationModule.current },
          body: JSON.stringify(snapshot),
        });
        if (response.status === 401) {
          setAuthUser(null);
          return;
        }
        if (response.status === 403) {
          showToast("当前账号只有只读权限，本次修改未保存");
          return;
        }
        if (!response.ok) throw new Error("save-failed");
        setLastSavedAt(new Date(snapshot.savedAt).toLocaleTimeString("zh-CN", { hour12: false }));
      } catch {
        showToast("本地持久化保存失败，请检查服务状态");
      }
    }, 420);
    return () => window.clearTimeout(timer);
  }, [authUser, buildLocalSnapshot, persistenceReady, showToast]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setDialog(null);
      setLogJob(null);
      setTopPanel(null);
      setMenuOpen(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    const activeFeedback = new WeakMap<HTMLButtonElement, Animation>();

    function animateButtonPress(event: PointerEvent) {
      if (event.button !== 0 || !(event.target instanceof Element)) return;
      const button = event.target.closest("button");
      if (!(button instanceof HTMLButtonElement) || button.disabled) return;

      activeFeedback.get(button)?.cancel();
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reducedMotion
        ? 80 + Math.floor(Math.random() * 31)
        : 120 + Math.floor(Math.random() * 71);
      const baseTransform = window.getComputedStyle(button).transform;
      const restingTransform = baseTransform === "none" ? "scale(1)" : baseTransform;
      const keyframes: Keyframe[] = reducedMotion
        ? [{ opacity: 1 }, { opacity: 0.72, offset: 0.34 }, { opacity: 1 }]
        : [
            { transform: restingTransform },
            { transform: `${restingTransform} scale(0.975)`, offset: 0.34 },
            { transform: restingTransform },
          ];
      const feedback = button.animate(keyframes, {
        duration,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
      });
      activeFeedback.set(button, feedback);
      feedback.onfinish = () => {
        if (activeFeedback.get(button) === feedback) activeFeedback.delete(button);
      };
    }

    document.addEventListener("pointerdown", animateButtonPress, true);
    return () => document.removeEventListener("pointerdown", animateButtonPress, true);
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const currentRole = roles.find((role) => role.id === activeRoleId) ?? roles[0];
    const readOnly = currentRole?.permissions[active] === "只读";
    const root = document.querySelector<HTMLElement>(".reuse-main");
    if (!root) return;
    const writePattern = /新建|添加|创建|保存|运行|同步|测试连接|立即同步|处置|分派|提交|关闭问题|启用|停用|删除|清除|导入|重评|重新评测|安装|发布|回滚|复制|重命名|生成|执行|校验配置|选择文件|上传|配置|加入清洗/;
    const safePattern = /查看|详情|导出|刷新|搜索|筛选|返回|取消|关闭菜单|关闭.*(?:框|详情|配置|抽屉)|换一批|定位|缩放|布局|血缘|质量$/;

    function isWriteButton(button: HTMLButtonElement) {
      if (button.dataset.readonlyAllow === "true") return false;
      if (button.dataset.writeAction === "true" || button.type === "submit") return true;
      const label = `${button.getAttribute("aria-label") || ""} ${button.innerText}`.trim();
      return !safePattern.test(label) && writePattern.test(label);
    }

    function markLockedControls() {
      root.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        const locked = readOnly && isWriteButton(button);
        button.classList.toggle("permission-locked", locked);
        if (locked) {
          button.setAttribute("aria-disabled", "true");
          button.title = "当前账号只有只读权限";
        } else {
          button.removeAttribute("aria-disabled");
          if (button.title === "当前账号只有只读权限") button.removeAttribute("title");
        }
      });
      root.querySelectorAll<HTMLInputElement>('input[type="checkbox"], input[type="radio"]').forEach((input) => {
        input.classList.toggle("permission-locked", readOnly);
        if (readOnly) input.setAttribute("aria-disabled", "true");
        else input.removeAttribute("aria-disabled");
      });
    }

    function denyWrite(event: Event) {
      if (!readOnly || !(event.target instanceof Element)) return;
      const button = event.target.closest("button");
      const input = event.target.closest('input[type="checkbox"], input[type="radio"]');
      if ((button instanceof HTMLButtonElement && isWriteButton(button)) || input) {
        event.preventDefault();
        event.stopPropagation();
        showToast(`${currentRole.name}在${modules.find((item) => item.id === active)?.label || "当前模块"}中只有只读权限`);
      }
    }

    function denySubmit(event: Event) {
      if (!readOnly) return;
      event.preventDefault();
      event.stopPropagation();
      showToast(`${currentRole.name}在当前模块中只有只读权限，不能提交更改`);
    }

    markLockedControls();
    const observer = new MutationObserver(markLockedControls);
    observer.observe(root, { childList: true, subtree: true });
    root.addEventListener("click", denyWrite, true);
    root.addEventListener("submit", denySubmit, true);
    return () => {
      observer.disconnect();
      root.removeEventListener("click", denyWrite, true);
      root.removeEventListener("submit", denySubmit, true);
      root.querySelectorAll(".permission-locked").forEach((element) => {
        element.classList.remove("permission-locked");
        element.removeAttribute("aria-disabled");
      });
    };
  }, [active, activeRoleId, authUser, roles, showToast]);

  useEffect(() => {
    if (!evaluations.some((item) => item.status === "评测中")) return;
    const timer = window.setInterval(() => {
      setEvaluations((current) => current.map((item) => {
        if (item.status !== "评测中") return item;
        const progress = Math.min(100, item.progress + 7);
        if (progress < 100) return { ...item, progress };
        const result = buildEvaluationResult(item);
        const completed = { ...item, result, progress: 100, score: result.overall.toFixed(1) };
        const passed = getEvaluationGateChecks(completed).every((check) => check.passed);
        return { ...completed, status: passed ? "通过" : "未通过" };
      }));
    }, 480);
    return () => window.clearInterval(timer);
  }, [evaluations]);

  function openModule(id: ModuleId, label?: string) {
    const moduleItem = modules.find((item) => item.id === id)!;
    const currentRole = roles.find((role) => role.id === activeRoleId) ?? roles[0];
    if (id !== "home" && currentRole?.permissions[id] === "无权限") {
      setMenuOpen(null);
      notify(`${currentRole.name} 无权访问${moduleItem.label}，请联系平台管理员`);
      return;
    }
    if (id === "governance") {
      if (!label || label === "治理项目管理") {
        setGovernanceView("projects");
        setWorkspaceProject(null);
      }
      if (label === "高质量数据治理工作间") {
        setGovernanceView("workspace");
        setWorkspaceProject((current) => current || projects[0]);
      }
      if (label === "治理算法管理") {
        setGovernanceView("algorithms");
        setWorkspaceProject(null);
      }
      if (label === "治理算法市场") {
        setGovernanceView("marketplace");
        setWorkspaceProject(null);
      }
    }
    if (id === "admin") {
      const nextAdminView: Record<string, AdminView> = { 全局消息: "messages", 审计日志: "audit", 权限控制: "permissions", 本地数据: "storage" };
      setAdminView(nextAdminView[label || "全局消息"] || "messages");
    }
    setActive(id);
    setMenuOpen(null);
    setTopPanel(null);
    setTabs((current) => {
      const nextLabel = label || moduleItem.children[0] || moduleItem.label;
      return current.some((tab) => tab.id === id)
        ? current.map((tab) => tab.id === id ? { ...tab, label: nextLabel } : tab)
        : [...current, { id, label: nextLabel }];
    });
  }

  function closeTab(id: ModuleId) {
    if (id === "home") return;
    setTabs((current) => current.filter((tab) => tab.id !== id));
    if (active === id) setActive("home");
  }

  function hasWriteAccess(moduleId: ModuleId = active) {
    const role = roles.find((item) => item.id === activeRoleId) ?? roles[0];
    return role?.permissions[moduleId] === "管理";
  }

  function requireWriteAccess(moduleId: ModuleId = active) {
    if (hasWriteAccess(moduleId)) return true;
    const role = roles.find((item) => item.id === activeRoleId) ?? roles[0];
    showToast(`${role?.name || "当前账号"}在${modules.find((item) => item.id === moduleId)?.label || "当前模块"}中只有只读权限`);
    return false;
  }

  function openCreate(id: Exclude<DialogId, null>, preset = "") {
    if (!requireWriteAccess(active)) return;
    setDialogPreset(preset);
    setDialog(id);
  }

  function pushPlatformMessage(message: Omit<PlatformMessage, "id" | "time" | "read">) {
    setMessages((current) => [{ ...message, id: `message-${Date.now()}`, time: "刚刚", read: false }, ...current].slice(0, 100));
  }

  function handleCreated(payload: CreatePayload) {
    if (!requireWriteAccess(active)) {
      setDialog(null);
      return;
    }
    const today = "2026-08-25";
    if (payload.kind === "assessment") {
      setReviewTasks((current) => [payload.name, ...current]);
    }
    if (payload.kind === "model") {
      setJobs((current) => [
        { name: payload.name, type: payload.option, model: payload.model, dataset: payload.dataset, progress: 0, status: "排队中", config: { ...defaultModelJobConfig }, versions: [], registeredVersion: "--" },
        ...current,
      ]);
    }
    if (payload.kind === "connection") {
      const connectionType = payload.option === "MySQL" ? "MySQL 8.0" : payload.option === "PostgreSQL" ? "PostgreSQL 16" : payload.option;
      setSources((current) => [
        {
          name: payload.name,
          type: connectionType,
          summary: "等待首次同步",
          scale: "--",
          strategy: payload.strategy || "手动触发",
          updated: "尚未同步",
          endpoint: payload.endpoint || "--",
          status: "正常",
          progress: 100,
          syncResult: "连接验证通过，等待执行首次同步",
        },
        ...current,
      ]);
    }
    if (payload.kind === "project") {
      setProjects((current) => [
        { name: payload.name, overview: "0 Datasets  0 Recipes", created: today, updated: today, isEmpty: true, workspace: { nodes: [], edges: [] } },
        ...current,
      ]);
    }
    if (payload.kind === "evaluation") {
      const evaluationConfig: EvaluationConfig = {
        ...defaultEvaluationConfig,
        standard: payload.standard || defaultEvaluationConfig.standard,
        baseline: payload.baseline || defaultEvaluationConfig.baseline,
        sampleSize: payload.sampleSize || defaultEvaluationConfig.sampleSize,
        mode: payload.mode || defaultEvaluationConfig.mode,
        scoreThreshold: payload.option === "安全专项评测" ? 85 : payload.option === "性能专项评测" ? 88 : defaultEvaluationConfig.scoreThreshold,
        safetyThreshold: payload.option === "安全专项评测" ? 99.5 : defaultEvaluationConfig.safetyThreshold,
        latencyThreshold: payload.option === "性能专项评测" ? 500 : defaultEvaluationConfig.latencyThreshold,
      };
      setEvaluations((current) => [
        { name: payload.name, model: payload.model, dataset: payload.dataset, score: "--", date: today, status: "待评测", progress: 0, config: evaluationConfig, result: null },
        ...current,
      ]);
    }
    setDialog(null);
    pushPlatformMessage({
      title: `${payload.name} 已创建`,
      detail: "新记录已加入平台任务列表，可继续配置并执行。",
      category: payload.kind === "model" || payload.kind === "evaluation" ? "模型" : payload.kind === "project" ? "治理" : "质量",
      level: "普通",
      module: payload.kind === "model" ? "modelDev" : payload.kind === "evaluation" ? "modelEval" : payload.kind === "project" ? "governance" : payload.kind === "connection" ? "inventory" : "assessment",
    });
    notify(`${payload.name} 已创建并加入列表`);
  }

  function toggleJob(name: string) {
    if (!requireWriteAccess("modelDev")) return;
    setJobs((current) => current.map((job) => {
      if (job.name !== name) return job;
      if (job.status === "训练中") return { ...job, status: "已暂停" };
      return { ...job, status: "训练中", progress: Math.max(job.progress, 8) };
    }));
  }

  const updateModelJob = useCallback((name: string, patch: Partial<JobRow>) => {
    const role = roles.find((item) => item.id === activeRoleId) ?? roles[0];
    if (role?.permissions.modelDev !== "管理") {
      showToast(`${role?.name || "当前账号"}在模型开发中只有只读权限`);
      return;
    }
    setJobs((current) => current.map((job) => job.name === name ? { ...job, ...patch } : job));
  }, [activeRoleId, roles, showToast]);

  function runEvaluation(name: string) {
    if (!requireWriteAccess("modelEval")) return;
    setEvaluations((current) => current.map((item) => item.name === name ? { ...item, status: "评测中", progress: 3, score: "--", result: null } : item));
    pushPlatformMessage({ title: `${name} 已开始运行`, detail: "评测完成后将自动计算能力指标并判定发布门禁。", category: "模型", level: "普通", module: "modelEval" });
    notify(`${name} 已开始运行`);
  }

  const updateEvaluation = useCallback((name: string, patch: Partial<EvaluationRow>) => {
    const role = roles.find((item) => item.id === activeRoleId) ?? roles[0];
    if (role?.permissions.modelEval !== "管理") {
      showToast(`${role?.name || "当前账号"}在模型评测中只有只读权限`);
      return;
    }
    setEvaluations((current) => current.map((item) => item.name === name ? { ...item, ...patch } : item));
  }, [activeRoleId, roles, showToast]);

  function updateSource(name: string, patch: Partial<SourceRow>) {
    if (!requireWriteAccess("inventory")) return;
    setSources((current) => current.map((source) => source.name === name ? { ...source, ...patch } : source));
  }

  const createCleaningTask = useCallback((task: CleaningTaskDraft) => {
    const role = roles.find((item) => item.id === activeRoleId) ?? roles[0];
    if (role?.permissions.inventory !== "管理") {
      showToast(`${role?.name || "当前账号"}在智能数据盘点中只有只读权限`);
      return "";
    }
    const id = `clean-${Date.now()}`;
    const sourceVersion: CleaningVersionRow = {
      id: `${id}-source`,
      version: task.sourceVersion,
      parent: "--",
      created: "刚刚",
      operator: "高质量数据评估演示",
      records: task.recordCount,
      issues: task.issueCount,
      quality: 93.7,
      change: "探查结果快照",
    };
    setCleaningTasks((current) => [{ ...task, id, status: "待执行", progress: 0, outputVersion: "--", activeVersion: task.sourceVersion, versions: [sourceVersion], created: "刚刚" }, ...current]);
    return id;
  }, [activeRoleId, roles, showToast]);

  const updateCleaningTask = useCallback((id: string, patch: Partial<CleaningTaskRow>) => {
    const role = roles.find((item) => item.id === activeRoleId) ?? roles[0];
    if (role?.permissions.inventory !== "管理") {
      showToast(`${role?.name || "当前账号"}在智能数据盘点中只有只读权限`);
      return;
    }
    setCleaningTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  }, [activeRoleId, roles, showToast]);

  function markMessageRead(id: string) {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, read: true } : message));
  }

  function markAllMessagesRead() {
    setMessages((current) => current.map((message) => ({ ...message, read: true })));
  }

  function updateRolePermission(roleId: string, moduleId: ModuleId, level: PermissionLevel) {
    setRoles((current) => current.map((role) => role.id === roleId ? { ...role, permissions: { ...role.permissions, [moduleId]: level } } : role));
    notify(`${roles.find((role) => role.id === roleId)?.name || "角色"} 的${modules.find((item) => item.id === moduleId)?.label || "模块"}权限已设为${level}`);
  }

  function addRole() {
    const id = `role-custom-${Date.now()}`;
    setRoles((current) => [...current, { id, name: `自定义角色 ${current.length - 3}`, description: "按实际职责配置模块访问权限", members: 0, permissions: { home: "只读", inventory: "只读", governance: "只读", assessment: "只读", modelDev: "无权限", modelEval: "无权限", admin: "只读" } }]);
    notify("已新增自定义角色，可继续配置模块权限");
  }

  function updateUserRole(userId: string, roleId: string) {
    const user = users.find((item) => item.id === userId);
    if (!user || user.roleId === roleId) return;
    setUsers((current) => current.map((item) => item.id === userId ? { ...item, roleId } : item));
    setRoles((current) => current.map((role) => role.id === user.roleId ? { ...role, members: Math.max(0, role.members - 1) } : role.id === roleId ? { ...role, members: role.members + 1 } : role));
    notify(`${user.name} 的平台角色已更新`);
  }

  function toggleUserStatus(userId: string) {
    const user = users.find((item) => item.id === userId);
    setUsers((current) => current.map((item) => item.id === userId ? { ...item, status: item.status === "正常" ? "停用" : "正常" } : item));
    if (user) notify(`${user.name} 的账号已${user.status === "正常" ? "停用" : "启用"}`);
  }

  function exportLocalBackup() {
    const snapshot = buildLocalSnapshot();
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `高质量数据评估平台本地备份-${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date())}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("本地平台数据备份已导出");
  }

  async function importLocalBackup(file: File) {
    if (!requireWriteAccess("admin")) return;
    try {
      const imported = JSON.parse(await file.text()) as Omit<LocalPlatformSnapshot, "version"> & { version: number };
      if (![1, 2].includes(imported.version) || !imported.data) throw new Error("invalid backup");
      const snapshot: LocalPlatformSnapshot = { ...imported, version: 2, data: { ...imported.data, activeRoleId: authUser?.roleId || "role-admin", resolvedRisks: imported.data.resolvedRisks || [], assessmentIssues: imported.data.assessmentIssues || initialAssessmentIssues } };
      setProject(snapshot.data.project);
      setCompact(snapshot.data.compact);
      setProjects(snapshot.data.projects);
      setSources(snapshot.data.sources);
      setCleaningTasks(snapshot.data.cleaningTasks);
      setReviewTasks(snapshot.data.reviewTasks);
      setJobs(snapshot.data.jobs);
      setEvaluations(snapshot.data.evaluations);
      setMessages(snapshot.data.messages);
      setAuditLogs(snapshot.data.auditLogs);
      setRoles(snapshot.data.roles);
      setUsers(snapshot.data.users);
      setActiveRoleId(authUser?.roleId || snapshot.data.activeRoleId);
      setResolvedRisks(snapshot.data.resolvedRisks);
      setAssessmentIssues(snapshot.data.assessmentIssues);
      setLastSavedAt("刚刚恢复");
      notify("本地备份已校验并恢复");
    } catch {
      notify("备份文件无效或版本不兼容，恢复失败");
    }
  }

  async function clearLocalBackup() {
    if (!requireWriteAccess("admin")) return;
    const response = await fetch("/api/platform-state", { method: "DELETE", headers: { "x-platform-request": "1" } });
    if (!response.ok) {
      showToast(response.status === 403 ? "只有平台管理员可以恢复预置数据" : "清除业务数据失败");
      return;
    }
    window.localStorage.removeItem(PLATFORM_STORAGE_KEY);
    setProject("高质量数据集评估演示");
    setCompact(false);
    setProjects(initialProjects);
    setSources(initialSources);
    setCleaningTasks(initialCleaningTasks);
    setReviewTasks(initialReviewTasks);
    setJobs(initialJobs);
    setEvaluations(initialEvaluations);
    setMessages(initialMessages);
    setAuditLogs(initialAuditLogs);
    setRoles(initialRoles);
    setUsers(initialUsers);
    setActiveRoleId(authUser?.roleId || "role-admin");
    setResolvedRisks([]);
    setAssessmentIssues(initialAssessmentIssues);
    setLastSavedAt("已恢复预置数据");
    notify("本地数据已清除，平台恢复预置演示状态");
  }

  async function handleLogin(credentials: { username: string; password: string; captcha: string }) {
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "x-platform-request": "1" }, body: JSON.stringify(credentials) });
      const payload = await response.json() as { user?: AuthUser; error?: string };
      if (!response.ok || !payload.user) return payload.error || "登录失败，请稍后重试";
      setAuthUser(payload.user);
      setActiveRoleId(payload.user.roleId);
      setAuthReady(true);
      showToast(`登录成功，欢迎回来，${payload.user.displayName}`);
      return null;
    } catch {
      return "无法连接认证服务，请确认本地服务正常运行";
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", headers: { "x-platform-request": "1" } }).catch(() => null);
    setAuthUser(null);
    setPersistenceReady(false);
    setActive("home");
    setTabs([{ id: "home", label: "首页" }]);
    setMenuOpen(null);
    setTopPanel(null);
  }

  if (!authReady) return <Login onLogin={handleLogin} checking />;
  if (!authUser) return <Login onLogin={handleLogin} />;

  const currentModule = modules.find((item) => item.id === active)!;
  const currentRole = roles.find((role) => role.id === activeRoleId) ?? roles[0];
  const unreadMessageCount = messages.filter((message) => !message.read).length;
  const storageBytes = JSON.stringify(buildLocalSnapshot()).length * 2;

  return (
    <div className={`reuse-app ${compact ? "compact" : ""}`}>
      <aside className="icon-rail">
        <div className="rail-logo">
          <span>质</span>
          <div><strong>QUALITY HUB</strong><small>高质量数据平台</small></div>
        </div>
        <nav aria-label="平台模块">
          <p className="rail-section-label">工作台</p>
          {modules.map((item) => (
            <button
              key={item.id}
              className={`${active === item.id ? "active" : ""} ${currentRole?.permissions[item.id] === "无权限" ? "locked" : ""}`}
              onClick={() => currentRole?.permissions[item.id] === "无权限" ? openModule(item.id) : item.children.length ? setMenuOpen(menuOpen === item.id ? null : item.id) : openModule(item.id)}
              title={`${item.label}${currentRole?.permissions[item.id] === "无权限" ? "（无权限）" : ""}`}
              aria-current={active === item.id ? "page" : undefined}
              aria-expanded={item.children.length ? menuOpen === item.id : undefined}
            >
              <span><UiIcon icon={item.icon} size={19} /></span><small>{item.label}</small>
            </button>
          ))}
        </nav>
        <button
          className="theme-dots"
          aria-label={compact ? "切换为舒适模式" : "切换为紧凑模式"}
          title={compact ? "舒适模式" : "紧凑模式"}
          onClick={() => {
            setCompact(!compact);
            notify(compact ? "已切换为舒适模式" : "已切换为紧凑模式");
          }}
        >
          <UiIcon icon={Rows3} size={17} /><span>{compact ? "舒适布局" : "紧凑布局"}</span>
        </button>
      </aside>

      {menuOpen && (
        <aside className="rail-flyout">
          <header><strong>{modules.find((item) => item.id === menuOpen)?.label}</strong><button aria-label="关闭菜单" onClick={() => setMenuOpen(null)}><UiIcon icon={X} size={17} /></button></header>
          {modules.find((item) => item.id === menuOpen)?.children.map((child, index) => (
            <button
              key={child}
              className={tabs.find((tab) => tab.id === menuOpen)?.label === child ? "active" : ""}
              aria-current={tabs.find((tab) => tab.id === menuOpen)?.label === child ? "page" : undefined}
              onClick={() => openModule(menuOpen, child)}
            ><span>{index + 1}</span>{child}<b><UiIcon icon={ChevronRight} size={15} /></b></button>
          ))}
        </aside>
      )}

      <header className="reuse-topbar">
        <div className="reuse-breadcrumb">
          <button aria-label="打开模块菜单" onClick={() => setMenuOpen(active === "home" ? "inventory" : active)}><UiIcon icon={Menu} size={16} /></button>
          <strong>{currentModule.label}</strong><span>/</span><span>{tabs.find((tab) => tab.id === active)?.label || currentModule.label}</span>
        </div>
        <label className="topbar-search">
          <UiIcon icon={Search} size={15} />
          <input
            aria-label="全局搜索"
            placeholder="搜索数据、任务或规则…"
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.currentTarget.value.trim()) notify(`正在全局搜索：${event.currentTarget.value.trim()}`);
            }}
          />
          <kbd>⌘ K</kbd>
        </label>
        <nav>
          <button className={topPanel === "guide" ? "active" : ""} onClick={() => setTopPanel(topPanel === "guide" ? null : "guide")}><UiIcon icon={BookOpen} />快速入门</button>
          <button className={topPanel === "profile" ? "active" : ""} onClick={() => setTopPanel(topPanel === "profile" ? null : "profile")}><UiIcon icon={UserRound} />我的主页</button>
          <button className={topPanel === "messages" ? "active" : ""} onClick={() => setTopPanel(topPanel === "messages" ? null : "messages")}><UiIcon icon={Bell} />消息{unreadMessageCount > 0 && <b className="message-badge">{unreadMessageCount}</b>}</button>
          <button onClick={handleLogout}><UiIcon icon={LogOut} />退出登录</button><i /><strong>{authUser.displayName}</strong>
        </nav>
      </header>

      {topPanel && (
        <aside className={`top-popover ${topPanel}`}>
          {topPanel === "guide" && (
            <>
              <header><div><strong>快速入门</strong><span>按业务流程开始工作</span></div><button aria-label="关闭快速入门" onClick={() => setTopPanel(null)}><UiIcon icon={X} size={16} /></button></header>
              <button onClick={() => openModule("inventory")}><span>1</span><div><strong>接入并盘点数据</strong><small>创建连接，查看资产规模</small></div><b>›</b></button>
              <button onClick={() => openModule("assessment")}><span>2</span><div><strong>创建质量评估</strong><small>选择数据集与质量规则</small></div><b>›</b></button>
              <button onClick={() => openModule("modelDev")}><span>3</span><div><strong>进入模型开发</strong><small>微调、RAG、蒸馏和注册</small></div><b>›</b></button>
            </>
          )}
          {topPanel === "profile" && (
            <>
              <header><div><strong>{authUser.displayName}</strong><span>{currentRole?.name}</span></div><button aria-label="关闭个人信息" onClick={() => setTopPanel(null)}><UiIcon icon={X} size={16} /></button></header>
              <div className="profile-card"><span>{authUser.displayName.slice(0, 1)}</span><div><strong>{authUser.username}</strong><small>服务端会话 · 本地部署</small></div></div>
              <div className="profile-stats"><span><b>12</b>数据集</span><span><b>20</b>治理任务</span><span><b>{jobs.length}</b>模型任务</span></div>
            </>
          )}
          {topPanel === "messages" && (
            <>
              <header><div><strong>消息中心</strong><span>{unreadMessageCount ? `${unreadMessageCount} 条未读消息` : "没有未读消息"}</span></div><button aria-label="关闭消息中心" onClick={() => setTopPanel(null)}><UiIcon icon={X} size={16} /></button></header>
              {messages.slice(0, 4).map((message) => (
                <button className="message-item" key={message.id} onClick={() => { markMessageRead(message.id); openModule(message.module); }}><i className={message.read ? "read" : ""} /><div><strong>{message.title}</strong><small>{message.category} · {message.time}</small></div></button>
              ))}
              <div className="message-popover-actions"><button className="mark-read" disabled={!unreadMessageCount} onClick={markAllMessagesRead}>全部标为已读</button><button className="mark-read" onClick={() => openModule("admin", "全局消息")}>查看全部消息</button></div>
            </>
          )}
        </aside>
      )}

      <div className="open-tabs" role="tablist" aria-label="已打开页面">
        {tabs.map((tab) => (
          <button key={tab.id} role="tab" aria-selected={active === tab.id} className={active === tab.id ? "active" : ""} onClick={() => openModule(tab.id, tab.label)}>
            <i />{tab.label}
            {tab.id !== "home" && (
              <span
                role="button"
                tabIndex={0}
                aria-label={`关闭${tab.label}`}
                onClick={(event) => { event.stopPropagation(); closeTab(tab.id); }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                    closeTab(tab.id);
                  }
                }}
              ><UiIcon icon={X} size={12} /></span>
            )}
          </button>
        ))}
      </div>

      <main className="reuse-main">
        {active === "home" && <HomeDashboard sources={sources} cleaningTasks={cleaningTasks} reviewTaskCount={reviewTasks.length} jobs={jobs} evaluations={evaluations} notify={notify} openModule={openModule} resolvedRisks={resolvedRisks} setResolvedRisks={setResolvedRisks} />}
        {active === "inventory" && <InventoryPage key={tabs.find((tab) => tab.id === "inventory")?.label || "数据库管理"} initialSection={tabs.find((tab) => tab.id === "inventory")?.label || "数据库管理"} sources={sources} cleaningTasks={cleaningTasks} openDialog={() => openCreate("connection")} updateSource={updateSource} createCleaningTask={createCleaningTask} updateCleaningTask={updateCleaningTask} notify={notify} />}
        {active === "governance" && governanceView === "workspace" && workspaceProject && (
          <GovernanceWorkbench
            project={workspaceProject}
            notify={notify}
            onSave={(workspace) => {
              const datasetCount = workspace.nodes.filter((node) => node.kind === "dataset" || node.kind === "output").length;
              const recipeCount = workspace.nodes.filter((node) => node.kind === "recipe" || node.kind === "annotation").length;
              const updatedProject: ProjectRow = {
                ...workspaceProject,
                overview: `${datasetCount} Datasets  ${recipeCount} Recipes`,
                updated: "2026-08-25",
                isEmpty: workspace.nodes.length === 0,
                workspace,
              };
              setWorkspaceProject(updatedProject);
              setProjects((current) => current.map((item) => item.name === workspaceProject.name && item.created === workspaceProject.created ? updatedProject : item));
            }}
            onBack={() => {
              setWorkspaceProject(null);
              setGovernanceView("projects");
              setTabs((current) => current.map((tab) => tab.id === "governance" ? { ...tab, label: "治理项目管理" } : tab));
            }}
          />
        )}
        {active === "governance" && governanceView === "projects" && (
          <GovernancePage
            projects={projects}
            openDialog={() => openCreate("project")}
            notify={notify}
            enterWorkspace={(row) => {
              setWorkspaceProject(row);
              setGovernanceView("workspace");
              setTabs((current) => current.map((tab) => tab.id === "governance" ? { ...tab, label: "高质量数据治理工作间" } : tab));
              notify(`已进入 ${row.name} 的高质量数据治理工作间`);
            }}
            copyProject={(row) => {
              const copy = { ...row, name: `${row.name}-副本`, created: "2026-08-23", updated: "2026-08-23" };
              setProjects((current) => [copy, ...current]);
              notify(`${row.name} 已复制`);
            }}
            deleteProject={(row) => {
              setProjects((current) => current.filter((item) => !(item.name === row.name && item.created === row.created && item.updated === row.updated)));
              if (workspaceProject?.name === row.name && workspaceProject.created === row.created) {
                setWorkspaceProject(null);
                setGovernanceView("projects");
              }
              notify(`${row.name} 已删除`);
            }}
          />
        )}
        {active === "governance" && governanceView === "algorithms" && <GovernanceAlgorithms notify={notify} />}
        {active === "governance" && governanceView === "marketplace" && <GovernanceMarketplace notify={notify} />}
        {active === "assessment" && tabs.find((tab) => tab.id === "assessment")?.label === "高质量数据评估历史" && <AssessmentHistoryPage notify={notify} />}
        {active === "assessment" && tabs.find((tab) => tab.id === "assessment")?.label !== "高质量数据评估历史" && <AssessmentPage key={tabs.find((tab) => tab.id === "assessment")?.label || "高质量数据评估"} initialView="评估执行" tasks={reviewTasks} issues={assessmentIssues} setIssues={setAssessmentIssues} openDialog={() => openCreate("assessment")} notify={notify} />}
        {active === "modelDev" && (
          <ModelDevelopment
            jobs={jobs}
            openDialog={(preset) => openCreate("model", preset)}
            notify={notify}
            openLog={setLogJob}
            toggleJob={toggleJob}
            updateJob={updateModelJob}
          />
        )}
        {active === "modelEval" && (
          <ModelEvaluation evaluations={evaluations} openDialog={() => openCreate("evaluation")} notify={notify} runEvaluation={runEvaluation} updateEvaluation={updateEvaluation} />
        )}
        {active === "admin" && (
          <PlatformManagement
            view={adminView}
            messages={messages}
            auditLogs={auditLogs}
            roles={roles}
            users={users}
            activeRoleId={activeRoleId}
            persistenceReady={persistenceReady}
            lastSavedAt={lastSavedAt}
            storageBytes={storageBytes}
            recordCounts={[
              { name: "项目与治理", count: projects.length + cleaningTasks.length, description: "治理项目、清洗任务和版本记录" },
              { name: "数据源", count: sources.length, description: "连接配置、同步策略和运行状态" },
              { name: "模型任务", count: jobs.length + evaluations.length, description: "开发任务、模型版本和评测结果" },
              { name: "全局消息", count: messages.length, description: "业务通知、未读状态和跳转目标" },
              { name: "审计日志", count: auditLogs.length, description: "操作用户、时间、对象和执行结果" },
              { name: "权限配置", count: roles.length + users.length, description: "平台角色、成员账号和模块权限" },
            ]}
            notify={notify}
            openModule={openModule}
            markMessageRead={markMessageRead}
            markAllMessagesRead={markAllMessagesRead}
            updateRolePermission={updateRolePermission}
            addRole={addRole}
            updateUserRole={updateUserRole}
            toggleUserStatus={toggleUserStatus}
            exportLocalBackup={exportLocalBackup}
            importLocalBackup={importLocalBackup}
            clearLocalBackup={clearLocalBackup}
          />
        )}
      </main>

      <button className="reuse-assistant-button" onClick={() => setAssistant(!assistant)} aria-label="打开质量助手"><UiIcon icon={Sparkles} size={21} /></button>
      {assistant && (
        <aside className="reuse-assistant">
          <header><strong>质量助手</strong><button aria-label="关闭质量助手" onClick={() => setAssistant(false)}><UiIcon icon={X} size={16} /></button></header>
          <p>当前项目包含 12 个数据集、20 个治理 Recipe 和 {jobs.length} 个模型开发任务。</p>
          <div className="assistant-suggestion">建议先处理 1 个等待评估的模型任务，再生成项目报告。</div>
          <button onClick={() => openModule("assessment")}>查看数据评估</button>
          <button onClick={() => openModule("modelDev")}>进入模型开发</button>
        </aside>
      )}

      {dialog && (
        <CreateDialog
          key={`${dialog}-${dialogPreset}`}
          id={dialog}
          preset={dialogPreset}
          onClose={() => setDialog(null)}
          onCreated={handleCreated}
        />
      )}
      {logJob && <LogDrawer job={logJob} onClose={() => setLogJob(null)} />}
      {toast && <div className="reuse-toast" role="status"><UiIcon icon={CircleCheck} size={15} />{toast}</div>}
    </div>
  );
}
