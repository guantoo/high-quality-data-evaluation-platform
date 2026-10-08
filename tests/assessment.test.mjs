import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
async function compile(file, replacements = {}) {
 let source = await readFile(new URL(`../lib/${file}.ts`, import.meta.url), 'utf8');
 for (const [from, to] of Object.entries(replacements)) source = source.replace(from, to);
 return `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText).toString('base64')}`;
}
const document = await compile('assessment-document');
const catalog = await compile('assessment-catalog'); const quality = await compile('data-quality');
const engine = await import(await compile('assessment', { "'./assessment-document'": JSON.stringify(document), "'./assessment-catalog'": JSON.stringify(catalog), "'./data-quality'": JSON.stringify(quality) }));
const awaitCatalog = (await import(catalog)).assessmentCatalog;
const data = (await import(quality)).parseDataset('x.csv', 'name,age\nAlice,1\nAlice,1\nBob,');
test('all 45 source rules preserved; automatic results use actual records and cell counts', () => {
 const report = engine.assessDataset(data);
 assert.equal(report.total, 9); assert.equal(report.calculated, 5); assert.equal(report.pending, 4);
 const value = name => report.results.find(rule => rule.name === name).value;
 assert.equal(value('结构完整性'), 66.67); assert.equal(value('数据元素完整性'), 83.33);
 assert.equal(value('数据重复率'), 33.33); assert.equal(value('数据唯一性'), 66.67);
 assert.equal((awaitCatalog).length, 45); assert.equal(awaitCatalog.filter(rule => rule.suggested).length, 9);
});
test('missing evidence stays pending; verified count evidence is evaluated without changing original', () => {
 const original = structuredClone(data); const rule = awaitCatalog.find(rule => rule.name === '标注准确性');
 const evidence = engine.validateEvidence({ [rule.id]: { numerator: 8, denominator: 10, note: '复核记录 2026-10-08' } });
 assert.equal(engine.assessDataset(data, evidence, [rule.id]).results.find(item => item.id === rule.id).value, 80);
 assert.deepEqual(data, original);
 for (const entry of [{ numerator: 11, denominator: 10, note: 'x' }, { numerator: 0, denominator: 0, note: 'x' }, { numerator: 1, denominator: 1, note: '' }]) assert.throws(() => engine.validateEvidence({ [rule.id]: entry }));
 assert.throws(() => engine.validateEvidence({ unknown: {} }));
});

test('selection isolates execution and rejects empty, duplicate, unknown or excluded rules', () => {
 const selected = ['rule-26'];
 const report = engine.assessDataset(data, {}, selected);
 assert.equal(report.total, 1); assert.deepEqual(report.results.map(rule => rule.id), selected);
 for (const ids of [[], ['bad'], ['rule-26', 'rule-26'], ['rule-15'], null]) assert.throws(() => engine.validateSelectedRules(ids));
 const pending = engine.assessDataset(data, {}, ['rule-00']);
 assert.equal(pending.pending, 1); assert.equal(pending.results[0].status, '待提供说明文档'); assert.equal(pending.calculated, 0);
});

const docs = await import(document);
test('platform reads document and records matched lines and missing requirements; ignores manual counts', () => {
 const document = { filename: '说明.md', text: '# 数据集规模\n1000 条记录\n数据格式：CSV\n文件结构：data.csv 包含姓名和年龄\n获取渠道：https://example.test/data\n技术支持：待补充' };
 const report = engine.assessDataset(data, { 'rule-00': { numerator: 5, denominator: 5, note: '不能替代读取' } }, ['rule-00'], document);
 const result = report.results[0]; assert.equal(result.value, 80); assert.equal(result.denominator, 5);
 assert.equal(result.documentCheck.checks[0].line, 1); assert.equal(result.documentCheck.checks[4].found, false);
 assert.match(result.documentCheck.checks[0].excerpt, /1000 条/);
 const headings = docs.inspectDocument('基本信息完整性', { filename: 'empty.md', text: '# 数据集规模\n# 格式规范\n# 文件结构\n# 获取渠道\n# 技术支持方式' }); assert.equal(headings.numerator, 0);
});
test('JSON docs and validation: all four document rules, empty, malformed, oversized and binary formats', () => {
 const doc = { filename: '说明.json', text: JSON.stringify({ 数据集规模: '1000 条', 格式规范: 'CSV', 文件结构: 'data.csv', 获取渠道: '内部目录', 技术支持方式: 'support@example.test' }) };
 assert.equal(docs.inspectDocument('基本信息完整性', docs.validateAssessmentDocument(doc)).numerator, 5);
 for (const name of ['内容特征完整性', '建设过程完整性', '应用说明完整性']) assert.equal(docs.inspectDocument(name, doc).denominator, 5);
 assert.throws(() => docs.inspectDocument('基本信息完整性', { filename: 'x.json', text: '{bad' }));
 for (const doc of [{ filename: 'x.pdf', text: 'binary' }, { filename: 'x.txt', text: '' }, { filename: 'x.md', text: 'x'.repeat(512 * 1024 + 1) }]) assert.throws(() => docs.validateAssessmentDocument(doc));
});
