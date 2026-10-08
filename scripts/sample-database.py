"""Export/restore only the explicitly listed synthetic local samples."""
import argparse
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / 'samples/database/local-samples.sql'
TABLES = ('data_projects', 'data_assets', 'data_versions', 'quality_runs', 'project_assets', 'project_workflows', 'assessment_issue_actions')


def quote(value):
    if value is None:
        return 'NULL'
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def export(database):
    manifest = json.loads((ROOT / 'samples/local/manifest.json').read_text())
    projects = [item['id'] for item in manifest['projects']]
    assets = [item['id'] for item in manifest['assets']]
    with sqlite3.connect(database.resolve().as_uri() + '?mode=ro', uri=True) as db:
        db.row_factory = sqlite3.Row
        rows = {}
        for table in TABLES:
            field, ids = ('id', projects) if table == 'data_projects' else ('project_id', projects) if table == 'project_workflows' else ('id', assets) if table == 'data_assets' else ('asset_id', assets)
            if table == 'assessment_issue_actions':
                rows[table] = db.execute('SELECT * FROM assessment_issue_actions WHERE run_id IN (SELECT id FROM quality_runs WHERE asset_id IN (' + ','.join('?' for _ in assets) + '))', assets).fetchall()
            else:
                rows[table] = db.execute(f'SELECT * FROM "{table}" WHERE "{field}" IN (' + ','.join('?' for _ in ids) + ')', ids).fetchall()
        assert len(rows['data_projects']) == len(projects)
        assert len(rows['data_assets']) == len(assets)
        assert all(row['name'].startswith('样例 · ') and row['owner_id'] == 'auth-admin' for table in ('data_projects', 'data_assets') for row in rows[table])
        statements = ['-- Synthetic samples only. No users, sessions, connection secrets or business snapshots.', '-- Apply after logging in once with the local demo account and stopping the dev server.', 'BEGIN;']
        for table in TABLES:
            ddl = db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone()[0]
            statements.append(ddl.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS', 1) + ';')
            for row in rows[table]:
                columns = ','.join('"' + key + '"' for key in row.keys())
                statements.append(f'INSERT OR IGNORE INTO "{table}" ({columns}) VALUES (' + ','.join(quote(row[key]) for key in row.keys()) + ');')
        statements.append('COMMIT;')
        SNAPSHOT.parent.mkdir(parents=True, exist_ok=True)
        SNAPSHOT.write_text('\n'.join(statements) + '\n')
        print(json.dumps({table: len(items) for table, items in rows.items()}, ensure_ascii=False))


def restore(database):
    # Refuse to create an unexpected database or restore before local initialization.
    with sqlite3.connect(database.resolve().as_uri() + '?mode=rw', uri=True) as db:
        assert db.execute("SELECT 1 FROM platform_users WHERE id='auth-admin'").fetchone(), '请先启动应用并登录一次本地演示账号，再停止开发服务后恢复'
        db.execute('PRAGMA foreign_keys=ON')
        db.executescript(SNAPSHOT.read_text())
        print('样例数据库已恢复；同 ID 的已有记录保持不变。')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['export', 'restore'])
    parser.add_argument('--database', type=Path, required=True)
    args = parser.parse_args()
    (export if args.mode == 'export' else restore)(args.database)
