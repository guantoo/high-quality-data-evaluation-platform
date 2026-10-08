# vinext-starter

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Email and name are intended for display or contact purposes.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)

## 业务数据库与实际可用性

平台使用 D1 保存账号、会话和共享状态。业务集合还会按记录写入
`platform_records`，数据库操作写入独立的 `platform_write_audit`。
运行时自动创建缺少的表；迁移 SQL 位于 `drizzle/0001_business_records.sql`。
旧快照在下一次保存时同步至记录表。管理员可通过 `/api/database` 查看记录统计与审计。
前端保存携带 `x-platform-base` 基准时间；过期写入返回 409，需要刷新后重试。

执行 `npm run test:db` 使用独立临时 D1 实测认证、事务、账号停用与接口权限。
完整限制与逐项结论见 `docs/功能实际可用性审查.md`。训练、同步和评测仍使用演示执行逻辑。

## 结构化数据处理（原有功能内）

- 智能数据盘点 → 本地数据管理 → 结构化文件：导入 CSV、JSON、JSONL；多模态文件预览保留在同页。
- 数据库管理 → 数据资产：查询资产、查看版本、下载 CSV、设置项目共享；数据连接配置保留在“数据连接”。
- 数据探查 / 智能数据盘点：计算并展示实际字段画像、完整率、唯一率及问题明细。
- 智能数据清洗：去重、空格清理、手机号/邮箱脱敏，保存新版本并保留原始数据。
- 高质量数据评估 / 评估历史：执行结构质量检查、查看历史运行并导出 JSON 报告。

数据资产、不可变版本、历史运行分别存入 `data_assets`、`data_versions`、`quality_runs`。
当前限制：文件 1 MiB、5000 行、100 个字段；同步执行，尚无大文件后台任务。
质量分仅衡量结构完整性与记录唯一性，不包含多模态、语义或合规认证。
模型开发和大模型能力评测按用户要求暂缓开发。

## 项目共享与服务端审计

“高质量数据治理 → 治理项目管理 → 项目管理”创建项目并配置已有账号的只读/编辑权限；
在数据库管理的数据资产中将自有资产归入自有项目。统一通过“新建数据治理项目”创建项目，项目内提供数据资产关联、成员管理与数据清洗处理；数据清洗处理内嵌原有可视化工作流，资源仅显示当前项目资产，节点与连线按项目保存；项目工作流现已通过受保护的本机执行服务运行真实节点。项目管理页不再展示历史流程工作间入口。
编辑成员执行处理仍需满足平台模块管理权限。未归入项目的资产默认私有。
管理员在“平台管理 → 审计日志”查询和导出服务端操作记录，在“本地数据”查看真实数据表统计。
本地备份仍只覆盖平台快照，尚不包含独立资产数据版本。
项目共享迁移位于 `drizzle/0003_project_sharing.sql`；运行时自动创建缺少的表。
旧快照接口已按模块过滤无权限数据，并在保存时保留服务端隐藏集合。

### 真实数据库接入

在现有「智能数据盘点 → 数据库管理 → 数据连接」中配置 MySQL 或 PostgreSQL。保存前实际验证账号；读取表目录、预览前 50 行，选择整表或样本导入到现有数据资产，继续探查、清洗和评估。仅执行只读查询，不写入源数据库。整表导入上限 5000 行、100 字段、1 MiB；超限明确报错，可改为样本导入。当前为手动导入，不提供定时或增量同步。

`npm run dev` 自动启动本机数据库连接服务；`.dev.vars` 首次运行自动生成连接服务地址、随机服务令牌和 32 字节 AES-GCM 密钥，文件不提交版本库。数据库密码在平台 D1 中加密保存，不返回浏览器。备份数据时需同时妥善保管该密钥，丢失后需重新填写连接密码。

生产环境需单独运行 `connector/server.mjs` 对应的 Node 服务，并通过 HTTPS 配置 `DB_CONNECTOR_URL`、`DB_CONNECTOR_TOKEN`、`DB_CONNECTION_KEY`；连接服务必须能访问源数据库，令牌仅供平台后端使用。仓库中的本机启动命令只监听 `127.0.0.1`，生产部署需要适配受保护的服务入口。D1 新增迁移为 `drizzle/0004_database_connections.sql`。建议使用仅授予目标表 SELECT 权限的账号；TLS 默认开启，并验证证书，可填写自定义 CA。

`npm run test:connectors` 使用独立测试库（MySQL `127.0.0.1:23306`、PostgreSQL `127.0.0.1:25432`，库名 `quality_test`），测试数据结构及专用账号见 `tests/fixtures`。该测试使用临时 D1，不修改平台业务数据；常规测试默认跳过需要外部数据库的集成项。

### 国产数据库适配

数据库类型入口提供 openGauss、人大金仓、TiDB 和 OceanBase。TiDB 默认 4000，使用 MySQL 驱动，单独处理不支持 `START TRANSACTION READ ONLY` 的差异，服务仅发送预定义的查询语句，请使用只读账号。OceanBase 默认 2881，仅适配 MySQL 模式租户，账号需填写租户要求的完整名称。openGauss 使用 `pg-opengauss` 专用驱动处理原生认证，默认 5432，不要求将服务端认证改成 MD5。

人大金仓默认 54321；官方 Node 驱动 `kb` 由厂商分发，请将对应版本驱动放在连接服务主机，再设置 `HQDP_KINGBASE_DRIVER` 为该驱动模块的绝对路径并重启服务。不要安装 npm 上同名 `kb` 包代替官方驱动。尚未配置时，实际测试连接会明确返回“人大金仓驱动未配置”，不会模拟成功。新增国产数据库需按部署版本、认证方式和读取权限做实际环境验收；兼容协议测试不代表所有厂商版本均已通过验收。


### 治理节点真实执行

项目内的 18 种模板均提供真实执行器，按连线拓扑顺序运行；单节点运行先执行必要的上游。循环、多个上游、未绑定输入或参数错误会明确失败。运行面板展示服务返回的耗时、记录/文件数量和失败原因，不再模拟进度。

- 结构化：CSV/JSON/JSONL 或项目资产版本接入；字段空白/控制字符清理；指定字段缺失值填充；关键字段精确去重（保留首次记录）；Unicode、日期、大小写标准化；手机号/邮箱掩码；指定字段非空校验；CSV 输出。绑定项目资产的结果输出在原资产下创建新版本，不覆盖原始版本。普通本地文件输出可下载。
- 非结构化：本地文件或粘贴文本接入；UTF-8 文本清洗；PNG/JPEG/WebP 格式及尺寸转换；音频转 WAV、采样率/声道/分段；视频抽帧（最多 100 帧）；MD5/SHA-256 内容去重；图像、音视频解码及文本有效性检查；文件输出下载。
- 文档：文本 PDF（最多 30 页）、TXT/Markdown、图像中英文 OCR。中英文语言包随 npm 安装，OCR 不上传到外部服务。当前仅提取文字；扫描 PDF 请拆成图像上传，不提供表格还原或智能纠错。
- 人工复核：实际提交每个图像样本的标注后才通过；未完成时明确中断。AI 预标注在项目真实执行模式禁用。质量检查输出问题报告或中断流程，不自动修正异常。

输入最多 20 个文件、每个 1 MiB；单节点输出最多 8 MiB；保存流程 JSON 最大约 1.5 MB。当前每个处理节点只允许一个上游。质量/规则能力以界面当前参数为准，未实现的智能补齐、语义去重、跨源核验、定时触发等不在项目真实执行选项中展示。

依赖 `sharp`、`ffmpeg-static`、`tesseract.js`、`pdfjs-dist` 与本地中英文语言包，由现有 `connector/server.mjs` 的认证接口 `/v1/governance` 执行；生产部署也必须运行该 Node 服务并配置现有连接服务环境变量。若 npm 禁止安装脚本，需允许 `ffmpeg-static` 官方安装脚本以取得二进制。升级执行器后需重启连接服务。

验收：`node --test tests/governance.test.mjs` 覆盖全部模板的真实处理结果、OCR/PDF、图像像素、音频头和视频帧；`node --test tests/governance-api.test.mjs` 使用独立临时 D1 数据库验证认证、资产归属、执行失败不落库、新版本输出与原版本保留。测试不改动现有业务数据库。

## 本地样例与数据库恢复

启动 `npm run dev` 后执行 `npm run samples:local`，在现有入口创建合成样例并验证真实数据链路。9 个样例项目覆盖全部 18 类治理节点，包含 CSV、JSON、JSONL、文本、图像、音频、视频、PDF 和 OCR。

- 样例、实际输出和验收记录：[`samples/local/`](samples/local/README.md)。
- 已验收的样例数据库快照与恢复步骤：[`samples/database/`](samples/database/README.md)，保留资产版本、工作流与浏览器实际提交的人工标注。
- 数据库迁移：`drizzle/`；独立 MySQL/PostgreSQL 样例初始化：[`tests/fixtures/`](tests/fixtures/README.md)。

本地运行库、登录会话、连接密码和 `.dev.vars` 密钥留在开发机，不提交 GitHub。新机器首次运行会生成新的本地连接服务密钥；外部数据库连接需在现有数据连接页面重新配置。
