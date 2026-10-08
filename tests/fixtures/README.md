# 数据库连接集成测试

以下账号及密码仅用于一次性的本机测试容器。先启动两个隔离库：

```sh
docker run --rm -d --name hqdp-mysql-acceptance -p 127.0.0.1:23306:3306 -e MYSQL_ROOT_PASSWORD=hqdp_isolated_test -e MYSQL_DATABASE=quality_test mysql:8.0
docker run --rm -d --name hqdp-postgres-acceptance -p 127.0.0.1:25432:5432 -e POSTGRES_PASSWORD=hqdp_isolated_test -e POSTGRES_DB=quality_test postgres:17-alpine
```

待 MySQL 的 `mysqladmin ping`、PostgreSQL 的 `pg_isready` 确认服务已就绪后，初始化合成数据：

```sh
docker exec -i hqdp-mysql-acceptance mysql -uroot -phqdp_isolated_test < tests/fixtures/mysql-connector.sql
docker exec -i hqdp-postgres-acceptance psql -U postgres -d quality_test < tests/fixtures/postgres-connector.sql
npm run test:connectors
```

测试使用 `quality_reader` 只读账号、临时 D1 和随机连接服务令牌，覆盖认证、表目录、特殊表名及字段名、精度、空表、越权、加密、导入上限、回滚和下游清洗/评估。完成后删除一次性容器：

```sh
docker stop hqdp-mysql-acceptance hqdp-postgres-acceptance
```

## 原生 TiDB

```sh
docker run --rm -d --name hqdp-tidb-adapter -p 127.0.0.1:24000:4000 pingcap/tidb:v8.5.4 --store=unistore --path=/tmp/tidb
# 待启动完成后，使用此一次性容器的 root 账号初始化合成数据和只读账号
HQDP_TIDB_INTEGRATION=1 node --test tests/domestic-live.test.mjs
docker stop hqdp-tidb-adapter
```

这里的 unistore 仅用于本机验收，不是生产部署方案。openGauss、金仓、OceanBase 的原生实例尚未纳入本次自动验收，不将驱动加载或兼容协议检查作为原生数据库验收结果。
