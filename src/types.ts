export type RiskLevel = 'high' | 'medium' | 'low';

export interface BiddingCompany {
  id: string;
  name: string;
  legalPerson: string;
  registeredCapital: string;
  shareholders: { name: string; ratio: string; isCommon: boolean }[];
  ipAddress?: string;
  macAddress?: string;
  phone?: string;
  address?: string;
  email?: string;
  contactPerson?: string;
  riskFlags: string[];
}

export interface EquityRelation {
  sourceCompany: string;
  targetCompany: string;
  relationType: '实际控制人相同' | '高管交叉重叠' | '股东交叉持股' | '同IP/MAC地址' | '历史资金关联';
  description: string;
  riskDegree: '高' | '中' | '低';
}

export interface CompanyRiskGroup {
  id: string;
  groupName: string;
  riskLevel: RiskLevel;
  companies: string[];
  equityIssues: string[];
  keyEvidence: string;
}

export interface EquityIssueItem {
  id: string;
  issueType: string;
  riskLevel: RiskLevel;
  companies: string[];
  relationPath: string;
  evidenceSummary: string;
}

export interface EquityConclusion {
  issueCategoriesCount: number;
  problematicCompanyCount: number;
  highRiskGroupCount: number;
  coreRisks: string[];
  disposalAdvice: string;
  summaryText: string;
}

// 1. 联系方式关联维度（电话、邮箱、地址）
export interface ContactAssociationItem {
  id: string;
  type: '电话重合' | '邮箱重合' | '注册/办公地址重合' | '联系人重合';
  value: string;
  riskDegree: '高' | '中' | '低';
  involvedCompanies: {
    companyName: string;
    role: string;
    contactPerson?: string;
  }[];
  description: string;
  source: string;
}

// 2. 历史投标关联维度
export interface HistoricalBiddingAssociationItem {
  id: string;
  companyPair: [string, string];
  coBidCount: number;
  timeSpan: string;
  winLossDistribution: string;
  priceGapAvg: string;
  riskDegree: '高' | '中' | '低';
  recentProjects: {
    projectName: string;
    bidDate: string;
    winner: string;
    priceGap: string;
  }[];
  patternSummary: string;
}

// 3. 陪标单位专项排查
export interface AccompanyingBidderItem {
  id: string;
  companyName: string;
  legalPerson: string;
  targetBeneficiaryCompany: string;
  riskScore: number;
  screeningStatus: '高度疑似陪标单位' | '需进一步澄清' | '排查正常';
  collusionIndicators: {
    indicatorName: string;
    matchedDetail: string;
    isTriggered: boolean;
    riskDegree: '高' | '中' | '低';
  }[];
  overallAuditOpinion: string;
}

export interface SectionItem {
  id: string;
  code: string;
  name: string;
  companyCount: number;
  riskScore: number;
  riskLevel: RiskLevel;
  budgetAmount?: string;
  bidDate?: string;
  riskSummary?: string;
  conclusionData?: EquityConclusion;
  companyRiskGroups?: CompanyRiskGroup[];
  equityIssueList?: EquityIssueItem[];
  contactAssociations?: ContactAssociationItem[];
  historicalBiddingAssociations?: HistoricalBiddingAssociationItem[];
  accompanyingBidders?: AccompanyingBidderItem[];
  companies: BiddingCompany[];
  equityRelations: EquityRelation[];
  suspiciousFactors: { title: string; desc: string; severity: 'high' | 'medium' | 'low' }[];
  mainRiskTypes?: string[];
  riskCount?: number;
}
