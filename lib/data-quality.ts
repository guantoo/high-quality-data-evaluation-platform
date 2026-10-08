export type DataRow = Record<string, string>;
export type DatasetContent = { columns: string[]; rows: DataRow[] };
export type CleaningRules = { trim: boolean; deduplicate: boolean; maskSensitive: boolean };
export const maxFileBytes = 1024 * 1024;

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false; let closed = false;
  const input = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else cell += char;
    } else if (char === '"') {
      if (cell || closed) throw new Error('CSV 引号位置无效');
      quoted = true;
    } else if (char === ',' || char === '\n') {
      row.push(cell); cell = ''; closed = false;
      if (char === '\n') { rows.push(row); row = []; }
    } else {
      if (closed) throw new Error('CSV 引号后只能是分隔符');
      cell += char;
    }
  }
  if (quoted) throw new Error('CSV 引号未闭合');
  if (cell || row.length || closed) { row.push(cell); rows.push(row); }
  return rows.filter(values => !(values.length === 1 && values[0] === ''));
}
export function parseDataset(filename: string, text: string): DatasetContent {
  if (new TextEncoder().encode(text).byteLength > maxFileBytes) throw new Error('文件超过 1 MiB 限制');
  let columns: string[]; let rows: DataRow[];
  if (/\.csv$/i.test(filename)) {
    const matrix = parseCsv(text); columns = (matrix.shift() ?? []).map(value => value.trim());
    if (matrix.some(row => row.length !== columns.length)) throw new Error('CSV 行的字段数与表头不一致');
    rows = matrix.map(row => Object.fromEntries(columns.map((name, i) => [name, row[i]])));
  } else if (/\.jsonl?$/i.test(filename)) {
    const value: unknown = /\.jsonl$/i.test(filename) ? text.trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)) : JSON.parse(text);
    if (!Array.isArray(value) || value.some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error('JSON 必须是对象数组，JSONL 必须每行一个对象');
    columns = Array.from(new Set(value.flatMap(row => Object.keys(row))));
    rows = value.map(row => Object.fromEntries(columns.map(name => {
      const cell = row[name];
      if (cell !== null && typeof cell === 'object') throw new Error('当前版本只支持扁平字段');
      return [name, cell === null || cell === undefined ? '' : String(cell)];
    })));
  } else throw new Error('仅支持 CSV、JSON、JSONL 文件');
  if (!columns.length || columns.some(name => !name || name.length > 120) || new Set(columns).size !== columns.length) throw new Error('表头不能为空、重复或超过 120 字符');
  if (!rows.length || rows.length > 5000 || columns.length > 100) throw new Error('数据需包含 1–5000 行、最多 100 个字段');
  return { columns, rows };
}
export function profileDataset(content: DatasetContent) {
  const seen = new Set<string>(); const issues: Array<{ row: number; field: string; rule: string }> = [];
  let duplicates = 0; let empty = 0;
  content.rows.forEach((row, index) => {
    const signature = JSON.stringify(content.columns.map(column => row[column]));
    if (seen.has(signature)) { duplicates++; issues.push({ row: index + 1, field: '*', rule: '重复记录' }); }
    seen.add(signature);
    for (const field of content.columns) {
      if (!row[field].trim()) { empty++; issues.push({ row: index + 1, field, rule: '空值' }); }
      else if (row[field] !== row[field].trim()) issues.push({ row: index + 1, field, rule: '首尾空格' });
    }
  });
  const total = content.rows.length * content.columns.length;
  const completeness = Math.round((1 - empty / total) * 10000) / 100;
  const uniqueness = Math.round((1 - duplicates / content.rows.length) * 10000) / 100;
  return { records: content.rows.length, duplicates, empty, completeness, uniqueness,
    score: Math.round((completeness + uniqueness) * 50) / 100,
    formula: '质量分 =（非空单元格占比 + 唯一记录占比）/ 2 × 100；仅评估结构质量',
    fields: content.columns.map(name => ({ name, empty: content.rows.filter(row => !row[name].trim()).length, unique: new Set(content.rows.map(row => row[name])).size })),
    issueCount: issues.length, issues: issues.slice(0, 200), issuesTruncated: issues.length > 200 };
}
export function cleanDataset(content: DatasetContent, rules: CleaningRules): DatasetContent {
  const seen = new Set<string>(); const rows: DataRow[] = [];
  for (const source of content.rows) {
    const row = Object.fromEntries(content.columns.map(field => {
      return [field, rules.trim ? source[field].trim() : source[field]];
    }));
    const signature = JSON.stringify(content.columns.map(field => row[field]));
    if (rules.deduplicate && seen.has(signature)) continue;
    seen.add(signature);
    // Deduplicate before redaction so different private values cannot collapse into one record.
    if (rules.maskSensitive) for (const field of content.columns) row[field] = row[field].replace(/\b(1[3-9]\d)\d{4}(\d{4})\b/g, '$1****$2').replace(/([\w.+-]+)@([\w.-]+\.[A-Za-z]{2,})/g, '***@$2');
    rows.push(row);
  }
  return { columns: [...content.columns], rows };
}
export function exportCsv(content: DatasetContent) {
  // Neutralize spreadsheet formulas when exporting untrusted cells.
  const quote = (value: string) => '"' + (/^[=+\-@\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""') + '"';
  return [content.columns, ...content.rows.map(row => content.columns.map(field => row[field]))].map(row => row.map(quote).join(',')).join('\r\n');
}
