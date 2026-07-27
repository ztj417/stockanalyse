import { SectionItem } from '../types';

export const INITIAL_SECTIONS: SectionItem[] = [
  {
    id: 'sec-001',
    code: 'BD-2026-001',
    name: '智慧城市感知网络系统升级与运营采购标段',
    companyCount: 8,
    riskScore: 94,
    riskLevel: 'high',
    budgetAmount: '1,850.00 万元',
    bidDate: '2026-07-15',
    riskSummary: '检测到3家投标单位存在高度股权重叠与同一自然人终极控制线，投标报价呈高度等差一致性，疑似围标/串标。',
    conclusionData: {
      issueCategoriesCount: 3,
      problematicCompanyCount: 5,
      highRiskGroupCount: 2,
      coreRisks: ['同一控制人', '间接控股', '交叉持股'],
      disposalAdvice: '建议进入重点复核',
      summaryText: '本标段共 8 家投标单位，其中 5 家触发股权关联风险。系统识别到同一母公司控制、间接控股、交叉持股 3 类问题，涉及 2 个高危关联单位组，建议进入重点复核。'
    },
    companyRiskGroups: [
      {
        id: 'grp-01',
        groupName: '中洲科技及关联单位组',
        riskLevel: 'high',
        companies: ['华数物联科技有限公司', '智感云联（浙江）数据系统有限公司', '中洲科技集团有限公司'],
        equityIssues: ['同一母公司控制', '间接控股'],
        keyEvidence: '中洲科技集团持股华数物联 65%，持股智感云联 51%，归属同一控制人张建国'
      },
      {
        id: 'grp-02',
        groupName: '星脉感知及合伙企业关联组',
        riskLevel: 'high',
        companies: ['星脉感知通信技术有限公司', '中洲投资合伙企业', '华数物联科技有限公司'],
        equityIssues: ['交叉持股关联', '高管交叉任职'],
        keyEvidence: '星脉感知监事李明伟同时在智感云联担任执行董事，终极受益人均为张建国'
      }
    ],
    equityIssueList: [
      {
        id: 'iss-01',
        issueType: '同一母公司控制',
        riskLevel: 'high',
        companies: ['华数物联', '智感云联'],
        relationPath: '中洲科技集团 → 华数物联 / 智感云联',
        evidenceSummary: '同一实际控制方支配，母公司持股均大于 50%'
      },
      {
        id: 'iss-02',
        issueType: '间接控股关联',
        riskLevel: 'high',
        companies: ['智感云联', '星脉感知'],
        relationPath: '中洲科技 → 中洲投资合伙 → 星脉感知',
        evidenceSummary: '穿透持股比例 33%，且管理层存在交叉重叠'
      },
      {
        id: 'iss-03',
        issueType: '交叉持股关联',
        riskLevel: 'high',
        companies: ['华数物联', '星脉感知'],
        relationPath: '双向持股 / 资金池划转',
        evidenceSummary: '存在循环资金池与相同硬件MAC地址痕迹'
      }
    ],
    companies: [
      {
        id: 'c1',
        name: '华数物联科技有限公司',
        legalPerson: '张建国',
        contactPerson: '王经理',
        phone: '0571-88992211',
        address: '浙江省杭州市西湖区文一西路88号中洲大厦302室',
        email: 'tender_admin@zhongzhou-group.com',
        registeredCapital: '5000 万人民币',
        shareholders: [
          { name: '中洲科技集团有限公司', ratio: '65%', isCommon: true },
          { name: '张建国', ratio: '35%', isCommon: false }
        ],
        ipAddress: '118.12.88.102',
        macAddress: '00-50-56-C0-00-08',
        riskFlags: ['控股股东与其他投标人重叠', '标书文件属性Mac地址相同', '高管交叉任职', '电话与智感云联重合', '地址与智感/星脉重合', '邮箱重合']
      },
      {
        id: 'c2',
        name: '智感云联（浙江）数据系统有限公司',
        legalPerson: '李明伟',
        contactPerson: '李经理',
        phone: '0571-88992211',
        address: '浙江省杭州市西湖区文一西路88号中洲大厦302室',
        email: 'tender_admin@zhongzhou-group.com',
        registeredCapital: '3000 万人民币',
        shareholders: [
          { name: '中洲科技集团有限公司', ratio: '51%', isCommon: true },
          { name: '李明伟', ratio: '49%', isCommon: false }
        ],
        ipAddress: '118.12.88.102',
        macAddress: '00-50-56-C0-00-08',
        riskFlags: ['与华数物联同一母公司', '投标保证金来自同一转账账户', '电话与华数物联重合', '地址与华数/星脉重合', '邮箱重合']
      },
      {
        id: 'c3',
        name: '星脉感知通信技术有限公司',
        legalPerson: '陈志远',
        contactPerson: '陈经理',
        phone: '0571-88992255',
        address: '浙江省杭州市西湖区文一西路88号中洲大厦302室',
        email: 'info@star-perceive.com',
        registeredCapital: '2000 万人民币',
        shareholders: [
          { name: '中洲投资合伙企业', ratio: '80%', isCommon: true },
          { name: '陈志远', ratio: '20%', isCommon: false }
        ],
        ipAddress: '118.12.88.105',
        macAddress: '00-50-56-C0-00-12',
        riskFlags: ['最终受益人同为张建国', '财务负责人为同一人', '地址与华数/智感重合']
      },
      {
        id: 'c4',
        name: '国讯时代网络工程有限公司',
        legalPerson: '王强',
        contactPerson: '刘主管',
        phone: '0571-87654321',
        address: '浙江省杭州市滨江区网商路666号国讯大厦A座12层',
        email: 'bidding@guoxun-time.com',
        registeredCapital: '8000 万人民币',
        shareholders: [{ name: '国讯集团', ratio: '100%', isCommon: false }],
        riskFlags: []
      },
      {
        id: 'c5',
        name: '紫光物联网络信息有限公司',
        legalPerson: '赵雪',
        contactPerson: '孙经理',
        phone: '0571-88112233',
        address: '浙江省杭州市拱墅区丰潭路380号紫光广场B座',
        email: 'market@ziguang-iot.cn',
        registeredCapital: '4500 万人民币',
        shareholders: [{ name: '紫光科技', ratio: '100%', isCommon: false }],
        riskFlags: []
      },
      {
        id: 'c6',
        name: '博信云网基础设施有限公司',
        legalPerson: '周华',
        contactPerson: '吴经理',
        phone: '0571-87009988',
        address: '浙江省杭州市上城区钱江路120号博信中心',
        email: 'tender@boxing-cloud.com',
        registeredCapital: '3500 万人民币',
        shareholders: [{ name: '博信控股', ratio: '100%', isCommon: false }],
        riskFlags: []
      },
      {
        id: 'c7',
        name: '天极感控系统集成有限公司',
        legalPerson: '孙伟',
        contactPerson: '郑主管',
        phone: '0571-85556677',
        address: '浙江省杭州市余杭区创景路99号天极科技园',
        email: 'contact@tianji-sensing.com',
        registeredCapital: '2800 万人民币',
        shareholders: [{ name: '天极集团', ratio: '100%', isCommon: false }],
        riskFlags: []
      },
      {
        id: 'c8',
        name: '远达通信工程有限公司',
        legalPerson: '钱江',
        contactPerson: '钱经理',
        phone: '0571-86663322',
        address: '浙江省杭州市萧山区建设一路58号',
        email: 'business@yuanda-comm.com',
        registeredCapital: '3200 万人民币',
        shareholders: [{ name: '远达信息', ratio: '100%', isCommon: false }],
        riskFlags: []
      }
    ],
    equityRelations: [
      {
        sourceCompany: '华数物联科技有限公司',
        targetCompany: '智感云联（浙江）数据系统有限公司',
        relationType: '实际控制人相同',
        description: '均受母公司【中洲科技集团有限公司】绝对控股，实际控制人同为张建国。',
        riskDegree: '高'
      },
      {
        sourceCompany: '华数物联科技有限公司',
        targetCompany: '智感云联（浙江）数据系统有限公司',
        relationType: '同IP/MAC地址',
        description: '投标文件电子签章与网络上传IP (118.12.88.102) 及MAC物理地址完全一致。',
        riskDegree: '高'
      },
      {
        sourceCompany: '智感云联（浙江）数据系统有限公司',
        targetCompany: '星脉感知通信技术有限公司',
        relationType: '高管交叉重叠',
        description: '星脉感知监事李明伟同时在智感云联担任法定代表人兼执行董事。',
        riskDegree: '高'
      }
    ],
    suspiciousFactors: [
      { title: '股权重叠穿透', desc: '华数物联与智感云联归属于同一母公司中洲科技集团，持股比例均超过50%。', severity: 'high' },
      { title: '终端硬件雷同', desc: '投标电子文档制作机器码、网卡MAC地址（00-50-56-C0-00-08）完全相同。', severity: 'high' },
      { title: '资金往来关联', desc: '两家公司的投标保证金在同日同一小时由【中洲科技资金池账户】划转。', severity: 'high' }
    ],
    contactAssociations: [
      {
        id: 'ca-101',
        type: '电话重合',
        value: '0571-88992211',
        riskDegree: '高',
        involvedCompanies: [
          { companyName: '华数物联科技有限公司', role: '投标主攻单位', contactPerson: '王经理' },
          { companyName: '智感云联（浙江）数据系统有限公司', role: '疑似陪标单位', contactPerson: '李经理' }
        ],
        description: '国家企业信用信息公示系统登记的2025年企业年报联系电话100%完全相同。',
        source: '工商年报 / 招标办备案数据'
      },
      {
        id: 'ca-102',
        type: '注册/办公地址重合',
        value: '浙江省杭州市西湖区文一西路88号中洲大厦302室',
        riskDegree: '高',
        involvedCompanies: [
          { companyName: '华数物联科技有限公司', role: '投标主攻单位' },
          { companyName: '智感云联（浙江）数据系统有限公司', role: '疑似陪标单位' },
          { companyName: '星脉感知通信技术有限公司', role: '关联持股平台' }
        ],
        description: '三家公司在同一办公大楼同房间挂牌合署办公，物理场所高度重合。',
        source: '不动产及工商房屋租赁备案'
      },
      {
        id: 'ca-103',
        type: '邮箱重合',
        value: 'tender_admin@zhongzhou-group.com',
        riskDegree: '高',
        involvedCompanies: [
          { companyName: '华数物联科技有限公司', role: '投标主攻单位' },
          { companyName: '智感云联（浙江）数据系统有限公司', role: '疑似陪标单位' }
        ],
        description: '电子招投标平台预留的标书解密联系邮箱使用同一个母公司集团企业邮箱域名。',
        source: '电子招投标系统平台日志'
      }
    ],
    historicalBiddingAssociations: [
      {
        id: 'hb-201',
        companyPair: ['华数物联科技有限公司', '智感云联（浙江）数据系统有限公司'],
        coBidCount: 14,
        timeSpan: '近24个月 (2024-2026)',
        winLossDistribution: '华数物联中标 12 次，智感云联 0 次 (陪标率 100%)',
        priceGapAvg: '报价差值极小，恒定维持在 0.35% - 0.50% 阶梯',
        riskDegree: '高',
        recentProjects: [
          { projectName: '杭州智算中心一期网络采购标段', bidDate: '2025-11-10', winner: '华数物联科技有限公司', priceGap: '高出 0.42%' },
          { projectName: '绍兴数字交通感知网络搭建项目', bidDate: '2025-08-22', winner: '华数物联科技有限公司', priceGap: '高出 0.38%' },
          { projectName: '嘉兴网格化监控基础设施标段', bidDate: '2025-03-15', winner: '华数物联科技有限公司', priceGap: '高出 0.45%' }
        ],
        patternSummary: '典型“一主一辅”陪标组合，近两年同场竞标14次，陪标单位胜率为0。'
      },
      {
        id: 'hb-202',
        companyPair: ['华数物联科技有限公司', '星脉感知通信技术有限公司'],
        coBidCount: 8,
        timeSpan: '近18个月',
        winLossDistribution: '华数物联中标 7 次，星脉感知 0 次',
        priceGapAvg: '价格阶梯分布固定在 1.2%',
        riskDegree: '高',
        recentProjects: [
          { projectName: '甬舟一体化智慧路网前端感知采购', bidDate: '2025-12-05', winner: '华数物联科技有限公司', priceGap: '高出 1.15%' }
        ],
        patternSummary: '协同保护性报价，拉开价格区间形成围标防线。'
      }
    ],
    accompanyingBidders: [
      {
        id: 'ac-301',
        companyName: '智感云联（浙江）数据系统有限公司',
        legalPerson: '李明伟',
        targetBeneficiaryCompany: '华数物联科技有限公司',
        riskScore: 96,
        screeningStatus: '高度疑似陪标单位',
        collusionIndicators: [
          { indicatorName: '同场竞标与胜率排查', matchedDetail: '近2年与华数物联共同参标 14 次，胜率 0%，存在长效陪标习惯', isTriggered: true, riskDegree: '高' },
          { indicatorName: '保证金资金链排查', matchedDetail: '投标保证金汇出账户归属于母公司【中洲科技资金池】，同一小时完成汇款', isTriggered: true, riskDegree: '高' },
          { indicatorName: '标书软硬件特征码', matchedDetail: '电子标书 Word/PDF 软件属性及 MAC 地址（00-50-56-C0-00-08）100% 相同', isTriggered: true, riskDegree: '高' },
          { indicatorName: '报价阶梯异常差值', matchedDetail: '报价恰好高出主攻单位 0.42%，精准处于防线边缘，故意落选', isTriggered: true, riskDegree: '高' },
          { indicatorName: '技术标故意缺失项', matchedDetail: '技术方案缺少“第七章 售后服务保障体系”，导致扣分故意废标', isTriggered: true, riskDegree: '中' }
        ],
        overallAuditOpinion: '该单位多维特征均符合《反串标审计指南》中典型陪标/围标特征，建议移交招标监督部门启动否决投标与信用扣分程序。'
      },
      {
        id: 'ac-302',
        companyName: '星脉感知通信技术有限公司',
        legalPerson: '陈志远',
        targetBeneficiaryCompany: '华数物联科技有限公司',
        riskScore: 88,
        screeningStatus: '高度疑似陪标单位',
        collusionIndicators: [
          { indicatorName: '穿透控制人及高管交叉', matchedDetail: '终极受益人同为张建国，监事李明伟交叉任职', isTriggered: true, riskDegree: '高' },
          { indicatorName: '办公场所重合度', matchedDetail: '登记地址与华数物联同大楼同房间', isTriggered: true, riskDegree: '高' },
          { indicatorName: '投标保证金追溯', matchedDetail: '保证金系由华数物联关联单位代筹拨付', isTriggered: true, riskDegree: '高' },
          { indicatorName: '技术方案雷同率', matchedDetail: '排版样式、逻辑框图及章节排版雷同度达到 92%', isTriggered: true, riskDegree: '高' }
        ],
        overallAuditOpinion: '存在严重关联控制及协同围标嫌疑，建议同步列入陪标调查名单。'
      }
    ]
  },
  {
    id: 'sec-002',
    code: 'BD-2026-002',
    name: '轨道交通高架桥梁健康监测系统设备标段',
    companyCount: 5,
    riskScore: 56,
    riskLevel: 'medium',
    budgetAmount: '980.00 万元',
    bidDate: '2026-07-18',
    riskSummary: '部分投标单位高管历史上存在同业任职背景，且投标预算清单项错别字完全一致。',
    companies: [
      {
        id: 'c2-1',
        name: '轨交智测技术（上海）有限公司',
        legalPerson: '吴建平',
        registeredCapital: '4000 万人民币',
        shareholders: [{ name: '轨交集团', ratio: '70%', isCommon: false }],
        riskFlags: ['与申铁检测历史高管重叠']
      },
      {
        id: 'c2-2',
        name: '申铁桥梁检测仪器有限公司',
        legalPerson: '郑海涛',
        registeredCapital: '2500 万人民币',
        shareholders: [{ name: '郑海涛', ratio: '60%', isCommon: false }],
        riskFlags: ['预算清单错别字与轨交智测一致']
      },
      {
        id: 'c2-3',
        name: '中铁结构健康监测有限公司',
        legalPerson: '刘洋',
        registeredCapital: '6000 万人民币',
        shareholders: [{ name: '中铁科工', ratio: '100%', isCommon: false }],
        riskFlags: []
      },
      {
        id: 'c2-4',
        name: '传感高科工程有限公司',
        legalPerson: '黄力',
        registeredCapital: '3000 万人民币',
        shareholders: [{ name: '传感集团', ratio: '100%', isCommon: false }],
        riskFlags: []
      },
      {
        id: 'c2-5',
        name: '桥安传感系统有限公司',
        legalPerson: '徐峰',
        registeredCapital: '2000 万人民币',
        shareholders: [{ name: '桥安科技', ratio: '100%', isCommon: false }],
        riskFlags: []
      }
    ],
    equityRelations: [
      {
        sourceCompany: '轨交智测技术（上海）有限公司',
        targetCompany: '申铁桥梁检测仪器有限公司',
        relationType: '高管交叉重叠',
        description: '轨交智测技术技术总监郑海涛原为申铁桥梁检测有限公司大股东。',
        riskDegree: '中'
      }
    ],
    suspiciousFactors: [
      { title: '标书特征码疑似雷同', desc: '清标软件识别到两份投标书工程量清单第42项存在相同Typo错误。', severity: 'medium' },
      { title: '近三年频繁同场竞标', desc: '两家单位近一年内共同参与5次轨道交通标段投标，互为陪标概率较高。', severity: 'medium' }
    ]
  },
  {
    id: 'sec-003',
    code: 'BD-2026-003',
    name: '国家级农业示范区节水灌溉智能化管道设备标段',
    companyCount: 3,
    riskScore: 25,
    riskLevel: 'low',
    budgetAmount: '450.00 万元',
    bidDate: '2026-07-20',
    riskSummary: '企业股权独立，未发现关联交易或同源投标轨迹，风险评估为健康。',
    companies: [
      {
        id: 'c3-1',
        name: '大禹节水智能装备股份有限公司',
        legalPerson: '王浩宇',
        registeredCapital: '8500 万人民币',
        shareholders: [{ name: '大禹科技集团', ratio: '42%', isCommon: false }],
        riskFlags: []
      },
      {
        id: 'c3-2',
        name: '绿洲智能化农机设备制造有限公司',
        legalPerson: '林建东',
        registeredCapital: '2000 万人民币',
        shareholders: [{ name: '林建东', ratio: '80%', isCommon: false }],
        riskFlags: []
      },
      {
        id: 'c3-3',
        name: '黑土地灌溉工程技术有限公司',
        legalPerson: '高永胜',
        registeredCapital: '1800 万人民币',
        shareholders: [{ name: '高永胜', ratio: '90%', isCommon: false }],
        riskFlags: []
      }
    ],
    equityRelations: [],
    suspiciousFactors: []
  },
  {
    id: 'sec-004',
    code: 'BD-2026-004',
    name: '省中心医院新院区弱电集成与网络布线采购标段',
    companyCount: 3,
    riskScore: 78,
    riskLevel: 'high',
    budgetAmount: '1,200.00 万元',
    bidDate: '2026-07-12',
    riskSummary: '投标人A与投标人B的合伙人存在夫妻关系，且两家投标文件作者Metadata属性完全一致。',
    companies: [
      {
        id: 'c4-1',
        name: '省医安达弱电工程系统有限公司',
        legalPerson: '许国庆',
        registeredCapital: '3500 万人民币',
        shareholders: [{ name: '许国庆', ratio: '70%', isCommon: false }],
        riskFlags: ['投标文件元数据作者为【韩梅梅】', '与捷通弱电法人存在近亲属关联']
      },
      {
        id: 'c4-2',
        name: '捷通智能弱电集成有限公司',
        legalPerson: '韩梅梅',
        registeredCapital: '2800 万人民币',
        shareholders: [{ name: '韩梅梅', ratio: '85%', isCommon: false }],
        riskFlags: ['投标文件元数据作者同为【韩梅梅】', '报价差异率仅为 0.08%']
      },
      {
        id: 'c4-3',
        name: '东软智能系统集成有限公司',
        legalPerson: '周天星',
        registeredCapital: '12000 万人民币',
        shareholders: [{ name: '东软集团', ratio: '100%', isCommon: false }],
        riskFlags: []
      }
    ],
    equityRelations: [
      {
        sourceCompany: '省医安达弱电工程系统有限公司',
        targetCompany: '捷通智能弱电集成有限公司',
        relationType: '股东交叉持股',
        description: '省医安达法人许国庆与捷通智能法人韩梅梅为夫妻关系，且交叉持有两家企业股份。',
        riskDegree: '高'
      }
    ],
    suspiciousFactors: [
      { title: '文件创建者同一人', desc: 'Word/PDF文档属性中，创建人名称同为“Admin-Han”，修改时间相差不到3分钟。', severity: 'high' },
      { title: '报价呈现阶梯配合', desc: '两家关联公司报价分别精准锁定招标控制价的 99.8% 和 99.9%。', severity: 'high' }
    ]
  },
  {
    id: 'sec-005',
    code: 'BD-2026-005',
    name: '沿海防汛防台数字指挥大厅大屏及配套网络标段',
    companyCount: 3,
    riskScore: 48,
    riskLevel: 'medium',
    budgetAmount: '620.00 万元',
    bidDate: '2026-07-10',
    riskSummary: '两家参与单位注册地址在同一商务楼同层相邻房间，且联系电话登记相同。',
    companies: [
      {
        id: 'c5-1',
        name: '海视威视指挥显示系统有限公司',
        legalPerson: '马步云',
        registeredCapital: '2200 万人民币',
        shareholders: [{ name: '马步云', ratio: '100%', isCommon: false }],
        riskFlags: ['注册地址与同创视讯同楼同层', '工商登记电话一致']
      },
      {
        id: 'c5-2',
        name: '同创视讯工程技术有限公司',
        legalPerson: '宋晓峰',
        registeredCapital: '1800 万人民币',
        shareholders: [{ name: '宋晓峰', ratio: '100%', isCommon: false }],
        riskFlags: ['注册地址与海视威视同楼同层', '工商登记电话一致']
      },
      {
        id: 'c5-3',
        name: '洲明显示大屏集成有限公司',
        legalPerson: '廖大为',
        registeredCapital: '5000 万人民币',
        shareholders: [{ name: '洲明科技', ratio: '100%', isCommon: false }],
        riskFlags: []
      }
    ],
    equityRelations: [
      {
        sourceCompany: '海视威视指挥显示系统有限公司',
        targetCompany: '同创视讯工程技术有限公司',
        relationType: '实际控制人相同',
        description: '登记办公地址均为“海警大厦1208室”，工商预留电话138****8888完全一致。',
        riskDegree: '中'
      }
    ],
    suspiciousFactors: [
      { title: '经营场所与联络人相同', desc: '两家企业在同一办公地址挂牌运营，属于高度物理合署。', severity: 'medium' }
    ]
  }
];
