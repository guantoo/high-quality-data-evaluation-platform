"use client";

import { FormEvent, useState } from "react";

type ModuleId = "home" | "inventory" | "governance" | "assessment" | "modelDev" | "modelEval";
type DialogId = "assessment" | "model" | null;

const modules: Array<{
  id: ModuleId;
  label: string;
  short: string;
  icon: string;
  children: string[];
}> = [
  { id: "home", label: "首页", short: "首页", icon: "⌂", children: [] },
  { id: "inventory", label: "智能数据盘点", short: "盘点", icon: "◈", children: ["数据库管理", "数据探查", "本地数据管理", "智能数据盘点", "智能数据清洗"] },
  { id: "governance", label: "高质量数据治理", short: "治理", icon: "▥", children: ["治理项目管理", "高质量数据治理工作间", "治理算法管理", "治理算法市场"] },
  { id: "assessment", label: "高质量数据集评估", short: "评估", icon: "▧", children: ["高质量数据评估", "高质量数据评估历史"] },
  { id: "modelDev", label: "可用不可见模型开发", short: "开发", icon: "⌘", children: ["模型开发任务", "RAG 增强", "微调训练", "蒸馏量化", "模型注册"] },
  { id: "modelEval", label: "大模型能力评测", short: "评测", icon: "◎", children: ["评测标准", "评测任务", "能力对比", "发布门禁"] },
];

const projectRows = [
  { name: "高质量数据集评估演示", overview: "5 Datasets  13 Recipes", created: "2026-02-26", updated: "2026-08-18" },
  { name: "高质量数据集测试", overview: "2 Datasets  2 Recipes", created: "2026-03-23", updated: "2026-03-23" },
  { name: "测试", overview: "5 Datasets  5 Recipes", created: "2026-03-22", updated: "2026-03-22" },
];

const reviewTasks = [
  "篮球版本1审查任务",
  "结构化数据集审查",
  "文档数据质量评估",
  "图片数据质量评估",
  "视频数据质量评估",
  "文本内容多样性",
  "文本语言统一性",
  "数据日期格式规范性",
];

const jobRows = [
  { name: "finance-sft-lora-07", type: "大模型微调训练", model: "Qwen3-8B", dataset: "金融年报问答集 v2.1", progress: 68, status: "训练中" },
  { name: "service-rag-index-12", type: "大模型 RAG 增强", model: "BGE-M3", dataset: "客服知识向量集 v3.4", progress: 100, status: "已完成" },
  { name: "vision-quant-int4-03", type: "大模型蒸馏轻量化", model: "Qwen2.5-VL", dataset: "篮球图像数据集 v1.3", progress: 24, status: "排队中" },
];

function Status({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "blue" | "orange" | "gray" }) {
  return <span className={`reuse-status ${tone}`}><i />{children}</span>;
}

function Progress({ value }: { value: number }) {
  return <div className="reuse-progress"><span style={{ width: `${value}%` }} /></div>;
}

function Login({ onLogin }: { onLogin: () => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin();
  }
  return (
    <main className="login-page">
      <div className="login-art" aria-hidden="true">
        <div className="data-cylinder"><span>高质量数据集</span><i /><i /><i /></div>
        <div className="data-line"><i /><i /><i /><i /></div>
        <div className="data-scroll">010010<br />110101<br />001110</div>
        <div className="data-cubes"><i /><i /><i /></div>
      </div>
      <form className="login-card" onSubmit={submit}>
        <header><h1>高质量数据集评估平台</h1><p>High quality dataset evaluation platform</p></header>
        <div className="login-tabs"><button type="button" className="active">密码登录</button><button type="button">验证码登录</button></div>
        <label><span>♙ 账 号：</span><input required defaultValue="高质量数据评估演示" aria-label="账号" placeholder="请输入用户名称/手机号码/电子邮箱" /></label>
        <label><span>♙ 密 码：</span><input required type="password" defaultValue="123456" aria-label="密码" placeholder="请输入密码" /></label>
        <label className="captcha-row"><span>▣ 验证码：</span><input required aria-label="验证码" placeholder="请输入验证码" /><b>3 + 5 =</b></label>
        <button className="login-submit">登 录</button>
        <div className="login-links"><button type="button">注册账号</button><button type="button">忘记密码？</button></div>
        <footer>@WINNOW | 商标 | 官网<br />粤ICP备2021133988号</footer>
      </form>
    </main>
  );
}

function ProjectToolbar({ project, setProject }: { project: string; setProject: (value: string) => void }) {
  const [mode, setMode] = useState("智能联动");
  const [view, setView] = useState("查看");
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <section className="project-toolbar">
      <label className="project-select"><span>数</span><select value={project} onChange={(event) => setProject(event.target.value)} aria-label="切换项目"><option>高质量数据集评估演示</option><option>高质量数据集测试</option><option>测试</option></select></label>
      <div className="project-actions">
        <div className="tiny-radios">{["智能联动", "自定义联动"].map((item) => <button key={item} onClick={() => setMode(item)} className={mode === item ? "active" : ""}><i />{item}</button>)}</div>
        <div className="tiny-radios">{["编辑", "查看"].map((item) => <button key={item} onClick={() => setView(item)} className={view === item ? "active" : ""}><i />{item}</button>)}</div>
        <span className="tool-divider" />
        <button disabled>♧ 告警管理</button><button disabled>⌯ 分享产品</button>
        <span className="tool-divider" />
        <button>⌄ 展开筛选器</button><button disabled>⟳ 刷新指标</button><button disabled>▤ 项目报告</button>
        <div className="export-wrap"><button onClick={() => setExportOpen(!exportOpen)}>⇧ 导出</button>{exportOpen && <div className="export-menu"><button onClick={() => setExportOpen(false)}>导出为图片</button><button onClick={() => setExportOpen(false)}>导出为 PDF</button></div>}</div>
      </div>
    </section>
  );
}

function HomeDashboard() {
  const checks = ["图像完好性", "图像重复率合规性", "图像涉黄合规性", "图像格式一致性", "图像内容有效性"];
  return (
    <section className="original-dashboard">
      <article className="file-panel white-panel">
        <h2>篮球高质量数据集1</h2>
        {[{ name: "篮球2.jpeg", time: "2026-03-22 17:00:35" }, { name: "篮球1.jpeg", time: "2026-03-22 17:00:36" }].map((file) => <button className="file-row" key={file.name}><span className="file-type">T</span><div><strong>{file.name}</strong><p><i>▧</i> JPEG <em>图像</em></p><small>{file.time}</small></div></button>)}
        <div className="file-empty"><span>＋</span><p>可继续添加数据文件</p></div>
      </article>
      <div className="dashboard-right">
        <article className="summary-panel white-panel">
          <header><h2>质量评估总结</h2><span>2026-03-23 18:37:06</span></header>
          <div className="summary-scroll">
            <p><strong>【结论】</strong>篮球版本1图像数据集已完成当前五项质量审查，2 个唯一图像样本均通过规则校验。</p>
            <h3>审查范围与数据表现概览：</h3>
            <p><b>唯一数据量：</b>2 个图像文件；<b>检查执行次数：</b>10 次；<b>问题样本：</b>0 个。</p>
            <h3>质量分析：</h3>
            <p>图像完好性、重复率、涉黄内容、格式一致性和内容有效性通过率均为 100%。结论仅适用于本次规则及当前样本，不直接代表模型训练效果。</p>
          </div>
        </article>
        <article className="result-panel white-panel">
          <h2>篮球版本1质量评估结果</h2>
          <div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>审查内容</th><th>组件名称</th><th>唯一数据量</th><th>问题数量</th><th>正确率</th></tr></thead><tbody>{checks.map((check) => <tr key={check}><td>篮球版本1</td><td>{check}</td><td>2</td><td>0</td><td><strong>100%</strong></td></tr>)}</tbody></table></div>
        </article>
      </div>
    </section>
  );
}

function InventoryPage() {
  const [section, setSection] = useState("数据库管理");
  return (
    <section className="reuse-content-page">
      <div className="reuse-page-tabs">{modules[1].children.map((item) => <button className={section === item ? "active" : ""} key={item} onClick={() => setSection(item)}>{item}</button>)}</div>
      <article className="white-panel reuse-list-panel">
        <div className="reuse-panel-head"><div><h2>{section}</h2><p>统一管理数据连接、数据文件和盘点结果</p></div><div><label className="reuse-search">⌕ <input placeholder="请输入关键字进行搜索" /></label><button className="reuse-primary">＋ 新建数据连接</button></div></div>
        <div className="source-cards">{[
          ["生产业务库", "MySQL", "42 张表", "5 分钟前"],
          ["数据评估文件仓", "本地文件", "12 个数据集", "18 分钟前"],
          ["知识文档仓", "SFTP", "1,286 个文件", "2 小时前"],
          ["业务事件接口", "REST API", "2.4M 条/日", "实时"],
        ].map((item, index) => <button key={item[0]} className="source-item"><span className={`source-symbol s${index}`}>{item[1].slice(0, 2)}</span><div><strong>{item[0]}</strong><p>{item[1]} · {item[2]}</p><small>最近同步：{item[3]}</small></div><Status>连接正常</Status></button>)}</div>
        <div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>数据源名称</th><th>连接类型</th><th>数据规模</th><th>同步策略</th><th>最近同步</th><th>状态</th><th>操作</th></tr></thead><tbody>{[
          ["生产业务库", "MySQL 8.0", "12.8 GB", "每 30 分钟", "5 分钟前"], ["数据评估文件仓", "本地文件", "36.4 GB", "手动触发", "18 分钟前"], ["知识文档仓", "SFTP", "34 GB", "每日 02:00", "2 小时前"]
        ].map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}<td><Status>正常</Status></td><td><button className="reuse-link">查看</button> <button className="reuse-link">配置</button></td></tr>)}</tbody></table></div>
      </article>
    </section>
  );
}

function GovernancePage() {
  const [section, setSection] = useState("开发项目管理");
  return (
    <section className="reuse-content-page">
      <div className="reuse-page-tabs"><button className={section === "开发项目管理" ? "active" : ""} onClick={() => setSection("开发项目管理")}>开发项目管理</button><button className={section === "定时任务管理" ? "active" : ""} onClick={() => setSection("定时任务管理")}>定时任务管理</button><button className={section === "定时任务抽取日志" ? "active" : ""} onClick={() => setSection("定时任务抽取日志")}>定时任务抽取日志</button></div>
      <article className="white-panel reuse-list-panel">
        <div className="reuse-panel-head"><div><h2>{section}</h2><p>当前项目：高质量数据集评估演示</p></div><div><button className="reuse-primary">＋ 新建项目</button><label className="reuse-search">⌕ <input placeholder="请输入关键字进行搜索" /></label><button className="reuse-secondary">搜索</button></div></div>
        {section === "开发项目管理" ? <div className="reuse-table-wrap"><table className="reuse-table project-table"><thead><tr><th>名称</th><th>项目类型</th><th>概览</th><th>创建人</th><th>创建时间</th><th>最近更新人</th><th>最近更新时间</th><th>标记</th><th>操作</th></tr></thead><tbody>{projectRows.map((row) => <tr key={row.name}><td><div className="project-name"><span>◉</span><strong>{row.name}</strong></div></td><td>普通项目</td><td>{row.overview}</td><td>高质量数据评估演示</td><td>{row.created}</td><td>高质量数据评估演示</td><td>{row.updated}</td><td><button className="tag-add">＋</button></td><td><button className="reuse-link">ETL</button> <button className="reuse-link">复制</button> <button className="reuse-link">重命名</button></td></tr>)}</tbody></table></div> : <div className="schedule-empty"><span>▤</span><h3>{section}</h3><p>暂无运行中的记录，可从治理工作间创建定时任务。</p><button className="reuse-primary">＋ 创建定时任务</button></div>}
        <footer className="reuse-pagination"><span>共 {section === "开发项目管理" ? 3 : 0} 条</span><button disabled>‹</button><button className="active">1</button><button disabled>›</button></footer>
      </article>
    </section>
  );
}

function AssessmentPage({ openDialog }: { openDialog: () => void }) {
  const [task, setTask] = useState(reviewTasks[0]);
  return (
    <section className="assessment-page">
      <aside className="white-panel task-browser">
        <div className="reuse-panel-head small"><div><h2>审查任务列表</h2><p>共 20 个任务</p></div><button className="reuse-primary" onClick={openDialog}>＋ 添加</button></div>
        <label className="reuse-search full">⌕ <input placeholder="请输入关键字进行搜索" /></label>
        <div className="assessment-task-list">{reviewTasks.map((item, index) => <button className={task === item ? "active" : ""} key={item} onClick={() => setTask(item)}><span>▣</span><div><strong>{item}</strong><small>{index < 2 ? "审查进行中..." : "等待审查"}</small></div><b>›</b></button>)}</div>
      </aside>
      <article className="white-panel assessment-scope">
        <header><div><h2>审查范围</h2><p>审查任务：<strong>{task}</strong></p></div><Status tone="blue">审查进行中</Status></header>
        <div className="scope-summary"><div><span>数据集</span><strong>1 个</strong></div><div><span>审查内容</span><strong>5 项</strong></div><div><span>唯一数据量</span><strong>2 个</strong></div><div><span>总分</span><strong>98.6 分</strong></div></div>
        <section className="assessment-item"><div className="dataset-illustration">数</div><div className="assessment-copy"><h3>篮球版本1.Image_annotation_multimodal_recipe</h3><p>多模态审查 · 5 个质量组件</p><Progress value={72} /><small>审查进行中，已完成 3 / 5 个组件</small></div><button className="reuse-primary">进入审查</button></section>
        <div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>组件名称</th><th>数据量</th><th>问题数量</th><th>正确率</th><th>评估日期</th><th>状态</th></tr></thead><tbody>{["图像完好性", "图像重复率合规性", "图像涉黄合规性", "图像格式一致性", "图像内容有效性"].map((name, index) => <tr key={name}><td><strong>{name}</strong></td><td>2</td><td>{index === 1 ? 1 : 0}</td><td>{index === 1 ? "50%" : "100%"}</td><td>2026-03-23</td><td><Status tone={index < 3 ? "green" : "gray"}>{index < 3 ? "已完成" : "等待评估"}</Status></td></tr>)}</tbody></table></div>
      </article>
    </section>
  );
}

function ModelDevelopment({ openDialog }: { openDialog: () => void }) {
  return (
    <section className="reuse-content-page">
      <article className="model-banner"><div><p>可用不可见模型开发环境</p><h2>模型能力可调用，底层资产不可见</h2><span>在租户隔离环境中完成微调、RAG、蒸馏量化和模型注册，训练数据、权重和密钥全程受控。</span></div><div className="secure-orbit"><span>◆</span><i /><i /><i /></div><button onClick={openDialog}>＋ 新建模型开发任务</button></article>
      <div className="model-capability-grid">{[
        ["大模型训练工具链", "微调训练", "LoRA、QLoRA、全量 SFT"], ["大模型蒸馏轻量化", "蒸馏量化", "INT8 / INT4 与知识蒸馏"], ["大模型 RAG 增强", "RAG 增强", "切片、索引、检索、重排"], ["模型注册与推理", "模型注册", "版本、审批、回滚、服务发布"]
      ].map((item, index) => <button className="model-capability" key={item[1]}><span className={`mc${index}`}>{["⌘", "◫", "⎈", "◎"][index]}</span><div><small>{item[0]}</small><strong>{item[1]}</strong><p>{item[2]}</p></div><b>›</b></button>)}</div>
      <article className="white-panel reuse-list-panel">
        <div className="reuse-panel-head"><div><h2>模型开发任务</h2><p>安全域资源使用率 68% · 当前等待队列 1</p></div><div><label className="reuse-search">⌕ <input placeholder="搜索任务名称" /></label><button className="reuse-primary" onClick={openDialog}>＋ 新建任务</button></div></div>
        <div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>任务名称</th><th>开发方式</th><th>基础模型</th><th>数据集版本</th><th>运行进度</th><th>安全策略</th><th>状态</th><th>操作</th></tr></thead><tbody>{jobRows.map((job) => <tr key={job.name}><td><strong>{job.name}</strong></td><td>{job.type}</td><td>{job.model}</td><td>{job.dataset}</td><td><div className="job-progress"><Progress value={job.progress} /><span>{job.progress}%</span></div></td><td><span className="secure-tag">可用不可见</span></td><td><Status tone={job.status === "已完成" ? "green" : job.status === "训练中" ? "blue" : "orange"}>{job.status}</Status></td><td><button className="reuse-link">查看日志</button></td></tr>)}</tbody></table></div>
      </article>
    </section>
  );
}

function ModelEvaluation() {
  const metrics = [["准确率", 83.4, 91.8], ["召回率", 78.6, 89.7], ["F1 值", 80.9, 90.7], ["事实忠实度", 86.2, 94.1], ["安全通过率", 98.1, 99.4]];
  return (
    <section className="reuse-content-page model-eval-page">
      <article className="white-panel evaluation-overview"><div><p>评测任务 #EV-20260822-04</p><h2>finance-assistant-v2.3 <span>对比</span> qwen3-8b-base</h2><small>金融问答黄金评测集 v4.2 · 2,000 条样本 · 双盲评测</small></div><div className="gate-pass"><span>发布门禁</span><strong>通过</strong><small>5 / 5 核心指标达标</small></div></article>
      <div className="model-eval-grid"><article className="white-panel metric-panel"><div className="reuse-panel-head small"><div><h2>能力指标对比</h2><p>基线模型 / 候选模型</p></div><div className="metric-legend"><span>基线</span><span>候选</span></div></div>{metrics.map((metric) => <div className="eval-metric-row" key={metric[0] as string}><strong>{metric[0]}</strong><div><i className="base" style={{ width: `${metric[1]}%` }} /><i className="candidate" style={{ width: `${metric[2]}%` }} /></div><span>{metric[1]}</span><b>{metric[2]}</b></div>)}</article><article className="white-panel test-panel"><div className="reuse-panel-head small"><div><h2>评测工具</h2><p>功能、性能与安全</p></div></div>{[["功能测试", "48 / 48", "通过"], ["性能测试", "P95 620ms", "通过"], ["安全测试", "1,000 条", "通过"], ["鲁棒性测试", "92.4 分", "通过"]].map((item) => <div className="test-row" key={item[0]}><span>✓</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div><Status>{item[2]}</Status></div>)}</article></div>
      <article className="white-panel reuse-list-panel"><div className="reuse-panel-head"><div><h2>评测任务列表</h2><p>模型版本必须通过评测门禁后才能发布</p></div><button className="reuse-primary">＋ 新建评测任务</button></div><div className="reuse-table-wrap"><table className="reuse-table"><thead><tr><th>评测任务</th><th>候选模型</th><th>评测数据</th><th>综合得分</th><th>创建时间</th><th>门禁结果</th></tr></thead><tbody>{[["金融问答能力评测", "finance-assistant-v2.3", "金融问答评测集 v4.2", "90.7"], ["RAG 召回质量评测", "service-rag-v3.4", "客服检索评测集 v3", "91.2"], ["图像理解安全评测", "vision-agent-v1.8", "多模态安全集 v2", "96.8"]].map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}><strong>{cell}</strong></td>)}<td>2026-08-22</td><td><Status>通过</Status></td></tr>)}</tbody></table></div></article>
    </section>
  );
}

function CreateDialog({ id, onClose, onCreated }: { id: DialogId; onClose: () => void; onCreated: () => void }) {
  if (!id) return null;
  return <div className="dialog-backdrop"><form className="reuse-dialog" onSubmit={(event) => { event.preventDefault(); onCreated(); }}><header><div><h2>{id === "assessment" ? "添加审查任务" : "新建模型开发任务"}</h2><p>{id === "assessment" ? "复用原平台数据审查流程" : "任务将在可用不可见安全域运行"}</p></div><button type="button" onClick={onClose}>×</button></header><label>任务名称<input required placeholder={id === "assessment" ? "请输入审查任务名称" : "例如：finance-sft-lora-08"} /></label>{id === "assessment" ? <><div className="dialog-tabs"><button type="button" className="active">语句文件</button><button type="button">数据产品</button><button type="button">自定义审查</button><button type="button">多模态审查</button></div><label>数据集<select defaultValue="篮球高质量数据集1"><option>篮球高质量数据集1</option><option>金融年报问答集 v2.1</option></select></label><label>审查方案<select defaultValue="图像质量评估标准 v2"><option>图像质量评估标准 v2</option><option>SFT 数据质量标准 v2</option></select></label></> : <><label>开发方式<select defaultValue="大模型微调训练"><option>大模型微调训练</option><option>大模型 RAG 增强</option><option>大模型蒸馏轻量化</option></select></label><label>基础模型<select defaultValue="Qwen3-8B"><option>Qwen3-8B</option><option>Qwen2.5-VL</option><option>BGE-M3</option></select></label><label>训练数据版本<select defaultValue="金融年报问答集 v2.1"><option>金融年报问答集 v2.1</option><option>篮球图像数据集 v1.3</option></select></label><div className="dialog-security"><span>◆</span><p><strong>安全域策略已启用</strong><br />模型权重、训练数据和运行密钥不可下载。</p></div></>}<footer><button type="button" className="reuse-secondary" onClick={onClose}>取消</button><button className="reuse-primary">确定</button></footer></form></div>;
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(true);
  const [active, setActive] = useState<ModuleId>("home");
  const [tabs, setTabs] = useState<Array<{ id: ModuleId; label: string }>>([{ id: "home", label: "首页" }]);
  const [menuOpen, setMenuOpen] = useState<ModuleId | null>(null);
  const [project, setProject] = useState("高质量数据集评估演示");
  const [dialog, setDialog] = useState<DialogId>(null);
  const [toast, setToast] = useState("");
  const [assistant, setAssistant] = useState(false);

  function openModule(id: ModuleId, label?: string) {
    const moduleItem = modules.find((item) => item.id === id)!;
    setActive(id);
    setMenuOpen(null);
    setTabs((current) => current.some((tab) => tab.id === id) ? current : [...current, { id, label: label || moduleItem.children[0] || moduleItem.label }]);
  }

  function closeTab(id: ModuleId) {
    if (id === "home") return;
    setTabs((current) => current.filter((tab) => tab.id !== id));
    if (active === id) setActive("home");
  }

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  const currentModule = modules.find((item) => item.id === active)!;
  return (
    <div className="reuse-app">
      <aside className="icon-rail">
        <div className="rail-logo">质</div>
        <nav aria-label="平台模块">{modules.map((item) => <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => item.children.length ? setMenuOpen(menuOpen === item.id ? null : item.id) : openModule(item.id)} title={item.label}><span>{item.icon}</span><small>{item.short}</small></button>)}</nav>
        <button className="theme-dots" aria-label="切换主题"><i /><i /><i /><i /></button>
      </aside>
      {menuOpen && <aside className="rail-flyout"><header><strong>{modules.find((item) => item.id === menuOpen)?.label}</strong><button onClick={() => setMenuOpen(null)}>×</button></header>{modules.find((item) => item.id === menuOpen)?.children.map((child, index) => <button key={child} onClick={() => openModule(menuOpen, child)}><span>{index + 1}</span>{child}<b>›</b></button>)}</aside>}
      <header className="reuse-topbar"><div className="reuse-breadcrumb"><button>☰</button><strong>{currentModule.label}</strong><span>/</span><span>{tabs.find((tab) => tab.id === active)?.label || currentModule.label}</span></div><nav><button>▣ 快速入门</button><button>♙ 我的主页</button><button>▤ 消息</button><button onClick={() => setLoggedIn(false)}>⇥ 退出登录</button><i /><strong>高质量数据评估演示</strong></nav></header>
      <div className="open-tabs">{tabs.map((tab) => <button key={tab.id} className={active === tab.id ? "active" : ""} onClick={() => setActive(tab.id)}><i />{tab.label}{tab.id !== "home" && <span role="button" tabIndex={0} aria-label={`关闭${tab.label}`} onClick={(event) => { event.stopPropagation(); closeTab(tab.id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.stopPropagation(); closeTab(tab.id); } }}>×</span>}</button>)}</div>
      <main className="reuse-main"><ProjectToolbar project={project} setProject={setProject} />{active === "home" && <HomeDashboard />}{active === "inventory" && <InventoryPage />}{active === "governance" && <GovernancePage />}{active === "assessment" && <AssessmentPage openDialog={() => setDialog("assessment")} />}{active === "modelDev" && <ModelDevelopment openDialog={() => setDialog("model")} />}{active === "modelEval" && <ModelEvaluation />}</main>
      <button className="reuse-assistant-button" onClick={() => setAssistant(!assistant)} aria-label="打开质量助手">✦</button>
      {assistant && <aside className="reuse-assistant"><header><strong>质量助手</strong><button onClick={() => setAssistant(false)}>×</button></header><p>当前项目包含 12 个数据集、20 个治理 Recipe 和 3 个模型开发任务。</p><button onClick={() => openModule("assessment")}>查看数据评估</button><button onClick={() => openModule("modelDev")}>进入模型开发</button></aside>}
      <CreateDialog id={dialog} onClose={() => setDialog(null)} onCreated={() => { setDialog(null); setToast("任务已创建并加入运行队列"); window.setTimeout(() => setToast(""), 2800); }} />
      {toast && <div className="reuse-toast">✓ {toast}</div>}
    </div>
  );
}
