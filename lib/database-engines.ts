export const databaseEngines = [
  { id: 'mysql', name: 'MySQL', port: 3306, mark: 'My', color: '#00758f', note: '' },
  { id: 'postgres', name: 'PostgreSQL', port: 5432, mark: 'PG', color: '#336791', note: '' },
  { id: 'opengauss', name: 'openGauss', port: 5432, mark: 'OG', color: '#d64048', note: '使用 openGauss 专用驱动，支持原生认证' },
  { id: 'kingbase', name: '人大金仓', port: 54321, mark: 'K', color: '#c82732', note: '使用 KingbaseES 官方 kb 驱动' },
  { id: 'tidb', name: 'TiDB', port: 4000, mark: 'Ti', color: '#d72b3f', note: 'MySQL 协议' },
  { id: 'oceanbase', name: 'OceanBase', port: 2881, mark: 'OB', color: '#0866e5', note: '仅支持 MySQL 模式租户；账号按租户配置填写' },
] as const;
export type DatabaseEngine = typeof databaseEngines[number]['id'];
export function databaseEngine(id: DatabaseEngine) { return databaseEngines.find(item => item.id === id)!; }
