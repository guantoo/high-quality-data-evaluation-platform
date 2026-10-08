export const governanceStages = ['数据接入', '数据处理', '质量检查', '结果输出'] as const;
export type GovernanceStage = typeof governanceStages[number];
export type GovernanceDataType = '结构化' | '非结构化';
export type GovernanceNodeTemplate = {
  id: string; name: string; stage: GovernanceStage; dataType: GovernanceDataType;
  kind: 'dataset' | 'recipe' | 'annotation' | 'output'; description: string;
  category?: '数据清洗' | '完整性治理' | '去重治理' | '规范性治理' | '准确性治理' | '安全治理' | '多模态治理' | '文档治理';
  algorithm?: string;
};
export const governanceNodeTemplates: GovernanceNodeTemplate[] = [
  { id: 'table-input', name: '结构化数据接入', stage: '数据接入', dataType: '结构化', kind: 'dataset', description: '数据库表、CSV、JSON 数据输入' },
  { id: 'file-input', name: '非结构化文件接入', stage: '数据接入', dataType: '非结构化', kind: 'dataset', description: '文档、图像、音频、视频资源输入' },
  { id: 'field-clean', name: '字段清洗', stage: '数据处理', dataType: '结构化', kind: 'recipe', category: '数据清洗', algorithm: '空白字符清理', description: '清理空白字符与无效字段内容' },
  { id: 'null-fill', name: '缺失值处理', stage: '数据处理', dataType: '结构化', kind: 'recipe', category: '完整性治理', description: '配置空值填充与必填字段规则' },
  { id: 'row-deduplicate', name: '记录去重', stage: '数据处理', dataType: '结构化', kind: 'recipe', category: '去重治理', description: '按关键字段识别重复记录' },
  { id: 'field-normalize', name: '字段格式标准化', stage: '数据处理', dataType: '结构化', kind: 'recipe', category: '规范性治理', description: '统一 Unicode、日期格式与大小写' },
  { id: 'field-mask', name: '敏感字段脱敏', stage: '数据处理', dataType: '结构化', kind: 'recipe', category: '安全治理', description: '对指定字段的手机号、邮箱做掩码脱敏' },
  { id: 'document-extract', name: '文档解析与 OCR', stage: '数据处理', dataType: '非结构化', kind: 'recipe', category: '文档治理', algorithm: 'OCR 内容纠错', description: '提取文本 PDF、图像 OCR 和文本内容' },
  { id: 'text-clean', name: '文本清洗', stage: '数据处理', dataType: '非结构化', kind: 'recipe', category: '数据清洗', description: '清理乱码、噪声与异常文本格式' },
  { id: 'image-normalize', name: '图像标准化', stage: '数据处理', dataType: '非结构化', kind: 'recipe', category: '多模态治理', algorithm: '图像格式标准化', description: '配置图像格式与分辨率标准' },
  { id: 'audio-process', name: '音频预处理', stage: '数据处理', dataType: '非结构化', kind: 'recipe', category: '多模态治理', algorithm: '音频格式标准化', description: '配置采样率、声道与音频切分' },
  { id: 'video-process', name: '视频预处理', stage: '数据处理', dataType: '非结构化', kind: 'recipe', category: '多模态治理', algorithm: '视频帧提取', description: '配置视频采样与关键帧提取' },
  { id: 'file-deduplicate', name: '文件去重', stage: '数据处理', dataType: '非结构化', kind: 'recipe', category: '去重治理', algorithm: '文件哈希去重', description: '按文件哈希识别重复内容' },
  { id: 'table-check', name: '结构化质量校验', stage: '质量检查', dataType: '结构化', kind: 'recipe', category: '准确性治理', algorithm: '业务规则校验', description: '检查指定字段非空约束并输出问题报告' },
  { id: 'media-check', name: '非结构化质量校验', stage: '质量检查', dataType: '非结构化', kind: 'recipe', category: '多模态治理', algorithm: '图像质量检测', description: '校验图像、音视频可解码性与文本有效性' },
  { id: 'annotation-review', name: '标注与人工复核', stage: '质量检查', dataType: '非结构化', kind: 'annotation', description: '配置标注规范并人工复核样本' },
  { id: 'table-output', name: '结构化结果输出', stage: '结果输出', dataType: '结构化', kind: 'output', description: '输出治理后的表数据与质量记录' },
  { id: 'file-output', name: '非结构化结果输出', stage: '结果输出', dataType: '非结构化', kind: 'output', description: '输出处理后的文件与标注结果' },
];
export const governanceTemplateParameters: Record<string, Array<{ key: string; label: string; options: string[] }>> = {
  'field-normalize': [{ key: 'format', label: '标准化规则', options: ['Unicode NFKC', '日期 YYYY-MM-DD', '转为小写', '转为大写'] }],
  'document-extract': [{ key: 'language', label: '识别语言', options: ['中文与英文', '中文', '英文'] }, { key: 'layout', label: '解析内容', options: ['仅文字'] }],
  'text-clean': [{ key: 'whitespace', label: '空白处理', options: ['合并连续空白', '保留段落换行', '移除空白行'] }],
  'image-normalize': [{ key: 'imageFormat', label: '目标格式', options: ['PNG', 'JPEG', 'WebP'] }, { key: 'resolution', label: '图像尺寸', options: ['保持原始尺寸', '最长边 1024', '最长边 2048'] }],
  'audio-process': [{ key: 'sampleRate', label: '采样率', options: ['16000 Hz', '44100 Hz', '48000 Hz'] }, { key: 'channels', label: '声道', options: ['单声道', '双声道', '保持原始声道'] }, { key: 'segment', label: '音频切分', options: ['不切分', '每 30 秒', '每 60 秒'] }],
  'video-process': [{ key: 'frameRate', label: '抽帧频率', options: ['每秒 1 帧', '每秒 5 帧', '仅关键帧'] }, { key: 'frameFormat', label: '帧输出格式', options: ['JPEG', 'PNG'] }],
  'file-deduplicate': [{ key: 'hash', label: '哈希算法', options: ['SHA-256', 'MD5'] }],
};
