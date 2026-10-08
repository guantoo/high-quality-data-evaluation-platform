import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import ts from 'typescript';
import { Miniflare } from 'miniflare';
import { connectorServer } from '../connector/server.mjs';
test('isolated project API executes real graph, creates a new version, preserves original and rejects unauthorized sources',async()=>{
 const token=randomBytes(32).toString('hex');const server=connectorServer(token);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB']});const dir=await mkdtemp(join(tmpdir(),'hq-governance-api-'));
 try{
 globalThis.governanceTestEnv={DB:await mf.getD1Database('DB'),DB_CONNECTOR_URL:`http://127.0.0.1:${server.address().port}`,DB_CONNECTOR_TOKEN:token};
 const modules={'assessment-document':'lib/assessment-document.ts','assessment':'lib/assessment.ts','assessment-catalog':'lib/assessment-catalog.ts','business-model':'db/business-model.ts','platform-store':'db/platform-store.ts','project-store':'db/project-store.ts','dataset-store':'db/dataset-store.ts','data-quality':'lib/data-quality.ts','governance-route':'app/api/governance/route.ts'};
 for(const [name,path]of Object.entries(modules)){let source=await readFile(new URL('../'+path,import.meta.url),'utf8');source=source.replace(/import \{ env \} from ['"]cloudflare:workers['"];?/,'const env = globalThis.governanceTestEnv;').replace(/from ['"](?:@\/(?:db|lib)\/|\.\/)([a-z-]+)['"]/g,"from './$1.mjs'");await writeFile(join(dir,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);}
 const store=await import(pathToFileURL(join(dir,'platform-store.mjs'))),projects=await import(pathToFileURL(join(dir,'project-store.mjs'))),datasets=await import(pathToFileURL(join(dir,'dataset-store.mjs'))),route=await import(pathToFileURL(join(dir,'governance-route.mjs')));
 const user=await store.authenticateUser('高质量数据评估演示','123456'),session=await store.createSession(user.id);
 const projectId=await projects.createDataProject(user.id,'独立运行验收');const content={columns:['name'],rows:[{name:' Alice '},{name:'Alice'}]};
 const assetId=await datasets.createDataset(user.id,'独立资产','test.csv',content);await projects.assignDataProject(user.id,assetId,projectId);
 const original=(await datasets.getDataset(user.id,assetId)).versions[0].id;
 const workspace={nodes:[{id:`asset-${assetId}`,kind:'dataset'},{id:'clean',kind:'recipe',templateId:'field-clean'},{id:'dedup',kind:'recipe',templateId:'row-deduplicate'},{id:'output',kind:'output',templateId:'table-output'}],edges:[{from:`asset-${assetId}`,to:'clean'},{from:'clean',to:'dedup'},{from:'dedup',to:'output'}],nodeConfigs:{dedup:{keyFields:'name'}}};
 const post=(payload,auth=session,header='1')=>route.POST(new Request('http://localhost/api/governance',{method:'POST',headers:{cookie:`hqdp_session=${auth}`,'x-platform-request':header,'Content-Type':'application/json'},body:JSON.stringify(payload)}));
 assert.equal((await post({projectId,workspace},'invalid')).status,401);assert.equal((await post({projectId,workspace},session,'')).status,403);
 const response=await post({projectId,workspace});assert.equal(response.status,200,await response.clone().text());const result=await response.json();assert.equal(result.failedNodeId,null);assert.equal(result.results.length,4);
 const outputId=result.results.at(-1).outputId;assert.ok(outputId);assert.equal((await datasets.getVersion(user.id,assetId,outputId)).rows.length,1);assert.deepEqual(await datasets.getVersion(user.id,assetId,original),content);assert.equal((await datasets.getDataset(user.id,assetId)).versions.length,2);
 const bad=structuredClone(workspace);bad.nodes[1].templateId='null-fill';const failure=await post({projectId,workspace:bad});assert.equal((await failure.json()).failedNodeId,'clean');assert.equal((await datasets.getDataset(user.id,assetId)).versions.length,2);
 const foreign=await datasets.createDataset('another-owner','外部资产','foreign.csv',content);bad.nodes[0].id=`asset-${foreign}`;assert.equal((await post({projectId,workspace:bad})).status,403);
 const source={name:'sample.txt',type:'text/plain',size:13,url:'data:text/plain;base64,'+Buffer.from(' Hello  world ').toString('base64')};const fileGraph={nodes:[{id:'files',kind:'dataset',templateId:'file-input'},{id:'text',kind:'recipe',templateId:'text-clean'},{id:'out',kind:'output',templateId:'file-output'}],edges:[{from:'files',to:'text'},{from:'text',to:'out'}],mediaAssets:{files:[source]}};
 const files=await post({projectId,workspace:fileGraph});assert.equal(files.status,200);const fileResult=await files.json();assert.equal(fileResult.failedNodeId,null);assert.equal(Buffer.from(fileResult.outputs.out.files[0].url.split(',')[1],'base64').toString(),'Hello world');
 }finally{await mf.dispose();await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});delete globalThis.governanceTestEnv;}
});
