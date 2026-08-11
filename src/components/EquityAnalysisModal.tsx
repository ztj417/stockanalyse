import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Printer,
  ShieldAlert,
  AlertTriangle,
  Building2,
  Network,
  Grid,
  FileText,
  Download,
  CheckCircle2,
  Cpu,
  LayoutDashboard,
  ArrowRight,
  Eye,
  Layers,
  Users,
  AlertCircle,
  PhoneCall,
  Phone,
  Mail,
  MapPin,
  History,
  UserX,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
  Scale,
  RotateCcw,
  Tag,
  Filter,
  Folder
} from 'lucide-react';
import { SectionItem } from '../types';
import { InteractiveEquityTopology } from './InteractiveEquityTopology';

interface EquityAnalysisModalProps {
  section: SectionItem | null;
  onClose: () => void;
}

const renderRichConclusionText = (text: string) => {
  if (!text) return null;

  const regex = /(【[^】]+】|中洲科技集团|北京中科国控|中科国控|招标人|招标代理|专家单位)/g;
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;

        if (part === '招标人') {
          return (
            <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200/90 mx-0.5">
              招标人
            </span>
          );
        }
        if (part === '招标代理') {
          return (
            <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200/90 mx-0.5">
              招标代理
            </span>
          );
        }
        if (part === '专家单位') {
          return (
            <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/90 mx-0.5">
              专家单位
            </span>
          );
        }

        if (part === '中洲科技集团' || part === '北京中科国控' || part === '中科国控') {
          return (
            <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200/90 mx-0.5 shadow-2xs">
              【{part}】
            </span>
          );
        }

        if (part.startsWith('【') && part.endsWith('】')) {
          const rawName = part.slice(1, -1);
          const isAssociated = ['中洲科技集团', '中科国控', '北京中科国控', '中洲投资', '母公司'].some(k => rawName.includes(k));

          if (isAssociated) {
            return (
              <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200/90 mx-0.5 shadow-2xs">
                【{rawName}】
              </span>
            );
          } else {
            return (
              <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200/90 mx-0.5 shadow-2xs">
                【{rawName}】
              </span>
            );
          }
        }

        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
};

const TypingEffectText: React.FC<{
  text: string;
  speed?: number;
  skipAnimation?: boolean;
  onComplete?: () => void;
  renderRich?: (str: string) => React.ReactNode;
}> = ({ text, speed = 20, skipAnimation = false, onComplete, renderRich }) => {
  const [displayedLength, setDisplayedLength] = useState(skipAnimation ? text.length : 0);
  const [isTyping, setIsTyping] = useState(!skipAnimation);

  const onCompleteRef = React.useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (skipAnimation) {
      setDisplayedLength(text.length);
      setIsTyping(false);
      return;
    }

    setDisplayedLength(0);
    setIsTyping(true);
    if (!text) return;

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= text.length) {
        setDisplayedLength(text.length);
        setIsTyping(false);
        clearInterval(interval);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      } else {
        setDisplayedLength(current);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, skipAnimation]);

  const currentSlice = text.slice(0, displayedLength);

  return (
    <span className="inline">
      {renderRich ? renderRich(currentSlice) : currentSlice}
      {isTyping && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-blue-600 animate-pulse align-middle rounded-2xs" />
      )}
    </span>
  );
};

interface CategoryTreeNode {
  id: string;
  name: string;
  weight?: string;
  children?: {
    id: string;
    name: string;
  }[];
}

const RULE_CATEGORY_TREE: CategoryTreeNode[] = [
  {
    id: 'cat-equity',
    name: '股权关系维度',
    weight: '权重40%',
    children: [
      { id: 'cat-equity-direct', name: '直接控股' },
      { id: 'cat-equity-indirect', name: '间接控股' },
      { id: 'cat-equity-join', name: '参股关系' },
    ],
  },
  {
    id: 'cat-personnel',
    name: '人员关系维度',
    weight: '权重30%',
    children: [
      { id: 'cat-personnel-main', name: '主要人员审查' },
      { id: 'cat-personnel-natural-shareholder', name: '自然人股东审查' },
      { id: 'cat-personnel-legal-shareholder', name: '法人股东审查' },
      { id: 'cat-personnel-legal-rep', name: '法定代表人审查' },
      { id: 'cat-personnel-controller', name: '实际控制人审查' },
      { id: 'cat-personnel-beneficiary', name: '实际受益人审查' },
      { id: 'cat-personnel-management', name: '管理关系审查' },
    ],
  },
  {
    id: 'cat-contact',
    name: '主体联系维度',
    weight: '权重30%',
    children: [
      { id: 'cat-contact-annual-report', name: '年报信息审查' },
      { id: 'cat-contact-address', name: '注册地址审查' },
      { id: 'cat-contact-phone', name: '注册电话审查' },
      { id: 'cat-contact-email', name: '注册邮箱审查' },
    ],
  },
];

const getCategoryLabel = (id: string): string => {
  if (id === 'all') return '规则分类: 全部';
  for (const cat of RULE_CATEGORY_TREE) {
    if (cat.id === id) return `大类: ${cat.name}`;
    if (cat.children) {
      const sub = cat.children.find((s) => s.id === id);
      if (sub) return `规则: ${sub.name}`;
    }
  }
  return '规则分类';
};

interface CompanyPaths {
  upPathStr: string;
  downPathStr: string;
  combinedPathStr: string;
}

const getCompany3LayerPaths = (comp: { name: string; legalPerson: string; shareholders: { name: string; ratio: string }[] }): CompanyPaths => {
  const cName = comp.name;

  if (cName.includes('星脉感知')) {
    return {
      upPathStr: '陈志远<-[实际控制人]<-中洲投资合伙企业<-[持股85%]<-星脉感知通信技术有限公司',
      downPathStr: '星脉感知通信技术有限公司->[全资100%]->星脉感知数字技术有限公司->[控股70%]->星脉感知智能装备有限公司',
      combinedPathStr: '陈志远<-[实际控制人]<-中洲投资合伙企业<-[持股85%]<-星脉感知通信技术有限公司->[全资100%]->星脉感知数字技术有限公司->[控股70%]->星脉感知智能装备有限公司',
    };
  }

  if (cName.includes('华数物联')) {
    return {
      upPathStr: '张建国<-[最终受益人]<-中洲科技集团有限公司<-[持股65%]<-华数物联科技有限公司',
      downPathStr: '华数物联科技有限公司->[全资100%]->华数物联感知终端有限公司->[控股60%]->华数物联智造工程有限公司',
      combinedPathStr: '张建国<-[最终受益人]<-中洲科技集团有限公司<-[持股65%]<-华数物联科技有限公司->[全资100%]->华数物联感知终端有限公司->[控股60%]->华数物联智造工程有限公司',
    };
  }

  if (cName.includes('智感云联')) {
    return {
      upPathStr: '张建国<-[最终受益人]<-中洲科技集团有限公司<-[持股51%]<-智感云联（浙江）数据系统有限公司',
      downPathStr: '智感云联（浙江）数据系统有限公司->[全资100%]->智感云联数据技术有限公司->[控股65%]->智感云能算力系统有限公司',
      combinedPathStr: '张建国<-[最终受益人]<-中洲科技集团有限公司<-[持股51%]<-智感云联（浙江）数据系统有限公司->[全资100%]->智感云联数据技术有限公司->[控股65%]->智感云能算力系统有限公司',
    };
  }

  if (cName.includes('国讯时代')) {
    return {
      upPathStr: '王建军<-[实际控制人]<-国讯科技集团有限公司<-[持股80%]<-国讯时代网络工程有限公司',
      downPathStr: '国讯时代网络工程有限公司->[全资100%]->国讯网络运维服务有限公司->[控股75%]->国讯数据中心工程有限公司',
      combinedPathStr: '王建军<-[实际控制人]<-国讯科技集团有限公司<-[持股80%]<-国讯时代网络工程有限公司->[全资100%]->国讯网络运维服务有限公司->[控股75%]->国讯数据中心工程有限公司',
    };
  }

  if (cName.includes('云智安防')) {
    return {
      upPathStr: '刘强<-[实际控制人]<-云智高科集团有限公司<-[持股70%]<-杭州云智安防系统工程有限公司',
      downPathStr: '杭州云智安防系统工程有限公司->[全资100%]->云智安防工程服务有限公司->[控股55%]->云智视频监控技术有限公司',
      combinedPathStr: '刘强<-[实际控制人]<-云智高科集团有限公司<-[持股70%]<-杭州云智安防系统工程有限公司->[全资100%]->云智安防工程服务有限公司->[控股55%]->云智视频监控技术有限公司',
    };
  }

  if (cName.includes('联创数字')) {
    return {
      upPathStr: '赵立新<-[实际控制人]<-浙江联创控股集团有限公司<-[持股100%]<-浙江联创数字技术有限公司',
      downPathStr: '浙江联创数字技术有限公司->[全资100%]->联创数字软件技术有限公司->[控股75%]->联创云服信息技术有限公司',
      combinedPathStr: '赵立新<-[实际控制人]<-浙江联创控股集团有限公司<-[持股100%]<-浙江联创数字技术有限公司->[全资100%]->联创数字软件技术有限公司->[控股75%]->联创云服信息技术有限公司',
    };
  }

  if (cName.includes('海润信息')) {
    return {
      upPathStr: '钱伟<-[实际控制人]<-宁波海润实业投资有限公司<-[持股80%]<-宁波海润信息工程有限公司',
      downPathStr: '宁波海润信息工程有限公司->[全资100%]->海润信息设备有限公司->[控股60%]->海润智能终端有限公司',
      combinedPathStr: '钱伟<-[实际控制人]<-宁波海润实业投资有限公司<-[持股80%]<-宁波海润信息工程有限公司->[全资100%]->海润信息设备有限公司->[控股60%]->海润智能终端有限公司',
    };
  }

  if (cName.includes('数智物联')) {
    return {
      upPathStr: '孙海<-[实际控制人]<-温州数投产业发展集团<-[持股60%]<-温州数智物联网有限公司',
      downPathStr: '温州数智物联网有限公司->[全资100%]->温州数智传感终端有限公司->[控股70%]->数智物联智能制造有限公司',
      combinedPathStr: '孙海<-[实际控制人]<-温州数投产业发展集团<-[持股60%]<-温州数智物联网有限公司->[全资100%]->温州数智传感终端有限公司->[控股70%]->数智物联智能制造有限公司',
    };
  }

  const topShareholder = comp.shareholders[0];
  const l1Name = topShareholder?.name || comp.legalPerson;
  const l2Name = topShareholder ? `${topShareholder.name}集团` : `${comp.legalPerson}控股平台`;
  const basePrefix = cName.replace(/(科技|数据|网络|通信|信息|工程|系统|物联网|安防)?(有限|股份)?公司$/, '');
  const ratioTag = topShareholder?.ratio ? `持股${topShareholder.ratio}` : '持股60%';

  const up = `${l1Name}<-[实际控制]<-${l2Name}<-[${ratioTag}]<-${cName}`;
  const down = `${cName}->[全资100%]->${basePrefix}技术服务有限公司->[控股70%]->${basePrefix}智能终端有限公司`;

  return {
    upPathStr: up,
    downPathStr: down,
    combinedPathStr: `${l1Name}<-[实际控制]<-${l2Name}<-[${ratioTag}]<-${cName}->[全资100%]->${basePrefix}技术服务有限公司->[控股70%]->${basePrefix}智能终端有限公司`,
  };
};

export const EquityAnalysisModal: React.FC<EquityAnalysisModalProps> = ({
  section,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'matrix' | 'topology' | 'companies'
  >('overview');

  const [companySearchKeyword, setCompanySearchKeyword] = useState<string>('');
  const [contactFilter, setContactFilter] = useState<'all' | 'phone' | 'email' | 'address'>('all');
  const [contactDisplayMode, setContactDisplayMode] = useState<'table' | 'cards'>('table');
  const [contactSearchKeyword, setContactSearchKeyword] = useState<string>('');
  const [otherAssocSubTab, setOtherAssocSubTab] = useState<'contact' | 'history'>('contact');

  const [matrixCompanySearch, setMatrixCompanySearch] = useState<string>('');
  const [matrixCategorySearch, setMatrixCategorySearch] = useState<string>('all');
  const [isCatTreeOpen, setIsCatTreeOpen] = useState<boolean>(false);

  const [expandedMatrixGroups, setExpandedMatrixGroups] = useState<Record<string, boolean>>({
    'matrix-grp-1': true,
    'matrix-grp-2': true,
    'matrix-grp-3': true,
    'matrix-grp-4': true,
  });

  const [selectedEvidenceGroup, setSelectedEvidenceGroup] = useState<{
    id: string;
    groupName: string;
    riskLevel: 'high' | 'medium' | 'low';
    companies: string[];
    equityIssues: string[];
    keyEvidence: string;
  } | null>(null);

  const [detailPopup, setDetailPopup] = useState<{
    type: 'topology' | 'history' | 'contact';
    title: string;
    subtitle?: string;
  } | null>(null);

  const [hasTypedConclusion, setHasTypedConclusion] = useState<boolean>(false);
  const [visibleStepCount, setVisibleStepCount] = useState<number>(0);

  useEffect(() => {
    setHasTypedConclusion(false);
    setVisibleStepCount(0);
    const t1 = setTimeout(() => {
      setVisibleStepCount(1);
    }, 350);
    const t2 = setTimeout(() => {
      setVisibleStepCount(2);
    }, 950);
    const t3 = setTimeout(() => {
      setVisibleStepCount(3);
    }, 1550);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [section?.id]);

  const toggleMatrixGroup = (grpId: string) => {
    setExpandedMatrixGroups((prev) => ({
      ...prev,
      [grpId]: !prev[grpId],
    }));
  };

  if (!section) return null;

  // Fallback defaults for contact associations
  const contactAssocs = section.contactAssociations || (
    section.riskLevel === 'low'
      ? []
      : [
          {
            id: 'ca-default-1',
            type: '电话重合',
            value: '0571-88992211',
            riskDegree: section.riskLevel === 'high' ? '高' : '中',
            involvedCompanies: section.companies.slice(0, 2).map((c, i) => ({
              companyName: c.name,
              role: i === 0 ? '投标主攻单位' : '疑似关联单位',
              contactPerson: c.legalPerson
            })),
            description: '国家企业信用信息公示系统登记预留年报联系电话存在100%重合。',
            source: '国家企业信用信息公示系统登记年报'
          },
          {
            id: 'ca-default-2',
            type: '注册/办公地址重合',
            value: '浙江省杭州市西湖区文一西路88号302室',
            riskDegree: section.riskLevel === 'high' ? '高' : '低',
            involvedCompanies: section.companies.slice(0, 2).map((c, i) => ({
              companyName: c.name,
              role: i === 0 ? '投标主攻单位' : '疑似关联单位'
            })),
            description: '注册与实际办公场所位于同一大楼同房间，场所高度合并。',
            source: '不动产及工商房屋租赁备案'
          }
        ]
  );

  // Fallback defaults for historical bidding associations
  const historicalAssocs = section.historicalBiddingAssociations || (
    section.riskLevel === 'low'
      ? []
      : [
          {
            id: 'hb-default-1',
            companyPair: [
              section.companies[0]?.name || '投标单位A',
              section.companies[1]?.name || '投标单位B'
            ] as [string, string],
            coBidCount: section.riskLevel === 'high' ? 12 : 3,
            timeSpan: '近24个月 (2024-2026)',
            winLossDistribution: `${section.companies[0]?.name || '单位A'} 中标 10 次，${section.companies[1]?.name || '单位B'} 中标 0 次`,
            priceGapAvg: '报价平均差值 0.45%',
            riskDegree: section.riskLevel === 'high' ? '高' : '中',
            recentProjects: [
              { projectName: `${section.name} (同类型一期)`, bidDate: '2025-10-12', winner: section.companies[0]?.name || '单位A', priceGap: '高出 0.40%' },
              { projectName: '省市数字基础设施建设项目', bidDate: '2025-06-18', winner: section.companies[0]?.name || '单位A', priceGap: '高出 0.52%' }
            ],
            patternSummary: '呈现明显的同场陪同参标与固定阶梯报价特征。'
          }
        ]
  );

  // Fallback defaults for accompanying bidders
  const accompanyingBiddersList = section.accompanyingBidders || (
    section.riskLevel === 'low'
      ? []
      : [
          {
            id: 'ac-default-1',
            companyName: section.companies[1]?.name || '疑似陪标单位',
            legalPerson: section.companies[1]?.legalPerson || '张三',
            targetBeneficiaryCompany: section.companies[0]?.name || '主攻单位',
            riskScore: section.riskScore || 85,
            screeningStatus: '高度疑似陪标单位',
            collusionIndicators: [
              { indicatorName: '同场竞标频次与胜率', matchedDetail: '近2年同场竞标 12 次，胜率 0%', isTriggered: true, riskDegree: '高' },
              { indicatorName: '标书软硬件特征码', matchedDetail: '电子标书 MAC 地址及生成时间高度雷同', isTriggered: true, riskDegree: '高' },
              { indicatorName: '保证金来源', matchedDetail: '投标保证金汇出渠道存在资金池同一性', isTriggered: true, riskDegree: '高' },
              { indicatorName: '报价差值分布', matchedDetail: '报价仅比主攻单位高出 0.45%，属保护性落选', isTriggered: true, riskDegree: '高' }
            ],
            overallAuditOpinion: '多项审查指标触发反串标预警红线，建议对其投标文件进行二次核验。'
          }
        ]
  );

  const filteredContactAssocs = contactAssocs.filter((item) => {
    if (contactFilter === 'phone') return item.type.includes('电话');
    if (contactFilter === 'email') return item.type.includes('邮箱');
    if (contactFilter === 'address') return item.type.includes('地址');
    return true;
  });

  // Fallback defaults for overview data
  const conclusion = section.conclusionData || {
    issueCategoriesCount: section.riskLevel === 'low' ? 0 : 3,
    problematicCompanyCount: section.riskLevel === 'high' ? 5 : section.riskLevel === 'medium' ? 2 : 0,
    highRiskGroupCount: section.riskLevel === 'high' ? 2 : section.riskLevel === 'medium' ? 1 : 0,
    coreRisks: section.riskLevel === 'low' ? ['未发现实质关联'] : ['同一控制人', '间接控股', '交叉持股'],
    disposalAdvice: section.riskLevel === 'high' ? '建议进入重点复核' : section.riskLevel === 'medium' ? '建议核实投标文件' : '可通过审查',
    summaryText: section.riskLevel === 'low'
      ? `本标段共 ${section.companyCount} 家投标单位，未发现实质性股权关联风险，各项指标符合标准。`
      : `本标段共 ${section.companyCount} 家投标单位，其中 5 家触发股权关联风险。系统识别到同一母公司控制、间接控股、交叉持股 3 类问题，涉及 2 个高危关联单位组，建议进入重点复核。`
  };

  const riskGroups = section.companyRiskGroups || (section.riskLevel === 'low' ? [] : [
    {
      id: 'grp-01',
      groupName: '中科国控及关联单位组',
      riskLevel: 'high' as const,
      companies: ['中科城投', '感知未来', '北京中科国控'],
      equityIssues: ['同一母公司控制', '间接控股'],
      keyEvidence: '北京中科国控持股 60%，中科城投持股感知未来 55%'
    },
    {
      id: 'grp-02',
      groupName: '华数物联及智感云联关联组',
      riskLevel: 'high' as const,
      companies: ['华数物联科技有限公司', '智感云联数据系统有限公司', '中洲科技集团'],
      equityIssues: ['交叉持股关联', '同网络源/MAC地址'],
      keyEvidence: '中洲科技集团绝对控股两家单位，电子投标文档属性码完全相同'
    }
  ]);

  const issueList = section.equityIssueList || (section.riskLevel === 'low' ? [] : [
    {
      id: 'iss-01',
      issueType: '同一母公司控制',
      riskLevel: 'high' as const,
      companies: ['中科城投', '感知未来'],
      relationPath: '北京中科国控 → 中科城投 / 感知未来',
      evidenceSummary: '同一实际控制方支配，持股比例均超过 50%'
    },
    {
      id: 'iss-02',
      issueType: '间接控股关联',
      riskLevel: 'high' as const,
      companies: ['感知未来', '中科国控'],
      relationPath: '中科国控 → 中科城投 → 感知未来',
      evidenceSummary: '穿透持股比例 33%，且高管人员存在高度重叠'
    },
    {
      id: 'iss-03',
      issueType: '交叉持股关联',
      riskLevel: 'high' as const,
      companies: ['中科国控', '中科城投'],
      relationPath: '双向持股 / 循环控制结构',
      evidenceSummary: '存在循环持股结构与相同保证金转账资金池'
    }
  ]);

  const matrixDataGroups = section.riskLevel === 'low' ? [] : [
    {
      id: 'matrix-grp-1',
      companies: [
        section.companies[0]?.name || '中科城感知新技术有限公司',
        section.companies[1]?.name || '感知未来信息科技（北京）有限公司',
      ],
      triggerCount: 2,
      summaryBadges: [
        { label: '股权关系 - 直接控股', isEquity: true },
        { label: '主体联系 - 年报信息审查', isEquity: false },
      ],
      overallRiskText: '高危 (1)',
      overallRiskType: 'high' as const,
      rules: [
        {
          mainCatId: 'cat-equity',
          subCatId: 'cat-equity-direct',
          typeTag: '股权关系',
          ruleTitle: '直接控股',
          description: `单位之间存在直接控股关系（同一母公司「${section.companies[2]?.name || '北京中科国控智能系统集团有限公司'}」）`,
          statusText: '• 高危红线',
          statusType: 'high' as const,
        },
        {
          mainCatId: 'cat-contact',
          subCatId: 'cat-contact-annual-report',
          typeTag: '主体联系',
          ruleTitle: '年报信息审查',
          description: '单位之间年报(含历史年报)出现相同邮箱/相同地址/相同电话(010-88481234)',
          statusText: '• 中危警示',
          statusType: 'medium' as const,
        },
      ],
    },
    {
      id: 'matrix-grp-2',
      companies: [
        section.companies[1]?.name || '感知未来信息科技（北京）有限公司',
        section.companies[2]?.name || '北京中科国控智能系统集团有限公司',
      ],
      triggerCount: 2,
      summaryBadges: [
        { label: '人员关系 - 主要人员审查', isEquity: true },
        { label: '人员关系 - 实际控制人审查', isEquity: true },
      ],
      overallRiskText: '高危 (2)',
      overallRiskType: 'high' as const,
      rules: [
        {
          mainCatId: 'cat-personnel',
          subCatId: 'cat-personnel-main',
          typeTag: '人员关系',
          ruleTitle: '主要人员审查',
          description: '单位之间存在历史董监高、历史股东关联关系',
          statusText: '• 高危红线',
          statusType: 'high' as const,
        },
        {
          mainCatId: 'cat-personnel',
          subCatId: 'cat-personnel-controller',
          typeTag: '人员关系',
          ruleTitle: '实际控制人审查',
          description: '单位之间存在共同实际控制人（自然人张建国穿透控制）',
          statusText: '• 高危红线',
          statusType: 'high' as const,
        },
      ],
    },
    {
      id: 'matrix-grp-3',
      companies: [
        section.companies[2]?.name || '北京中科国控智能系统集团有限公司',
        section.companies[3]?.name || '华数物联科技有限公司',
      ],
      triggerCount: 3,
      summaryBadges: [
        { label: '股权关系 - 间接控股', isEquity: true },
        { label: '人员关系 - 法人股东审查', isEquity: true },
        { label: '主体联系 - 注册地址审查', isEquity: false },
      ],
      overallRiskText: '高危 (2)',
      overallRiskType: 'high' as const,
      rules: [
        {
          mainCatId: 'cat-equity',
          subCatId: 'cat-equity-indirect',
          typeTag: '股权关系',
          ruleTitle: '间接控股',
          description: '单位之间存在间接控股/参股等股权相关的关联关系',
          statusText: '• 高危红线',
          statusType: 'high' as const,
        },
        {
          mainCatId: 'cat-personnel',
          subCatId: 'cat-personnel-legal-shareholder',
          typeTag: '人员关系',
          ruleTitle: '法人股东审查',
          description: '单位之间存在共同的法人股东，股东关系向上追溯3层(股权占比为 1/3 的股东)',
          statusText: '• 高危红线',
          statusType: 'high' as const,
        },
        {
          mainCatId: 'cat-contact',
          subCatId: 'cat-contact-address',
          typeTag: '主体联系',
          ruleTitle: '注册地址审查',
          description: '单位之间存在相同的注册地址（综合办公大楼同层室）',
          statusText: '• 中危警示',
          statusType: 'medium' as const,
        },
      ],
    },
    {
      id: 'matrix-grp-4',
      companies: [
        section.companies[0]?.name || '中科城感知新技术有限公司',
        section.companies[3]?.name || '华数物联科技有限公司',
      ],
      triggerCount: 3,
      summaryBadges: [
        { label: '人员关系 - 法定代表人审查', isEquity: true },
        { label: '人员关系 - 实际受益人审查', isEquity: true },
        { label: '主体联系 - 注册电话审查', isEquity: false },
      ],
      overallRiskText: '高危 (3)',
      overallRiskType: 'high' as const,
      rules: [
        {
          mainCatId: 'cat-personnel',
          subCatId: 'cat-personnel-legal-rep',
          typeTag: '人员关系',
          ruleTitle: '法定代表人审查',
          description: '单位之间存在共同法定代表人（李国强）',
          statusText: '• 高危红线',
          statusType: 'high' as const,
        },
        {
          mainCatId: 'cat-personnel',
          subCatId: 'cat-personnel-beneficiary',
          typeTag: '人员关系',
          ruleTitle: '实际受益人审查',
          description: '单位之间存在共同实际受益人',
          statusText: '• 高危红线',
          statusType: 'high' as const,
        },
        {
          mainCatId: 'cat-contact',
          subCatId: 'cat-contact-phone',
          typeTag: '主体联系',
          ruleTitle: '注册电话审查',
          description: '单位之间存在相同的注册电话',
          statusText: '• 中危警示',
          statusType: 'medium' as const,
        },
      ],
    },
  ];

  // Filtering matrix groups
  const filteredMatrixGroups = matrixDataGroups
    .map((grp) => {
      // 1. Company Search
      const companyKw = matrixCompanySearch.trim().toLowerCase();
      const matchesCompany =
        !companyKw ||
        grp.companies.some((c) => c.toLowerCase().includes(companyKw));

      if (!matchesCompany) return null;

      // 2. Rule Category Search
      if (matrixCategorySearch === 'all') {
        return grp;
      }

      const isMainCat = RULE_CATEGORY_TREE.some((c) => c.id === matrixCategorySearch);

      const matchingRules = grp.rules.filter((rule) => {
        if (isMainCat) {
          return rule.mainCatId === matrixCategorySearch;
        } else {
          return rule.subCatId === matrixCategorySearch;
        }
      });

      if (matchingRules.length === 0) return null;

      return {
        ...grp,
        rules: matchingRules,
        triggerCount: matchingRules.length,
      };
    })
    .filter(Boolean) as typeof matrixDataGroups;

  const renderEquityRelationMatrix = () => (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-0">
      {/* Filter Toolbar */}
      <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* 1. 单位名称搜索 */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={matrixCompanySearch}
              onChange={(e) => setMatrixCompanySearch(e.target.value)}
              placeholder="搜索单位名称..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
            />
            {matrixCompanySearch && (
              <button
                onClick={() => setMatrixCompanySearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 2. 规则分类树状搜索 */}
          <div className="relative">
            <button
              onClick={() => setIsCatTreeOpen(!isCatTreeOpen)}
              className={`w-full sm:w-auto inline-flex items-center justify-between gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer bg-white ${
                matrixCategorySearch !== 'all'
                  ? 'border-blue-500 text-blue-700 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">
                  {getCategoryLabel(matrixCategorySearch)}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCatTreeOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Tree Selector Dropdown Panel */}
            {isCatTreeOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsCatTreeOpen(false)}
                />

                <div className="absolute left-0 top-full mt-1.5 z-30 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 text-xs space-y-1 max-h-88 overflow-y-auto">
                  <button
                    onClick={() => {
                      setMatrixCategorySearch('all');
                      setIsCatTreeOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      matrixCategorySearch === 'all'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>全部规则分类</span>
                    {matrixCategorySearch === 'all' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  {/* Tree Categories */}
                  {RULE_CATEGORY_TREE.map((category) => {
                    const isMainSelected = matrixCategorySearch === category.id;

                    return (
                      <div key={category.id} className="space-y-0.5">
                        {/* 大类 (可选中!) */}
                        <button
                          onClick={() => {
                            setMatrixCategorySearch(category.id);
                            setIsCatTreeOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-1.5 font-bold flex items-center justify-between transition-colors cursor-pointer group ${
                            isMainSelected
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-slate-900 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Folder className={`w-3.5 h-3.5 ${isMainSelected ? 'text-blue-600' : 'text-amber-500 group-hover:text-amber-600'}`} />
                            <span>{category.name}</span>
                            {category.weight && (
                              <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                {category.weight}
                              </span>
                            )}
                          </div>
                          {isMainSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </button>

                        {/* 小类 (缩进树形结构) */}
                        <div className="pl-6 pr-2 space-y-0.5 border-l-2 border-slate-100 ml-5 my-0.5">
                          {category.children?.map((sub) => {
                            const isSubSelected = matrixCategorySearch === sub.id;

                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setMatrixCategorySearch(sub.id);
                                  setIsCatTreeOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1 rounded-lg font-medium flex items-center justify-between text-[11px] transition-colors cursor-pointer ${
                                  isSubSelected
                                    ? 'bg-blue-100/80 text-blue-800 font-bold'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                <span className="truncate">├─ {sub.name}</span>
                                {isSubSelected && <Check className="w-3 h-3 text-blue-600 shrink-0 ml-1" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Reset Filters */}
          {(matrixCompanySearch || matrixCategorySearch !== 'all') && (
            <button
              onClick={() => {
                setMatrixCompanySearch('');
                setMatrixCategorySearch('all');
              }}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              重置筛选
            </button>
          )}
        </div>

        <div className="text-xs font-medium text-slate-500 shrink-0">
          包含排查记录: <span className="font-bold text-slate-900">{filteredMatrixGroups.length}</span> 组单位
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-bold">
              <th className="p-3.5 pl-6 w-1/4 min-w-[200px]">关联单位组</th>
              <th className="p-3.5 w-1/5 min-w-[160px]">关联类型</th>
              <th className="p-3.5 w-2/5 min-w-[260px]">具体情况</th>
              <th className="p-3.5 w-28 text-center min-w-[100px]">风险状态</th>
              <th className="p-3.5 pr-6 w-28 text-center min-w-[100px]">查看详情</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredMatrixGroups.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center bg-white">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                      <Search className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-bold text-slate-800">未检索到匹配的单位风险记录</div>
                    <p className="text-xs text-slate-500">尝试清除单位名称搜索或重置规则分类筛选条件。</p>
                    <button
                      onClick={() => {
                        setMatrixCompanySearch('');
                        setMatrixCategorySearch('all');
                      }}
                      className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      清除搜索与筛选
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMatrixGroups.map((grp) => {
              const isExpanded = expandedMatrixGroups[grp.id] !== false;
              const totalRowsForGroup = 1 + (isExpanded ? grp.rules.length : 0);

              return (
                <React.Fragment key={grp.id}>
                  {/* Row 1: Group Summary Row */}
                  <tr className="bg-white hover:bg-slate-50/40 transition-colors">
                    {/* Spanning Company Group Cell */}
                    <td
                      rowSpan={totalRowsForGroup}
                      className="p-4 pl-6 align-middle border-r border-slate-200 bg-slate-50/40 space-y-2.5"
                    >
                      {grp.companies.map((cName, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-2 text-xs font-bold text-slate-900 leading-snug">
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                          <span>{cName}</span>
                        </div>
                      ))}
                    </td>

                    {/* 风险数量 / 触发规则 (Summary) */}
                    <td className="p-3.5 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleMatrixGroup(grp.id)}
                          className="p-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                          title={isExpanded ? '折叠明细' : '展开明细'}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <span className="font-extrabold text-blue-950 text-xs sm:text-sm">
                          触发 {grp.triggerCount} 项规则
                        </span>
                      </div>
                    </td>

                    {/* 具体情况 (Summary) */}
                    <td className="p-3.5 align-middle">
                      <div className="space-y-1.5">
                        <div className="text-xs text-slate-600 font-medium">
                          该单位组共排查出 <strong className="text-slate-900 font-bold">{grp.triggerCount}</strong> 项关联风险：
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {grp.summaryBadges.map((b, bIdx) => (
                            <span
                              key={bIdx}
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                b.isEquity
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                              }`}
                            >
                              {b.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* 风险状态 (Summary) */}
                    <td className="p-3.5 text-center align-middle">
                      <span
                        className={`inline-flex items-center justify-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold border ${
                          grp.overallRiskType === 'high'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {grp.overallRiskText}
                      </span>
                    </td>

                    {/* 查看详情 (Summary) */}
                    <td className="p-3.5 pr-6 text-center align-middle">
                      <button
                        onClick={() => {
                          const hasEquity = grp.rules.some((r) => r.typeTag === '股权关系' || r.typeTag === '人员关系' || r.mainCatId === 'cat-equity' || r.mainCatId === 'cat-personnel');
                          const hasHistory = grp.rules.some((r) => r.subCatId === 'cat-other-history' || r.ruleTitle.includes('历史投标'));
                          if (hasEquity) {
                            setDetailPopup({
                              type: 'topology',
                              title: '合规穿透与关联拓扑图谱',
                              subtitle: grp.companies.join(' 与 '),
                            });
                          } else if (hasHistory) {
                            setDetailPopup({
                              type: 'history',
                              title: '历史投标同场关联排查详情',
                              subtitle: grp.companies.join(' 与 '),
                            });
                          } else {
                            setDetailPopup({
                              type: 'contact',
                              title: '投标单位联系方式与关联排查详情',
                              subtitle: grp.companies.join(' 与 '),
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer border border-blue-200/80"
                      >
                        <span>查看详情</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                  {/* Detail Rows for each triggered rule */}
                  {isExpanded &&
                    grp.rules.map((rule, rIdx) => (
                      <tr key={rIdx} className="bg-white hover:bg-slate-50/40 transition-colors border-t border-slate-100">
                        {/* 风险数量 / 触发规则 (Detail) */}
                        <td className="p-3.5 align-middle">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 border ${
                                rule.typeTag === '股权关系'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : rule.typeTag === '人员关系'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {rule.typeTag}
                            </span>
                            <span className="font-extrabold text-slate-900 text-xs">
                              {rule.ruleTitle}
                            </span>
                          </div>
                        </td>

                        {/* 具体情况 (Detail) */}
                        <td className="p-3.5 align-middle text-xs text-slate-700 font-medium leading-relaxed">
                          {rule.description}
                        </td>

                        {/* 风险状态 (Detail) */}
                        <td className="p-3.5 text-center align-middle">
                          <span
                            className={`inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              rule.statusType === 'high'
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {rule.statusText}
                          </span>
                        </td>

                        {/* 查看详情 (Detail) */}
                        <td className="p-3.5 pr-6 text-center align-middle">
                          <button
                            onClick={() => {
                              if (
                                rule.typeTag === '股权关系' ||
                                rule.typeTag === '人员关系' ||
                                rule.mainCatId === 'cat-equity' ||
                                rule.mainCatId === 'cat-personnel' ||
                                rule.ruleTitle.includes('控股') ||
                                rule.ruleTitle.includes('持股') ||
                                rule.ruleTitle.includes('代表人') ||
                                rule.ruleTitle.includes('任职')
                              ) {
                                setDetailPopup({
                                  type: 'topology',
                                  title: `股权与人员关系排查 - ${rule.ruleTitle}`,
                                  subtitle: grp.companies.join(' 与 '),
                                });
                              } else if (
                                rule.subCatId === 'cat-other-history' ||
                                rule.ruleTitle.includes('历史投标')
                              ) {
                                setDetailPopup({
                                  type: 'history',
                                  title: `历史投标关联排查 - ${rule.ruleTitle}`,
                                  subtitle: grp.companies.join(' 与 '),
                                });
                              } else {
                                setDetailPopup({
                                  type: 'contact',
                                  title: `联系方式关联排查 - ${rule.ruleTitle}`,
                                  subtitle: grp.companies.join(' 与 '),
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <span>查看详情</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-3 md:p-4 animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-[1800px] w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (浅色高颜值顶栏) */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              title="返回标段列表"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-white text-slate-600 border border-slate-200 shadow-2xs">
                  {section.code}
                </span>

                {section.riskLevel === 'high' && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                    高风险等级
                  </span>
                )}
                {section.riskLevel === 'medium' && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    中风险等级
                  </span>
                )}
                {section.riskLevel === 'low' && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    低风险等级
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  {section.name}
                </h2>

                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 shrink-0">
                  <span>标段风险指数</span>
                  <span className="font-bold text-red-600 text-sm">{section.riskScore}</span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Right Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrintReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden xs:inline">打印分析报告</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="bg-slate-50/60 border-b border-slate-200/80 px-6 pt-2.5 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl border-t border-x border-slate-200/90 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            标段风险总览
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl border-t border-x border-slate-200/90 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            单位风险详情
          </button>

          <button
            onClick={() => setActiveTab('topology')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'topology'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl border-t border-x border-slate-200/90 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-4 h-4" />
            单位关系图谱
          </button>

          <button
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'companies'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl border-t border-x border-slate-200/90 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            投标单位画像
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#f8fafc] space-y-6">

          {/* TAB 1: 单位关系风险总览 */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Top Overview Split Grid: Left Sidebar Stats + Main Right Content */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                
                {/* Left Column: Vertical Stat Cards Stack */}
                <div className="lg:col-span-1 space-y-3.5">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-1">参与单位</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-blue-600">{section.companyCount}</span>
                        <span className="text-xs font-semibold text-slate-400">家</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">本次投标单位总数</div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-500">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-1">问题单位家数</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-amber-500">
                          {conclusion.problematicCompanyCount}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">家</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">触发风控规则单位</div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-500">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-1">风险单位组数量</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-rose-600">
                          {conclusion.highRiskGroupCount || (section.riskLevel === 'high' ? 2 : section.riskLevel === 'medium' ? 1 : 0)}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">个</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">关联风险涉险单位组</div>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-500">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-1">问题总数</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-purple-600">
                          {section.riskLevel === 'high' ? 12 : section.riskLevel === 'medium' ? 5 : 0}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">项</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">风险线索触发规则数</div>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-500">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Right Column: 1. 顶部：股权审查结论卡 */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-blue-600" />
                            股权审查结论卡
                          </h3>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            系统自动诊断结论
                          </span>

                          {section.riskLevel === 'high' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200/90 shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                              高风险（红线预警）
                            </span>
                          )}
                          {section.riskLevel === 'medium' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              中风险（关注排查）
                            </span>
                          )}
                          {section.riskLevel === 'low' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              低风险（合规通过）
                            </span>
                          )}
                        </div>

                        {/* 单位分类图例 */}
                        <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-xl shadow-2xs">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            单位图例:
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            投标单位
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            关联单位
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                            招标人
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                            招标代理
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            专家单位
                          </span>
                        </div>
                      </div>

                      {/* 1. 总的结论 */}
                      <div className={`p-4 rounded-xl border text-sm text-slate-800 leading-relaxed min-h-[72px] ${
                        section.riskLevel === 'high'
                          ? 'bg-red-50/50 border-red-200'
                          : section.riskLevel === 'medium'
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-blue-50/50 border-blue-200'
                      }`}>
                        <span className="font-bold text-slate-900 mr-1">【总审查结论】</span>
                        <TypingEffectText
                          key={section.id}
                          text={conclusion.summaryText}
                          speed={22}
                          skipAnimation={hasTypedConclusion}
                          onComplete={() => setHasTypedConclusion(true)}
                          renderRich={renderRichConclusionText}
                        />
                      </div>

                      {/* 2. 详情分析思考 */}
                      <div className="space-y-3 pt-1">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          详情分析思考与推理过程
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {(
                            section.riskLevel === 'low'
                              ? [
                                  {
                                    label: '研判 1',
                                    badgeClass: 'bg-emerald-100 text-emerald-800',
                                    title: '股权穿透与控制关系核查',
                                    content: `系统已对参标的 ${section.companyCount || section.companies?.length || 3} 家单位进行多层股权穿透排查，各单位股权结构完全独立，未发现直接或间接的控股/参股关系，亦无同一实际控制人特征。`
                                  },
                                  {
                                    label: '研判 2',
                                    badgeClass: 'bg-emerald-100 text-emerald-800',
                                    title: '高管任职与交叉控制排查',
                                    content: '经工商监管及高管数据库比对，各参标单位的法定代表人、董事、监事及高级管理人员均无交叉兼职或高管重叠现象，管理层独立性良好。'
                                  },
                                  {
                                    label: '研判 3',
                                    badgeClass: 'bg-blue-100 text-blue-800',
                                    title: '法规对照与合规建议',
                                    content: '依据《招投标法》及《招投标法实施条例》相关规定，本次投标单位之间无同母公司或控制关系，未触发任何违规风险红线，建议正常推进后续开评标流程。'
                                  }
                                ]
                              : section.riskLevel === 'medium'
                              ? [
                                  {
                                    label: '研判 1',
                                    badgeClass: 'bg-amber-100 text-amber-800',
                                    title: '股权穿透与潜在关联',
                                    content: '经多层股权穿透排查，少数单位存在少量历史参股或边缘交集，但持股比例低于 10%，未形成实质控制关系。'
                                  },
                                  {
                                    label: '研判 2',
                                    badgeClass: 'bg-amber-100 text-amber-800',
                                    title: '管理层与历史关联排查',
                                    content: '部分单位高管曾在历史时期共同任职，当前无直接交叉兼职，建议对标书编制及资金流水进行常规辅助核验。'
                                  },
                                  {
                                    label: '研判 3',
                                    badgeClass: 'bg-blue-100 text-blue-800',
                                    title: '法规对照与处置建议',
                                    content: '未触及直接控股关系一票否决条款，但提示存在中度关联关注项，建议评标委员会对相关投标人的商务文件进行重点审核。'
                                  }
                                ]
                              : [
                                  {
                                    label: '研判 1',
                                    badgeClass: 'bg-red-100 text-red-700',
                                    title: '股权穿透与同一控制人',
                                    content: '穿透股东结构发现，中洲科技集团同时直接控股【华数物联】(65%) 并间接控制【智感云联】(51%)，表决权高度归属于同一实际控制人，属于典型“同一控制人支配下的协同投标”。'
                                  },
                                  {
                                    label: '研判 2',
                                    badgeClass: 'bg-amber-100 text-amber-800',
                                    title: '交叉持股与管理层重叠',
                                    content: '【星脉感知】与【华数物联】存在回避失效，星脉感知监事同时在智感云联担任执行董事，且投标保证金划转显示来自相同集中资金池，具备高危串标协同特征。'
                                  },
                                  {
                                    label: '研判 3',
                                    badgeClass: 'bg-blue-100 text-blue-800',
                                    title: '法规对照与处置建议',
                                    content: '依据《招投标法实施条例》第三十四条“存在控股关系的不同单位不得参加同一标段投标”之规定，建议评标委员会暂停开标进程，并将 5 家问题单位移交重点质询。'
                                  }
                                ]
                          ).map((step, idx) => {
                            const isRevealed = idx < visibleStepCount;
                            if (!isRevealed) {
                              return (
                                <div
                                  key={`thinking-${section.id}-${idx}`}
                                  className="p-3.5 rounded-xl bg-blue-50/40 border border-dashed border-blue-200/80 space-y-2 min-h-[85px] flex flex-col justify-center transition-all animate-pulse"
                                >
                                  <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium">
                                    <Clock className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                    <span>{step.label}：{step.title} — AI 深度推理研判中...</span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="h-2 bg-blue-200/60 rounded w-5/6"></div>
                                    <div className="h-2 bg-blue-200/40 rounded w-2/3"></div>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={`revealed-${section.id}-${idx}`}
                                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100/90 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-400 shadow-2xs"
                              >
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${step.badgeClass}`}>
                                    {step.label}
                                  </span>
                                  {step.title}
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {renderRichConclusionText(step.content)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. 底部：再放“风险问题清单” */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    风险问题清单
                  </h3>
                  <span className="text-xs text-slate-400">明细化展现穿透分析路径与证据链摘要</span>
                </div>

                {issueList.length === 0 ? (
                  <div className="text-slate-500 text-sm text-center py-6 border border-dashed border-slate-200 rounded-xl">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    未发现任何股权异常明细。
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 bg-slate-50/80">
                          <th className="py-3 px-4 w-[150px]">问题类型</th>
                          <th className="py-3 px-3 w-[100px]">风险等级</th>
                          <th className="py-3 px-4 w-[180px]">涉及单位</th>
                          <th className="py-3 px-4">关联路径</th>
                          <th className="py-3 px-4">证据摘要</th>
                          <th className="py-3 px-4 text-right w-[110px]">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {issueList.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {item.issueType}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-700">
                                {item.riskLevel === 'high' ? '高' : '中'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs">
                              {item.companies.join('、')}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-blue-700 font-semibold">
                              {item.relationPath}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600">
                              {item.evidenceSummary}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() =>
                                  setDetailPopup({
                                    type: 'topology',
                                    title: `合规穿透与关联拓扑图谱 - ${item.issueType}`,
                                    subtitle: item.companies.join('、'),
                                  })
                                }
                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                              >
                                查看图谱
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: 单位关联情况 */}
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              {renderEquityRelationMatrix()}
            </div>
          )}

          {/* TAB 3: 单位关系图谱 */}
          {activeTab === 'topology' && (
            <div className="space-y-6">
              <InteractiveEquityTopology section={section} />
            </div>
          )}



          {/* TAB 5: 投标单位画像 */}
          {activeTab === 'companies' && (() => {
            const companyKw = companySearchKeyword.trim().toLowerCase();
            const filteredProfileCompanies = section.companies.filter((comp) => {
              if (!companyKw) return true;
              return (
                comp.name.toLowerCase().includes(companyKw) ||
                comp.legalPerson.toLowerCase().includes(companyKw) ||
                comp.shareholders.some((s) => s.name.toLowerCase().includes(companyKw))
              );
            });

            return (
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  {/* 单位名称搜索 */}
                  <div className="relative shrink-0 max-w-xs w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={companySearchKeyword}
                      onChange={(e) => setCompanySearchKeyword(e.target.value)}
                      placeholder="搜索单位名称..."
                      className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400 font-medium"
                    />
                    {companySearchKeyword && (
                      <button
                        onClick={() => setCompanySearchKeyword('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    包含排查记录: <span className="font-bold text-slate-900">{filteredProfileCompanies.length}</span> 家单位
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3 min-w-[200px]">投标单位名称</th>
                        <th className="p-3 min-w-[150px]">法定代表人 / 注册资本</th>
                        <th className="p-3 min-w-[220px]">主要股东构成与持股比例</th>
                        <th className="p-3 min-w-[380px]">关联路径（上下穿透3层）</th>
                        <th className="p-3 w-28 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProfileCompanies.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            未匹配到符合搜索条件的投标单位
                          </td>
                        </tr>
                      ) : (
                        filteredProfileCompanies.map((comp, idx) => (
                          <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-3">
                              <div className="font-extrabold text-slate-900 text-xs">{comp.name}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-slate-800 font-medium">
                                <span className="text-slate-500">法人：</span>
                                <span className="font-bold text-slate-900">{comp.legalPerson}</span>
                              </div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                资本：<span className="font-semibold text-slate-700">{comp.registeredCapital}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                {comp.shareholders.map((s, i) => (
                                  <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                                    <span className={s.isCommon ? 'font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200' : 'text-slate-700'}>
                                      {s.name} {s.isCommon && '(重叠股东)'}
                                    </span>
                                    <span className="font-mono font-semibold text-slate-500 shrink-0">{s.ratio}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-3">
                              {(() => {
                                const paths = getCompany3LayerPaths(comp);
                                return (
                                  <div className="font-mono text-[11px] text-slate-800 bg-slate-50/90 border border-slate-200/90 p-2.5 rounded-xl break-all min-w-[320px] leading-relaxed select-text">
                                    {paths.combinedPathStr}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() =>
                                  setDetailPopup({
                                    type: 'topology',
                                    title: `合规穿透与关联拓扑图谱 - ${comp.name}`,
                                    subtitle: comp.name,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer border border-blue-200/80 whitespace-nowrap"
                              >
                                查看图谱
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            数据支持：智慧招投标穿透监管与大数据大数据挖掘引擎
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors cursor-pointer"
          >
            关闭窗口
          </button>
        </div>
      </div>

      {/* Evidence Chain Detail Pop-up Modal */}
      {selectedEvidenceGroup && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden space-y-0">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    关联证据链诊断报告
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/30 text-rose-300 border border-rose-400/30">
                      {selectedEvidenceGroup.riskLevel === 'high' ? '高风险组' : '中风险组'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">{selectedEvidenceGroup.groupName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvidenceGroup(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
              {/* Companies involved */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  涉案排查单位：
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEvidenceGroup.companies.map((c, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 shadow-2xs">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Core Triggered Issues */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  触发核心串联/围标风险项：
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEvidenceGroup.equityIssues.map((issue, idx) => (
                    <span key={idx} className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-extrabold text-xs">
                      ⚠️ {issue}
                    </span>
                  ))}
                </div>
              </div>

              {/* Detailed Evidence Chain checklist */}
              <div className="space-y-3">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  多维证据链核查溯源结论：
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-blue-950 space-y-1">
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>1. 股权控制关系证据 (工商穿透)</span>
                      <span className="text-[10px] text-blue-700 font-semibold px-2 py-0.5 rounded bg-blue-100">已形成完整闭环</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {selectedEvidenceGroup.keyEvidence}。全网穿透后表决权集中度超过 50%，属于典型同一实际控制人支配下的协同投标行为。
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 text-purple-950 space-y-1">
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>2. 电子标书特征码证据 (技术指纹)</span>
                      <span className="text-[10px] text-purple-700 font-semibold px-2 py-0.5 rounded bg-purple-100">高确信度重合</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      投标文件创建者 (Author)、MAC物理地址与上传IP网段在开标前24小时内高度一致，证明投标文件出自同一编制终端或同源网络。
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-950 space-y-1">
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>3. 财务与保证金痕迹证据</span>
                      <span className="text-[10px] text-amber-800 font-semibold px-2 py-0.5 rounded bg-amber-100">资金池同源</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      投标保证金缴纳账号开户行相同，且汇款备注单据编号呈连续性，存在集中资金池划转特征。
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal citation */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-1">
                <div className="font-bold text-amber-400">⚖️ 适用法律规章依据：</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  依据《招标投标法实施条例》第三十四条及《网络招投标违规行为认定指南》，上述证据链已构成协同串标的直接依据。
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedEvidenceGroup(null);
                  setDetailPopup({
                    type: 'topology',
                    title: '合规穿透与关联拓扑图谱',
                    subtitle: selectedEvidenceGroup.groupName,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors cursor-pointer"
              >
                查看股权穿透拓扑图
              </button>
              <button
                onClick={() => setSelectedEvidenceGroup(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300 transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Pop-up Modal (点击查看详情弹出层) */}
      {detailPopup && (
        <div
          onClick={() => setDetailPopup(null)}
          className="fixed inset-0 z-[100] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-7xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50/90 via-sky-50/90 to-blue-50/90 text-slate-900 flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700 border border-blue-200/80 shrink-0">
                  {detailPopup.type === 'topology' && <Network className="w-5 h-5" />}
                  {detailPopup.type === 'history' && <History className="w-5 h-5" />}
                  {detailPopup.type === 'contact' && <PhoneCall className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 truncate">
                    {detailPopup.title}
                  </h3>
                  {detailPopup.subtitle && (
                    <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                      涉及单位：{detailPopup.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* View Switchers inside Popup */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white border border-blue-200/80 p-1 rounded-xl shadow-2xs">
                  <button
                    onClick={() =>
                      setDetailPopup((prev) =>
                        prev ? { ...prev, type: 'topology', title: '合规穿透与关联拓扑图谱' } : null
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      detailPopup.type === 'topology'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5" />
                    拓扑图谱
                  </button>
                  <button
                    onClick={() =>
                      setDetailPopup((prev) =>
                        prev ? { ...prev, type: 'history', title: '历史投标同场关联排查详情' } : null
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      detailPopup.type === 'history'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    历史投标
                  </button>
                  <button
                    onClick={() =>
                      setDetailPopup((prev) =>
                        prev ? { ...prev, type: 'contact', title: '联系方式关联排查列表' } : null
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      detailPopup.type === 'contact'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80'
                    }`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    联系方式
                  </button>
                </div>

                <button
                  onClick={() => setDetailPopup(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-blue-100/60 transition-colors cursor-pointer shrink-0 ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
              {detailPopup.type === 'topology' && (
                <InteractiveEquityTopology
                  section={section}
                  targetCompanyName={detailPopup.subtitle}
                />
              )}

              {detailPopup.type === 'history' && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        历史投标同场关联分析列表
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          historicalAssocs.length === 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          识别 {historicalAssocs.length} 组协同组合
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        识别近24个月内同场竞标频次异常、胜率分布极度倾斜、报价呈固定梯度的组合
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {historicalAssocs.length === 0 ? (
                      <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200 space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                        <div className="text-sm font-bold text-slate-800">未识别到历史投标同场协同组合</div>
                        <p className="text-xs text-slate-500">近24个月内各投标单位无频次过高、陪标或梯度报价等异常同场竞标记录，属于独立规范竞标。</p>
                      </div>
                    ) : (
                      historicalAssocs.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3.5"
                        >
                          {/* Header */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-500">同场关联组：</span>
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                                {item.companyPair[0]}
                              </span>
                              <span className="text-rose-500 font-extrabold text-xs">↔ 频次协同 ↔</span>
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                                {item.companyPair[1]}
                              </span>
                            </div>

                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                              ⚠️ {item.riskDegree}风险 (高度伴随陪标特征)
                            </span>
                          </div>

                          {/* Quick Metrics bar */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                              <div className="text-slate-500 text-[11px] mb-0.5 font-medium">同场参标频次</div>
                              <div className="font-bold text-blue-700 text-sm">
                                {item.coBidCount} 次{' '}
                                <span className="text-[11px] text-slate-400 font-normal">({item.timeSpan})</span>
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                              <div className="text-slate-500 text-[11px] mb-0.5 font-medium">中标/落选战绩分布</div>
                              <div className="font-bold text-slate-800 text-xs">{item.winLossDistribution}</div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                              <div className="text-slate-500 text-[11px] mb-0.5 font-medium">历史报价平均梯度差</div>
                              <div className="font-bold text-amber-700 text-xs">{item.priceGapAvg}</div>
                            </div>
                          </div>

                          {/* Pattern summary box */}
                          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-900 font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>同场协同行为模式：</strong> {item.patternSummary}
                            </span>
                          </div>

                          {/* Recent projects preview */}
                          {item.recentProjects && item.recentProjects.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-bold text-slate-500">
                                近期的共同参标历史记录（核验证据链）：
                              </div>
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
                                      <th className="p-2.5 font-bold">历史投标项目名称</th>
                                      <th className="p-2.5 font-bold">开标日期</th>
                                      <th className="p-2.5 font-bold">实际中标单位</th>
                                      <th className="p-2.5 font-bold">陪标报价阶梯差</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {item.recentProjects.map((proj, pIdx) => (
                                      <tr key={pIdx} className="hover:bg-slate-50/80">
                                        <td className="p-2.5 font-semibold text-slate-900">{proj.projectName}</td>
                                        <td className="p-2.5 text-slate-500 font-mono">{proj.bidDate}</td>
                                        <td className="p-2.5 font-bold text-blue-700">{proj.winner}</td>
                                        <td className="p-2.5 font-bold text-amber-600">{proj.priceGap}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {detailPopup.type === 'contact' && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <PhoneCall className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          投标单位联系方式关联排查列表
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                            section.riskLevel === 'low' || contactAssocs.length === 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            共 {section.companies.length} 家单位 / 触发 {section.riskLevel === 'low' ? 0 : contactAssocs.length} 项重合
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          对比各投标单位工商登记、年报预留电话、注册/实际办公地址及电子邮箱信息
                        </p>
                      </div>
                    </div>

                    {/* Search box */}
                    <div className="relative shrink-0">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={contactSearchKeyword}
                        onChange={(e) => setContactSearchKeyword(e.target.value)}
                        placeholder="搜索单位/电话/地址/邮箱..."
                        className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 transition-all"
                      />
                    </div>
                  </div>

                  {/* TABLE VIEW */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                          <th className="p-3 w-10 text-center">#</th>
                          <th className="p-3 min-w-[180px]">投标单位名称</th>
                          <th className="p-3 min-w-[130px]">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-blue-600" />
                              联系电话
                            </div>
                          </th>
                          <th className="p-3 min-w-[220px]">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-600" />
                              注册 / 办公地址
                            </div>
                          </th>
                          <th className="p-3 min-w-[180px]">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-purple-600" />
                              电子邮箱
                            </div>
                          </th>
                          <th className="p-3 min-w-[120px]">排查风险与重合标记</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {section.companies
                          .filter((comp) => {
                            if (!contactSearchKeyword) return true;
                            const kw = contactSearchKeyword.toLowerCase();
                            const phoneVal = comp.phone || '';
                            const addrVal = comp.address || '';
                            const emailVal = comp.email || '';
                            return (
                              comp.name.toLowerCase().includes(kw) ||
                              phoneVal.toLowerCase().includes(kw) ||
                              addrVal.toLowerCase().includes(kw) ||
                              emailVal.toLowerCase().includes(kw) ||
                              comp.legalPerson.toLowerCase().includes(kw)
                            );
                          })
                          .map((comp, idx) => {
                            const isLowRisk = section.riskLevel === 'low';
                            const phoneVal = comp.phone || (
                              isLowRisk
                                ? `0571-88${200000 + idx * 13579}`
                                : (contactAssocs.find(c => c.type.includes('电话') && c.involvedCompanies.some(ic => ic.companyName === comp.name))?.value || `0571-87${100000 + idx * 11111}`)
                            );
                            const addrVal = comp.address || (
                              isLowRisk
                                ? `${comp.name.includes('大禹') ? '甘肃省兰州市城关区高新技术产业园15号' : comp.name.includes('绿洲') ? '山东省济南市历下区产业创新大厦808室' : '黑龙江省哈尔滨市高新区示范路22号'}大厦`
                                : (contactAssocs.find(c => c.type.includes('地址') && c.involvedCompanies.some(ic => ic.companyName === comp.name))?.value || `浙江省杭州市高新区科技路${(idx + 1) * 10}号${comp.name.substring(0, 4)}大厦`)
                            );
                            const emailVal = comp.email || (
                              isLowRisk
                                ? `contact@${comp.name.includes('大禹') ? 'dayu-water.com' : comp.name.includes('绿洲') ? 'lvzhou-agri.com' : 'heitudi-tech.com'}`
                                : (contactAssocs.find(c => c.type.includes('邮箱') && c.involvedCompanies.some(ic => ic.companyName === comp.name))?.value || `contact@${comp.name.includes('华数') || comp.name.includes('智感') ? 'zhongzhou-group.com' : 'company-tech.com'}`)
                            );

                            const isPhoneOverlapped = !isLowRisk && (
                              contactAssocs.some(
                                (ca) => ca.type.includes('电话') && ca.value === phoneVal && ca.involvedCompanies.some(ic => ic.companyName === comp.name)
                              ) || (section.riskLevel === 'high' && idx < 2)
                            );

                            const isAddrOverlapped = !isLowRisk && (
                              contactAssocs.some(
                                (ca) => ca.type.includes('地址') && ca.value === addrVal && ca.involvedCompanies.some(ic => ic.companyName === comp.name)
                              ) || (section.riskLevel === 'high' && idx < 3)
                            );

                            const isEmailOverlapped = !isLowRisk && (
                              contactAssocs.some(
                                (ca) => ca.type.includes('邮箱') && ca.value === emailVal && ca.involvedCompanies.some(ic => ic.companyName === comp.name)
                              ) || (section.riskLevel === 'high' && idx < 2 && emailVal.includes('zhongzhou'))
                            );

                            const overlapCount = (isPhoneOverlapped ? 1 : 0) + (isAddrOverlapped ? 1 : 0) + (isEmailOverlapped ? 1 : 0);

                            return (
                              <tr
                                key={comp.id}
                                className={`transition-colors ${
                                  overlapCount >= 2
                                    ? 'bg-rose-50/40 hover:bg-rose-50/70'
                                    : overlapCount === 1
                                    ? 'bg-amber-50/30 hover:bg-amber-50/60'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                <td className="p-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                                
                                <td className="p-3">
                                  <div className="font-extrabold text-slate-900 text-xs">
                                    {comp.name}
                                  </div>
                                </td>

                                <td className="p-3 font-mono">
                                  <span className={`font-bold select-all ${isPhoneOverlapped ? 'text-blue-700 underline decoration-blue-300' : 'text-slate-800'}`}>
                                    {phoneVal}
                                  </span>
                                </td>

                                <td className="p-3">
                                  <span className={`text-xs ${isAddrOverlapped ? 'font-bold text-amber-900 bg-amber-100/60 px-1.5 py-0.5 rounded border border-amber-200 select-all' : 'text-slate-700'}`}>
                                    {addrVal}
                                  </span>
                                </td>

                                <td className="p-3 font-mono text-xs">
                                  <span className={`select-all ${isEmailOverlapped ? 'font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200' : 'text-slate-700'}`}>
                                    {emailVal}
                                  </span>
                                </td>

                                <td className="p-3">
                                  {overlapCount >= 2 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                                      高风险 (三重合)
                                    </span>
                                  ) : overlapCount === 1 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                      <AlertCircle className="w-3 h-3 text-amber-600" />
                                      中风险 (单重合)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      正常未触重
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>标段：{section.sectionName}</div>
              <button
                onClick={() => setDetailPopup(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                关闭详情窗口
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
