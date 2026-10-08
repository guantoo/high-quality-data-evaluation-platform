import { createHash } from 'node:crypto';
import { mkdtemp, writeFile, readFile, readdir, rm, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const require = createRequire(import.meta.url);
export const templateIds = ['table-input','file-input','field-clean','null-fill','row-deduplicate','field-normalize','field-mask','document-extract','text-clean','image-normalize','audio-process','video-process','file-deduplicate','table-check','media-check','annotation-review','table-output','file-output'];
const removeNoise = text => Array.from(text).filter(char => { const code = char.charCodeAt(0); return (code >= 32 || [9,10,13].includes(code)) && code !== 65533; }).join('');
const fileBytes = file => {
  if (!file || typeof file.name !== 'string' || file.name.length > 255 || !/^data:[^,]*;base64,/.test(file.url ?? '')) throw new Error('文件必须是已上传的本地内容，不能使用外部 URL');
  const data = Buffer.from(file.url.slice(file.url.indexOf(',') + 1), 'base64');
  if (!data.length || data.length > 8 * 1024 * 1024) throw new Error('单个处理文件需为 1 字节–8 MiB');
  return data;
};
const outputFile = (name, type, bytes) => ({ name, type, size: bytes.length, url: `data:${type};base64,${bytes.toString('base64')}` });
const textFile = (name, text) => outputFile(name, 'text/plain', Buffer.from(text));
const selectedFields = (content, config) => {
  const fields = (config.keyFields ?? '').split(/[，,]/).map(s => s.trim()).filter(Boolean);
  if (fields.some(field => !content.columns.includes(field))) throw new Error('关键字段不在输入数据中，请按实际表头配置');
  return fields.length ? fields : content.columns;
};
function validateParameters(id, p) {
  const enums = {
    'text-clean': { whitespace: ['合并连续空白','保留段落换行','移除空白行'] },
    'image-normalize': { imageFormat: ['PNG','JPEG','WebP'], resolution: ['保持原始尺寸','最长边 1024','最长边 2048'] },
    'audio-process': { sampleRate: ['16000 Hz','44100 Hz','48000 Hz'], channels: ['单声道','双声道','保持原始声道'], segment: ['不切分','每 30 秒','每 60 秒'] },
    'video-process': { frameRate: ['每秒 1 帧','每秒 5 帧','仅关键帧'], frameFormat: ['JPEG','PNG'] },
    'document-extract': { language: ['中文与英文','中文','英文'], layout: ['文字与表格','仅文字','保留版面结构'] },
    'file-deduplicate': { hash: ['SHA-256','MD5'] },
    'field-normalize': { format: ['Unicode NFKC','日期 YYYY-MM-DD','转为小写','转为大写'] },
  };
  for (const [key, values] of Object.entries(enums[id] ?? {})) if (p[key] !== undefined && !values.includes(p[key])) throw new Error(`节点参数无效：${key}`);
}
export async function executeTemplate(id, input, config = {}, annotations) {
  if (!templateIds.includes(id)) throw new Error('节点没有对应的真实执行器，请重新选择节点模板');
  const p = config.parameters ?? {}; validateParameters(id, p);
  const data = structuredClone(input); const files = data.files ?? [];
  const table = data.table;
  if (id === 'table-input' && (!table || !table.rows.length)) throw new Error('结构化接入节点未绑定有效的数据版本');
  if (id === 'file-input') { if (!files.length) throw new Error('请在接入节点上传本地文件'); for (const file of files) { const bytes=fileBytes(file); if(bytes.length>1024*1024) throw new Error('每个输入文件最多 1 MiB'); file.size=bytes.length; } }
  if (['field-clean','null-fill','row-deduplicate','field-normalize','field-mask','table-check','table-output'].includes(id) && !table) throw new Error('此节点需要结构化表数据');
  if (['document-extract','text-clean','image-normalize','audio-process','video-process','file-deduplicate','media-check','annotation-review','file-output'].includes(id) && !files.length) throw new Error('此节点需要非结构化文件，请连接文件接入节点');
  if (id === 'field-clean') for (const row of table.rows) for (const field of table.columns) row[field] = removeNoise(String(row[field] ?? '')).trim();
  if (id === 'null-fill') {
    const fields = selectedFields(table, config);
    if (typeof p.defaultValue !== 'string' || !p.defaultValue.length || p.defaultValue.length > 1024) throw new Error('请填写缺失值填充值');
    for (const row of table.rows) for (const field of fields) if (!String(row[field] ?? '').trim()) row[field] = p.defaultValue;
  }
  if (id === 'row-deduplicate') {
    const fields = selectedFields(table, config); const seen = new Set();
    table.rows = table.rows.filter(row => { const signature = JSON.stringify(fields.map(field => row[field])); if (seen.has(signature)) return false; seen.add(signature); return true; });
  }
  if (id === 'field-normalize') for (const row of table.rows) for (const field of selectedFields(table, config)) {
    let value = String(row[field] ?? '').normalize('NFKC').trim();
    if (p.format === '转为小写') value = value.toLowerCase();
    if (p.format === '转为大写') value = value.toUpperCase();
    if (p.format === '日期 YYYY-MM-DD' && value) {
      const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(value);
      if (!match) throw new Error('日期字段存在无法识别的值');
      const iso = `${match[1]}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`;
      const date = new Date(`${iso}T00:00:00Z`);
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== iso) throw new Error('日期字段存在无效日期');
      value = iso;
    }
    row[field] = value;
  }
  if (id === 'field-mask') for (const row of table.rows) for (const field of selectedFields(table, config)) row[field] = String(row[field] ?? '').replace(/\b(1[3-9]\d)\d{4}(\d{4})\b/g,'$1****$2').replace(/[\w.+-]+@([\w.-]+\.[A-Za-z]{2,})/g,'***@$1');
  if (id === 'table-check') {
    const fields = selectedFields(table, config); const issues = [];
    table.rows.forEach((row, i) => fields.forEach(field => { if (!String(row[field] ?? '').trim()) issues.push({ row: i+1, field, rule: '必填字段为空' }); }));
    data.report = { records: table.rows.length, issueCount: issues.length, issues: issues.slice(0,200), passed: !issues.length };
    if (issues.length && config.exceptionPolicy === '终止当前流程') throw new Error(`质量检查发现 ${issues.length} 个必填字段问题`);
  }
  if (id === 'text-clean') data.files = files.map(file => {
    if (!/\.(txt|md|csv|jsonl?)$/i.test(file.name)) throw new Error('文本清洗只接受 TXT、Markdown、CSV、JSON、JSONL');
    let text = removeNoise(new TextDecoder('utf-8',{fatal:true}).decode(fileBytes(file)).replace(/^\uFEFF/,''));
    text = p.whitespace === '保留段落换行' ? text.replace(/[^\S\r\n]+/g,' ').trim() : p.whitespace === '移除空白行' ? text.split(/\r?\n/).filter(line => line.trim()).join('\n') : text.replace(/\s+/g,' ').trim();
    return textFile(file.name, text);
  });
  if (id === 'file-deduplicate') {
    const seen = new Set(); data.files = files.filter(file => { const hash = createHash(p.hash === 'MD5' ? 'md5' : 'sha256').update(fileBytes(file)).digest('hex'); if (seen.has(hash)) return false; seen.add(hash); return true; });
  }
  if (id === 'image-normalize') {
    const { default: sharp } = await import('sharp');
    data.files = await Promise.all(files.map(async file => {
      const format = ({PNG:'png',JPEG:'jpeg',WebP:'webp'})[p.imageFormat ?? 'PNG'];
      let image = sharp(fileBytes(file), {limitInputPixels: 25000000}).rotate();
      if (p.resolution && p.resolution !== '保持原始尺寸') { const side = p.resolution === '最长边 1024' ? 1024 : 2048; image = image.resize({width:side,height:side,fit:'inside',withoutEnlargement:true}); }
      const bytes = await image.toFormat(format).toBuffer();
      return outputFile(file.name.replace(/\.[^.]+$/,'')+'.'+format, `image/${format}`, bytes);
    }));
  }
  if (id === 'audio-process' || id === 'video-process') {
    const { default: ffmpeg } = await import('ffmpeg-static');
    if (!ffmpeg) throw new Error('当前服务器没有可用的媒体处理引擎');
    const directory = await mkdtemp(join(tmpdir(),'hq-governance-'));
    try {
      data.files = [];
      for (let i=0;i<files.length;i++) {
        const file = files[i]; const inputPath = join(directory,`input-${i}`); await writeFile(inputPath,fileBytes(file));
        const args = ['-nostdin','-hide_banner','-loglevel','error','-protocol_whitelist','file,pipe','-i',inputPath];
        if (id === 'audio-process') {
          args.push('-vn','-ar',String(parseInt(p.sampleRate ?? '16000')));
          if (p.channels !== '保持原始声道') args.push('-ac',p.channels === '双声道' ? '2':'1');
          args.push('-c:a','pcm_s16le');
          if (p.segment && p.segment !== '不切分') args.push('-f','segment','-segment_time',p.segment === '每 30 秒' ? '30':'60','-reset_timestamps','1');
          args.push(join(directory,p.segment && p.segment !== '不切分' ? `out-${i}-%03d.wav` : `out-${i}.wav`));
        } else {
          args.push('-an','-vf',p.frameRate === '仅关键帧' ? "select=eq(pict_type\\,I)" : `fps=${p.frameRate === '每秒 5 帧' ? 5:1}`,'-frames:v','100');
          args.push(join(directory,`out-${i}-%03d.${p.frameFormat === 'PNG' ? 'png':'jpg'}`));
        }
        await exec(ffmpeg,args,{timeout:60000,maxBuffer:65536});
        for (const name of (await readdir(directory)).filter(name => name.startsWith(`out-${i}`)).sort()) {
          const bytes = await readFile(join(directory,name)); data.files.push(outputFile(name,id === 'audio-process' ? 'audio/wav' : p.frameFormat === 'PNG' ? 'image/png':'image/jpeg',bytes));
        }
      }
    } catch (error) { if (error.killed) throw new Error('媒体处理超时，请缩短输入文件'); throw new Error('媒体解码失败，请检查文件内容与格式'); }
    finally { await rm(directory,{recursive:true,force:true}); }
  }
  if (id === 'document-extract') {
    data.files = [];
    for (const file of files) {
      let text;
      if (/\.(txt|md)$/i.test(file.name)) text = new TextDecoder('utf-8',{fatal:true}).decode(fileBytes(file));
      else if (/\.pdf$/i.test(file.name)) {
        const {getDocument} = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const loading = getDocument({data:new Uint8Array(fileBytes(file)),isEvalSupported:false,standardFontDataUrl:join(dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts') + '/'});
        const pdf = await loading.promise;
        try { const pages=[]; if (pdf.numPages > 30) throw new Error('PDF 最多支持 30 页'); for(let i=1;i<=pdf.numPages;i++) { const page=await pdf.getPage(i); const content=await page.getTextContent(); pages.push(content.items.map(item => item.str ?? '').join(' ')); } text=pages.join('\n\n'); }
        finally { await loading.destroy(); }
        if (!text.trim()) throw new Error('扫描 PDF 暂不支持，请上传单页图像进行 OCR');
      } else {
        if (!file.type?.startsWith('image/')) throw new Error('文档解析支持文本 PDF、TXT、Markdown 和图像 OCR');
        const {default:sharp} = await import('sharp'); await sharp(fileBytes(file),{limitInputPixels:25000000}).metadata();
        const {createWorker} = await import('tesseract.js');
        const language = p.language === '英文' ? 'eng' : p.language === '中文' ? 'chi_sim' : 'chi_sim+eng';
        const languageDir = await mkdtemp(join(tmpdir(), 'hq-ocr-')); let worker;
        try {
          for (const code of language.split('+')) await copyFile(join(require(`@tesseract.js-data/${code}`).langPath, `${code}.traineddata.gz`), join(languageDir, `${code}.traineddata.gz`));
          worker = await createWorker(language, 1, { langPath: languageDir, cacheMethod: 'none', gzip: true });
          const result=await worker.recognize(fileBytes(file)); text=result.data.text;
        } finally { if (worker) await worker.terminate(); await rm(languageDir,{recursive:true,force:true}); }
      }
      if (p.layout && p.layout !== '仅文字') throw new Error('当前文档引擎只支持真实文字提取，请将解析内容设为“仅文字”');
      if (!text.trim()) throw new Error('文档没有提取到有效文字');
      data.files.push(textFile(file.name+'.txt',text));
    }
  }
  if (id === 'media-check') {
    const {default:sharp} = await import('sharp'); const issues=[];
    for (const file of files) {
      const bytes=fileBytes(file);
      try {
        if (file.type?.startsWith('image/')) { await sharp(bytes,{limitInputPixels:25000000}).stats(); }
        else if (/\.(txt|md|jsonl?|csv)$/i.test(file.name)) { if (!new TextDecoder('utf-8',{fatal:true}).decode(bytes).trim()) throw new Error('内容为空'); }
        else if (file.type?.startsWith('audio/') || file.type?.startsWith('video/')) {
          const {default:ffmpeg} = await import('ffmpeg-static'); const dir=await mkdtemp(join(tmpdir(),'hq-check-'));
          try { const path=join(dir,'input'); await writeFile(path,bytes); await exec(ffmpeg,['-nostdin','-v','error','-xerror','-protocol_whitelist','file,pipe','-i',path,'-f','null','-'],{timeout:60000,maxBuffer:65536}); }
          finally { await rm(dir,{recursive:true,force:true}); }
        } else throw new Error('质量校验支持图像、音视频和 UTF-8 文本');
      } catch(error) { issues.push({file:file.name,rule:error.message}); }
    }
    data.report={files:files.length,issueCount:issues.length,issues,passed:!issues.length};
    if(issues.length && config.exceptionPolicy === '终止当前流程') throw new Error(`文件质量检查发现 ${issues.length} 个问题`);
  }
  if (id === 'annotation-review') {
    if (files.some(file => !file.type?.startsWith('image/'))) throw new Error('人工标注节点当前只接受图像样本');
    if (!annotations || (annotations.files && (annotations.files.length !== files.length || files.some((file,i)=>annotations.files[i]?.url !== file.url))) || !Array.isArray(annotations.completed) || new Set(annotations.completed).size !== files.length || files.some((_,i) => !annotations.completed.includes(i) || !annotations.shapes?.[i]?.some(shape => (shape.type === 'rect' && Number.isFinite(shape.x) && Number.isFinite(shape.y) && shape.width >= 2 && shape.height >= 2) || (shape.type === 'polygon' && shape.points?.length >= 3)))) throw new Error('人工复核尚未完成：请逐个提交真实样本标注后再运行');
    data.files=[...files,textFile('annotations.json',JSON.stringify(annotations))];
  }
  if (id === 'table-output') {
    const quote=value => '"'+String(value ?? '').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
    data.files=[outputFile('result.csv','text/csv',Buffer.from([table.columns,...table.rows.map(row=>table.columns.map(field=>row[field]))].map(row=>row.map(quote).join(',')).join('\r\n')))];
  }
  if (id === 'file-output') files.forEach(fileBytes);
  if (data.table) { let bytes=0; for (const row of data.table.rows) for (const field of data.table.columns) { bytes += Buffer.byteLength(String(row[field] ?? '')) + Buffer.byteLength(field) + 8; if (bytes > 1500000) throw new Error('结构化输出超过 1.5 MB，请缩小处理范围'); } }
  const totalBytes=(data.files ?? []).reduce((sum,file)=>sum+file.size,0);
  if(totalBytes > 8*1024*1024) throw new Error('节点输出超过 8 MiB，请缩小处理范围');
  return data;
}
export async function executeWorkflow(workspace, sources, targetId, annotations) {
  if (!workspace || !Array.isArray(workspace.nodes) || !Array.isArray(workspace.edges) || workspace.nodes.length>200 || workspace.edges.length>400) throw new Error('流程格式无效');
  const nodes=workspace.nodes.filter(node=>node.placed!==false);
  if(nodes.some(node=>typeof node.id!=='string'||node.id.length>120||!['dataset','recipe','annotation','output'].includes(node.kind))) throw new Error('节点格式无效'); const ids=new Set(nodes.map(node=>node.id));
  if(ids.size!==nodes.length || workspace.edges.some(edge=>!ids.has(edge.from)||!ids.has(edge.to))) throw new Error('流程存在重复节点或无效连线');
  if(targetId && !ids.has(targetId)) throw new Error('目标节点不存在');
  const visiting=new Set(),visited=new Set(),order=[];
  function visit(id) { if(visiting.has(id)) throw new Error('流程存在循环连线'); if(visited.has(id)) return; visiting.add(id); for(const edge of workspace.edges.filter(edge=>edge.to===id)) visit(edge.from); visiting.delete(id); visited.add(id); order.push(nodes.find(node=>node.id===id)); }
  if(targetId) visit(targetId); else nodes.forEach(node=>visit(node.id));
  const outputs=Object.create(null),results=[];
  for(const node of order) {
    const started=Date.now();
    try {
      const parents=workspace.edges.filter(edge=>edge.to===node.id);
      if(parents.length>1) throw new Error('当前节点只支持一个上游，请拆分处理链路');
      const input=parents.length ? outputs[parents[0].from] : sources[node.id];
      if(!input) throw new Error('没有输入数据，请绑定接入节点并连接上游');
      const template=node.templateId ?? (node.id.startsWith('asset-') ? 'table-input' : null);
      outputs[node.id]=await executeTemplate(template,input,workspace.nodeConfigs?.[node.id],annotations?.[node.id]);
      results.push({id:node.id,status:'成功',durationMs:Date.now()-started,records:outputs[node.id].table?.rows.length,files:outputs[node.id].files?.length,report:outputs[node.id].report});
    } catch(error) { results.push({id:node.id,status:'失败',durationMs:Date.now()-started,error:error.message}); return {results,outputs,failedNodeId:node.id}; }
  }
  return {results,outputs,failedNodeId:null};
}
