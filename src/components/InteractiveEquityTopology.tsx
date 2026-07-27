import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Network,
  Search,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  Info,
  Building2,
  Users,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Zap,
  HelpCircle,
  Briefcase,
  GitCommit,
  UserX,
  FileCheck,
  MousePointer
} from 'lucide-react';
import { SectionItem } from '../types';

export type EquityFilterType =
  | 'all'
  | 'equity_group'
  | 'personnel_group'
  | 'direct'
  | 'indirect'
  | 'cross'
  | 'same_parent'
  | 'same_legal_person'
  | 'cross_executive'
  | 'close_relatives'
  | 'nominee_shareholder';

interface TopologyNode {
  id: string;
  name: string;
  type: 'ultimate' | 'spv' | 'person' | 'bidding_company';
  legalPerson?: string;
  registeredCapital?: string;
  shareRatio?: string;
  isHighRisk?: boolean;
  x: number;
  y: number;
  riskFlags?: string[];
}

interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  category: 'equity' | 'personnel';
  relationType:
    | 'direct'
    | 'indirect'
    | 'cross'
    | 'same_parent'
    | 'same_legal_person'
    | 'cross_executive'
    | 'close_relatives'
    | 'nominee_shareholder';
  label: string;
  detailText: string;
  holdingRatio?: string;
  riskLevel: 'high' | 'medium' | 'low';
}

interface InteractiveEquityTopologyProps {
  section: SectionItem;
}

export const InteractiveEquityTopology: React.FC<InteractiveEquityTopologyProps> = ({ section }) => {
  const [activeFilter, setActiveFilter] = useState<EquityFilterType>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLegendModal, setShowLegendModal] = useState(false);
  const [onlyShowProblemCompanies, setOnlyShowProblemCompanies] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Wheel zoom handler: allows zooming in/out using mouse scroll wheel inside graph canvas
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomStep = e.deltaY < 0 ? 0.08 : -0.08;
      setZoomLevel((prev) => {
        const next = Math.round((prev + zoomStep) * 100) / 100;
        return Math.min(Math.max(0.4, next), 2.2);
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Construct nodes and edges with wide, clean spacing
  const { nodes, edges, canvasWidth } = useMemo(() => {
    const isHigh = section.riskLevel === 'high';
    const isMedium = section.riskLevel === 'medium';
    const isLow = section.riskLevel === 'low';

    // 1. LOW RISK TOPOLOGY: Independently penetrate 1 layer up & 1 layer down for each bidding unit with NO inter-unit connections
    if (isLow) {
      const displayCompanies = section.companies;
      const compCount = Math.max(displayCompanies.length, 3);
      const startX = 220;
      const gapX = 380; // Generous horizontal spacing so each independent tree stands on its own column
      const calculatedWidth = Math.max(1080, startX * 2 + (compCount - 1) * gapX);

      const lowNodes: TopologyNode[] = [];
      const lowEdges: TopologyEdge[] = [];

      displayCompanies.forEach((comp, idx) => {
        const colX = startX + idx * gapX;

        // Up 1 Layer: Parent Shareholder / Controlling Entity
        const parentShareholderName = (comp.shareholders && comp.shareholders[0]?.name)
          ? comp.shareholders[0].name
          : (idx === 0 ? '大禹节水集团股份有限公司' : idx === 1 ? '绿洲装备产业控股发展有限公司' : '黑土地农业科技集团有限公司');
        const holdingRatio = (comp.shareholders && comp.shareholders[0]?.ratio) || (idx === 0 ? '60%' : idx === 1 ? '75%' : '68%');

        const topNodeId = `node-top-${comp.id}`;
        const topNode: TopologyNode = {
          id: topNodeId,
          name: parentShareholderName,
          type: 'ultimate',
          legalPerson: `控股股东 / 持股 ${holdingRatio}`,
          registeredCapital: '50000 万元人民币',
          shareRatio: `控股 ${holdingRatio}`,
          isHighRisk: false,
          x: colX,
          y: 75,
          riskFlags: ['主体独立', '合规持股']
        };

        // Middle Layer: Bidding Company
        const midNodeId = `node-${comp.id}`;
        const midNode: TopologyNode = {
          id: midNodeId,
          name: comp.name,
          type: 'bidding_company',
          legalPerson: comp.legalPerson || '法定代表人',
          registeredCapital: comp.registeredCapital || '10000 万元人民币',
          shareRatio: holdingRatio,
          isHighRisk: false,
          x: colX,
          y: 240,
          riskFlags: ['主体独立', '无关联风险']
        };

        // Down 1 Layer: Subsidiary Entity
        const subName = idx === 0 
          ? '大禹智能灌溉技术有限公司（全资子公司）'
          : idx === 1
          ? '绿洲装备制造（山东）有限公司（全资子公司）'
          : '黑土地灌溉工程技术有限公司（全资子公司）';

        const bottomNodeId = `node-bottom-${comp.id}`;
        const bottomNode: TopologyNode = {
          id: bottomNodeId,
          name: subName,
          type: 'spv',
          legalPerson: '核心全资子公司',
          registeredCapital: '2000 万元人民币',
          shareRatio: '全资持股 100%',
          isHighRisk: false,
          x: colX,
          y: 405,
          riskFlags: ['独立子公司', '规范运营']
        };

        lowNodes.push(topNode, midNode, bottomNode);

        // Edge 1: Top -> Mid (Up 1 layer connection)
        lowEdges.push({
          id: `edge-top-${comp.id}`,
          source: topNodeId,
          target: midNodeId,
          category: 'equity',
          relationType: 'direct',
          label: `直接控股 ${holdingRatio}`,
          holdingRatio,
          detailText: `【${topNode.name}】直接持有【${comp.name}】${holdingRatio} 股权，持股结构规范独立，与其他投标单位无交叉或关联。`,
          riskLevel: 'low'
        });

        // Edge 2: Mid -> Bottom (Down 1 layer connection)
        lowEdges.push({
          id: `edge-bottom-${comp.id}`,
          source: midNodeId,
          target: bottomNodeId,
          category: 'equity',
          relationType: 'direct',
          label: '全资持股 100%',
          holdingRatio: '100%',
          detailText: `【${comp.name}】全资持有【${bottomNode.name}】100% 股权，属于正常生产经营延伸，无异常关联划转。`,
          riskLevel: 'low'
        });
      });

      return { nodes: lowNodes, edges: lowEdges, canvasWidth: calculatedWidth };
    }

    // 2. HIGH OR MEDIUM RISK TOPOLOGY: Complex cross-shareholding & personnel risk graph
    // Filter companies: If onlyShowProblemCompanies is true, keep only units with riskFlags
    const targetCompanies = onlyShowProblemCompanies
      ? section.companies.filter((c) => c.riskFlags && c.riskFlags.length > 0)
      : section.companies;

    // Fallback if no companies have risk flags (prevent empty display)
    const displayCompanies = targetCompanies.length > 0 ? targetCompanies : section.companies;

    // Bidding company count drives canvas width
    const compCount = Math.max(displayCompanies.length, 3);
    const startX = 200;
    const gapX = 360; // Wide 360px center-to-center spacing prevents overlapping
    const calculatedWidth = Math.max(1080, startX * 2 + (compCount - 1) * gapX);

    // Center coordinates
    const centerX = calculatedWidth / 2;

    // 1. Ultimate Parent Node
    const parentNode: TopologyNode = {
      id: 'node-parent',
      name: section.companies[0]?.shareholders[0]?.name || '中洲科技集团有限公司',
      type: 'ultimate',
      legalPerson: '张建国 (实际控制人)',
      registeredCapital: '10000 万元人民币',
      isHighRisk: isHigh,
      x: centerX,
      y: 70,
      riskFlags: ['终极控制核心', '支配多家投标主体']
    };

    // 2. SPV Holding Entity Node
    const spvNode: TopologyNode = {
      id: 'node-spv',
      name: '中洲投资合伙企业（有限合伙）',
      type: 'spv',
      legalPerson: '张建国 / 执事务合伙人',
      registeredCapital: '3000 万元人民币',
      shareRatio: '穿透持股 33%',
      isHighRisk: isHigh || isMedium,
      x: centerX + 280,
      y: 200,
      riskFlags: ['多层穿透持股平台', '高管交叉任职']
    };

    // 3. Key Person / Executive Node
    const personNode: TopologyNode = {
      id: 'node-person',
      name: '张建国 (核心关联自然人)',
      type: 'person',
      legalPerson: '法定代表人 / 董事长',
      registeredCapital: '自然人股东',
      shareRatio: '关联控制者',
      isHighRisk: isHigh,
      x: centerX - 280,
      y: 200,
      riskFlags: ['法定代表人同一人', '近亲属协同操作']
    };

    // 4. Bidding Companies Nodes (Filtered & Generously Spaced)
    const biddingNodes: TopologyNode[] = displayCompanies.map((comp, idx) => {
      const x = startX + idx * gapX;
      const y = 390;

      return {
        id: `node-${comp.id}`,
        name: comp.name,
        type: 'bidding_company',
        legalPerson: comp.legalPerson,
        registeredCapital: comp.registeredCapital,
        shareRatio: comp.shareholders[0]?.ratio || '51%',
        isHighRisk: comp.riskFlags.length > 0,
        x,
        y,
        riskFlags: comp.riskFlags
      };
    });

    const allNodes: TopologyNode[] = [parentNode, spvNode, personNode, ...biddingNodes];

    // Build edges for both Equity and Personnel/Nominee relations
    const builtEdges: TopologyEdge[] = [];

    if (biddingNodes.length >= 1) {
      // 1. 股权：直接控股 (Direct Holding)
      builtEdges.push({
        id: 'edge-direct-1',
        source: parentNode.id,
        target: biddingNodes[0].id,
        category: 'equity',
        relationType: 'direct',
        label: '直接控股 65%',
        holdingRatio: '65%',
        detailText: `${parentNode.name} 直接持有 ${biddingNodes[0].name} 65% 股权，具备绝对表决权控制。`,
        riskLevel: 'high'
      });

      // 2. 人员：法定代表人/负责人为同一人
      builtEdges.push({
        id: 'edge-same-legal-1',
        source: personNode.id,
        target: biddingNodes[0].id,
        category: 'personnel',
        relationType: 'same_legal_person',
        label: '法定代表人为同一人',
        detailText: `【张建国】同时担任 ${parentNode.name} 与 ${biddingNodes[0].name} 法定代表人，决策主体重叠。`,
        riskLevel: 'high'
      });
    }

    if (biddingNodes.length >= 2) {
      // 3. 股权：同一个母公司控制 (Same Parent Company)
      builtEdges.push({
        id: 'edge-same-parent-1',
        source: parentNode.id,
        target: biddingNodes[1].id,
        category: 'equity',
        relationType: 'same_parent',
        label: '同一母公司控制 (51%)',
        holdingRatio: '51%',
        detailText: `${parentNode.name} 亦持有 ${biddingNodes[1].name} 51% 股权。${biddingNodes[0].name} 与 ${biddingNodes[1].name} 归属于同一母公司支配。`,
        riskLevel: 'high'
      });

      // 4. 人员：法定代表人/负责人为同一人 (Person -> Bidding Company 2)
      builtEdges.push({
        id: 'edge-same-legal-2',
        source: personNode.id,
        target: biddingNodes[1].id,
        category: 'personnel',
        relationType: 'same_legal_person',
        label: '兼任实际负责人',
        detailText: `【张建国】同时为 ${biddingNodes[1].name} 的实际控制负责人，构成多投标人同一法定代表人/负责人高危串标。`,
        riskLevel: 'high'
      });
    }

    if (biddingNodes.length >= 3) {
      // 5. 股权：间接控股 (Indirect Holding via SPV)
      builtEdges.push({
        id: 'edge-indirect-1',
        source: parentNode.id,
        target: spvNode.id,
        category: 'equity',
        relationType: 'indirect',
        label: '控股 SPV (80%)',
        holdingRatio: '80%',
        detailText: `${parentNode.name} 设立 ${spvNode.name} 作为穿透持股平台。`,
        riskLevel: 'medium'
      });

      builtEdges.push({
        id: 'edge-indirect-2',
        source: spvNode.id,
        target: biddingNodes[2].id,
        category: 'equity',
        relationType: 'indirect',
        label: '间接控股 (穿透 33%)',
        holdingRatio: '穿透 33%',
        detailText: `通过 ${spvNode.name} 穿透持股 ${biddingNodes[2].name} 33% 股份并派驻监事。`,
        riskLevel: 'high'
      });

      // 6. 股权：交叉持股 (Cross Shareholding)
      builtEdges.push({
        id: 'edge-cross-1',
        source: biddingNodes[0].id,
        target: biddingNodes[2].id,
        category: 'equity',
        relationType: 'cross',
        label: '交叉持股 15%',
        holdingRatio: '双向 15%',
        detailText: `${biddingNodes[0].name} 与 ${biddingNodes[2].name} 互为股东，交叉持股达 15%，资金池共享。`,
        riskLevel: 'high'
      });

      // 7. 人员：董监高交叉任职 (Cross Executive)
      builtEdges.push({
        id: 'edge-cross-exec-1',
        source: biddingNodes[1].id,
        target: biddingNodes[2].id,
        category: 'personnel',
        relationType: 'cross_executive',
        label: '董监高交叉任职',
        detailText: `${biddingNodes[1].name} 监事【陈伟】同时在 ${biddingNodes[2].name} 担任执行董事兼高级管理人员，参与双方业务决策。`,
        riskLevel: 'high'
      });

      // 8. 人员：近亲属关系 (Close Relatives)
      builtEdges.push({
        id: 'edge-relatives-1',
        source: biddingNodes[0].id,
        target: biddingNodes[1].id,
        category: 'personnel',
        relationType: 'close_relatives',
        label: '核心控制人近亲属',
        detailText: `${biddingNodes[0].name} 控股股东【张建国】与 ${biddingNodes[1].name} 法人【张建军】为亲兄弟关系，存在高度利益协同。`,
        riskLevel: 'high'
      });

      // 9. 人员/代持：股权代持 (Nominee Shareholding)
      builtEdges.push({
        id: 'edge-nominee-1',
        source: biddingNodes[2].id,
        target: parentNode.id,
        category: 'personnel',
        relationType: 'nominee_shareholder',
        label: '隐名股权代持 (40%)',
        holdingRatio: '代持 40%',
        detailText: `${biddingNodes[2].name} 名义股东【李梅】签署隐名代持协议，实际为 ${parentNode.name} 代持 40% 股权，隐蔽控制。`,
        riskLevel: 'high'
      });
    } else if (biddingNodes.length === 2) {
      // Fallback cross and personnel edge for 2 companies
      builtEdges.push({
        id: 'edge-cross-fallback',
        source: biddingNodes[0].id,
        target: biddingNodes[1].id,
        category: 'equity',
        relationType: 'cross',
        label: '交叉持股 10%',
        holdingRatio: '双向持股',
        detailText: `${biddingNodes[0].name} 与 ${biddingNodes[1].name} 存在交叉持股与流水划转痕迹。`,
        riskLevel: 'high'
      });

      builtEdges.push({
        id: 'edge-exec-fallback',
        source: biddingNodes[0].id,
        target: biddingNodes[1].id,
        category: 'personnel',
        relationType: 'cross_executive',
        label: '高管重叠任职',
        detailText: `两单位高管存在重叠任职情况。`,
        riskLevel: 'high'
      });
    }

    return { nodes: allNodes, edges: builtEdges, canvasWidth: calculatedWidth };
  }, [section, onlyShowProblemCompanies]);

  // Filter logic
  const filteredEdges = useMemo(() => {
    if (activeFilter === 'all') return edges;
    if (activeFilter === 'equity_group') return edges.filter((e) => e.category === 'equity');
    if (activeFilter === 'personnel_group') return edges.filter((e) => e.category === 'personnel');
    return edges.filter((e) => e.relationType === activeFilter);
  }, [edges, activeFilter]);

  // Search matching node IDs
  const searchMatchedNodeIds = useMemo(() => {
    if (!searchTerm.trim()) return new Set<string>();
    const term = searchTerm.toLowerCase();
    const matches = new Set<string>();
    nodes.forEach((n) => {
      if (
        n.name.toLowerCase().includes(term) ||
        (n.legalPerson && n.legalPerson.toLowerCase().includes(term))
      ) {
        matches.add(n.id);
      }
    });
    return matches;
  }, [nodes, searchTerm]);

  // Active detail object
  const activeEdgeDetail = useMemo(() => {
    const edgeId = selectedEdgeId || hoveredEdgeId;
    if (!edgeId) return null;
    return edges.find((e) => e.id === edgeId) || null;
  }, [selectedEdgeId, hoveredEdgeId, edges]);

  const activeNodeDetail = useMemo(() => {
    const nodeId = selectedNodeId || hoveredNodeId;
    if (!nodeId) return null;
    return nodes.find((n) => n.id === nodeId) || null;
  }, [selectedNodeId, hoveredNodeId, nodes]);

  // Style mapper for relation types
  const getRelationStyle = (type: TopologyEdge['relationType'], riskLevel?: string) => {
    if (riskLevel === 'low') {
      return {
        stroke: '#10b981', // Emerald
        labelBg: 'bg-emerald-600 text-white',
        badgeText: '合规持股关系',
        border: 'border-emerald-500',
        textColor: 'text-emerald-600',
        dashArray: 'none'
      };
    }

    switch (type) {
      // 股权关系
      case 'direct':
        return {
          stroke: '#ef4444', // Red
          labelBg: 'bg-red-500 text-white',
          badgeText: '直接控股',
          border: 'border-red-500',
          textColor: 'text-red-600',
          dashArray: 'none'
        };
      case 'indirect':
        return {
          stroke: '#f59e0b', // Amber
          labelBg: 'bg-amber-500 text-white',
          badgeText: '间接控股',
          border: 'border-amber-500',
          textColor: 'text-amber-600',
          dashArray: '6,4'
        };
      case 'cross':
        return {
          stroke: '#a855f7', // Purple
          labelBg: 'bg-purple-600 text-white',
          badgeText: '交叉持股',
          border: 'border-purple-600',
          textColor: 'text-purple-600',
          dashArray: '4,4'
        };
      case 'same_parent':
        return {
          stroke: '#0284c7', // Sky
          labelBg: 'bg-sky-600 text-white',
          badgeText: '同一个母公司控制',
          border: 'border-sky-600',
          textColor: 'text-sky-600',
          dashArray: 'none'
        };

      // 人员及代持关系
      case 'same_legal_person':
        return {
          stroke: '#e11d48', // Crimson/Rose
          labelBg: 'bg-rose-600 text-white',
          badgeText: '法定代表人/负责人为同一人',
          border: 'border-rose-600',
          textColor: 'text-rose-600',
          dashArray: 'none'
        };
      case 'cross_executive':
        return {
          stroke: '#6366f1', // Indigo
          labelBg: 'bg-indigo-600 text-white',
          badgeText: '董监高交叉任职',
          border: 'border-indigo-600',
          textColor: 'text-indigo-600',
          dashArray: '5,3'
        };
      case 'close_relatives':
        return {
          stroke: '#d946ef', // Fuchsia
          labelBg: 'bg-fuchsia-600 text-white',
          badgeText: '近亲属关系',
          border: 'border-fuchsia-600',
          textColor: 'text-fuchsia-600',
          dashArray: 'none'
        };
      case 'nominee_shareholder':
        return {
          stroke: '#14b8a6', // Teal
          labelBg: 'bg-teal-600 text-white',
          badgeText: '股权代持',
          border: 'border-teal-600',
          textColor: 'text-teal-600',
          dashArray: '6,3'
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col space-y-0">
      
      {/* 1. Top Bar & Title - Clean Light Tone Design */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-blue-50/60 to-slate-50 text-slate-900 border-b border-slate-200/80 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 border border-blue-200 text-blue-600 shadow-2xs">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                交互式股权与人员穿透拓扑图
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setOnlyShowProblemCompanies(!onlyShowProblemCompanies)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs ${
                onlyShowProblemCompanies
                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200/80 ring-1 ring-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={onlyShowProblemCompanies ? '已隐藏无问题独立单位，点击查看全部投标单位' : '点击隐藏无问题的独立单位'}
            >
              <ShieldAlert className={`w-3.5 h-3.5 ${onlyShowProblemCompanies ? 'text-amber-600' : 'text-slate-500'}`} />
              <span>{onlyShowProblemCompanies ? '只展示涉险/问题单位' : `显示全部单位 (${section.companies.length})`}</span>
            </button>

            <button
              onClick={() => {
                setZoomLevel(1);
                setActiveFilter('all');
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
                setSearchTerm('');
              }}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer transition-colors shadow-2xs"
              title="重置视图"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(Math.round((z - 0.1) * 100) / 100, 0.4))}
                className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                title="缩小"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-slate-800 font-bold min-w-[42px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(Math.round((z + 0.1) * 100) / 100, 2.2))}
                className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                title="放大"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Structured Filter Categories Bar (Equity vs Personnel) */}
        <div className="space-y-2 pt-2.5 border-t border-slate-200/80">
          {/* Equity Section Filters */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-blue-700 font-bold mr-1 flex items-center gap-1 min-w-[76px]">
              <Building2 className="w-3.5 h-3.5" />
              股权关系：
            </span>

            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              全部图谱关系 ({edges.length})
            </button>

            <button
              onClick={() => setActiveFilter('direct')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'direct'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-red-50/80 text-red-700 hover:bg-red-100 border border-red-200/80'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              直接控股 ({edges.filter((e) => e.relationType === 'direct').length})
            </button>

            <button
              onClick={() => setActiveFilter('indirect')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'indirect'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50/80 text-amber-800 hover:bg-amber-100 border border-amber-200/80'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              间接控股 ({edges.filter((e) => e.relationType === 'indirect').length})
            </button>

            <button
              onClick={() => setActiveFilter('cross')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'cross'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-purple-50/80 text-purple-700 hover:bg-purple-100 border border-purple-200/80'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              交叉持股 ({edges.filter((e) => e.relationType === 'cross').length})
            </button>

            <button
              onClick={() => setActiveFilter('same_parent')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'same_parent'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-sky-50/80 text-sky-800 hover:bg-sky-100 border border-sky-200/80'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              同一个母公司控制 ({edges.filter((e) => e.relationType === 'same_parent').length})
            </button>
          </div>

          {/* Personnel & Nominee Section Filters */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-purple-700 font-bold mr-1 flex items-center gap-1 min-w-[76px]">
                <Users className="w-3.5 h-3.5" />
                人员及代持：
              </span>

              <button
                onClick={() => setActiveFilter('same_legal_person')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'same_legal_person'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50/80 text-rose-700 hover:bg-rose-100 border border-rose-200/80'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                法定代表人/负责人同一人 ({edges.filter((e) => e.relationType === 'same_legal_person').length})
              </button>

              <button
                onClick={() => setActiveFilter('cross_executive')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'cross_executive'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                董监高交叉任职 ({edges.filter((e) => e.relationType === 'cross_executive').length})
              </button>

              <button
                onClick={() => setActiveFilter('close_relatives')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'close_relatives'
                    ? 'bg-fuchsia-600 text-white shadow-2xs'
                    : 'bg-fuchsia-50/80 text-fuchsia-700 hover:bg-fuchsia-100 border border-fuchsia-200/80'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span>
                近亲属关系 ({edges.filter((e) => e.relationType === 'close_relatives').length})
              </button>

              <button
                onClick={() => setActiveFilter('nominee_shareholder')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'nominee_shareholder'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-teal-50/80 text-teal-800 hover:bg-teal-100 border border-teal-200/80'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                股权代持 ({edges.filter((e) => e.relationType === 'nominee_shareholder').length})
              </button>
            </div>

            {/* Quick Search Box */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索单位名称 / 控制人..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Legend Modal Popup */}
      {showLegendModal && (
        <div className="bg-slate-50 border-b border-slate-200 p-4 text-xs text-slate-700 animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-red-200 shadow-2xs">
            <div className="font-bold text-red-700 flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-1 bg-red-500 rounded"></span>
              1. 直接控股
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              母公司直接出资并持有子公司超过 50% 股权或拥有绝对表决权。
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-2xs">
            <div className="font-bold text-amber-700 flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-1 bg-amber-500 rounded border-dashed border-t"></span>
              2. 间接控股
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              通过中间持股平台 (SPV) / 合伙企业进行多层穿透控制。
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-purple-200 shadow-2xs">
            <div className="font-bold text-purple-700 flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-1 bg-purple-500 rounded"></span>
              3. 交叉持股
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              投标人之间互相持有股份，资本结构闭环并伴有资金划转。
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-sky-200 shadow-2xs">
            <div className="font-bold text-sky-700 flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-1 bg-sky-500 rounded"></span>
              4. 同一个母公司控制
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              多家投标单位归属于同一母公司支配，属于禁止同标段投标情形。
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-rose-200 shadow-2xs">
            <div className="font-bold text-rose-700 flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-1 bg-rose-500 rounded"></span>
              5. 法定代表人/负责人同一人
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              不同参评投标单位的法定代表人或项目负责人由同一自然人担任。
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-indigo-200 shadow-2xs">
            <div className="font-bold text-indigo-700 flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-1 bg-indigo-500 rounded border-dashed border-t"></span>
              6. 董监高交叉任职
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              董事、监事或高级管理人员在不同投标单位中兼任职务。
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-fuchsia-200 shadow-2xs">
            <div className="font-bold text-fuchsia-700 flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-1 bg-fuchsia-500 rounded"></span>
              7. 近亲属关系
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              投标单位的核心控制人、法定代表人之间存在夫妻、直系血亲或三代以内旁系血亲关系。
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-teal-200 shadow-2xs">
            <div className="font-bold text-teal-700 flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-1 bg-teal-500 rounded border-dashed border-t"></span>
              8. 股权代持
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              显名股东替隐名实际控制人持有股权，避开监管名义限制。
            </p>
          </div>
        </div>
      )}

      {/* 3. Light Blue Canvas with Mouse Wheel Zooming */}
      <div
        ref={canvasRef}
        className="relative bg-gradient-to-br from-[#ebf4ff] via-[#f0f7ff] to-[#e4f0fe] border-y border-blue-200/80 min-h-[520px] overflow-x-auto overflow-y-hidden p-6 flex justify-center items-center select-none"
        title="可在拓扑图区域内滑动鼠标滚轮进行放大或缩小"
      >
        {/* Background Grid Pattern - Light Blue Blueprint Dots */}
        <div className="absolute inset-0 bg-[radial-gradient(#93c5fd_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-80"></div>

        {/* Scalable Container with explicit calculated minimum width */}
        <div
          className="relative h-[480px] transition-transform duration-200 ease-out"
          style={{
            width: `${canvasWidth}px`,
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center top'
          }}
        >
          {/* SVG Connection Lines Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            <defs>
              <marker id="arrow-direct" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
              <marker id="arrow-indirect" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
              <marker id="arrow-cross" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
              </marker>
              <marker id="arrow-same-parent" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
              </marker>
              <marker id="arrow-same-legal" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48" />
              </marker>
              <marker id="arrow-cross-exec" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
              </marker>
              <marker id="arrow-relatives" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#d946ef" />
              </marker>
              <marker id="arrow-nominee" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#14b8a6" />
              </marker>
            </defs>

            {/* Render Connecting Lines */}
            {filteredEdges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const style = getRelationStyle(edge.relationType, edge.riskLevel);
              const isEdgeActive =
                selectedEdgeId === edge.id ||
                hoveredEdgeId === edge.id ||
                selectedNodeId === edge.source ||
                selectedNodeId === edge.target;

              // Calculate curve and midpoints
              const isCurved =
                edge.relationType === 'cross' ||
                edge.relationType === 'cross_executive' ||
                edge.relationType === 'close_relatives' ||
                edge.relationType === 'nominee_shareholder';

              const midX = (sourceNode.x + targetNode.x) / 2;
              const curveOffset = isCurved ? (sourceNode.y === targetNode.y ? -55 : 45) : 0;
              const midY = (sourceNode.y + targetNode.y) / 2 + curveOffset;

              const pathD = isCurved
                ? `M ${sourceNode.x} ${sourceNode.y} Q ${midX} ${midY} ${targetNode.x} ${targetNode.y}`
                : `M ${sourceNode.x} ${sourceNode.y} L ${targetNode.x} ${targetNode.y}`;

              // Get marker id mapped by relation type
              let markerType = 'arrow-direct';
              if (edge.relationType === 'indirect') markerType = 'arrow-indirect';
              else if (edge.relationType === 'cross') markerType = 'arrow-cross';
              else if (edge.relationType === 'same_parent') markerType = 'arrow-same-parent';
              else if (edge.relationType === 'same_legal_person') markerType = 'arrow-same-legal';
              else if (edge.relationType === 'cross_executive') markerType = 'arrow-cross-exec';
              else if (edge.relationType === 'close_relatives') markerType = 'arrow-relatives';
              else if (edge.relationType === 'nominee_shareholder') markerType = 'arrow-nominee';

              return (
                <g key={edge.id} className="pointer-events-auto cursor-pointer">
                  {/* Invisible Hitbox */}
                  <path
                    d={pathD}
                    stroke="transparent"
                    strokeWidth="20"
                    fill="none"
                    onMouseEnter={() => setHoveredEdgeId(edge.id)}
                    onMouseLeave={() => setHoveredEdgeId(null)}
                    onClick={() => {
                      setSelectedEdgeId(edge.id === selectedEdgeId ? null : edge.id);
                      setSelectedNodeId(null);
                    }}
                  />

                  {/* Active Highlight Glow */}
                  {isEdgeActive && (
                    <path
                      d={pathD}
                      stroke={style.stroke}
                      strokeWidth="9"
                      strokeOpacity="0.35"
                      fill="none"
                      className="animate-pulse"
                    />
                  )}

                  {/* Main Line */}
                  <path
                    d={pathD}
                    stroke={style.stroke}
                    strokeWidth={isEdgeActive ? '3.5' : '2.5'}
                    strokeDasharray={style.dashArray}
                    fill="none"
                    markerEnd={`url(#${markerType})`}
                    className="transition-all duration-200"
                  />

                  {/* Line Floating Label */}
                  <foreignObject
                    x={midX - 70}
                    y={midY - 14}
                    width="140"
                    height="28"
                    className="overflow-visible pointer-events-auto"
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEdgeId(edge.id === selectedEdgeId ? null : edge.id);
                        setSelectedNodeId(null);
                      }}
                      onMouseEnter={() => setHoveredEdgeId(edge.id)}
                      onMouseLeave={() => setHoveredEdgeId(null)}
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full text-center shadow-md cursor-pointer transition-transform hover:scale-110 whitespace-nowrap border border-white/20 truncate ${
                        style.labelBg
                      } ${isEdgeActive ? 'ring-2 ring-white scale-105' : 'opacity-90'}`}
                      title={edge.label}
                    >
                      {edge.label}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          {/* Render Nodes (HTML Absolute Positioning) */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isSearchMatched = searchMatchedNodeIds.has(node.id);

            const isParent = node.type === 'ultimate';
            const isSPV = node.type === 'spv';
            const isPerson = node.type === 'person';

            return (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
                  setSelectedEdgeId(null);
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                className={`absolute z-20 cursor-pointer transition-all duration-200 select-none ${
                  isSelected
                    ? 'scale-110 ring-4 ring-blue-400 shadow-2xl'
                    : isHovered
                    ? 'scale-105 ring-2 ring-blue-300 shadow-xl'
                    : isSearchMatched
                    ? 'ring-4 ring-amber-400 animate-bounce'
                    : ''
                }`}
              >
                {/* Node Box Designs - Light Tone Palette */}
                {isParent ? (
                  <div className="bg-gradient-to-b from-white via-blue-50/90 to-blue-100/90 text-slate-900 p-3.5 rounded-2xl border-2 border-blue-500 shadow-lg w-60 text-center">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-blue-800 bg-blue-100/90 border border-blue-300 px-2.5 py-0.5 rounded-full inline-flex items-center justify-center gap-1 mb-1 shadow-2xs">
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                      终极实际控制人 / 集团
                    </div>
                    <div className="text-xs font-extrabold text-blue-950 truncate" title={node.name}>
                      {node.name}
                    </div>
                    <div className="text-[10px] text-blue-700 mt-1 font-semibold truncate">
                      {node.legalPerson}
                    </div>
                  </div>
                ) : isSPV ? (
                  <div className="bg-gradient-to-b from-white via-amber-50/90 to-amber-100/90 text-slate-900 p-3 rounded-2xl border-2 border-amber-400 shadow-md w-56 text-center">
                    <div className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full inline-flex items-center justify-center gap-1 mb-1 shadow-2xs">
                      <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                      持股平台 / 合伙企业
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 truncate" title={node.name}>
                      {node.name}
                    </div>
                    <div className="text-[10px] text-amber-800 font-semibold mt-0.5">{node.shareRatio}</div>
                  </div>
                ) : isPerson ? (
                  <div className="bg-gradient-to-b from-white via-purple-50/90 to-purple-100/90 text-slate-900 p-3 rounded-2xl border-2 border-purple-400 shadow-md w-56 text-center">
                    <div className="text-[10px] font-bold text-purple-900 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-full inline-flex items-center justify-center gap-1 mb-1 shadow-2xs">
                      <UserCheck className="w-3 h-3 text-purple-600" />
                      核心关联自然人
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 truncate" title={node.name}>
                      {node.name}
                    </div>
                    <div className="text-[10px] text-purple-800 font-semibold mt-0.5">{node.legalPerson}</div>
                  </div>
                ) : (
                  <div
                    className={`p-3.5 rounded-2xl border-2 w-60 shadow-md transition-colors ${
                      node.isHighRisk
                        ? 'bg-gradient-to-b from-white via-rose-50/90 to-red-100/80 border-red-500 text-slate-900'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        参评投标单位
                      </span>
                      {node.isHighRisk ? (
                        <span className="text-[9px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-300 flex items-center gap-1 shadow-2xs">
                          <ShieldAlert className="w-2.5 h-2.5 text-red-600" />
                          风险预警
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                          主体独立
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 truncate" title={node.name}>
                      {node.name}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1.5 flex items-center justify-between border-t border-slate-200/80 pt-1.5">
                      <span className="truncate mr-1 font-medium">法人: {node.legalPerson}</span>
                      <span className="text-blue-700 font-extrabold shrink-0 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/80">{node.shareRatio}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Detail Panel */}
      <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5">
        {activeEdgeDetail ? (
          <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-2xs space-y-2 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getRelationStyle(activeEdgeDetail.relationType, activeEdgeDetail.riskLevel).labelBg}`}>
                  {getRelationStyle(activeEdgeDetail.relationType, activeEdgeDetail.riskLevel).badgeText}
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  {activeEdgeDetail.label} 穿透详情
                </h4>
              </div>
              <span className="text-xs text-slate-400">点击关系线条切换细化分析</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed pt-1">
              {activeEdgeDetail.detailText}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
              <span>关系类别: <strong className="text-slate-800 font-bold">{activeEdgeDetail.category === 'equity' ? '股权控制关系' : '人员/代持关联'}</strong></span>
              <span>风险等级: <strong className="text-red-600 font-bold">{activeEdgeDetail.riskLevel === 'high' ? '高风险 (涉及围标串标)' : '中风险'}</strong></span>
              {activeEdgeDetail.holdingRatio && (
                <span>表决/代持比例: <strong className="text-slate-800 font-bold">{activeEdgeDetail.holdingRatio}</strong></span>
              )}
            </div>
          </div>
        ) : activeNodeDetail ? (
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">{activeNodeDetail.name}</h4>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  {activeNodeDetail.type === 'ultimate'
                    ? '终极控制人'
                    : activeNodeDetail.type === 'spv'
                    ? '持股平台'
                    : activeNodeDetail.type === 'person'
                    ? '核心自然人'
                    : '投标主体'}
                </span>
              </div>
              <span className="text-xs text-slate-400">点击其他节点或线条可联动分析</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400">法定代表人/负责人: </span>
                <strong className="text-slate-800">{activeNodeDetail.legalPerson || '未登记'}</strong>
              </div>
              <div>
                <span className="text-slate-400">注册资本: </span>
                <strong className="text-slate-800">{activeNodeDetail.registeredCapital || '未知'}</strong>
              </div>
              <div>
                <span className="text-slate-400">已知穿透/关联占比: </span>
                <strong className="text-blue-600 font-bold">{activeNodeDetail.shareRatio || '主体独立'}</strong>
              </div>
            </div>

            {activeNodeDetail.riskFlags && activeNodeDetail.riskFlags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs font-bold text-slate-500 mr-1">识别风险特征:</span>
                {activeNodeDetail.riskFlags.map((flag, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 text-xs font-medium">
                    ⚠️ {flag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-slate-500 flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span>提示：您可以点击顶部筛选切换【股权关系】与【人员及代持关系】，或在拓扑图谱中交互点击查看不同单位之间的关联详情。</span>
          </div>
        )}
      </div>

    </div>
  );
};

