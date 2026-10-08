# 可恢复的本地样例数据库

`local-samples.sql` 仅导出样例清单中 9 个项目、3 个资产，以及它们的版本、质量运行、工作流、真实人工标注提交和问题处理状态。所有源数据为代码合成；不包含账号密码、会话、数据库连接配置或密钥。

完整数据库结构迁移位于仓库 `drizzle/`，MySQL/PostgreSQL 测试数据和初始化方法位于 `tests/fixtures/`。不需要把开发机的完整 `.wrangler` 数据库复制到 GitHub。

## 在新机器恢复这次样例

1. 执行 `npm ci`、`npm run dev`，登录一次本地演示账号以初始化数据库，然后停止开发服务。
2. 找到 `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` 中非 `metadata.sqlite` 的数据库文件。
3. 执行 `python3 scripts/sample-database.py restore --database <数据库文件路径>`。
4. 重新执行 `npm run dev`，在「高质量数据治理 → 治理项目管理」查看样例；可运行已恢复的人工复核流程。

恢复仅插入不存在的样例 ID，不覆盖同 ID 的已有记录。重复恢复不会增加重复项目。

也可启动应用后执行 `npm run samples:local`，通过真实业务接口重新生成样例并运行；首次使用这种方式时，人工复核需要在浏览器画框并提交。

重新导出当前合成样例：`python3 scripts/sample-database.py export --database <数据库文件路径>`。脚本按 `samples/local/manifest.json` 的明确 ID 白名单导出，仅支持本地演示账号拥有的「样例 ·」项目和资产。
