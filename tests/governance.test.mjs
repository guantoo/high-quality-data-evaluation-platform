import test from 'node:test';
import assert from 'node:assert/strict';
import { executeTemplate, executeWorkflow, templateIds } from '../connector/governance.mjs';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const exec = promisify(execFile);
const table = { columns:['id','name','date','phone'],rows:[{id:'1',name:' Alice ',date:'2026/1/2',phone:'13812345678'},{id:'1',name:'Alice',date:'2026/1/2',phone:'13812345678'},{id:'2',name:'',date:'2026/2/3',phone:''}] };
const file=(name,bytes,type='text/plain')=>({name,type,size:bytes.length,url:`data:${type};base64,${Buffer.from(bytes).toString('base64')}`});
const decode=f=>Buffer.from(f.url.split(',')[1],'base64');
const covered=new Set();
async function run(id,input,config,annotations){covered.add(id);return executeTemplate(id,input,config,annotations);}
test('each structured template transforms actual rows and preserves the input',async()=>{
 const original=structuredClone(table);
 assert.deepEqual((await run('table-input',{table})).table,table);
 const clean=await run('field-clean',{table}); assert.equal(clean.table.rows[0].name,'Alice');
 const filled=await run('null-fill',clean,{keyFields:'name',parameters:{defaultValue:'未知'}});assert.equal(filled.table.rows[2].name,'未知');
 assert.equal((await run('row-deduplicate',filled,{keyFields:'id'})).table.rows.length,2);
 assert.equal((await run('field-normalize',filled,{keyFields:'date',parameters:{format:'日期 YYYY-MM-DD'}})).table.rows[0].date,'2026-01-02');
 assert.equal((await run('field-mask',filled,{keyFields:'phone'})).table.rows[0].phone,'138****5678');
 assert.equal((await run('table-check',{table},{keyFields:'name'})).report.issueCount,1);
 const output=await run('table-output',clean);assert.match(decode(output.files[0]).toString(),/Alice/);assert.equal(output.table.rows.length,3);
 assert.deepEqual(table,original);
 await assert.rejects(executeTemplate('null-fill',{table}),/填充值/);
 await assert.rejects(executeTemplate('row-deduplicate',{table},{keyFields:'missing'}),/字段/);
 await assert.rejects(executeTemplate('field-normalize',{table:{columns:['d'],rows:[{d:'2026-02-30'}]}},{parameters:{format:'日期 YYYY-MM-DD'}}),/无效日期/);
});
test('file input, text cleaning, content hashing, checks, annotation review and output use actual bytes',async()=>{
 const text=file('sample.txt','  Hello\u0000   world \n');
 const input=await run('file-input',{files:[text]});
 const clean=await run('text-clean',input,{parameters:{whitespace:'合并连续空白'}});assert.equal(decode(clean.files[0]).toString(),'Hello world');
 const dedup=await run('file-deduplicate',{files:[text,{...text,name:'copy.txt'}]},{parameters:{hash:'SHA-256'}});assert.equal(dedup.files.length,1);
 assert.equal((await run('media-check',clean)).report.passed,true);
 const {default:sharp}=await import('sharp'); const reviewInput={files:[file('sample.png',await sharp({create:{width:16,height:16,channels:3,background:'white'}}).png().toBuffer(),'image/png')]};
 await assert.rejects(executeTemplate('annotation-review',reviewInput),/人工复核尚未完成/);
 const review=await run('annotation-review',reviewInput,{}, {completed:[0],shapes:{0:[{type:'rect',x:1,y:1,width:10,height:10,label:'sample'}]}});assert.equal(review.files.length,2);assert.match(decode(review.files[1]).toString(),/sample/);
 assert.equal((await run('file-output',review)).files.length,2);
 await assert.rejects(executeTemplate('file-input',{files:[]}),/上传/);
 await assert.rejects(executeTemplate('file-output',{files:[{name:'bad',url:'https://example.org/file'}]}),/外部 URL/);
});
test('image normalization decodes pixels and changes real output format/size',async()=>{
 const {default:sharp}=await import('sharp'); const png=await sharp({create:{width:1600,height:800,channels:3,background:'#ffffff'}}).png().toBuffer();
 const out=await run('image-normalize',{files:[file('image.png',png,'image/png')]},{parameters:{imageFormat:'WebP',resolution:'最长边 1024'}});
 const meta=await sharp(decode(out.files[0])).metadata();assert.equal(meta.format,'webp');assert.equal(meta.width,1024);assert.equal(meta.height,512);
 assert.equal((await executeTemplate('media-check',out)).report.passed,true);
 await assert.rejects(executeTemplate('image-normalize',{files:[file('bad.png','garbage','image/png')]}));
});
test('audio resampling and video extraction produce decodable output files',async()=>{
 const {default:ffmpeg}=await import('ffmpeg-static');const directory=await mkdtemp(join(tmpdir(),'hq-test-'));
 try {
  await exec(ffmpeg,['-nostdin','-f','lavfi','-i','sine=frequency=440:duration=0.2','-ar','44100','-ac','2',join(directory,'tone.wav')]);
  const audio=await run('audio-process',{files:[file('tone.wav',await readFile(join(directory,'tone.wav')),'audio/wav')]},{parameters:{sampleRate:'16000 Hz',channels:'单声道',segment:'不切分'}});
  const wav=decode(audio.files[0]);assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt32LE(24),16000);assert.equal(wav.readUInt16LE(22),1);
  await exec(ffmpeg,['-nostdin','-f','lavfi','-i','color=c=red:s=32x32:d=1','-c:v','mpeg4',join(directory,'clip.mp4')]);
  const video=await run('video-process',{files:[file('clip.mp4',await readFile(join(directory,'clip.mp4')),'video/mp4')]},{parameters:{frameRate:'每秒 1 帧',frameFormat:'PNG'}});
  assert.equal(video.files.length,1);const {default:sharp}=await import('sharp');assert.equal((await sharp(decode(video.files[0])).metadata()).width,32);
 } finally {await rm(directory,{recursive:true,force:true});}
});
test('document extraction returns the original text content',async()=>{
 const out=await run('document-extract',{files:[file('document.txt','真实文档内容')]},{parameters:{layout:'仅文字'}});assert.equal(decode(out.files[0]).toString(),'真实文档内容');
});
test('workflow executes dependencies, rejects cycles and stops at genuine failures',async()=>{
 const workspace={nodes:[{id:'output',kind:'output',templateId:'table-output'},{id:'clean',kind:'recipe',templateId:'field-clean'},{id:'source',kind:'dataset',templateId:'table-input'}],edges:[{from:'source',to:'clean'},{from:'clean',to:'output'}]};
 const result=await executeWorkflow(workspace,{source:{table}});assert.deepEqual(result.results.map(r=>r.id),['source','clean','output']);assert.equal(result.failedNodeId,null);assert.equal(result.outputs.output.table.rows[0].name,'Alice');
 const fail=await executeWorkflow({...workspace,nodes:workspace.nodes.map(n=>n.id==='clean'?{...n,templateId:'null-fill'}:n)},{source:{table}});assert.equal(fail.failedNodeId,'clean');assert.equal(fail.outputs.output,undefined);
 await assert.rejects(executeWorkflow({...workspace,edges:[...workspace.edges,{from:'output',to:'source'}]},{source:{table}}),/循环/);
 const single=await executeWorkflow(workspace,{source:{table}},'clean');assert.deepEqual(single.results.map(r=>r.id),['source','clean']);
});
test('every advertised node template has an exercised real executor',()=>assert.deepEqual([...covered].sort(),[...templateIds].sort()));
test('offline OCR recognizes pixels rather than filename or placeholder text',async()=>{
 const {default:sharp}=await import('sharp');const png=await sharp(Buffer.from('<svg width="700" height="120"><rect width="700" height="120" fill="white"/><text x="25" y="85" font-family="Arial" font-size="64" fill="black">HELLO WORLD</text></svg>')).png().toBuffer();
 const out=await executeTemplate('document-extract',{files:[file('not-the-content.png',png,'image/png')]},{parameters:{language:'英文',layout:'仅文字'}});assert.match(decode(out.files[0]).toString(),/HELLO WORLD/);
});
test('PDF extraction reads the text objects from a real PDF',async()=>{
 const stream='BT /F1 20 Tf 50 100 Td (REAL PDF CONTENT) Tj ET';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
 let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((obj,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`;});const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 const out=await executeTemplate('document-extract',{files:[file('sample.pdf',pdf,'application/pdf')]},{parameters:{layout:'仅文字'}});assert.match(decode(out.files[0]).toString(),/REAL PDF CONTENT/);
});
