"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bell,
  Blocks,
  BookOpen,
  CalendarClock,
  Check,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Database,
  Download,
  Filter,
  FolderKanban,
  Gauge,
  GitBranch,
  Grid2X2,
  House,
  LayoutDashboard,
  Link2,
  LocateFixed,
  LogOut,
  Menu,
  Minus,
  MoreHorizontal,
  PackageCheck,
  Play,
  Plus,
  RefreshCw,
  Redo2,
  Rows3,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  TriangleAlert,
  Undo2,
  Upload,
  UserRound,
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
  | "modelEval";
type DialogId =
  | "assessment"
  | "model"
  | "connection"
  | "project"
  | "evaluation"
  | null;
type TopPanelId = "guide" | "profile" | "messages" | null;
type GovernanceView = "projects" | "workspace" | "algorithms" | "marketplace";
type Notify = (message: string) => void;

function UiIcon({ icon: Icon, size = 14 }: { icon: LucideIcon; size?: number }) {
  return <Icon className="ui-icon" size={size} strokeWidth={1.8} aria-hidden="true" />;
}

type ProjectRow = {
  name: string;
  overview: string;
  created: string;
  updated: string;
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

type JobRow = {
  name: string;
  type: string;
  model: string;
  dataset: string;
  progress: number;
  status: string;
};

type EvaluationRow = {
  name: string;
  model: string;
  dataset: string;
  score: string;
  date: string;
  status: string;
};

type CreatePayload = {
  kind: Exclude<DialogId, null>;
  name: string;
  option: string;
  model: string;
  dataset: string;
  endpoint?: string;
  strategy?: string;
};

type FilterValues = {
  dataType: string;
  status: string;
  date: string;
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
    children: ["评测标准", "评测任务", "能力对比", "发布门禁"],
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

const initialJobs: JobRow[] = [
  {
    name: "finance-sft-lora-07",
    type: "大模型微调训练",
    model: "Qwen3-8B",
    dataset: "金融年报问答集 v2.1",
    progress: 68,
    status: "训练中",
  },
  {
    name: "service-rag-index-12",
    type: "大模型 RAG 增强",
    model: "BGE-M3",
    dataset: "客服知识向量集 v3.4",
    progress: 100,
    status: "已完成",
  },
  {
    name: "vision-quant-int4-03",
    type: "大模型蒸馏轻量化",
    model: "Qwen2.5-VL",
    dataset: "篮球图像数据集 v1.3",
    progress: 24,
    status: "排队中",
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
  },
  {
    name: "RAG 召回质量评测",
    model: "service-rag-v3.4",
    dataset: "客服检索评测集 v3",
    score: "91.2",
    date: "2026-08-22",
    status: "通过",
  },
  {
    name: "图像理解安全评测",
    model: "vision-agent-v1.8",
    dataset: "多模态安全集 v2",
    score: "96.8",
    date: "2026-08-22",
    status: "通过",
  },
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

function Login({ onLogin }: { onLogin: () => void }) {
  const [loginMode, setLoginMode] = useState<"password" | "code">("password");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((current) => current - 1), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin();
  }

  return (
    <main className="login-page">
      <div className="login-art" aria-hidden="true">
        <div className="data-cylinder">
          <span>高质量数据集</span>
          <i />
          <i />
          <i />
        </div>
        <div className="data-line">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="data-scroll">
          010010<br />110101<br />001110
        </div>
        <div className="data-cubes">
          <i />
          <i />
          <i />
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
            onClick={() => setLoginMode("password")}
          >
            密码登录
          </button>
          <button
            type="button"
            className={loginMode === "code" ? "active" : ""}
            onClick={() => setLoginMode("code")}
          >
            验证码登录
          </button>
        </div>
        <label>
          <span>♙ {loginMode === "password" ? "账 号" : "手机号"}：</span>
          <input
            required
            defaultValue={loginMode === "password" ? "高质量数据评估演示" : ""}
            aria-label={loginMode === "password" ? "账号" : "手机号码"}
            placeholder={loginMode === "password" ? "请输入用户名称/手机号码/电子邮箱" : "请输入手机号码"}
          />
        </label>
        {loginMode === "password" ? (
          <>
            <label>
              <span>♙ 密 码：</span>
              <input required type="password" defaultValue="123456" aria-label="密码" placeholder="请输入密码" />
            </label>
            <label className="captcha-row">
              <span>▣ 验证码：</span>
              <input required aria-label="验证码" placeholder="请输入验证码" />
              <b>3 + 5 =</b>
            </label>
          </>
        ) : (
          <label className="sms-row">
            <span>▣ 验证码：</span>
            <input required aria-label="短信验证码" placeholder="请输入短信验证码" />
            <button type="button" disabled={seconds > 0} onClick={() => setSeconds(60)}>
              {seconds > 0 ? `${seconds}s` : "获取验证码"}
            </button>
          </label>
        )}
        <button className="login-submit">登 录</button>
        <div className="login-links">
          <button type="button">注册账号</button>
          <button type="button">忘记密码？</button>
        </div>
        <footer>
          @WINNOW | 商标 | 官网<br />粤ICP备2021133988号
        </footer>
      </form>
    </main>
  );
}

function ProjectToolbar({
  project,
  setProject,
  notify,
}: {
  project: string;
  setProject: (value: string) => void;
  notify: Notify;
}) {
  function changeProject(value: string) {
    setProject(value);
    notify(`已切换到项目：${value}`);
  }

  return (
    <section className="project-toolbar project-toolbar-minimal">
      <label className="project-select">
        <span><UiIcon icon={Database} size={18} /></span>
          <select value={project} onChange={(event) => changeProject(event.target.value)} aria-label="切换项目">
            <option>高质量数据集评估演示</option>
            <option>高质量数据集测试</option>
            <option>测试</option>
          </select>
        </label>
      </section>
  );
}

function HomeDashboard({ filters, notify }: { filters: FilterValues; notify: Notify }) {
  const checks = ["图像完好性", "图像重复率合规性", "图像涉黄合规性", "图像格式一致性", "图像内容有效性"];
  const metricGuides: Record<string, string> = {
    图像完好性: "检查文件是否可正常解码、尺寸信息是否完整。当前阈值：完好率 ≥ 98%。",
    图像重复率合规性: "通过感知哈希识别近似重复内容。当前阈值：重复率 ≤ 2%。",
    图像涉黄合规性: "调用内容安全规则识别敏感内容。当前阈值：违规率 = 0%。",
    图像格式一致性: "检查文件扩展名、编码和色彩空间。当前标准：JPEG / RGB。",
    图像内容有效性: "检查空白、过暗、模糊及主体缺失。当前阈值：有效率 ≥ 95%。",
  };
  const [files, setFiles] = useState([
    { name: "篮球2.jpeg", time: "2026-03-22 17:00:35", type: "JPEG" },
    { name: "篮球1.jpeg", time: "2026-03-22 17:00:36", type: "JPEG" },
  ]);
  const [selectedFile, setSelectedFile] = useState("篮球2.jpeg");
  const [selectedMetric, setSelectedMetric] = useState(checks[0]);
  const fileInput = useRef<HTMLInputElement>(null);
  const activeFilters = Object.entries(filters).filter(([, value]) => value && value !== "全部");

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;
    const now = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    const added = selected.map((file) => ({
      name: file.name,
      time: now,
      type: file.name.split(".").pop()?.toUpperCase() || "文件",
    }));
    setFiles((current) => [...current, ...added]);
    setSelectedFile(added[0].name);
    event.target.value = "";
    notify(`已添加 ${added.length} 个本地文件`);
  }

  return (
    <section className="original-dashboard">
      <article className="file-panel white-panel">
        <div className="file-panel-title">
          <h2>篮球高质量数据集1</h2>
          <span>{files.length} 个文件</span>
        </div>
        {files.map((file) => (
          <button
            className={`file-row ${selectedFile === file.name ? "active" : ""}`}
            key={`${file.name}-${file.time}`}
            onClick={() => setSelectedFile(file.name)}
            aria-pressed={selectedFile === file.name}
          >
            <span className="file-type">T</span>
            <div>
              <strong>{file.name}</strong>
              <p>
                <i>▧</i> {file.type} <em>图像</em>
              </p>
              <small>{file.time}</small>
            </div>
            <b className="file-check">{selectedFile === file.name ? "✓" : ""}</b>
          </button>
        ))}
        <button className="file-empty" onClick={() => fileInput.current?.click()}>
          <span><UiIcon icon={Plus} size={18} /></span>
          <p>添加本地数据文件</p>
          <small>支持多选，文件仅保留在当前浏览器会话</small>
        </button>
        <input ref={fileInput} className="visually-hidden" type="file" accept="image/*" multiple onChange={addFiles} />
      </article>
      <div className="dashboard-right">
        <article className="summary-panel white-panel">
          <header>
            <h2>质量评估总结</h2>
            <span>2026-08-23 00:08:06</span>
          </header>
          <div className="summary-scroll">
            <div className="summary-context">
              <span>当前文件：{selectedFile}</span>
              {activeFilters.map(([key, value]) => (
                <span key={key}>{value}</span>
              ))}
            </div>
            <p>
              <strong>【结论】</strong>篮球版本1图像数据集已完成当前五项质量审查，{files.length} 个唯一图像样本均通过规则校验。
            </p>
            <h3>审查范围与数据表现概览：</h3>
            <p>
              <b>唯一数据量：</b>{files.length} 个图像文件；<b>检查执行次数：</b>{files.length * checks.length} 次；
              <b>问题样本：</b>0 个。
            </p>
            <h3>质量分析：</h3>
            <p>
              图像完好性、重复率、涉黄内容、格式一致性和内容有效性通过率均为 100%。结论仅适用于本次规则及当前样本，不直接代表模型训练效果。
            </p>
          </div>
        </article>
        <article className="result-panel white-panel">
          <h2>篮球版本1质量评估结果</h2>
          <div className="metric-focus">
            <span>当前指标</span>
            <strong>{selectedMetric}</strong>
            <p>{metricGuides[selectedMetric]}</p>
          </div>
          <div className="reuse-table-wrap">
            <table className="reuse-table">
              <thead>
                <tr>
                  <th>审查内容</th>
                  <th>组件名称</th>
                  <th>唯一数据量</th>
                  <th>问题数量</th>
                  <th>正确率</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((check) => (
                  <tr key={check} className={selectedMetric === check ? "selected-row" : ""}>
                    <td>篮球版本1</td>
                    <td>
                      <button className="reuse-link metric-link" onClick={() => setSelectedMetric(check)}>
                        {check}
                      </button>
                    </td>
                    <td>{files.length}</td>
                    <td>0</td>
                    <td><strong>100%</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  const issueColumns = columns.filter((column) => column.issue !== "无");
  const [selectedIssueFields, setSelectedIssueFields] = useState(issueColumns.map((column) => column.name));
  const [selectedSampleIds, setSelectedSampleIds] = useState(defaultCleaningSamples.map((sample) => sample.id));

  useEffect(() => {
    if (!scanning) return;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(100, current + 11);
        if (next === 100) {
          window.clearInterval(timer);
          setScanning(false);
          notify(`${table} 数据探查已完成`);
        }
        return next;
      });
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

function LocalDataManager({ notify }: { notify: Notify }) {
  type LocalFile = { name: string; format: string; size: string; records: string; updated: string; status: string };
  const [files, setFiles] = useState<LocalFile[]>([
    { name: "篮球图像数据集.zip", format: "ZIP / 图像", size: "286 MB", records: "2,480 个文件", updated: "2026-08-22 22:16", status: "可用" },
    { name: "金融年报问答集.csv", format: "CSV / 文本", size: "38.6 MB", records: "126,842 条", updated: "2026-08-22 18:32", status: "可用" },
    { name: "制度文档汇编.pdf", format: "PDF / 文档", size: "124 MB", records: "380 个文档", updated: "2026-08-21 15:08", status: "可用" },
    { name: "客服录音样本.wav", format: "WAV / 语音", size: "1.2 GB", records: "1,865 段", updated: "2026-08-20 11:46", status: "待解析" },
  ]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"列表" | "卡片">("列表");
  const input = useRef<HTMLInputElement>(null);
  const filtered = files.filter((file) => file.name.toLowerCase().includes(search.toLowerCase()));

  function addLocalFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;
    const added = selected.map((file) => ({
      name: file.name,
      format: `${file.name.split(".").pop()?.toUpperCase() || "文件"} / 自动识别`,
      size: file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`,
      records: "解析中",
      updated: "刚刚",
      status: "解析中",
    }));
    setFiles((current) => [...added, ...current]);
    event.target.value = "";
    notify(`已导入 ${added.length} 个本地文件，正在解析`);
    window.setTimeout(() => {
      const names = new Set(added.map((file) => file.name));
      setFiles((current) => current.map((file) => names.has(file.name) ? { ...file, records: "已识别", status: "可用" } : file));
    }, 1400);
  }

  return (
    <article className="white-panel inventory-workspace local-manager-workspace">
      <div className="reuse-panel-head inventory-head">
        <div><h2>本地数据管理</h2><p>上传、解析和管理用于治理与评估的本地文件</p></div>
        <div><label className="reuse-search"><UiIcon icon={Search} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索文件名称" /></label><div className="view-switch"><button aria-label="列表视图" className={view === "列表" ? "active" : ""} onClick={() => setView("列表")}><UiIcon icon={Rows3} /></button><button aria-label="卡片视图" className={view === "卡片" ? "active" : ""} onClick={() => setView("卡片")}><UiIcon icon={Grid2X2} /></button></div><button className="reuse-primary" onClick={() => input.current?.click()}><UiIcon icon={Upload} />导入本地文件</button></div>
      </div>
      <button className="local-dropzone" onClick={() => input.current?.click()}><span><UiIcon icon={Upload} size={20} /></span><div><strong>点击选择本地文件</strong><p>支持 CSV、Excel、JSON、PDF、图像、音频、视频及 ZIP，单文件建议不超过 2 GB</p></div><b>浏览文件</b></button>
      <input ref={input} className="visually-hidden" type="file" multiple onChange={addLocalFiles} />
      <div className="local-summary"><span>文件总数 <b>{files.length}</b></span><span>已解析 <b>{files.filter((file) => file.status === "可用").length}</b></span><span>存储占用 <b>1.65 GB</b></span><span>待处理 <b>{files.filter((file) => file.status !== "可用").length}</b></span></div>
      {view === "列表" ? (
        <div className="reuse-table-wrap"><table className="reuse-table local-file-table"><thead><tr><th>文件名称</th><th>格式 / 类型</th><th>大小</th><th>数据量</th><th>更新时间</th><th>解析状态</th><th>操作</th></tr></thead><tbody>{filtered.map((file, index) => (
          <tr key={file.name}><td><div className="local-file-name"><span className={`local-file-icon f${index % 4}`}>{file.format.slice(0, 2)}</span><strong>{file.name}</strong></div></td><td>{file.format}</td><td>{file.size}</td><td>{file.records}</td><td>{file.updated}</td><td><Status tone={file.status === "可用" ? "green" : file.status === "解析中" ? "blue" : "orange"}>{file.status}</Status></td><td><button className="reuse-link" onClick={() => notify(`正在预览 ${file.name}`)}>预览</button>{" "}<button className="reuse-link" onClick={() => notify(`${file.name} 已加入数据集创建向导`)}>创建数据集</button>{" "}<button className="reuse-link danger-link" onClick={() => { setFiles((current) => current.filter((item) => item.name !== file.name)); notify(`${file.name} 已从当前列表移除`); }}>移除</button></td></tr>
        ))}</tbody></table>{filtered.length === 0 && <div className="table-empty">未找到匹配的本地文件</div>}</div>
      ) : (
        <div className="local-file-grid">{filtered.map((file, index) => <button key={file.name} onClick={() => notify(`正在预览 ${file.name}`)}><span className={`local-file-icon f${index % 4}`}>{file.format.slice(0, 2)}</span><strong>{file.name}</strong><p>{file.format} · {file.size}</p><small>{file.records} · {file.updated}</small><Status tone={file.status === "可用" ? "green" : "orange"}>{file.status}</Status></button>)}</div>
      )}
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

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(100, current + 5);
        if (next === 100) {
          window.clearInterval(timer);
          setRunning(false);
          notify("智能数据盘点完成，发现 17 个新增资产");
        }
        return next;
      });
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
        <section className="sub-panel asset-tree-panel"><header><div><h3>{selected.name}资产目录</h3><p>{selected.assets} 个资产，按语义自动归类</p></div><button className="reuse-link" onClick={() => notify(`${selected.name}目录已展开到字段级`)}><UiIcon icon={GitBranch} />展开全部</button></header><div className="asset-tree">{[['基础信息', 26, '客户基本资料、身份标识'], ['行为记录', 34, '访问、咨询、服务轨迹'], ['价值指标', 18, '贡献度、生命周期价值'], ['标签特征', 50, '偏好、等级、风险标签']].map((item) => <button key={item[0]}><span><UiIcon icon={ChevronRight} size={12} /></span><i><UiIcon icon={FolderKanban} size={14} /></i><div><strong>{item[0]}</strong><small>{item[2]}</small></div><b>{item[1]}</b></button>)}</div></section>
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
  const [view, setView] = useState<"任务执行" | "版本管理">("任务执行");
  const [compareBaseVersion, setCompareBaseVersion] = useState(firstTask?.versions.at(-1)?.version ?? "");
  const [compareTargetVersion, setCompareTargetVersion] = useState(firstTask?.activeVersion ?? "");
  const [rollbackTarget, setRollbackTarget] = useState<CleaningVersionRow | null>(null);
  const selectedTask = tasks.find((task) => task.id === taskId) ?? tasks[0];
  const enabledCount = rules.filter((rule) => rule.enabled).length;

  useEffect(() => {
    if (!running || !selectedTask) return;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(100, current + 6);
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
        return next;
      });
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
  sources,
  cleaningTasks,
  openDialog,
  updateSource,
  createCleaningTask,
  updateCleaningTask,
  notify,
}: {
  sources: SourceRow[];
  cleaningTasks: CleaningTaskRow[];
  openDialog: () => void;
  updateSource: (name: string, patch: Partial<SourceRow>) => void;
  createCleaningTask: (task: CleaningTaskDraft) => string;
  updateCleaningTask: (id: string, patch: Partial<CleaningTaskRow>) => void;
  notify: Notify;
}) {
  const [section, setSection] = useState("数据库管理");
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
  enterWorkspace,
  notify,
}: {
  projects: ProjectRow[];
  openDialog: () => void;
  copyProject: (project: ProjectRow) => void;
  enterWorkspace: (project: ProjectRow) => void;
  notify: Notify;
}) {
  const [section, setSection] = useState("开发项目管理");
  const [search, setSearch] = useState("");
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
                {filtered.map((row) => (
                  <tr key={row.name}>
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
                      <button className="reuse-link" onClick={() => notify(`已打开 ${row.name} 的重命名编辑框`)}>重命名</button>
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
          <button disabled>‹</button><button className="active">1</button><button disabled>›</button>
        </footer>
      </article>
    </section>
  );
}

type WorkbenchNode = {
  id: string;
  label: string;
  kind: "dataset" | "recipe" | "annotation" | "output";
  meta: string;
  position: { left: number; top: number };
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
  notify,
}: {
  project: ProjectRow;
  onBack: () => void;
  notify: Notify;
}) {
  const [nodes, setNodes] = useState<WorkbenchNode[]>(workbenchNodes);
  const [edges, setEdges] = useState<WorkbenchEdge[]>(workbenchEdges);
  const [resourceType, setResourceType] = useState<"数据集" | "Recipe">("数据集");
  const [resourceSearch, setResourceSearch] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("image-label");
  const [inspectorTab, setInspectorTab] = useState<"配置" | "质量" | "血缘">("配置");
  const [zoom, setZoom] = useState(90);
  const [running, setRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(100);
  const [runMode, setRunMode] = useState<"flow" | "node" | null>(null);
  const [activeRunNodeId, setActiveRunNodeId] = useState<string | null>(null);
  const [failedNodeId, setFailedNodeId] = useState<string | null>(null);
  const [currentRunWillFail, setCurrentRunWillFail] = useState(false);
  const [hasSimulatedFailure, setHasSimulatedFailure] = useState(false);
  const [runStates, setRunStates] = useState<Record<string, WorkbenchNodeRunState>>(() => Object.fromEntries(workbenchNodes.map((node) => [node.id, {
    status: node.kind === "annotation" ? "运行中" : node.kind === "dataset" ? "未运行" : "成功",
    duration: node.kind === "recipe" ? "00:34" : "--",
    detail: node.meta,
  }])));
  const [logOpen, setLogOpen] = useState(true);
  const [saved, setSaved] = useState(true);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [nodeDraftKind, setNodeDraftKind] = useState<WorkbenchNode["kind"]>("recipe");
  const [nodeDraftName, setNodeDraftName] = useState("");
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkbenchNode | null>(null);
  const [annotationType, setAnnotationType] = useState("目标检测 + 关键点");
  const [annotationTeam, setAnnotationTeam] = useState("视觉标注一组");
  const [annotationLabels, setAnnotationLabels] = useState(["篮球", "运动员", "篮筐", "裁判", "三分线"]);
  const [annotationLabelDraft, setAnnotationLabelDraft] = useState("");
  const [aiPrelabel, setAiPrelabel] = useState(true);
  const [doubleReview, setDoubleReview] = useState(true);
  const [samplingRate, setSamplingRate] = useState(10);
  const [annotationProgress, setAnnotationProgress] = useState(94);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) || nodes[0] || workbenchNodes[0];
  const selectedProfile = workbenchNodeProfiles[selectedNode.id] ?? createWorkbenchProfile(selectedNode);
  const isAnnotationNode = selectedNode.kind === "annotation";
  const resources = nodes.filter((node) => resourceType === "数据集"
    ? node.kind === "dataset" || node.kind === "output"
    : node.kind === "recipe" || node.kind === "annotation");
  const filteredResources = resources.filter((node) => node.label.includes(resourceSearch));
  const resourceCount = {
    数据集: nodes.filter((node) => node.kind === "dataset" || node.kind === "output").length,
    Recipe: nodes.filter((node) => node.kind === "recipe" || node.kind === "annotation").length,
  };
  const runtimeNodes = nodes.filter((node) => node.kind === "recipe" || node.kind === "annotation" || node.kind === "output");
  const successfulNodeCount = runtimeNodes.filter((node) => runStates[node.id]?.status === "成功").length;
  const canvasHeight = Math.max(390, ...nodes.map((node) => node.position.top + 100));
  const selectedUpstream = edges.filter((edge) => edge.to === selectedNode.id).map((edge) => nodes.find((node) => node.id === edge.from)?.label).filter(Boolean) as string[];
  const selectedDownstream = edges.filter((edge) => edge.from === selectedNode.id).map((edge) => nodes.find((node) => node.id === edge.to)?.label).filter(Boolean) as string[];
  const selectedMetrics = isAnnotationNode
    ? selectedProfile.quality.map((metric, index) => index === 0 ? { ...metric, value: `${annotationProgress.toFixed(1)}%`, score: annotationProgress } : metric)
    : selectedProfile.quality;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRunProgress((current) => {
        const next = Math.min(100, current + (runMode === "node" ? 12 : 8));
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
          return 76;
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
        return next;
      });
    }, 360);
    return () => window.clearInterval(timer);
  }, [activeRunNodeId, currentRunWillFail, nodes, notify, project.name, runMode, running, runtimeNodes]);

  function runFlow() {
    setRunProgress(4);
    setRunning(true);
    setRunMode("flow");
    setActiveRunNodeId(null);
    setCurrentRunWillFail(!hasSimulatedFailure);
    setFailedNodeId(null);
    setRunStates((current) => Object.fromEntries(nodes.map((node) => [node.id, node.kind === "dataset" ? current[node.id] ?? { status: "未运行", duration: "--", detail: node.meta } : { status: "等待中", duration: "--", detail: "等待上游节点" }])));
    setLogOpen(true);
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
    setRunStates((current) => ({ ...current, [node.id]: { status: "未运行", duration: "--", detail: "等待配置与连接" } }));
    setSelectedNodeId(node.id);
    setInspectorTab("配置");
    setNodeDialogOpen(false);
    setNodeDraftName("");
    setSaved(false);
    notify(`${node.label} 已添加到治理画布`);
  }

  function removeWorkbenchNode() {
    if (!deleteTarget || nodes.length === 1) return;
    const remainingNodes = nodes.filter((node) => node.id !== deleteTarget.id);
    setNodes(remainingNodes);
    setEdges((current) => current.filter((edge) => edge.from !== deleteTarget.id && edge.to !== deleteTarget.id));
    setRunStates((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== deleteTarget.id)));
    if (selectedNodeId === deleteTarget.id) setSelectedNodeId(remainingNodes[0].id);
    if (failedNodeId === deleteTarget.id) setFailedNodeId(null);
    if (connectingFromId === deleteTarget.id) setConnectingFromId(null);
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
    setLogOpen(true);
    notify(`${node.label} 已开始重新执行`);
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

  function openAnnotationWorkspace() {
    setAnnotationProgress((current) => Math.min(100, current + 0.6));
    setSaved(false);
    notify(`已打开${annotationTeam}的标注工作台，并领取下一批 50 个样本`);
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
          <button title="撤销" aria-label="撤销" onClick={() => notify("已撤销上一步画布操作")}><UiIcon icon={Undo2} /></button>
          <button title="重做" aria-label="重做" onClick={() => notify("已重做画布操作")}><UiIcon icon={Redo2} /></button>
          <button className="workbench-save" onClick={() => { setSaved(true); notify("项目流程已保存"); }}><UiIcon icon={Save} />保存</button>
          <button onClick={() => notify("已打开定时任务配置")}><UiIcon icon={CalendarClock} />定时任务</button>
          <button className="workbench-run" disabled={running} onClick={runFlow}><UiIcon icon={running ? RefreshCw : Play} />{running ? `运行中 ${runProgress}%` : "运行全部"}</button>
        </div>
      </header>

      <nav className="workbench-view-tabs">
        <div>
          {["数据流程", "数据集", "Recipes", "分析", "仪表板"].map((item, index) => (
            <button key={item} className={index === 0 ? "active" : ""} onClick={() => index === 0 ? undefined : notify(`${item}视图已准备，可从当前流程资源进入`)}>{item}</button>
          ))}
        </div>
        <div className="canvas-view-actions">
          <button onClick={() => { setZoom(90); notify("已自动整理流程画布"); }}><UiIcon icon={LayoutDashboard} />自动布局</button>
          <button aria-label="缩小画布" onClick={() => setZoom((value) => Math.max(60, value - 10))}><UiIcon icon={Minus} /></button><span>{zoom}%</span><button aria-label="放大画布" onClick={() => setZoom((value) => Math.min(130, value + 10))}><UiIcon icon={ZoomIn} /></button>
        </div>
      </nav>

      <div className={`workbench-body ${logOpen ? "with-log" : ""}`}>
        <aside className="flow-resource-panel">
          <header><strong>项目资源</strong><button aria-label="添加项目资源" onClick={() => setNodeDialogOpen(true)}><UiIcon icon={Plus} /></button></header>
          <div className="resource-tabs">
            {(["数据集", "Recipe"] as const).map((item) => <button key={item} className={resourceType === item ? "active" : ""} onClick={() => setResourceType(item)}>{item}<b>{resourceCount[item]}</b></button>)}
          </div>
          <label className="resource-search"><UiIcon icon={Search} /><input value={resourceSearch} onChange={(event) => setResourceSearch(event.target.value)} placeholder={`搜索${resourceType}`} /></label>
          <div className="resource-list">
            {filteredResources.map((node) => (
              <button key={node.id} className={selectedNodeId === node.id ? "active" : ""} onClick={() => selectNode(node.id)}>
                <span className={node.kind}><UiIcon icon={getWorkbenchNodeIcon(node.kind)} size={15} /></span>
                <div><strong>{node.label}</strong><small>{node.meta}</small></div><i><UiIcon icon={ChevronRight} size={13} /></i>
              </button>
            ))}
            {filteredResources.length === 0 && <p className="resource-empty">没有匹配的资源</p>}
          </div>
          <footer><span className={failedNodeId ? "has-failure" : ""}><UiIcon icon={failedNodeId ? TriangleAlert : CircleCheck} size={11} />{failedNodeId ? "1 个节点等待重试" : `${successfulNodeCount} 个节点已成功运行`}</span><button aria-label="刷新项目资源" onClick={() => notify("已刷新项目资源")}><UiIcon icon={RefreshCw} size={13} /></button></footer>
        </aside>

        <main className="flow-canvas-shell">
          <header className="flow-canvas-head">
            <div><span className="live-dot" /><strong>主流程</strong><small>最近保存：刚刚</small></div>
            <div><button onClick={() => setNodeDialogOpen(true)}><UiIcon icon={Plus} />添加节点</button><button className={connectingFromId ? "active" : ""} onClick={startConnecting}><UiIcon icon={Link2} />{connectingFromId ? "取消连线" : "连接节点"}</button><button onClick={() => notify("流程筛选器已展开")}><UiIcon icon={Filter} />筛选</button><button onClick={() => notify("流程已导出为 PNG")}><UiIcon icon={Download} />导出</button><button onClick={() => notify("已定位全部流程节点")}><UiIcon icon={LocateFixed} />定位</button></div>
          </header>
          <div className="flow-canvas-viewport">
            {connectingFromId && <div className="connection-mode-banner"><UiIcon icon={Link2} /><span>上游：<strong>{nodes.find((node) => node.id === connectingFromId)?.label}</strong>，点击下游节点完成连接</span><button onClick={() => setConnectingFromId(null)}>取消</button></div>}
            <div className="flow-canvas" style={{ height: canvasHeight, transform: `scale(${zoom / 100})` }}>
              <div className="flow-lane-label lane-input">原始数据</div><div className="flow-lane-label lane-process">治理处理</div><div className="flow-lane-label lane-output">高质量数据</div>
              {edges.map((edge) => {
                const style = getWorkbenchEdgeStyle(edge, nodes);
                return style && <i key={edge.id} className="flow-edge" style={{ left: style.left, top: style.top, width: style.width, transform: `rotate(${style.rotate}deg)` }}><b /></i>;
              })}
              {nodes.map((node) => {
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
            </div>
          </div>
          <div className="canvas-minimap"><i /><i /><i /><i /><span /></div>
        </main>

        <aside className="node-inspector">
          <header><div><span className={selectedNode.kind}><UiIcon icon={getWorkbenchNodeIcon(selectedNode.kind)} size={16} /></span><div><strong>{selectedNode.label}</strong><small>{selectedProfile.typeLabel} · {selectedNode.meta}</small></div></div><div className="node-inspector-actions"><button aria-label="从当前节点连接" title="从当前节点连接" onClick={startConnecting}><UiIcon icon={Link2} /></button><button aria-label="删除当前节点" title="删除当前节点" disabled={nodes.length === 1} onClick={() => setDeleteTarget(selectedNode)}><UiIcon icon={Trash2} /></button><button aria-label="更多节点操作" onClick={() => notify(`${selectedNode.label} 的更多操作已展开`)}><UiIcon icon={MoreHorizontal} /></button></div></header>
          <div className="inspector-tabs">{(["配置", "质量", "血缘"] as const).map((tab) => <button className={inspectorTab === tab ? "active" : ""} key={tab} onClick={() => setInspectorTab(tab)}>{tab}</button>)}</div>
          {inspectorTab === "配置" && <div className="inspector-content">
            {isAnnotationNode ? <>
              <div className="annotation-config-head"><div><h4>标注任务配置</h4><small>剩余 {Math.max(0, Math.round(12680 * (100 - annotationProgress) / 100)).toLocaleString()} 个样本待标注</small></div><Status tone="blue">进行中</Status></div>
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
              <button className="inspector-secondary" onClick={() => notify(`已将待标样本分派给${annotationTeam}`)}><UiIcon icon={UserRound} />分派剩余任务</button>
            </> : <>
              <h4>{selectedProfile.typeLabel}配置</h4>
              <label>节点名称<input key={selectedNode.id} defaultValue={selectedNode.label} onChange={() => setSaved(false)} /></label>
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
          <footer><button onClick={() => notify(isAnnotationNode ? "标注规范、类别和质检规则校验通过" : `已校验 ${selectedNode.label} 的配置`)}><UiIcon icon={Check} />{isAnnotationNode ? "检查标注规范" : "校验配置"}</button><button className="primary" disabled={running} onClick={isAnnotationNode ? openAnnotationWorkspace : () => runNode(selectedNode.id)}><UiIcon icon={isAnnotationNode ? ClipboardCheck : Play} />{isAnnotationNode ? "打开标注工作台" : runStates[selectedNode.id]?.status === "失败" ? "重试当前节点" : "运行当前节点"}</button></footer>
        </aside>

        <section className={`workbench-run-log ${logOpen ? "open" : ""}`}>
          <header><div><strong>运行记录</strong><span className={failedNodeId ? "failed" : running ? "running" : ""}>{failedNodeId ? `${nodes.find((node) => node.id === failedNodeId)?.label} 运行失败` : running ? `运行中 · ${runProgress}%` : "最近运行成功 · 刚刚"}</span>{failedNodeId && <button className="retry-failed-node" disabled={running} onClick={() => runNode(failedNodeId)}><UiIcon icon={RefreshCw} />重试失败节点</button>}</div><div><button aria-label="刷新运行记录" onClick={() => notify("运行记录已刷新")}><UiIcon icon={RefreshCw} size={13} /></button><button aria-label={logOpen ? "收起运行记录" : "展开运行记录"} onClick={() => setLogOpen(!logOpen)}><UiIcon icon={SlidersHorizontal} size={13} /></button></div></header>
          {logOpen && <div className="run-log-body">
            <div className={`run-progress ${failedNodeId ? "failed" : ""}`}><i><b style={{ width: `${running || failedNodeId ? runProgress : 100}%` }} /></i><span>{failedNodeId ? `中断于 ${runProgress}%` : running ? `${runProgress}%` : "100%"}</span></div>
            <div className="run-log-rows">
              {runtimeNodes.map((node) => {
                const state = runStates[node.id] ?? { status: "未运行" as const, duration: "--", detail: node.meta };
                const stateClass = state.status === "成功" ? "success" : state.status === "运行中" ? "progress" : state.status === "失败" ? "failed" : "waiting";
                return <button key={node.id} className={state.status === "失败" ? "failed" : ""} onClick={() => { selectNode(node.id); notify(`${node.label}：${state.detail}`); }}><span className={stateClass}>{state.status === "成功" ? "✓" : state.status === "运行中" ? "◌" : state.status === "失败" ? "!" : "·"}</span><strong>{node.label}</strong><small>{state.detail}</small><b>{state.duration}</b></button>;
              })}
            </div>
          </div>}
        </section>
      </div>
      {nodeDialogOpen && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="关闭添加节点" onClick={() => setNodeDialogOpen(false)} /><form className="reuse-dialog workbench-node-dialog" onSubmit={addWorkbenchNode}><header><div><h2>添加治理节点</h2><p>节点加入画布后可继续配置并连接上下游</p></div><button type="button" aria-label="关闭添加节点" onClick={() => setNodeDialogOpen(false)}><UiIcon icon={X} /></button></header><label>节点类型<select value={nodeDraftKind} onChange={(event) => setNodeDraftKind(event.target.value as WorkbenchNode["kind"])}><option value="dataset">数据集</option><option value="recipe">治理 Recipe</option><option value="annotation">标注任务</option><option value="output">输出数据集</option></select></label><label>节点名称<input required value={nodeDraftName} onChange={(event) => setNodeDraftName(event.target.value)} placeholder="请输入节点名称" /></label><div className="workbench-node-dialog-tip"><UiIcon icon={Link2} /><span>添加后选择“连接节点”，再依次点击上游和下游节点即可建立血缘。</span></div><footer><button type="button" className="reuse-secondary" onClick={() => setNodeDialogOpen(false)}>取消</button><button className="reuse-primary"><UiIcon icon={Plus} />添加到画布</button></footer></form></div>}
      {deleteTarget && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="关闭删除确认" onClick={() => setDeleteTarget(null)} /><div className="reuse-dialog workbench-delete-dialog"><header><div><h2>删除治理节点</h2><p>{project.name}</p></div><button aria-label="关闭删除确认" onClick={() => setDeleteTarget(null)}><UiIcon icon={X} /></button></header><section><span><UiIcon icon={TriangleAlert} size={20} /></span><div><h3>确认删除“{deleteTarget.label}”</h3><p>该节点及与其相连的 {edges.filter((edge) => edge.from === deleteTarget.id || edge.to === deleteTarget.id).length} 条血缘连线将从当前画布移除，其他节点和运行记录不会受影响。</p></div></section><footer><button className="reuse-secondary" onClick={() => setDeleteTarget(null)}>取消</button><button className="reuse-danger" onClick={removeWorkbenchNode}><UiIcon icon={Trash2} />确认删除</button></footer></div></div>}
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
        <footer className="reuse-pagination"><span>共 {filtered.length} 条</span><button disabled>‹</button><button className="active">1</button><button disabled>›</button></footer>
      </article> : <article className="white-panel governance-run-panel">
        <header className="algorithm-page-head"><div><h2>算法运行记录</h2><p>追踪算法执行状态、耗时和处理数据集</p></div><button className="reuse-secondary" onClick={() => notify("运行记录已刷新")}><UiIcon icon={RefreshCw} />刷新</button></header>
        <div className="run-summary-bar"><span><b>今日运行</b><strong>28</strong></span><span><b>成功</b><strong>25</strong></span><span><b>运行中</b><strong>2</strong></span><span><b>失败</b><strong>1</strong></span></div>
        <div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>算法名称</th><th>治理项目</th><th>输入数据集</th><th>运行状态</th><th>耗时</th><th>开始时间</th><th>操作</th></tr></thead><tbody>{runRows.map((row) => <tr key={`${row[0]}-${row[5]}`}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td><Status tone={row[3] === '成功' ? 'green' : row[3] === '运行中' ? 'blue' : 'orange'}>{row[3]}</Status></td><td>{row[4]}</td><td>{row[5]}</td><td><button className="reuse-link" onClick={() => notify(`${row[0]} 的运行日志已展开`)}>查看日志</button>{" "}{row[3] === '失败' && <button className="reuse-link" onClick={() => notify(`${row[0]} 已重新运行`)}>重试</button>}</td></tr>)}</tbody></table></div>
      </article>}

      {selected && <div className="algorithm-drawer-backdrop"><aside className="algorithm-detail-drawer">
        <header><div><span><UiIcon icon={Settings2} size={17} /></span><div><strong>{selected.name}</strong><small>{selected.code} · {selected.version}</small></div></div><button aria-label="关闭算法详情" onClick={() => setSelected(null)}><UiIcon icon={X} /></button></header>
        <nav><button className="active">基本信息</button><button onClick={() => notify("参数配置页已切换")}>参数配置</button><button onClick={() => notify("版本记录页已切换")}>版本记录</button></nav>
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

const assessmentComponents = ["图像完好性", "图像重复率合规性", "图像涉黄合规性", "图像格式一致性", "图像内容有效性"];

const initialAssessmentIssues: AssessmentIssue[] = [
  { id: "QA-0823-001", sample: "basketball_03812.jpeg", component: "图像重复率合规性", problem: "与 basketball_01866.jpeg 相似度 99.2%", severity: "中", assignee: "未分派", status: "待处理", suggestion: "保留分辨率更高的样本，移除重复文件" },
  { id: "QA-0823-002", sample: "basketball_09218.jpeg", component: "图像内容有效性", problem: "主体遮挡面积超过 65%", severity: "高", assignee: "视觉数据治理组", status: "已分派", suggestion: "转入人工复核并补充主体可见性标签" },
  { id: "QA-0823-003", sample: "basketball_00186.jpeg", component: "图像格式一致性", problem: "色彩空间为 CMYK，不符合 sRGB 标准", severity: "低", assignee: "数据生产一组", status: "待复核", suggestion: "转换为 JPEG / sRGB 后重新评估" },
];

function AssessmentPage({
  tasks,
  openDialog,
  notify,
}: {
  tasks: string[];
  openDialog: () => void;
  notify: Notify;
}) {
  const [task, setTask] = useState(tasks[0]);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState(72);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<"评估执行" | "问题闭环">("评估执行");
  const [configOpen, setConfigOpen] = useState(false);
  const [config, setConfig] = useState<AssessmentConfig>({ dataset: "篮球高质量数据集1", standard: "图像质量评估标准 v2", sampling: "全量评估", threshold: 95, components: assessmentComponents });
  const [configDraft, setConfigDraft] = useState<AssessmentConfig>(config);
  const [issues, setIssues] = useState<AssessmentIssue[]>(initialAssessmentIssues);
  const [issueFilter, setIssueFilter] = useState("全部状态");
  const filteredTasks = tasks.filter((item) => item.toLowerCase().includes(search.toLowerCase()));
  const completedCount = progress >= 100 ? config.components.length : Math.min(Math.max(0, config.components.length - 1), Math.floor(progress / Math.max(1, 100 / config.components.length)));
  const openIssueCount = issues.filter((issue) => issue.status !== "已关闭").length;
  const closedIssueCount = issues.length - openIssueCount;
  const filteredIssues = issues.filter((issue) => issueFilter === "全部状态" || issue.status === issueFilter);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(100, current + 7);
        if (next === 100) {
          window.clearInterval(timer);
          setRunning(false);
          notify(`${task} 已完成全部质量组件`);
        }
        return next;
      });
    }, 360);
    return () => window.clearInterval(timer);
  }, [running, notify, task]);

  function selectTask(item: string, index: number) {
    setTask(item);
    setProgress(index < 2 ? 72 : 20);
    setRunning(false);
    setView("评估执行");
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
                    <td><strong>{name}</strong></td><td>2</td><td>{complete && index === 1 ? 1 : 0}</td>
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
      {configOpen && <div className="dialog-backdrop"><button className="dialog-dismiss" aria-label="关闭评估配置" onClick={() => setConfigOpen(false)} /><form className="reuse-dialog assessment-config-dialog" onSubmit={saveAssessmentConfig}><header><div><h2>评估任务配置</h2><p>{task} · 保存后将重新执行评估</p></div><button type="button" aria-label="关闭评估配置" onClick={() => setConfigOpen(false)}><UiIcon icon={X} /></button></header><label>评估数据集<select value={configDraft.dataset} onChange={(event) => setConfigDraft((current) => ({ ...current, dataset: event.target.value }))}><option>篮球高质量数据集1</option><option>金融年报问答集 v2.1</option><option>客服知识数据集 v3.4</option></select></label><label>评估标准<select value={configDraft.standard} onChange={(event) => setConfigDraft((current) => ({ ...current, standard: event.target.value }))}><option>图像质量评估标准 v2</option><option>多模态训练数据标准 v3</option><option>SFT 数据质量标准 v2</option></select></label><label>抽样策略<select value={configDraft.sampling} onChange={(event) => setConfigDraft((current) => ({ ...current, sampling: event.target.value }))}><option>全量评估</option><option>分层抽样 20%</option><option>风险优先抽样</option></select></label><label>通过阈值<div className="assessment-threshold-field"><input type="range" min="80" max="100" value={configDraft.threshold} onChange={(event) => setConfigDraft((current) => ({ ...current, threshold: Number(event.target.value) }))} /><strong>{configDraft.threshold} 分</strong></div></label><fieldset><legend>质量评估组件 <small>已选择 {configDraft.components.length} 项</small></legend><div>{assessmentComponents.map((component) => <label key={component}><span className="visually-hidden">评估组件</span><input type="checkbox" checked={configDraft.components.includes(component)} onChange={() => toggleAssessmentComponent(component)} /><span><strong>{component}</strong><small>{component.includes("重复") ? "识别完全重复与近似重复样本" : component.includes("格式") ? "检查编码、色彩空间和文件格式" : "按标准规则检查并输出问题样本"}</small></span></label>)}</div></fieldset><footer><button type="button" className="reuse-secondary" onClick={() => setConfigOpen(false)}>取消</button><button className="reuse-primary"><UiIcon icon={Save} />保存配置</button></footer></form></div>}
    </section>
  );
}

function ModelDevelopment({
  jobs,
  openDialog,
  notify,
  openLog,
  toggleJob,
}: {
  jobs: JobRow[];
  openDialog: (preset?: string) => void;
  notify: Notify;
  openLog: (job: JobRow) => void;
  toggleJob: (name: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = jobs.filter((job) => job.name.toLowerCase().includes(search.toLowerCase()));
  const capabilities = [
    ["大模型训练工具链", "微调训练", "LoRA、QLoRA、全量 SFT"],
    ["大模型蒸馏轻量化", "蒸馏量化", "INT8 / INT4 与知识蒸馏"],
    ["大模型 RAG 增强", "RAG 增强", "切片、索引、检索、重排"],
    ["模型注册与推理", "模型注册", "版本、审批、回滚、服务发布"],
  ];

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
                <tr key={job.name}>
                  <td><strong>{job.name}</strong></td><td>{job.type}</td><td>{job.model}</td><td>{job.dataset}</td>
                  <td><div className="job-progress"><Progress value={job.progress} /><span>{job.progress}%</span></div></td>
                  <td><span className="secure-tag">可用不可见</span></td>
                  <td><Status tone={job.status === "已完成" ? "green" : job.status === "训练中" ? "blue" : job.status === "已暂停" ? "gray" : "orange"}>{job.status}</Status></td>
                  <td>
                    <button className="reuse-link" onClick={() => openLog(job)}>查看日志</button>{" "}
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
    </section>
  );
}

function ModelEvaluation({
  evaluations,
  openDialog,
  notify,
  runEvaluation,
}: {
  evaluations: EvaluationRow[];
  openDialog: () => void;
  notify: Notify;
  runEvaluation: (name: string) => void;
}) {
  const [view, setView] = useState<"综合" | "安全" | "性能">("综合");
  const [selectedName, setSelectedName] = useState(evaluations[0]?.name ?? "");
  const selected = evaluations.find((item) => item.name === selectedName) ?? evaluations[0];
  const metrics = useMemo(() => {
    const base = [["准确率", 83.4, 91.8], ["召回率", 78.6, 89.7], ["F1 值", 80.9, 90.7], ["事实忠实度", 86.2, 94.1], ["安全通过率", 98.1, 99.4]];
    if (view === "安全") return [["越权防护", 91.2, 98.7], ["敏感内容", 95.3, 99.4], ["提示注入", 88.6, 97.8], ["隐私保护", 94.2, 99.1], ["内容合规", 96.1, 99.6]];
    if (view === "性能") return [["首字延迟", 72.4, 88.1], ["吞吐量", 68.7, 91.4], ["并发稳定", 81.2, 93.5], ["长文本", 79.8, 90.2], ["资源效率", 75.6, 89.7]];
    return base;
  }, [view]);

  return (
    <section className="reuse-content-page model-eval-page">
      <article className="white-panel evaluation-overview">
        <div>
          <p>评测任务 · {selected?.date}</p>
          <h2>{selected?.model} <span>对比</span> qwen3-8b-base</h2>
          <small>{selected?.dataset} · 2,000 条样本 · 双盲评测</small>
        </div>
        <div className={`gate-pass ${selected?.status !== "通过" ? "waiting" : ""}`}>
          <span>发布门禁</span><strong>{selected?.status === "通过" ? "通过" : "待评测"}</strong>
          <small>{selected?.status === "通过" ? "5 / 5 核心指标达标" : "等待评测任务完成"}</small>
        </div>
      </article>
      <div className="model-eval-grid">
        <article className="white-panel metric-panel">
          <div className="reuse-panel-head small">
            <div><h2>能力指标对比</h2><p>基线模型 / 候选模型</p></div>
            <div className="eval-switch">
              {(["综合", "安全", "性能"] as const).map((item) => (
                <button className={view === item ? "active" : ""} key={item} onClick={() => setView(item)}>{item}</button>
              ))}
            </div>
          </div>
          {metrics.map((metric) => (
            <div className="eval-metric-row" key={metric[0] as string}>
              <strong>{metric[0]}</strong>
              <div><i className="base" style={{ width: `${metric[1]}%` }} /><i className="candidate" style={{ width: `${metric[2]}%` }} /></div>
              <span>{metric[1]}</span><b>{metric[2]}</b>
            </div>
          ))}
        </article>
        <article className="white-panel test-panel">
          <div className="reuse-panel-head small"><div><h2>评测工具</h2><p>功能、性能与安全</p></div></div>
          {["功能测试", "性能测试", "安全测试", "鲁棒性测试"].map((name, index) => (
            <button className="test-row" key={name} onClick={() => notify(`${name}详情已更新到当前评测上下文`)}>
              <span>✓</span><div><strong>{name}</strong><small>{["48 / 48", "P95 620ms", "1,000 条", "92.4 分"][index]}</small></div><Status>通过</Status>
            </button>
          ))}
        </article>
      </div>
      <article className="white-panel reuse-list-panel">
        <div className="reuse-panel-head">
          <div><h2>评测任务列表</h2><p>模型版本必须通过评测门禁后才能发布</p></div>
          <button className="reuse-primary" onClick={openDialog}><UiIcon icon={Plus} />新建评测任务</button>
        </div>
        <div className="reuse-table-wrap">
          <table className="reuse-table">
            <thead><tr><th>评测任务</th><th>候选模型</th><th>评测数据</th><th>综合得分</th><th>创建时间</th><th>门禁结果</th><th>操作</th></tr></thead>
            <tbody>
              {evaluations.map((row) => (
                <tr key={row.name} className={selected?.name === row.name ? "selected-row" : ""}>
                  <td><strong>{row.name}</strong></td><td>{row.model}</td><td>{row.dataset}</td><td><strong>{row.score}</strong></td><td>{row.date}</td>
                  <td><Status tone={row.status === "通过" ? "green" : row.status === "评测中" ? "blue" : "gray"}>{row.status}</Status></td>
                  <td>
                    <button className="reuse-link" onClick={() => setSelectedName(row.name)}>查看详情</button>{" "}
                    {row.status === "待评测" && <button className="reuse-link" onClick={() => runEvaluation(row.name)}>开始评测</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
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
  const [name, setName] = useState("");
  const [option, setOption] = useState(defaultOption);
  const [model, setModel] = useState("Qwen3-8B");
  const [dataset, setDataset] = useState("金融年报问答集 v2.1");
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
    window.setTimeout(() => onCreated({ kind: id, name, option, model, dataset, endpoint: connectionAddress, strategy: connectionStrategy }), 520);
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
      <form className="reuse-dialog" onSubmit={submit}>
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
            placeholder={id === "assessment" ? "请输入审查任务名称" : id === "model" ? "例如：finance-sft-lora-08" : "请输入名称"}
          />
        </label>
        {id === "assessment" && (
          <>
            <div className="dialog-tabs">
              {["语句文件", "数据产品", "自定义审查", "多模态审查"].map((item) => (
                <button type="button" className={option === item ? "active" : ""} key={item} onClick={() => setOption(item)}>{item}</button>
              ))}
            </div>
            <label>数据集<select value={dataset} onChange={(event) => setDataset(event.target.value)}><option>篮球高质量数据集1</option><option>金融年报问答集 v2.1</option></select></label>
            <label>审查方案<select defaultValue="图像质量评估标准 v2"><option>图像质量评估标准 v2</option><option>SFT 数据质量标准 v2</option></select></label>
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
            <label>评测类型<select value={option} onChange={(event) => setOption(event.target.value)}><option>综合能力评测</option><option>安全专项评测</option><option>性能专项评测</option></select></label>
            <label>候选模型<select value={model} onChange={(event) => setModel(event.target.value)}><option>finance-assistant-v2.3</option><option>service-rag-v3.4</option><option>vision-agent-v1.8</option></select></label>
            <label>评测数据<select value={dataset} onChange={(event) => setDataset(event.target.value)}><option>金融问答评测集 v4.2</option><option>客服检索评测集 v3</option><option>多模态安全集 v2</option></select></label>
          </>
        )}
        <footer>
          <button type="button" className="reuse-secondary" onClick={onClose}>取消</button>
          <button className="reuse-primary" disabled={saving || (id === "connection" && connectionTest !== "success")}>{saving ? "创建中..." : id === "connection" ? "保存连接" : "确定"}</button>
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
  const [loggedIn, setLoggedIn] = useState(true);
  const [active, setActive] = useState<ModuleId>("home");
  const [tabs, setTabs] = useState<Array<{ id: ModuleId; label: string }>>([{ id: "home", label: "首页" }]);
  const [menuOpen, setMenuOpen] = useState<ModuleId | null>(null);
  const [project, setProject] = useState("高质量数据集评估演示");
  const [dialog, setDialog] = useState<DialogId>(null);
  const [dialogPreset, setDialogPreset] = useState("");
  const [toast, setToast] = useState("");
  const [assistant, setAssistant] = useState(false);
  const [topPanel, setTopPanel] = useState<TopPanelId>(null);
  const [messagesRead, setMessagesRead] = useState(false);
  const [compact, setCompact] = useState(false);
  const [filters] = useState<FilterValues>({ dataType: "全部", status: "全部", date: "" });
  const [projects, setProjects] = useState(initialProjects);
  const [workspaceProject, setWorkspaceProject] = useState<ProjectRow | null>(null);
  const [governanceView, setGovernanceView] = useState<GovernanceView>("projects");
  const [sources, setSources] = useState(initialSources);
  const [cleaningTasks, setCleaningTasks] = useState(initialCleaningTasks);
  const [reviewTasks, setReviewTasks] = useState(initialReviewTasks);
  const [jobs, setJobs] = useState(initialJobs);
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [logJob, setLogJob] = useState<JobRow | null>(null);
  const toastTimer = useRef<number | null>(null);

  const notify = useCallback((message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  }, []);

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

  function openModule(id: ModuleId, label?: string) {
    const moduleItem = modules.find((item) => item.id === id)!;
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

  function openCreate(id: Exclude<DialogId, null>, preset = "") {
    setDialogPreset(preset);
    setDialog(id);
  }

  function handleCreated(payload: CreatePayload) {
    const today = "2026-08-23";
    if (payload.kind === "assessment") {
      setReviewTasks((current) => [payload.name, ...current]);
    }
    if (payload.kind === "model") {
      setJobs((current) => [
        { name: payload.name, type: payload.option, model: payload.model, dataset: payload.dataset, progress: 0, status: "排队中" },
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
        { name: payload.name, overview: "0 Datasets  0 Recipes", created: today, updated: today },
        ...current,
      ]);
    }
    if (payload.kind === "evaluation") {
      setEvaluations((current) => [
        { name: payload.name, model: payload.model, dataset: payload.dataset, score: "--", date: today, status: "待评测" },
        ...current,
      ]);
    }
    setDialog(null);
    notify(`${payload.name} 已创建并加入列表`);
  }

  function toggleJob(name: string) {
    setJobs((current) => current.map((job) => {
      if (job.name !== name) return job;
      if (job.status === "训练中") return { ...job, status: "已暂停" };
      return { ...job, status: "训练中", progress: Math.max(job.progress, 8) };
    }));
  }

  function runEvaluation(name: string) {
    setEvaluations((current) => current.map((item) => item.name === name ? { ...item, status: "评测中" } : item));
    notify(`${name} 已开始运行`);
  }

  function updateSource(name: string, patch: Partial<SourceRow>) {
    setSources((current) => current.map((source) => source.name === name ? { ...source, ...patch } : source));
  }

  const createCleaningTask = useCallback((task: CleaningTaskDraft) => {
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
  }, []);

  const updateCleaningTask = useCallback((id: string, patch: Partial<CleaningTaskRow>) => {
    setCleaningTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  }, []);

  if (!loggedIn) return <Login onLogin={() => { setLoggedIn(true); notify("登录成功，欢迎回来"); }} />;

  const currentModule = modules.find((item) => item.id === active)!;

  return (
    <div className={`reuse-app ${compact ? "compact" : ""}`}>
      <aside className="icon-rail">
        <div className="rail-logo">质</div>
        <nav aria-label="平台模块">
          {modules.map((item) => (
            <button
              key={item.id}
              className={active === item.id ? "active" : ""}
              onClick={() => item.children.length ? setMenuOpen(menuOpen === item.id ? null : item.id) : openModule(item.id)}
              title={item.label}
              aria-current={active === item.id ? "page" : undefined}
              aria-expanded={item.children.length ? menuOpen === item.id : undefined}
            >
              <span><UiIcon icon={item.icon} size={20} /></span><small>{item.short}</small>
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
          <i /><i /><i /><i />
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
        <nav>
          <button className={topPanel === "guide" ? "active" : ""} onClick={() => setTopPanel(topPanel === "guide" ? null : "guide")}><UiIcon icon={BookOpen} />快速入门</button>
          <button className={topPanel === "profile" ? "active" : ""} onClick={() => setTopPanel(topPanel === "profile" ? null : "profile")}><UiIcon icon={UserRound} />我的主页</button>
          <button className={topPanel === "messages" ? "active" : ""} onClick={() => setTopPanel(topPanel === "messages" ? null : "messages")}><UiIcon icon={Bell} />消息{!messagesRead && <b className="message-badge">3</b>}</button>
          <button onClick={() => setLoggedIn(false)}><UiIcon icon={LogOut} />退出登录</button><i /><strong>高质量数据评估演示</strong>
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
              <header><div><strong>高质量数据评估演示</strong><span>平台管理员</span></div><button aria-label="关闭个人信息" onClick={() => setTopPanel(null)}><UiIcon icon={X} size={16} /></button></header>
              <div className="profile-card"><span>高</span><div><strong>演示租户</strong><small>最后登录：刚刚 · 本地环境</small></div></div>
              <div className="profile-stats"><span><b>12</b>数据集</span><span><b>20</b>治理任务</span><span><b>{jobs.length}</b>模型任务</span></div>
            </>
          )}
          {topPanel === "messages" && (
            <>
              <header><div><strong>消息中心</strong><span>{messagesRead ? "没有未读消息" : "3 条未读消息"}</span></div><button aria-label="关闭消息中心" onClick={() => setTopPanel(null)}><UiIcon icon={X} size={16} /></button></header>
              {["篮球版本1评估已完成", "finance-sft-lora-07 已运行至 68%", "安全评测门禁已通过"].map((message, index) => (
                <button className="message-item" key={message} onClick={() => notify(message)}><i className={messagesRead ? "read" : ""} /><div><strong>{message}</strong><small>{["2 分钟前", "8 分钟前", "26 分钟前"][index]}</small></div></button>
              ))}
              <button className="mark-read" onClick={() => setMessagesRead(true)}>全部标为已读</button>
            </>
          )}
        </aside>
      )}

      <div className="open-tabs" role="tablist" aria-label="已打开页面">
        {tabs.map((tab) => (
          <button key={tab.id} role="tab" aria-selected={active === tab.id} className={active === tab.id ? "active" : ""} onClick={() => setActive(tab.id)}>
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
        <ProjectToolbar project={project} setProject={setProject} notify={notify} />
        {active === "home" && <HomeDashboard filters={filters} notify={notify} />}
        {active === "inventory" && <InventoryPage sources={sources} cleaningTasks={cleaningTasks} openDialog={() => openCreate("connection")} updateSource={updateSource} createCleaningTask={createCleaningTask} updateCleaningTask={updateCleaningTask} notify={notify} />}
        {active === "governance" && governanceView === "workspace" && workspaceProject && (
          <GovernanceWorkbench
            project={workspaceProject}
            notify={notify}
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
          />
        )}
        {active === "governance" && governanceView === "algorithms" && <GovernanceAlgorithms notify={notify} />}
        {active === "governance" && governanceView === "marketplace" && <GovernanceMarketplace notify={notify} />}
        {active === "assessment" && <AssessmentPage tasks={reviewTasks} openDialog={() => openCreate("assessment")} notify={notify} />}
        {active === "modelDev" && (
          <ModelDevelopment
            jobs={jobs}
            openDialog={(preset) => openCreate("model", preset)}
            notify={notify}
            openLog={setLogJob}
            toggleJob={toggleJob}
          />
        )}
        {active === "modelEval" && (
          <ModelEvaluation evaluations={evaluations} openDialog={() => openCreate("evaluation")} notify={notify} runEvaluation={runEvaluation} />
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
