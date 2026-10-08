import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { Miniflare } from 'miniflare';
const compile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const helperSource=await readFile(new URL('../lib/assessment-issues.ts',import.meta.url),'utf8');
const helper=await import(`data:text/javascript;base64,${Buffer.from(compile(helperSource)).toString('base64')}`);
const fixture={id:'r',asset_id:'a',name:'实际资产',filename:'records.csv',version:1,created_at:Date.now(),result:JSON.stringify({assessment:{results:[
  {id:'rule-26',name:'数据重复率',numerator:2,denominator:10,method:'全量整行精确比较'},
  {id:'pending',name:'证据规则',numerator:null,denominator:null},
  {id:'perfect',name:'数据唯一性',numerator:10,denominator:10,method:'检查'},
  {id:'doc',name:'基本信息完整性',numerator:1,denominator:2,method:'文档检查',documentCheck:{checks:[{name:'数据规模',found:true},{name:'格式规范',found:false}]}},
]}})};
test('findings are measured results only, with original provenance and no invented risk/threshold',()=>{
 const findings=helper.assessmentFindings(fixture);
 assert.equal(findings.length,2);assert.equal(findings[0].runId,'r');assert.equal(findings[0].kind,'指标待核查');assert.match(findings[1].problem,/格式规范/);
 assert.equal(helper.assessmentFindings({...fixture,result:'{"after":{"empty":8}}'}).length,0);
 assert.deepEqual(helper.removeLegacyAssessmentSamples([{id:'QA-0823-001',sample:'basketball_03812.jpeg'},{id:'real',sample:'actual.csv'}]),[{id:'real',sample:'actual.csv'}]);
});
test('D1 issue lifecycle: scope, no skipped stages, concurrency, evidence, reload and audit',async()=>{
 const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB']});
 const directory=await mkdtemp(join(tmpdir(),'assessment-issue-db-'));
 try{
  const db=await mf.getD1Database('DB');globalThis.issueTestDb=db;
  const datasetSource=await readFile(new URL('../db/dataset-store.ts',import.meta.url),'utf8');const ddl=datasetSource.match(/export const datasetDDL = (\[[\s\S]*?\n\]);/)[1];
  const projectSource=(await readFile(new URL('../db/project-store.ts',import.meta.url),'utf8')).replace("import { env } from 'cloudflare:workers';",'const env={DB:globalThis.issueTestDb};');
  const storeSource=(await readFile(new URL('../db/assessment-issue-store.ts',import.meta.url),'utf8')).replace("import { datasetDDL } from './dataset-store';",`const datasetDDL=${ddl};`).replaceAll("'./project-store'","'./project-store.mjs'").replaceAll("'@/lib/assessment-issues'","'./assessment-issues.mjs'");
  for(const [name,source]of[['project-store',projectSource],['assessment-issues',helperSource],['issue-store',storeSource]])await writeFile(join(directory,name+'.mjs'),compile(source));
  const store=await import(pathToFileURL(join(directory,'issue-store.mjs')));
  assert.equal((await store.listAssessmentIssues('owner',1)).issues.length,0);
  await db.batch([
   db.prepare('INSERT INTO data_assets VALUES (?,?,?,?,?)').bind('a','owner','实际资产','records.csv',Date.now()),
   db.prepare('INSERT INTO data_versions VALUES (?,?,NULL,1,?,?)').bind('v','a','{"columns":["x"],"rows":[{"x":"ok"}]}',Date.now()),
   db.prepare('INSERT INTO quality_runs VALUES (?,?,?,NULL,?,?,?,?,?)').bind('r','a','v','assessment','{}',fixture.result,'owner',Date.now()),
  ]);
  assert.equal((await store.listAssessmentIssues('other',1)).issues.length,0);
  assert.equal((await store.listAssessmentIssues('owner',1)).issues.length,2);
  const id='r:rule-26';
  assert.equal((await store.updateAssessmentIssue('other',id,'待处理','组员','安排整改')).status,404);
  assert.equal((await store.updateAssessmentIssue('owner',id,'已分派','组员','直接关闭')).status,409);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM assessment_issue_actions').first()).n,0);
  assert.equal((await store.updateAssessmentIssue('owner',id,'待处理','','')).status,400);
  assert.equal((await store.updateAssessmentIssue('owner',id,'待处理','组员','安排整改')).ok,true);
  assert.equal((await store.updateAssessmentIssue('owner',id,'待处理','组员','重复提交')).status,409);
  assert.equal((await store.updateAssessmentIssue('owner',id,'已分派','组员','附处理说明')).ok,true);
  assert.equal((await store.updateAssessmentIssue('owner',id,'待复核','组员','复核依据已记录')).ok,true);
  const issue=(await store.listAssessmentIssues('owner',1)).issues.find(row=>row.id===id);
  assert.equal(issue.status,'已关闭');assert.equal(issue.closureNote,'复核依据已记录');
  assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM data_audit WHERE target_id=?").bind(id).first()).n,3);
 }finally{delete globalThis.issueTestDb;await mf.dispose();await rm(directory,{recursive:true,force:true});}
});
