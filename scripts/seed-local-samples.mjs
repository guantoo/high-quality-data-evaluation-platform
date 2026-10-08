import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import ffmpeg from 'ffmpeg-static';
import ts from 'typescript';
const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = join(root, 'samples/local');
const base = new URL(process.env.SAMPLE_BASE_URL ?? 'http://localhost:3000');
if (!['127.0.0.1','localhost','[::1]'].includes(base.hostname) || base.protocol !== 'http:') throw new Error('此脚本仅允许本机 HTTP 服务，不可用于生产站点');
const source = await readFile(join(root,'lib/governance-node-catalog.ts'),'utf8');
const { governanceNodeTemplates: catalog, governanceTemplateParameters: parameters } = await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText).toString('base64'));
const report = { generatedAt:new Date().toISOString(),base:base.origin,projects:[],assets:[],checks:[],nodes:[] };
let cookie;
async function api(path, body, method=body===undefined?'GET':'POST') {
 const response=await fetch(new URL(path,base),{method,headers:{...(cookie?{cookie}:{}),'Content-Type':'application/json','x-platform-request':'1'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(180000)});
 const text=await response.text();let result;try{result=JSON.parse(text);}catch{throw new Error(`${path}: 响应格式无效 (${response.status})`);}
 if(!response.ok)throw new Error(`${path}: ${result.error ?? response.status}`);
 const session=response.headers.get('set-cookie');if(session)cookie=session.split(';')[0];return result;
}
function check(name, value) { assert.ok(value,name);report.checks.push({name,status:'通过'});console.log(`✓ ${name}`); }
async function fixture(name, value) {await writeFile(join(directory,name),value);return name;}
async function file(name,type) {const bytes=await readFile(join(directory,name));assert.ok(bytes.length<=1024*1024);return {name,type,size:bytes.length,url:`data:${type};base64,${bytes.toString('base64')}`};}
async function project(name) {const list=await api('/api/data-projects');let row=list.projects.find(item=>item.name===name && item.permission==='owner');if(!row)row={id:(await api('/api/data-projects',{mode:'create',name})).id};report.projects.push({id:row.id,name});return row.id;}
async function asset(name,filename,projectId) {const list=await api('/api/datasets');let row=list.assets.find(item=>item.name===name);if(!row)row={id:(await api('/api/datasets',{mode:'import',name,filename,text:await readFile(join(directory,filename),'utf8')})).id};const detail=await api(`/api/datasets?id=${row.id}`);if(detail.asset.project_id!==projectId)await api('/api/data-projects',{mode:'assign',assetId:row.id,projectId});const original=[...detail.versions].sort((a,b)=>a.version-b.version)[0];report.assets.push({id:row.id,name,filename});return {id:row.id,original:original.id};}
function graph(templates, input, patches={}) {
 const nodes=templates.map((id,i)=>{const template=catalog.find(item=>item.id===id);return {id:i===0&&input?.assetId?`asset-${input.assetId}`:`sample-${id}-${i}`,label:template.name,kind:template.kind,stage:template.stage,dataType:template.dataType,templateId:id,meta:`${template.stage} · ${template.dataType}`,placed:true,position:{left:44+i*230,top:110}};});
 const nodeConfigs=Object.fromEntries(nodes.map(node=>{const template=catalog.find(item=>item.id===node.templateId);return [node.id,{category:template.category ?? '数据清洗',algorithm:template.algorithm ?? '规则化清洗',scope:'全量数据',keyFields:'',threshold:90,strategy:'标准处理',exceptionPolicy:'终止当前流程',outputMode:'生成新版本',trigger:'手动触发',keepAudit:true,parameters:Object.fromEntries((parameters[node.templateId]??[]).map(item=>[item.key,item.options[0]])),...patches[node.templateId]}];}));
 if(input?.versionId)nodeConfigs[nodes[0].id].parameters.versionId=input.versionId;
 return {nodes,edges:nodes.slice(1).map((node,i)=>({id:`sample-edge-${i}`,from:nodes[i].id,to:node.id})),nodeConfigs,mediaAssets:input?.files?{[nodes[0].id]:input.files}:{}};
}
async function save(projectId,workspace) {await api('/api/data-projects',{mode:'workflow',projectId,workspace});const loaded=await api(`/api/data-projects?id=${projectId}&workflow=1`);assert.deepEqual(loaded.workspace,workspace);}
async function run(name,projectId,workspace,{cache=true,annotations}={}) {
 const path=join(directory,'results',`${projectId}.json`);let result;
 if(cache&&!process.argv.includes('--rerun'))try{const stored=JSON.parse(await readFile(path,'utf8'));if(stored.workspace===JSON.stringify(workspace)&&!stored.result.failedNodeId)result=stored.result;}catch{/* First execution. */}
 if(!result){result=await api('/api/governance',{projectId,workspace,annotations});await writeFile(path,JSON.stringify({workspace:JSON.stringify(workspace),result},null,2));}
 check(name+'：执行成功',!result.failedNodeId && result.results.every(item=>item.status==='成功'));
 for(const node of workspace.nodes)if(!report.nodes.includes(node.templateId))report.nodes.push(node.templateId);
 const final=result.outputs[workspace.nodes.at(-1).id];const outDir=join(directory,'results',projectId);await mkdir(outDir,{recursive:true});
 for(const output of final?.files ?? [])await writeFile(join(outDir,basename(output.name)),Buffer.from(output.url.split(',')[1],'base64'));
 return result;
}
function pdfText(text) {const stream=`BT /F1 20 Tf 50 100 Td (${text}) Tj ET`;const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];let pdf='%PDF-1.4\n';const offsets=[];objects.forEach((obj,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`;});const xref=Buffer.byteLength(pdf);return pdf+`xref\n0 6\n0000000000 65535 f \n${offsets.map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;}

await mkdir(join(directory,'results'),{recursive:true});
await fixture('customers.csv','id,name,signup_date,phone,email,city,status\n1, 样例甲 ,2026/1/2,13800000001,a@example.test,杭州,有效\n1,样例甲,2026/1/2,13800000001,a@example.test,杭州,有效\n2,样例乙,2026/2/3,13800000002,b@example.test,,有效\n3,,2026/3/4,13800000003,c@example.test,上海,有效\n4,样例丁,2026/4/5,13800000004,d@example.test,北京,\n5,样例戊,2026/5/6,13800000005,e@example.test,深圳,有效\n5,样例戊,2026/5/6,13800000005,e@example.test,深圳,有效\n6,样例己,2026/6/7,13800000006,f@example.test,成都,有效\n');
await fixture('orders.json',JSON.stringify([{id:'O-001',product:' 样例设备 ',amount:120},{id:'O-001',product:'样例设备',amount:120},{id:'O-002',product:'样例服务',amount:null}],null,2));
await fixture('events.jsonl','{"id":"E-001","event":" view ","region":"杭州"}\n{"id":"E-001","event":"view","region":"杭州"}\n{"id":"E-002","event":"click","region":""}\n');
await fixture('notes.txt','  Local   sample\n  Data   quality\n\n  仅用于本地功能验收。  ');
await fixture('sample-document.pdf',pdfText('LOCAL SAMPLE DOCUMENT'));
await fixture('sample-image.png',await sharp(Buffer.from('<svg width="1200" height="800"><rect width="1200" height="800" fill="white"/><rect x="300" y="200" width="600" height="400" fill="#be3d35"/></svg>')).png().toBuffer());
await fixture('sample-ocr.png',await sharp(Buffer.from('<svg width="700" height="120"><rect width="700" height="120" fill="white"/><text x="25" y="85" font-family="Arial" font-size="60">LOCAL SAMPLE DATA</text></svg>')).png().toBuffer());
await exec(ffmpeg,['-y','-nostdin','-v','error','-f','lavfi','-i','sine=frequency=440:duration=2','-ar','44100','-ac','2',join(directory,'sample-audio.wav')]);
await exec(ffmpeg,['-y','-nostdin','-v','error','-f','lavfi','-i','color=c=red:s=160x120:d=1','-c:v','mpeg4',join(directory,'sample-video.mp4')]);
const description='数据集规模：6 条合成客户记录\n格式规范：CSV，UTF-8\n文件结构：customers.csv 包含 id、姓名、日期、电话等字段\n获取渠道：本地脚本合成\n技术支持方式：本项目维护者\n模态类型：结构化表\n数据分布情况：多个虚构城市记录\n标签类别统计：有效、未知\n样本示例：样例甲\n局限性说明：仅用于功能验收，不能用于业务决策\n数据来源：代码生成的合成数据\n采集方法：固定样例生成\n加工处理流程：字段清洗、缺失值处理、去重、标准化与脱敏\n标注规范：本样例不含真实个人信息\n版本控制记录：原始版 v1、治理版 v2\n使用许可：仅限本地测试\n目标应用场景：平台功能验收\n评估方法：实际结构质量计算和说明文档读取\n基准测试结果：6 条唯一记录，必填字段完整\n典型应用案例：本地数据治理流程\n';
await fixture('dataset-description.md',description);
await api('/api/auth/login',{username:process.env.SAMPLE_USERNAME??'高质量数据评估演示',password:process.env.SAMPLE_PASSWORD??'123456',captcha:'8'});
const projectId=await project('样例 · 客户数据治理');const customer=await asset('样例 · 客户数据（含空值和重复）','customers.csv',projectId);
const detail=await api(`/api/datasets?id=${customer.id}`);
if(!detail.runs.some(item=>item.kind==='profile'&&item.input_id===customer.original))await api('/api/datasets',{mode:'profile',assetId:customer.id,versionId:customer.original});
const customerGraph=graph(['table-input','field-clean','null-fill','row-deduplicate','field-normalize','field-mask','table-check','table-output'],{assetId:customer.id,versionId:customer.original},{'null-fill':{keyFields:'name,city,status',parameters:{defaultValue:'未知'}},'row-deduplicate':{keyFields:'id'},'field-normalize':{keyFields:'signup_date',parameters:{format:'日期 YYYY-MM-DD'}},'field-mask':{keyFields:'phone,email'},'table-check':{keyFields:'id,name,city,status'}});
await save(projectId,customerGraph);const customerResult=await run('客户治理',projectId,customerGraph);const final=customerResult.outputs[customerGraph.nodes.at(-1).id];
check('8 条客户原始记录治理为 6 条唯一记录',final.table.rows.length===6);
check('手机号和邮箱实际脱敏',final.table.rows[0].phone==='138****0001'&&final.table.rows[0].email==='***@example.test');
check('日期已统一为 YYYY-MM-DD',final.table.rows[0].signup_date==='2026-01-02');
const customerAfter=await api(`/api/datasets?id=${customer.id}`);check('输出版本已落库，原始版本保留',customerAfter.versions.some(item=>item.id===customer.original)&&customerAfter.versions.some(item=>item.id===customerResult.results.at(-1).outputId));
const outputId=customerResult.results.at(-1).outputId;
const assessmentRequest={mode:'assessment',assetId:customer.id,versionId:outputId,selectedRules:['rule-00','rule-01','rule-02','rule-03','rule-04','rule-22','rule-23','rule-26','rule-27'],document:{filename:'dataset-description.md',text:description}};
const assessDetail=await api(`/api/datasets?id=${customer.id}`);let fullAssessment=assessDetail.runs.find(item=>item.kind==='assessment'&&item.input_id===outputId&&item.result.assessment?.results?.every(rule=>rule.value===100 || rule.name==='数据重复率'&&rule.value===0));
if(!fullAssessment)fullAssessment=await api('/api/datasets',assessmentRequest);
check('完整说明文档与治理后数据完成质量评估',fullAssessment.result.assessment.calculated===9);
for(const [name,filename]of [['样例 · 订单 JSON','orders.json'],['样例 · 事件 JSONL','events.jsonl']]){
 const item=await asset(name,filename,projectId);const current=await api(`/api/datasets?id=${item.id}`);let cleaned=current.runs.find(run=>run.kind==='clean'&&run.input_id===item.original);
 if(!cleaned)cleaned=await api('/api/datasets',{mode:'clean',assetId:item.id,versionId:item.original,projectId,rules:{trim:true,deduplicate:true,maskSensitive:false}});
 const versionId=cleaned.outputId??cleaned.output_id;if(!current.runs.some(run=>run.kind==='profile'&&run.input_id===versionId))await api('/api/datasets',{mode:'profile',assetId:item.id,versionId});
 if(!current.runs.some(run=>run.kind==='assessment'&&run.input_id===versionId))await api('/api/datasets',{mode:'assessment',assetId:item.id,versionId,selectedRules:['rule-04','rule-22','rule-23','rule-26','rule-27']});
 check(filename+'：导入、清洗、探查和评估',Boolean(versionId));
}
const cases=[
 ['样例 · 文本清洗与文件去重',['file-input','text-clean','file-deduplicate','media-check','file-output'],[await file('notes.txt','text/plain'),{...await file('notes.txt','text/plain'),name:'notes-copy.txt'}],{}],
 ['样例 · 图像标准化',['file-input','image-normalize','media-check','file-output'],[await file('sample-image.png','image/png')],{'image-normalize':{parameters:{imageFormat:'WebP',resolution:'最长边 1024'}}}],
 ['样例 · 音频预处理',['file-input','audio-process','media-check','file-output'],[await file('sample-audio.wav','audio/wav')],{'audio-process':{parameters:{sampleRate:'16000 Hz',channels:'单声道',segment:'不切分'}}}],
 ['样例 · 视频抽帧',['file-input','video-process','media-check','file-output'],[await file('sample-video.mp4','video/mp4')],{'video-process':{parameters:{frameRate:'每秒 5 帧',frameFormat:'PNG'}}}],
 ['样例 · 文档文字提取',['file-input','document-extract','text-clean','file-output'],[await file('sample-document.pdf','application/pdf'),await file('notes.txt','text/plain')],{'document-extract':{parameters:{language:'英文',layout:'仅文字'}}}],
 ['样例 · 图像 OCR',['file-input','document-extract','file-output'],[await file('sample-ocr.png','image/png')],{'document-extract':{parameters:{language:'英文',layout:'仅文字'}}}],
];
for(const [name,templates,files,patches]of cases){const id=await project(name);const workspace=graph(templates,{files},patches);await save(id,workspace);const result=await run(name,id,workspace);const output=result.outputs[workspace.nodes.at(-1).id];
 if(name.includes('去重'))check('文本已清理，重复文件从 2 个减至 1 个',output.files.length===1&&Buffer.from(output.files[0].url.split(',')[1],'base64').toString().startsWith('Local sample'));
 if(name.includes('图像标准化')){const metadata=await sharp(Buffer.from(output.files[0].url.split(',')[1],'base64')).metadata();check('图像输出为 WebP，最长边 1024',metadata.format==='webp'&&metadata.width===1024);}
 if(name.includes('音频')){const bytes=Buffer.from(output.files[0].url.split(',')[1],'base64');check('音频输出为 16000 Hz 单声道 WAV',bytes.readUInt32LE(24)===16000&&bytes.readUInt16LE(22)===1);}
 if(name.includes('视频'))check('1 秒视频实际输出 5 帧图像',output.files.length===5);
 if(name.includes('OCR'))check('OCR 从图像识别出 LOCAL SAMPLE DATA',Buffer.from(output.files[0].url.split(',')[1],'base64').toString().includes('LOCAL SAMPLE DATA'));
 if(name.includes('文档'))check('PDF 实际文字提取正确',output.files.some(item=>Buffer.from(item.url.split(',')[1],'base64').toString().includes('LOCAL SAMPLE DOCUMENT')));
}
const manualId=await project('样例 · 人工标注复核');const existing=await api(`/api/data-projects?id=${manualId}&workflow=1`);const manualGraph=existing.workspace?.annotationReviews?existing.workspace:graph(['file-input','annotation-review','file-output'],{files:[await file('sample-image.png','image/png')]});await save(manualId,manualGraph);
const manual=manualGraph.annotationReviews ? await run('人工标注提交、复核与结果输出',manualId,manualGraph,{annotations:manualGraph.annotationReviews}) : await api('/api/governance',{projectId:manualId,workspace:manualGraph});
check('人工复核按实际提交状态返回结果',manual.failedNodeId===manualGraph.nodes[1].id||manual.failedNodeId===null);report.manualProject={id:manualId,name:'样例 · 人工标注复核',pending:Boolean(manual.failedNodeId)};
const retryId=await project('样例 · 错误与重试');const badFile={name:'dates.csv',type:'text/csv',size:18,url:'data:text/csv;base64,'+Buffer.from('date\n2026-02-30').toString('base64')};const bad=graph(['table-input','field-normalize','table-output'],{files:[badFile]},{'field-normalize':{keyFields:'date',parameters:{format:'日期 YYYY-MM-DD'}}});
const failed=await api('/api/governance',{projectId:retryId,workspace:bad});check('无效日期明确失败，输出节点未执行',failed.failedNodeId===bad.nodes[1].id&&!failed.outputs[bad.nodes[2].id]);
const repaired=structuredClone(bad);repaired.mediaAssets[bad.nodes[0].id]=[{...badFile,size:15,url:'data:text/csv;base64,'+Buffer.from('date\n2026-02-28').toString('base64')}];await save(retryId,repaired);await run('日期错误修复后重试',retryId,repaired);
let issueDetail=await api(`/api/datasets?id=${customer.id}`);let partial=issueDetail.runs.find(item=>item.kind==='assessment'&&item.input_id===outputId&&item.result.assessment?.results?.find(rule=>rule.id==='rule-00')?.value===80);
if(!partial)partial=await api('/api/datasets',{...assessmentRequest,selectedRules:['rule-00'],document:{filename:'incomplete-description.md',text:description.split('\n').filter(line=>!line.startsWith('技术支持方式')).join('\n')}});
const partialRunId=partial.runId??partial.id;let issues=(await api('/api/assessment-issues')).issues;let issue=issues.find(item=>item.runId===partialRunId);
check('文档缺项已生成真实评估问题',Boolean(issue));
for(const status of ['待处理','已分派','待复核'])if(issue.status===status){await api('/api/assessment-issues',{id:issue.id,status,assignee:'样例验收',note:status==='待复核'?'样例说明文档已补齐，完整文档评估 9 项已计算。':'仅对本地样例问题进行功能验收；不涉及真实业务数据。'},'PATCH');issues=(await api('/api/assessment-issues')).issues;issue=issues.find(item=>item.id===issue.id);}
check('样例问题分派、处理、复核与关闭状态已落库',issue.status==='已关闭');
const dashboard=await api('/api/dashboard?period=30d');check('首页统计已读取新增样例资产和执行记录',dashboard.assetCount>=report.assets.length && dashboard.tasks.profile>=3 && dashboard.tasks.clean>=3 && dashboard.tasks.assessment>=3);
await writeFile(join(directory,'manifest.json'),JSON.stringify(report,null,2));
await writeFile(join(directory,'README.md'),`# 本地合成样例\n\n仅供功能验收，所有记录和媒体由代码合成，不含真实个人信息。\n\n运行：\`npm run samples:local\`；重复执行复用同名样例项目、资产和已完成结果。\`-- --rerun\` 会增加新的输出版本。\n\n${report.projects.map(item=>`- ${item.name}`).join('\n')}\n\n人工复核${report.manualProject.pending?'尚待提交：打开“样例 · 人工标注复核”，绘制目标框、提交、保存并运行。':'已在浏览器绘制真实样例目标框并提交，复核节点与结果输出实际执行通过。'}脚本只复用已有人工提交，不生成伪造标注。\n\n实际验收结果见 [manifest.json](manifest.json)。输出文件在 results/ 各项目子目录。\n`);
console.log(JSON.stringify({projects:report.projects.length,assets:report.assets.length,checks:report.checks.length,coveredNodes:report.nodes.length,manualPending:report.manualProject.pending,report:join(directory,'manifest.json')},null,2));
