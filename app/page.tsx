"use client";

import { FormEvent, useMemo, useState } from "react";

type ViewId =
  | "overview"
  | "assets"
  | "governance"
  | "assessment"
  | "development"
  | "evaluation"
  | "delivery";

type ModalId = "connector" | "assessment" | "training" | null;

const navItems: Array<{ id: ViewId; label: string; icon: string; hint?: string }> = [
  { id: "overview", label: "工作台", icon: "⌂" },
  { id: "assets", label: "数据资产", icon: "▤", hint: "12" },
  { id: "governance", label: "治理生产", icon: "◇", hint: "3" },
  { id: "assessment", label: "数据集评估", icon: "✓", hint: "6" },
  { id: "development", label: "模型开发", icon: "⌘", hint: "2" },
  { id: "evaluation", label: "模型评测", icon: "◎", hint: "4" },
  { id: "delivery", label: "交付部署", icon: "↗", hint: "3" },
];

const pageMeta: Record<ViewId, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "高质量数据集评估演示",
    title: "数据质量作战台",
    description: "从数据接入、治理生产到模型交付，统一掌握关键质量状态。",
  },
  assets: {
    eyebrow: "数据资产 / 统一目录",
    title: "数据资产中心",
    description: "管理数据源、数据集版本、向量索引与全链路血缘。",
  },
  governance: {
    eyebrow: "数据生产 / 治理工作间",
    title: "治理生产工作间",
    description: "编排清洗、转换、质检与标注节点，让每一步都有记录。",
  },
  assessment: {
    eyebrow: "质量验收 / 数据集评估",
    title: "数据集评估",
    description: "基于版本化数据和可复用组件，创建可追溯的质量验收任务。",
  },
  development: {
    eyebrow: "可用不可见 / 模型工程",
    title: "模型开发中心",
    description: "在隔离环境中完成微调、RAG、蒸馏量化与模型注册。",
  },
  evaluation: {
    eyebrow: "模型门禁 / 能力评测",
    title: "模型能力评测",
    description: "统一比较基线与候选模型的质量、安全、性能和成本。",
  },
  delivery: {
    eyebrow: "服务交付 / 生产部署",
    title: "交付与部署",
    description: "把合格的数据产品和模型版本安全发布到业务系统。",
  },
};

const datasets = [
  { name: "篮球图像数据集", version: "v1.3", type: "图像", volume: "2,480 张", quality: 98.6, owner: "数据一组", updated: "今天 10:24", status: "可用" },
  { name: "金融年报问答集", version: "v2.1", type: "SFT", volume: "18,620 对", quality: 95.4, owner: "模型实验室", updated: "昨天 18:42", status: "可用" },
  { name: "设备巡检文档集", version: "v0.9", type: "文档", volume: "6.8 GB", quality: 89.7, owner: "制造业务线", updated: "08-20 16:08", status: "治理中" },
  { name: "客服知识向量集", version: "v3.4", type: "向量", volume: "128k 切片", quality: 96.1, owner: "智能服务组", updated: "08-19 09:36", status: "可用" },
];

const reviewTasks = [
  { name: "篮球图像数据集 v1.3 验收", type: "多模态审查", progress: 100, score: 98.6, status: "已完成", updated: "10:32" },
  { name: "金融年报问答集 v2.1 验收", type: "SFT 问答审查", progress: 72, score: 94.2, status: "运行中", updated: "09:48" },
  { name: "设备巡检文档集 v0.9 验收", type: "文档审查", progress: 38, score: 86.7, status: "运行中", updated: "08:56" },
  { name: "客服知识向量集 v3.4 验收", type: "RAG 数据审查", progress: 0, score: 0, status: "待运行", updated: "昨天" },
];

const initialJobs = [
  { name: "finance-sft-lora-07", mode: "LoRA 微调", model: "Qwen3-8B", dataset: "金融年报问答集 v2.1", progress: 68, status: "训练中", eta: "01:24:18" },
  { name: "service-rag-index-12", mode: "RAG 增强", model: "BGE-M3", dataset: "客服知识向量集 v3.4", progress: 100, status: "已完成", eta: "—" },
  { name: "vision-quant-int4-03", mode: "量化", model: "Qwen2.5-VL", dataset: "篮球图像数据集 v1.3", progress: 24, status: "排队中", eta: "等待资源" },
];

function StatusPill({ status }: { status: string }) {
  const tone = status.includes("完成") || status === "可用" || status === "在线" ? "success" : status.includes("运行") || status.includes("训练") ? "info" : status.includes("治理") || status.includes("排队") ? "warning" : "muted";
  return <span className={`status-pill ${tone}`}><span />{status}</span>;
}

function Progress({ value, tone = "blue" }: { value: number; tone?: "blue" | "green" | "amber" }) {
  return (
    <div className="progress-track" aria-label={`进度 ${value}%`}>
      <div className={`progress-value ${tone}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function Overview({ onNavigate, onOpen }: { onNavigate: (id: ViewId) => void; onOpen: (id: ModalId) => void }) {
  return (
    <>
      <section className="kpi-grid" aria-label="核心指标">
        {[
          { label: "数据集资产", value: "12", unit: "个", delta: "+2 本月", icon: "▤", tone: "cyan" },
          { label: "质量评估任务", value: "27", unit: "次", delta: "6 个运行中", icon: "✓", tone: "blue" },
          { label: "平均质量分", value: "94.8", unit: "分", delta: "+3.2% 较上月", icon: "⌁", tone: "green" },
          { label: "模型服务", value: "3", unit: "个", delta: "99.97% 可用性", icon: "↗", tone: "violet" },
        ].map((item) => (
          <article className="kpi-card" key={item.label}>
            <div className={`kpi-icon ${item.tone}`}>{item.icon}</div>
            <div>
              <p>{item.label}</p>
              <strong>{item.value}<small>{item.unit}</small></strong>
              <span className={item.tone === "green" ? "positive" : ""}>{item.delta}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="panel pipeline-panel">
        <div className="panel-heading compact">
          <div>
            <p className="section-kicker">全链路状态</p>
            <h2>从数据接入到业务交付</h2>
          </div>
          <button className="text-button" onClick={() => onNavigate("governance")}>查看治理工作流 <span>→</span></button>
        </div>
        <div className="pipeline">
          {[
            { name: "数据接入", meta: "5 个来源", status: "done", icon: "01" },
            { name: "治理生产", meta: "3 个任务", status: "running", icon: "02" },
            { name: "数据评估", meta: "94.8 分", status: "running", icon: "03" },
            { name: "模型开发", meta: "2 个作业", status: "waiting", icon: "04" },
            { name: "交付部署", meta: "3 个服务", status: "waiting", icon: "05" },
          ].map((step, index) => (
            <div className={`pipeline-step ${step.status}`} key={step.name}>
              <span className="step-index">{step.icon}</span>
              <div><strong>{step.name}</strong><small>{step.meta}</small></div>
              {index < 4 && <span className="step-arrow">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="content-grid overview-grid">
        <article className="panel quality-panel">
          <div className="panel-heading">
            <div><p className="section-kicker">最近完成</p><h2>篮球图像数据集 v1.3</h2></div>
            <div className="score-ring"><strong>98.6</strong><small>质量分</small></div>
          </div>
          <div className="metric-bars">
            {[
              ["图像完好性", 100, "2,480 / 2,480"],
              ["重复率合规性", 96, "2,381 / 2,480"],
              ["内容安全性", 99, "2,463 / 2,480"],
              ["格式一致性", 100, "2,480 / 2,480"],
              ["内容有效性", 98, "2,431 / 2,480"],
            ].map(([label, value, count]) => (
              <div className="metric-row" key={label as string}>
                <div><strong>{label}</strong><span>{count}</span></div>
                <Progress value={value as number} tone={(value as number) > 98 ? "green" : "blue"} />
                <b>{value}%</b>
              </div>
            ))}
          </div>
          <div className="metric-footnote"><span className="dot green" /> 唯一样本 2,480 · 检查执行 12,400 次 · 规则覆盖率 100%</div>
        </article>

        <article className="panel task-panel">
          <div className="panel-heading">
            <div><p className="section-kicker">今日任务</p><h2>运行队列</h2></div>
            <button className="icon-button" aria-label="更多任务">•••</button>
          </div>
          <div className="task-list">
            {reviewTasks.slice(0, 3).map((task) => (
              <button className="task-item" key={task.name} onClick={() => onNavigate("assessment")}>
                <div className="task-mark">{task.type.slice(0, 1)}</div>
                <div className="task-copy"><strong>{task.name}</strong><span>{task.type} · 更新于 {task.updated}</span><Progress value={task.progress} /></div>
                <StatusPill status={task.status} />
              </button>
            ))}
          </div>
          <button className="full-link" onClick={() => onNavigate("assessment")}>查看全部评估任务 <span>→</span></button>
        </article>

        <article className="panel insight-panel">
          <div className="insight-icon">✦</div>
          <div>
            <p className="section-kicker">智能质量洞察</p>
            <h2>设备巡检文档集需要关注</h2>
            <p>发现 286 个低信息密度段落和 74 个日期格式异常。建议在评估前增加“文档切片优化”和“日期标准化”节点。</p>
            <div className="insight-actions"><button onClick={() => onNavigate("governance")}>进入治理工作间</button><button className="ghost" onClick={() => onOpen("assessment")}>新建评估任务</button></div>
          </div>
        </article>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading">
          <div><p className="section-kicker">资产概览</p><h2>最近更新的数据集</h2></div>
          <button className="text-button" onClick={() => onNavigate("assets")}>进入资产中心 <span>→</span></button>
        </div>
        <DatasetTable compact />
      </section>
    </>
  );
}

function DatasetTable({ compact = false }: { compact?: boolean }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr><th>数据集名称</th><th>类型</th><th>数据规模</th><th>质量分</th><th>责任团队</th><th>最近更新</th><th>状态</th></tr></thead>
        <tbody>
          {datasets.slice(0, compact ? 4 : datasets.length).map((item) => (
            <tr key={item.name}>
              <td><div className="dataset-name"><span>{item.type.slice(0, 1)}</span><div><strong>{item.name}</strong><small>{item.version}</small></div></div></td>
              <td>{item.type}</td><td>{item.volume}</td>
              <td><div className="quality-score"><strong>{item.quality}</strong><Progress value={item.quality} tone={item.quality > 95 ? "green" : "amber"} /></div></td>
              <td>{item.owner}</td><td>{item.updated}</td><td><StatusPill status={item.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Assets({ onOpen }: { onOpen: (id: ModalId) => void }) {
  const [tab, setTab] = useState<"datasets" | "sources" | "vectors">("datasets");
  return (
    <>
      <section className="toolbar-card">
        <div className="segmented-control" role="tablist" aria-label="资产类型">
          {["datasets", "sources", "vectors"].map((id) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id as typeof tab)}>{id === "datasets" ? "数据集" : id === "sources" ? "数据源" : "向量索引"}</button>
          ))}
        </div>
        <div className="toolbar-actions"><label className="search-box"><span>⌕</span><input aria-label="搜索资产" placeholder="搜索名称、负责人或标签" /></label><button className="primary-button" onClick={() => onOpen("connector")}>＋ 接入数据</button></div>
      </section>
      {tab === "datasets" && <section className="panel table-panel"><div className="panel-heading"><div><p className="section-kicker">数据集目录</p><h2>全部数据集 <span className="count-badge">12</span></h2></div><div className="filter-chips"><button className="active">全部</button><button>图像</button><button>文档</button><button>SFT</button><button>向量</button></div></div><DatasetTable /></section>}
      {tab === "sources" && <SourceGrid />}
      {tab === "vectors" && <VectorIndex />}
    </>
  );
}

function SourceGrid() {
  const sources = [
    { name: "生产业务库", kind: "MySQL 8.0", meta: "42 张表 · 12.8 GB", status: "在线", sync: "5 分钟前" },
    { name: "知识文档仓", kind: "SFTP", meta: "1,286 个文件 · 34 GB", status: "在线", sync: "18 分钟前" },
    { name: "业务事件流", kind: "REST API", meta: "2.4M 条/日", status: "在线", sync: "实时" },
    { name: "历史归档库", kind: "对象存储", meta: "186 GB", status: "待检查", sync: "2 天前" },
  ];
  return <section className="source-grid">{sources.map((source) => <article className="panel source-card" key={source.name}><div className="source-head"><span className="source-logo">{source.kind.slice(0, 2)}</span><StatusPill status={source.status} /></div><h3>{source.name}</h3><p>{source.kind}</p><div className="source-meta"><span>{source.meta}</span><span>同步：{source.sync}</span></div><button className="secondary-button">查看连接</button></article>)}</section>;
}

function VectorIndex() {
  return <section className="content-grid vector-layout"><article className="panel vector-hero"><div className="vector-orbit"><span>128k</span><i /><i /><i /></div><div><p className="section-kicker">客服知识向量集</p><h2>索引健康度 96.1%</h2><p>使用 BGE-M3 生成 1024 维向量，当前检索延迟 P95 为 42ms。</p><div className="inline-stats"><span><b>128,420</b> 切片</span><span><b>0.84</b> 平均相似度</span><span><b>v3.4</b> 当前版本</span></div></div></article><article className="panel"><div className="panel-heading"><div><p className="section-kicker">检索质量</p><h2>最近 7 天</h2></div></div><div className="mini-bars">{[48,64,57,72,69,84,78,91,86,95,88,98].map((v,i)=><i key={i} style={{height:`${v}%`}} />)}</div><div className="chart-legend"><span>召回率 91.2%</span><span>零结果率 2.8%</span></div></article></section>;
}

function Governance() {
  const [selected, setSelected] = useState("质量规则评估");
  const nodes = [
    { name: "金融年报问答集 v2.1", type: "数据集", icon: "▤", x: 4, y: 34 },
    { name: "文档解析与切片", type: "预处理", icon: "◇", x: 28, y: 16 },
    { name: "低质量内容过滤", type: "清洗", icon: "⌁", x: 28, y: 58 },
    { name: "质量规则评估", type: "评估", icon: "✓", x: 55, y: 34 },
    { name: "SFT 数据集 v2.2", type: "输出", icon: "↗", x: 80, y: 34 },
  ];
  return (
    <section className="workspace-layout">
      <aside className="node-palette panel"><div className="palette-heading"><p className="section-kicker">组件库</p><h2>治理节点</h2></div><label className="palette-search"><span>⌕</span><input aria-label="搜索治理组件" placeholder="搜索组件" /></label>{["数据接入","预处理与解析","数据清洗","质量评估","标注与增强"].map((group,i)=><div className="palette-group" key={group}><strong>{group}</strong><button><span>{["＋","◇","⌁","✓","✦"][i]}</span>{["数据库读取","文档解析","去重过滤","规则评估","问答生成"][i]}</button><button><span>{["⇧","▤","↯","◎","⎈"][i]}</span>{["文件导入","字段映射","异常检测","人工复核","多模态对齐"][i]}</button></div>)}</aside>
      <div className="workflow-stage panel">
        <div className="workflow-toolbar"><div><button className="tool-active">工作流</button><button>ER 图</button></div><div><button aria-label="缩小">−</button><span>80%</span><button aria-label="放大">＋</button><button>自动整理</button><button className="primary-small">运行工作流</button></div></div>
        <div className="workflow-canvas">
          <div className="canvas-grid" />
          <span className="connector c1" /><span className="connector c2" /><span className="connector c3" /><span className="connector c4" />
          {nodes.map((node)=><button key={node.name} className={`workflow-node ${selected===node.name?"selected":""}`} style={{left:`${node.x}%`,top:`${node.y}%`}} onClick={()=>setSelected(node.name)}><span className="node-icon">{node.icon}</span><div><small>{node.type}</small><strong>{node.name}</strong></div><i /></button>)}
          <div className="run-badge"><span className="pulse-dot" /> 上次运行成功 · 12 分钟前</div>
        </div>
        <div className="workflow-bottom"><div><span>5</span> 节点</div><div><span>2,486</span> 输入记录</div><div><span>2,311</span> 输出记录</div><div><span>07:42</span> 运行耗时</div></div>
      </div>
      <aside className="config-panel panel"><div className="panel-heading"><div><p className="section-kicker">节点配置</p><h2>{selected}</h2></div><button className="icon-button">×</button></div><label>运行方式<select defaultValue="全量评估"><option>全量评估</option><option>抽样评估</option></select></label><label>规则方案<select defaultValue="SFT 数据质量标准 v2"><option>SFT 数据质量标准 v2</option><option>通用数据质量标准</option></select></label><div className="config-rule"><div><strong>内容完整性</strong><span className="toggle on" /></div><p>问题和答案字段必须同时存在。</p></div><div className="config-rule"><div><strong>答案真实性</strong><span className="toggle on" /></div><p>使用参考文档核验答案依据。</p></div><div className="config-rule"><div><strong>敏感信息</strong><span className="toggle on" /></div><p>检测个人身份与内部敏感信息。</p></div><button className="secondary-button full">保存配置</button></aside>
    </section>
  );
}

function Assessment({ onOpen }: { onOpen: (id: ModalId) => void }) {
  const [selected, setSelected] = useState(reviewTasks[0].name);
  const activeTask = reviewTasks.find((task) => task.name === selected) ?? reviewTasks[0];
  return <section className="assessment-layout"><aside className="panel review-list"><div className="panel-heading"><div><p className="section-kicker">审查任务</p><h2>任务列表</h2></div><button className="primary-small" onClick={() => onOpen("assessment")}>＋ 新建</button></div><label className="search-box wide"><span>⌕</span><input aria-label="搜索评估任务" placeholder="搜索任务" /></label><div className="review-cards">{reviewTasks.map((task)=><button className={selected===task.name?"active":""} key={task.name} onClick={()=>setSelected(task.name)}><div><strong>{task.name}</strong><span>{task.type} · {task.updated}</span></div><StatusPill status={task.status} /><Progress value={task.progress} /></button>)}</div></aside><div className="review-detail"><article className="panel review-summary"><div className="review-title"><div><p className="section-kicker">当前评估</p><h2>{activeTask.name}</h2><div className="tag-row"><span>{activeTask.type}</span><span>唯一数据版本</span><span>规则集 v2.4</span></div></div><div className="score-large"><strong>{activeTask.score || "—"}</strong><span>综合质量分</span></div></div><div className="review-kpis"><div><span>唯一数据量</span><strong>2,480</strong><small>不重复计数</small></div><div><span>检查执行次数</span><strong>12,400</strong><small>5 项规则</small></div><div><span>问题样本</span><strong>36</strong><small>占比 1.45%</small></div><div><span>规则覆盖率</span><strong>100%</strong><small>5 / 5</small></div></div></article><article className="panel table-panel"><div className="panel-heading"><div><p className="section-kicker">检查组件</p><h2>评估结果</h2></div><button className="secondary-button">导出报告</button></div><div className="table-scroll"><table className="data-table"><thead><tr><th>组件名称</th><th>检查范围</th><th>问题数</th><th>通过率</th><th>耗时</th><th>结果</th></tr></thead><tbody>{[["图像完好性","2,480",0,"100%","00:48"],["重复率合规性","2,480",24,"99.03%","03:12"],["内容安全性","2,480",2,"99.92%","04:26"],["格式一致性","2,480",0,"100%","00:31"],["内容有效性","2,480",10,"99.60%","02:56"]].map((row)=><tr key={row[0] as string}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td><b className="positive">{row[3]}</b></td><td>{row[4]}</td><td><StatusPill status="已完成" /></td></tr>)}</tbody></table></div></article><article className="panel conclusion-card"><div className="conclusion-icon">✦</div><div><p className="section-kicker">受控生成结论</p><h2>该版本满足当前发布门槛</h2><p>本次评估覆盖 2,480 个唯一图像样本和 5 项质量规则，共发现 36 个问题样本。重复率是主要风险项，建议修复后发布为 v1.4。结论仅适用于当前规则覆盖范围，不代表模型训练效果。</p></div><button className="primary-button">进入问题样本</button></article></div></section>;
}

function Development({ onOpen, jobs }: { onOpen: (id: ModalId) => void; jobs: typeof initialJobs }) {
  return <><section className="dev-capabilities">{[
    {name:"微调训练",desc:"LoRA、QLoRA 与全量 SFT",icon:"⌘",tone:"blue",meta:"8 个模型可用"},
    {name:"RAG 增强",desc:"切片、向量化、检索与重排",icon:"⎈",tone:"cyan",meta:"4 个知识库"},
    {name:"蒸馏量化",desc:"知识蒸馏与 INT8 / INT4 量化",icon:"◫",tone:"violet",meta:"3 个任务模板"},
    {name:"模型注册",desc:"版本、制品、审批与回滚",icon:"◎",tone:"green",meta:"7 个模型版本"},
  ].map(card=><article className={`capability-card ${card.tone}`} key={card.name}><div className="capability-top"><span>{card.icon}</span><small>{card.meta}</small></div><h3>{card.name}</h3><p>{card.desc}</p><button onClick={() => onOpen("training")}>创建任务 <span>→</span></button></article>)}</section><section className="content-grid dev-grid"><article className="panel secure-card"><div className="secure-visual"><div className="shield">◆</div><i/><i/><i/></div><div><p className="section-kicker">可用不可见安全域</p><h2>隔离执行，结果可用，资产不可见</h2><p>训练作业运行在租户隔离环境中。用户可以查看配置、进度、指标和审计记录，但无法下载基础模型权重、底层密钥或其他租户资产。</p><div className="secure-tags"><span>租户隔离</span><span>密钥托管</span><span>制品防下载</span><span>全程审计</span></div></div></article><article className="panel resource-card"><div className="panel-heading"><div><p className="section-kicker">算力资源</p><h2>GPU 资源池</h2></div><StatusPill status="在线" /></div><div className="resource-meter"><div className="donut"><strong>68%</strong><span>已分配</span></div><div><p><span>A800 × 8</span><b>6 已占用</b></p><Progress value={75}/><p><span>L40S × 12</span><b>7 已占用</b></p><Progress value={58} tone="green"/></div></div><small className="quiet">当前等待队列 1 个任务 · 预计 18 分钟</small></article></section><section className="panel table-panel"><div className="panel-heading"><div><p className="section-kicker">训练与构建</p><h2>最近作业</h2></div><button className="primary-button" onClick={() => onOpen("training")}>＋ 创建开发任务</button></div><div className="table-scroll"><table className="data-table"><thead><tr><th>任务名称</th><th>模式</th><th>基础模型</th><th>数据集</th><th>进度</th><th>预计剩余</th><th>状态</th></tr></thead><tbody>{jobs.map(job=><tr key={job.name}><td><strong>{job.name}</strong></td><td>{job.mode}</td><td>{job.model}</td><td>{job.dataset}</td><td><div className="table-progress"><Progress value={job.progress}/><span>{job.progress}%</span></div></td><td>{job.eta}</td><td><StatusPill status={job.status}/></td></tr>)}</tbody></table></div></section></>;
}

function Evaluation() {
  const metrics = [
    {name:"任务准确率",base:83.4,candidate:91.8,gate:90},
    {name:"召回率",base:78.6,candidate:89.7,gate:85},
    {name:"F1 值",base:80.9,candidate:90.7,gate:88},
    {name:"事实忠实度",base:86.2,candidate:94.1,gate:92},
    {name:"安全通过率",base:98.1,candidate:99.4,gate:99},
  ];
  return <><section className="comparison-hero panel"><div><p className="section-kicker">候选模型评测 #EV-20260822-04</p><h2>finance-assistant-v2.3 <span>对比</span> qwen3-8b-base</h2><p>使用金融问答黄金评测集 v4.2，共 2,000 条样本；评测环境与推理参数已锁定。</p><div className="tag-row"><span>可复现</span><span>双盲评测</span><span>评测集不可见</span></div></div><div className="gate-result"><span>发布门禁</span><strong>通过</strong><small>5 / 5 核心指标达标</small></div></section><section className="eval-grid"><article className="panel metric-compare"><div className="panel-heading"><div><p className="section-kicker">核心能力</p><h2>基线 / 候选模型对比</h2></div><div className="legend"><span className="base">基线</span><span className="candidate">候选</span><span className="gate">门槛</span></div></div><div className="compare-list">{metrics.map(metric=><div className="compare-row" key={metric.name}><div><strong>{metric.name}</strong><span>门槛 {metric.gate}%</span></div><div className="double-bar"><i className="base" style={{width:`${metric.base}%`}}/><i className="candidate" style={{width:`${metric.candidate}%`}}/><b style={{left:`${metric.gate}%`}}/></div><div><span>{metric.base}</span><strong>{metric.candidate}</strong></div></div>)}</div></article><article className="panel performance-card"><div className="panel-heading"><div><p className="section-kicker">性能与成本</p><h2>生产可用性</h2></div></div>{[["P95 首字延迟","620 ms","< 800 ms","good"],["吞吐能力","42 req/s","> 36 req/s","good"],["单千次成本","¥ 18.40","< ¥ 20.00","good"],["峰值显存","18.2 GB","< 20 GB","good"]].map(row=><div className="perf-row" key={row[0]}><span>{row[0]}</span><strong>{row[1]}</strong><small>{row[2]}</small><i>✓</i></div>)}<div className="safety-note"><strong>安全专项</strong><p>越狱攻击 500 条、敏感信息 320 条、偏见样本 180 条，全部达到发布阈值。</p></div></article></section><section className="panel table-panel"><div className="panel-heading"><div><p className="section-kicker">评测记录</p><h2>最近评测任务</h2></div><button className="primary-button">＋ 新建评测</button></div><div className="evaluation-cards">{["金融问答能力评测","RAG 召回质量评测","图像理解安全评测","通用性能基准"].map((name,i)=><article key={name}><span className="eval-number">0{i+1}</span><div><strong>{name}</strong><p>{["finance-assistant-v2.3","service-rag-v3.4","vision-agent-v1.8","qwen3-8b-int4"][i]}</p></div><b>{[90.7,91.2,96.8,88.5][i]}</b><StatusPill status={i===3?"运行中":"已完成"}/></article>)}</div></section></>;
}

function Delivery() {
  return <><section className="delivery-stats">{[["在线模型服务","3","全部健康","green"],["本月调用量","1.84M","+18.6%","blue"],["平均可用性","99.97%","SLA 99.9%","cyan"],["待交付数据产品","2","1 个待审批","amber"]].map(item=><article className="panel" key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong><small className={item[3]}>{item[2]}</small></article>)}</section><section className="content-grid deploy-grid"><article className="panel endpoint-panel"><div className="panel-heading"><div><p className="section-kicker">模型服务</p><h2>在线推理端点</h2></div><button className="primary-small">＋ 发布服务</button></div>{[
    {name:"金融问答助手",ver:"finance-assistant-v2.3",type:"LLM API",qps:"18.4",latency:"620ms"},
    {name:"客服 RAG 检索",ver:"service-rag-v3.4",type:"Retrieval API",qps:"42.8",latency:"42ms"},
    {name:"图像内容审核",ver:"vision-agent-v1.8",type:"Vision API",qps:"6.2",latency:"880ms"},
  ].map(service=><div className="endpoint-row" key={service.name}><div className="endpoint-icon">↗</div><div><strong>{service.name}</strong><span>{service.ver} · {service.type}</span></div><div><small>当前 QPS</small><b>{service.qps}</b></div><div><small>P95 延迟</small><b>{service.latency}</b></div><StatusPill status="在线"/><button className="icon-button">•••</button></div>)}</article><article className="panel traffic-panel"><div className="panel-heading"><div><p className="section-kicker">服务流量</p><h2>近 24 小时</h2></div><span className="positive">+12.8%</span></div><div className="traffic-chart">{[22,28,25,31,38,34,45,54,48,63,68,59,72,76,71,82,78,88,91,84,79,73,68,62].map((v,i)=><i key={i} style={{height:`${v}%`}} />)}</div><div className="traffic-axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>现在</span></div><div className="traffic-total"><div><span>总请求</span><strong>78,426</strong></div><div><span>成功率</span><strong>99.96%</strong></div></div></article></section><section className="panel table-panel"><div className="panel-heading"><div><p className="section-kicker">数据交付</p><h2>数据产品与订单</h2></div><button className="secondary-button">新建交付订单</button></div><div className="table-scroll"><table className="data-table"><thead><tr><th>交付名称</th><th>交付资产</th><th>目标系统</th><th>方式</th><th>最近交付</th><th>状态</th></tr></thead><tbody>{[["金融 SFT 数据月度交付","金融年报问答集 v2.1","模型训练平台","SFTP 推送","今天 02:00","已完成"],["客服知识索引增量发布","客服知识向量集 v3.4","智能客服系统","API 推送","昨天 23:30","已完成"],["巡检文档治理结果交付","设备巡检文档集 v0.9","设备管理系统","对象存储","等待审批","待运行"]].map(row=><tr key={row[0]}>{row.slice(0,5).map((cell,i)=><td key={i}>{i===0?<strong>{cell}</strong>:cell}</td>)}<td><StatusPill status={row[5]}/></td></tr>)}</tbody></table></div></section></>;
}

function Modal({ id, onClose, onCreated }: { id: ModalId; onClose: () => void; onCreated: (id: Exclude<ModalId, null>, name: string) => void }) {
  if (!id) return null;
  const configs = {
    connector: { title: "接入新数据", subtitle: "选择连接方式并创建可复用的数据源连接。", action: "创建连接" },
    assessment: { title: "新建数据集评估", subtitle: "绑定唯一数据版本和质量规则，确保结果可复现。", action: "创建评估任务" },
    training: { title: "创建模型开发任务", subtitle: "作业将在可用不可见安全域中运行。", action: "提交开发任务" },
  } as const;
  const config = configs[id];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onCreated(id as Exclude<ModalId, null>, String(data.get("name") || "新任务"));
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><p className="section-kicker">创建向导</p><h2 id="modal-title">{config.title}</h2><p>{config.subtitle}</p></div><button className="modal-close" onClick={onClose} aria-label="关闭">×</button></div><form onSubmit={submit}>
    <label>名称<input name="name" required placeholder={id==="connector"?"例如：生产业务库":id==="assessment"?"例如：金融问答集 v2.1 验收":"例如：finance-sft-lora-08"}/></label>
    {id==="connector"&&<><label>接入方式<select defaultValue="MySQL"><option>MySQL</option><option>SFTP</option><option>REST API</option><option>对象存储</option><option>本地批量导入</option></select></label><div className="form-grid"><label>主机地址<input placeholder="db.internal.example"/></label><label>端口<input defaultValue="3306"/></label></div><label className="checkbox-row"><input type="checkbox" defaultChecked/> 启用每日连接健康检查</label></>}
    {id==="assessment"&&<><label>数据集版本<select defaultValue="篮球图像数据集 v1.3"><option>篮球图像数据集 v1.3</option><option>金融年报问答集 v2.1</option><option>设备巡检文档集 v0.9</option></select></label><label>评估方案<select defaultValue="多模态数据质量标准 v2.4"><option>多模态数据质量标准 v2.4</option><option>SFT 数据质量标准 v2.0</option><option>文档数据质量标准 v1.6</option></select></label><label className="checkbox-row"><input type="checkbox" defaultChecked/> 完成后生成受控质量总结</label></>}
    {id==="training"&&<><div className="form-grid"><label>开发方式<select defaultValue="LoRA 微调"><option>LoRA 微调</option><option>RAG 增强</option><option>蒸馏</option><option>INT4 量化</option></select></label><label>基础模型<select defaultValue="Qwen3-8B"><option>Qwen3-8B</option><option>Qwen2.5-VL</option><option>BGE-M3</option></select></label></div><label>训练数据版本<select defaultValue="金融年报问答集 v2.1"><option>金融年报问答集 v2.1</option><option>篮球图像数据集 v1.3</option><option>客服知识向量集 v3.4</option></select></label><div className="security-callout"><span>◆</span><div><strong>安全域策略已启用</strong><p>模型权重、训练数据和运行密钥不可下载，所有操作将进入审计日志。</p></div></div></>}
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>取消</button><button type="submit" className="primary-button">{config.action}</button></div>
  </form></div></div>;
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const [modal, setModal] = useState<ModalId>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [jobs, setJobs] = useState(initialJobs);
  const meta = pageMeta[activeView];
  const currentDate = useMemo(() => new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date()), []);

  function created(id: Exclude<ModalId, null>, name: string) {
    if (id === "training") setJobs((current) => [{ name, mode: "LoRA 微调", model: "Qwen3-8B", dataset: "金融年报问答集 v2.1", progress: 0, status: "排队中", eta: "等待资源" }, ...current]);
    setModal(null);
    setToast(id === "connector" ? "数据连接已创建，正在执行健康检查" : id === "assessment" ? "评估任务已创建并加入运行队列" : "模型开发任务已提交到安全域队列");
    window.setTimeout(() => setToast(""), 3200);
  }

  return (
    <div className={`app-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">质<span /></div><div className="brand-copy"><strong>高质量数据平台</strong><small>Quality Data Studio</small></div></div>
        <div className="workspace-switch"><span>演</span><div><small>当前空间</small><strong>评估演示空间</strong></div><button aria-label="切换空间">⌄</button></div>
        <nav aria-label="主导航"><p className="nav-label">业务工作区</p>{navItems.map((item)=><button key={item.id} className={activeView===item.id?"active":""} onClick={()=>setActiveView(item.id)} title={item.label}><span className="nav-icon">{item.icon}</span><b>{item.label}</b>{item.hint&&<small>{item.hint}</small>}</button>)}</nav>
        <div className="sidebar-bottom"><button><span className="nav-icon">?</span><b>帮助与文档</b></button><button><span className="nav-icon">⚙</span><b>平台管理</b></button><div className="system-health"><i/><div><strong>平台运行正常</strong><small>所有服务可用</small></div></div></div>
      </aside>

      <header className="topbar">
        <button className="menu-toggle" onClick={()=>setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen?"收起导航":"展开导航"}>☰</button>
        <div className="breadcrumb"><span>高质量数据平台</span><b>/</b><strong>{navItems.find(item=>item.id===activeView)?.label}</strong></div>
        <div className="topbar-actions"><span className="date-label">{currentDate}</span><button className="quick-entry">▣ 快速入口</button><label className="global-search"><span>⌕</span><input aria-label="全局搜索" placeholder="搜索数据、任务、模型"/><kbd>⌘ K</kbd></label><button className="notice-button" aria-label="通知">♢<i/></button><button className="user-menu"><span>演</span><div><strong>高质量数据评估演示</strong><small>平台管理员</small></div><b>⌄</b></button></div>
      </header>

      <main className="main-content">
        <div className="page-header"><div><p>{meta.eyebrow}</p><h1>{meta.title}</h1><span>{meta.description}</span></div><div className="page-actions">{activeView!=="overview"&&<button className="secondary-button">导出当前视图</button>}<button className="primary-button" onClick={()=>setModal(activeView==="development"?"training":activeView==="assets"?"connector":"assessment")}>＋ {activeView==="development"?"创建开发任务":activeView==="assets"?"接入数据":"新建评估"}</button></div></div>
        {activeView==="overview"&&<Overview onNavigate={setActiveView} onOpen={setModal}/>} 
        {activeView==="assets"&&<Assets onOpen={setModal}/>} 
        {activeView==="governance"&&<Governance/>}
        {activeView==="assessment"&&<Assessment onOpen={setModal}/>} 
        {activeView==="development"&&<Development onOpen={setModal} jobs={jobs}/>} 
        {activeView==="evaluation"&&<Evaluation/>} 
        {activeView==="delivery"&&<Delivery/>}
      </main>

      <button className={`assistant-fab ${assistantOpen?"open":""}`} onClick={()=>setAssistantOpen(!assistantOpen)} aria-label="打开质量助手">✦</button>
      <aside className={`assistant-panel ${assistantOpen?"open":""}`} aria-hidden={!assistantOpen}><div className="assistant-head"><div><span>✦</span><div><strong>质量助手</strong><small>基于当前项目上下文</small></div></div><button onClick={()=>setAssistantOpen(false)} aria-label="关闭助手">×</button></div><div className="assistant-message"><span>✦</span><p>设备巡检文档集当前质量分低于发布门槛。需要我生成一条治理工作流吗？</p></div><div className="assistant-suggestions"><button onClick={()=>{setActiveView("governance");setAssistantOpen(false)}}>生成治理工作流</button><button onClick={()=>{setActiveView("assessment");setAssistantOpen(false)}}>查看问题样本</button><button onClick={()=>setModal("assessment")}>创建复评任务</button></div><label className="assistant-input"><input placeholder="询问数据、模型或任务状态"/><button>↑</button></label></aside>
      {toast&&<div className="toast" role="status"><span>✓</span>{toast}</div>}
      <Modal id={modal} onClose={()=>setModal(null)} onCreated={created}/>
    </div>
  );
}
