// 原始规则来自用户提供的 Excel；表内文字仅作为评估数据。
export const assessmentCatalog = [
  {
    "id": "rule-00",
    "category": "文档完整性",
    "name": "基本信息完整性",
    "description": "数据集说明文档应包含数据集规模、格式规范、文件结构、获取渠道、技术支持方式等基本信息",
    "sourceFormula": "X= B/A\nA：数据集说明文档满足基本信息完整性要求的方面数量\nB：需要满足的基本信息完整性要求方面总数",
    "sourceAutomation": "暂未支持",
    "suggested": false,
    "sourceRow": 2
  },
  {
    "id": "rule-01",
    "category": "文档完整性",
    "name": "内容特征完整性",
    "description": "数据集说明文档应包含模态类型、数据分布情况、标签类别统计、样本示例、局限性说明等内容特征",
    "sourceFormula": "X= B/A\nA：满足内容特征完整性要求的方面数量（\nB：需要满足的内容特征完整性要求方面总数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 3
  },
  {
    "id": "rule-02",
    "category": "文档完整性",
    "name": "建设过程完整性",
    "description": "数据集说明文档应包含数据来源、采集方法、加工处理流程、标注规范、版本控制记录等建设过程",
    "sourceFormula": "X= B/A \nA：满足建设过程完整性要求的方面数量\nB：需要满足的建设过程完整性要求方面总数",
    "sourceAutomation": "暂未支持",
    "suggested": false,
    "sourceRow": 4
  },
  {
    "id": "rule-03",
    "category": "文档完整性",
    "name": "应用说明完整性",
    "description": "数据集说明文档应包含使用许可、目标应用场景、评估方法、基准测试结果、典型应用案例等应用说明",
    "sourceFormula": "X= B/A\nA：满足应用说明完整性要求的方面数量（许可/场景/评估方法/基准测试/案例）\nB：需要满足的应用说明完整性要求方面总数（固定5项）",
    "sourceAutomation": "暂未支持",
    "suggested": false,
    "sourceRow": 5
  },
  {
    "id": "rule-04",
    "category": "质量合规性",
    "name": "结构完整性",
    "description": "数据集描述数据的元数据完整，不包含缺失值或缺失值应在合理范围内",
    "sourceFormula": "X= B/A\nA：数据集中无空数据项的数据记录数量\nB：数据集中的数据记录总数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 6
  },
  {
    "id": "rule-05",
    "category": "质量合规性",
    "name": "安全规范性",
    "description": "数据无\"中毒数据\"（含违法/侵权/歧视内容等）",
    "sourceFormula": "X= B/A\nA：不属于中毒数据的数据记录数量（排除违法/侵权/歧视内容）\nB：数据集中数据记录总数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 7
  },
  {
    "id": "rule-06",
    "category": "质量合规性",
    "name": "格式规范性",
    "description": "数据集中数据的格式符合预定标准，可直接用于人工智能模型开发和训练。",
    "sourceFormula": "X= B/A\nA：格式符合预定标准的数据记录数量\nB：数据集中的数据记录总数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 8
  },
  {
    "id": "rule-07",
    "category": "质量合规性",
    "name": "标注规范性",
    "description": "数据集中数据的标注符合预定的标注规范，遵循预先设定的规范化流程。",
    "sourceFormula": "X= B/A\nA：符合标注规则的数据记录数量\nB：数据集中的数据记录总数",
    "sourceAutomation": "暂未支持",
    "suggested": false,
    "sourceRow": 9
  },
  {
    "id": "rule-08",
    "category": "质量合规性",
    "name": "内容专业性",
    "description": "数据集中数据真实可追溯。非合成数据能追溯到采集源头，且能与采集源头保持一致，不存在未经说明的篡改；合成数据能追溯到生成过程，且能符合目标场景真实数据的分布规律",
    "sourceFormula": "X= B/A\nA：体现行业领域复杂概念的数据记录数量\nB：数据集中的数据记录总数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 10
  },
  {
    "id": "rule-09",
    "category": "质量合规性",
    "name": "内容真实性",
    "description": "数据集经过严格清洗处理，不包含重复数据、噪声数据、损坏数据等脏数据",
    "sourceFormula": "X= B/A\nA：真实可信的数据记录数量（非合成数据可溯源/合成数据符合分布）\nB：数据集中的数据记录总数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 11
  },
  {
    "id": "rule-10",
    "category": "质量合规性",
    "name": "内容干净性",
    "description": "数据集经过严格清洗处理，不包含重复数据、噪声数据、损坏数据等脏数据",
    "sourceFormula": "X= B/A\nA：内容干净的数据记录数量（无重复/噪声/损坏）\nB：数据集中的数据记录总数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 12
  },
  {
    "id": "rule-11",
    "category": "质量合规性",
    "name": "内容一致性",
    "description": "数据集中相关联的多模态数据间的内容一致，能在语义和表达上保持匹配",
    "sourceFormula": "X= B/A\nA：内容一致的数据记录数量（多模态数据语义匹配）\nB：数据集中的数据记录总数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 13
  },
  {
    "id": "rule-12",
    "category": "场景适用性",
    "name": "内容多样性",
    "description": "数据集满足目标应用场景人工智能模型开发和训练对数据分布全面程度的要求",
    "sourceFormula": "X= B/A\nA：数据集在关键维度上的实际分布覆盖范围\nB：目标场景所需的分布覆盖范围",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 14
  },
  {
    "id": "rule-13",
    "category": "场景适用性",
    "name": "规模完整性",
    "description": "数据集的规模满足目标应用场景人工智能模型开发和训练的要求",
    "sourceFormula": "X= B/A\nA：数据集实际规模\nB：目标场景需求规模",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 15
  },
  {
    "id": "rule-14",
    "category": "场景适用性",
    "name": "标注准确性",
    "description": "数据集中数据的标注准确反映数据的实际内容和特征，能精准标记出目标应用场景人工智能模型开发和训练所需的所有信息",
    "sourceFormula": "X= B/A\nA：满足标注准确性要求的数据记录数量\nB：数据集中的数据记录总数",
    "sourceAutomation": "暂未支持",
    "suggested": false,
    "sourceRow": 16
  },
  {
    "id": "rule-15",
    "category": "场景适用性",
    "name": "模型适配性",
    "description": "数据集能显著提升目标应用场景人工智能模型的性能",
    "sourceFormula": "X=A−B 或 B−A\nA：使用本数据集训练模型的性能值\nB：使用基准数据集训练模型的性能值\n（正指标：A-B；负指标：B-A）",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 17
  },
  {
    "id": "rule-16",
    "category": "规范性",
    "name": "数据标准",
    "description": "数据符合数据标准的度量。注:评价数据质量时需要收集数据在命名、创建、定义、更新和归档时遵循的标准,包括国际标准、国家标准、行业标准、地方标准或相关规定等。",
    "sourceFormula": "X=A/B\nA=满足数据标准要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 18
  },
  {
    "id": "rule-17",
    "category": "规范性",
    "name": "数据模型",
    "description": "数据符合数据模型的度量。注:数据模型是一种直观描述组织数据结构的手段,是数据表达的规范。注2:评价数据质量时需要检查是否存在清晰可理解的数据模型定义以及这些数据的组织形式",
    "sourceFormula": "X=A/B\nA=满足数据模型要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 19
  },
  {
    "id": "rule-18",
    "category": "规范性",
    "name": "元数据",
    "description": "数据符合元数据定义的度量。注:元数据标注、描述或刻画其他数据、以使检索、或使用信息更容易。评价数据质量时需要检查是否提供可解读的元数据文档。示例:包含各字段名称、描述、类型值域等内容的数据字典为一种元数据文档",
    "sourceFormula": "X=A/B\nA=满足元数据定义的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "暂未支持",
    "suggested": false,
    "sourceRow": 20
  },
  {
    "id": "rule-19",
    "category": "规范性",
    "name": "业务规则",
    "description": "数据符合业务规则的度量。注:业务规则是一种权威性原则,用来描述业务交互,并建立行动和数据行为结果及完整性的规则",
    "sourceFormula": "X=A/B\nA=满足业务规则的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 21
  },
  {
    "id": "rule-20",
    "category": "规范性",
    "name": "权威参考数据",
    "description": "参考数据是系统、应用软件、数据库、流程、报告及交易记录和主记录用来参考的数值集合或分类表。注:评价数据质量时需要收集参考数据列表。示例:一张用于一个特定字段的有效值列表为一种参考数据类型",
    "sourceFormula": "X=A/B\nA=满足参考数据规则的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 22
  },
  {
    "id": "rule-21",
    "category": "规范性",
    "name": "安全规范",
    "description": "安全规范是安全和隐私方面的规则,包括数据权限管理,数据脱敏处理等",
    "sourceFormula": "X=A/B\nA=满足安全规范的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 23
  },
  {
    "id": "rule-22",
    "category": "完整性",
    "name": "数据元素完整性",
    "description": "按照业务规则要求,数据集中应被赋值的数据元素的赋值程度",
    "sourceFormula": "X=A/B\nA=被赋值的数据集中元素的个数；B=预期被赋值的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 24
  },
  {
    "id": "rule-23",
    "category": "完整性",
    "name": "数据记录完整性",
    "description": "按照业务规则要求,数据集中应被赋值的数据记录的赋值程度",
    "sourceFormula": "X=A/B\nA=被赋值的数据集中元素的个数；B=预期被赋值的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 25
  },
  {
    "id": "rule-24",
    "category": "准确性",
    "name": "数据内容正确性",
    "description": "数据内容是否是预期数据",
    "sourceFormula": "X=A/B\nA=满足正确性要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 26
  },
  {
    "id": "rule-25",
    "category": "准确性",
    "name": "数据格式合规性",
    "description": "数据格式(包括数据类型、数值范围、数据长度、精度等)是否满足预期要求。示例:性别一栏不能出现男/女以外的内容;身份证号不能出现标点符号;以及对字符编码的一些限制,都需要通过规定内容的格式来实现",
    "sourceFormula": "X=A/B\nA=满足格式要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 27
  },
  {
    "id": "rule-26",
    "category": "准确性",
    "name": "数据重复率",
    "description": "特定字段、记录、文件或数据集意外重复的度量",
    "sourceFormula": "计算方法：X=A/B\nA=重复的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 28
  },
  {
    "id": "rule-27",
    "category": "准确性",
    "name": "数据唯一性",
    "description": "特定字段、记录、文件或数据集唯一性的度量",
    "sourceFormula": "X=A/B\nA=满足唯一性要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 29
  },
  {
    "id": "rule-28",
    "category": "准确性",
    "name": "脏数据出现率",
    "description": "正确字段、记录、文件或数据集之外无效数据的度量。示例:事务发生回滚时由于回滚机制不健全或不完善导致可能出现脏数据",
    "sourceFormula": "X=A/B\nA=有脏数据出现的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 30
  },
  {
    "id": "rule-29",
    "category": "一致性",
    "name": "相同数据一致性",
    "description": "同一数据在不同位置存储或被不同应用或用户使用时,数据的一致性;数据发生变化时,存储在不同位置的同一数据被同步修改",
    "sourceFormula": "X=A/B\nA=满足一致性要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 31
  },
  {
    "id": "rule-30",
    "category": "一致性",
    "name": "关联数据一致性",
    "description": "根据一致性约束规则检查关联数据的一致性",
    "sourceFormula": "X=A/B\nA=满足一致性要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 32
  },
  {
    "id": "rule-31",
    "category": "时效性",
    "name": "基于时间段的正确性",
    "description": "基于日期范围的记录数或频率分布符合业务需求的程度",
    "sourceFormula": "X=A/B\nA=满足有效性要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 33
  },
  {
    "id": "rule-32",
    "category": "时效性",
    "name": "基于时间点及时性",
    "description": "基于时间截的记录数、频率分布或延迟时间符合业务需求的程度",
    "sourceFormula": "X=A/B\nA=满足及时性要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 34
  },
  {
    "id": "rule-33",
    "category": "时效性",
    "name": "时序性",
    "description": "数据集中同一实体的数据元素之间的相对时序关系",
    "sourceFormula": "X=A/B\nA=满足时序性要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 35
  },
  {
    "id": "rule-34",
    "category": "可访问性",
    "name": "可访问",
    "description": "数据在需要时的可获取性",
    "sourceFormula": "X=A/B\nA=满足可访问性要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 36
  },
  {
    "id": "rule-35",
    "category": "可访问性",
    "name": "可用性",
    "description": "数据在设定有效生存周期内的可使用性",
    "sourceFormula": "X=A/B\nA=满足可用性要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": false,
    "sourceRow": 37
  },
  {
    "id": "rule-36",
    "category": "完整性",
    "name": "实体属性完整性",
    "description": "结构化数据中，业务核心实体（如 “商品”）的关键属性（如 “商品 ID、名称、分类、价格”）是否完整，无遗漏核心维度",
    "sourceFormula": "X=A/B\nA=满足实体属性完整要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": true,
    "sourceRow": 40
  },
  {
    "id": "rule-37",
    "category": "完整性",
    "name": "版本控制完整性",
    "description": "数据集中数据有版本变更记录，包括不限于变更日期、修改人等。可用计算方式：",
    "sourceFormula": "X=A/B\nA: 有完整版本历史的数量\nB: 被评价的数据总数",
    "sourceAutomation": "支持",
    "suggested": true,
    "sourceRow": 41
  },
  {
    "id": "rule-38",
    "category": "完整性",
    "name": "引用完整性扩展",
    "description": "在关系型数据中，确保外键引用有效（如订单必须对应有效客户ID），避免孤立数据。提升可靠性和一致性。",
    "sourceFormula": "X=A/B\nA: 满足外键约束的记录数量\nB: 被评价的记录总数",
    "sourceAutomation": "支持",
    "suggested": true,
    "sourceRow": 42
  },
  {
    "id": "rule-39",
    "category": "准确性",
    "name": "逻辑关系准确性",
    "description": "检查数据间的计算逻辑，如公式、派生值是否正确。例如，在财务报表中，总和等于各部分之和。",
    "sourceFormula": "A: 逻辑关系一致的数据记录或元素数量\nB: 被评价的数据记录或元素总数",
    "sourceAutomation": "支持",
    "suggested": true,
    "sourceRow": 43
  },
  {
    "id": "rule-40",
    "category": "一致性",
    "name": "业务流程时序一致性",
    "description": "若数据记录业务流程（如 “订单创建→支付→发货→签收”），各环节的时间戳、状态流转是否符合实际业务逻辑（如 “支付时间” 不能早于 “订单创建时间”，“签收状态” 需在 “发货状态” 之后）。",
    "sourceFormula": "X=A/B\nA=满足业务流程时序一致性要求的数据集中元素的个数；B=被评价的数据集中元素的个数",
    "sourceAutomation": "支持",
    "suggested": true,
    "sourceRow": 44
  },
  {
    "id": "rule-41",
    "category": "一致性",
    "name": "语义一致性",
    "description": "确保文本或分类数据使用统一语义（如“北京”不混淆为“Beijing”或“Peking”），通过标准词典校验。提升可用性和一致性。",
    "sourceFormula": "X=A/B\nA: 符合预定义语义的数据元素数量\nB: 被评价的元素总数",
    "sourceAutomation": "支持",
    "suggested": true,
    "sourceRow": 45
  },
  {
    "id": "rule-42",
    "category": "一致性",
    "name": "多模态语义一致性",
    "description": "通过AI模型检测图像描述文本与画面内容需匹配（如“红色汽车”的图中不能出现蓝色汽车",
    "sourceFormula": "X = A/B\nA = 图文匹配的记录数B = 多模态记录总数\n​",
    "sourceAutomation": "支持",
    "suggested": true,
    "sourceRow": 46
  },
  {
    "id": "rule-43",
    "category": "规范性",
    "name": "命名规范性",
    "description": "数据字段的命名需遵循统一规则（如前缀统一、避免歧义、使用业务术语），禁止随意命名",
    "sourceFormula": "X=A/B\nA = 符合命名规则的元素（字段 ）数量\nB = 被评价的元素总数",
    "sourceAutomation": "支持",
    "suggested": true,
    "sourceRow": 47
  },
  {
    "id": "rule-44",
    "category": "场景适用性",
    "name": "流程环节适应性",
    "description": "数据在业务全流程中的可用性（如电商数据需支持“浏览→加购→支付→售后”全链路分析）等其他更多流程分析",
    "sourceFormula": "X=A/B\nA=覆盖关键流程环节的数据量B=业务全流程环节数\n",
    "sourceAutomation": "支持",
    "suggested": true,
    "sourceRow": 48
  }
] as const;
