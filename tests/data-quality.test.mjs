import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../lib/data-quality.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const engine = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('CSV: BOM, quoted comma, escaped quote, multiline and malformed records', () => {
  const content = engine.parseDataset('test.csv', '\uFEFFname,note\r\nAlice,"hello, world"\r\nBob,"a""b\nc"\r\n');
  assert.equal(content.rows[0].note, 'hello, world'); assert.equal(content.rows[1].note, 'a"b\nc');
  for (const input of ['name,name\na,b', 'name,note\na', 'name\n"open', 'name\n"closed"x']) assert.throws(() => engine.parseDataset('test.csv', input));
});
test('real profiling and cleaning preserve source, expose nulls and produce deterministic results', () => {
  const content = engine.parseDataset('test.csv', 'name,phone\n Alice ,13812345678\nAlice,13812345678\nBob,\n');
  const original = structuredClone(content);
  const cleaned = engine.cleanDataset(content, { trim: true, deduplicate: true, maskSensitive: true });
  assert.deepEqual(content, original); assert.equal(cleaned.rows.length, 2); assert.equal(cleaned.rows[0].phone, '138****5678');
  const profile = engine.profileDataset(cleaned); assert.equal(profile.empty, 1); assert.equal(profile.completeness, 75); assert.equal(profile.score, 87.5);
  assert.deepEqual(engine.cleanDataset(cleaned, { trim: true, deduplicate: true, maskSensitive: true }), cleaned);
});
test('JSON/JSONL flat schema, limits and formula-safe export', () => {
  const content = engine.parseDataset('test.jsonl', '{"a":1}\n{"b":"=SUM(1,2)"}');
  assert.deepEqual(content.columns, ['a', 'b']); assert.equal(content.rows[0].b, '');
  assert.match(engine.exportCsv(content), /'=SUM/);
  assert.throws(() => engine.parseDataset('test.json', '[{"a":{"b":1}}]'));
  assert.throws(() => engine.parseDataset('test.csv', 'a\n' + 'x'.repeat(1024 * 1024)));
});

test('redaction does not remove distinct original records', () => {
  const content = engine.parseDataset('test.csv', 'email\na@example.test\nb@example.test');
  assert.equal(engine.cleanDataset(content, { trim: true, deduplicate: true, maskSensitive: true }).rows.length, 2);
});
