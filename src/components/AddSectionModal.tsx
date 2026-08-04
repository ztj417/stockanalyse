import React, { useState } from 'react';
import { X, Plus, ShieldAlert } from 'lucide-react';
import { SectionItem, RiskLevel } from '../types';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newSec: SectionItem) => void;
}

export const AddSectionModal: React.FC<AddSectionModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [code, setCode] = useState('BD-2026-006');
  const [name, setName] = useState('');
  const [companyCount, setCompanyCount] = useState(3);
  const [riskScore, setRiskScore] = useState(65);
  const [budgetAmount, setBudgetAmount] = useState('500.00 万元');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let riskLevel: RiskLevel = 'low';
    if (riskScore >= 70) riskLevel = 'high';
    else if (riskScore >= 45) riskLevel = 'medium';

    const newSec: SectionItem = {
      id: `sec-${Date.now()}`,
      code: code.trim() || `BD-2026-0${Math.floor(Math.random() * 90 + 10)}`,
      name: name.trim(),
      companyCount: Number(companyCount) || 3,
      riskScore: Number(riskScore) || 50,
      riskLevel,
      budgetAmount,
      bidDate: new Date().toISOString().split('T')[0],
      mainRiskTypes: riskScore >= 70 ? ['股权关系异常', '人员关系异常', '主体联系异常'] : riskScore >= 45 ? ['主体联系异常'] : [],
      riskSummary: riskScore >= 70 ? '新增监测标段风险较集中，需要进一步穿透分析' : '常规新建标段，暂未发现高度关联异常',
      companies: [
        {
          id: `c-new-1`,
          name: `${name.substring(0, 4)}第一工程有限公司`,
          legalPerson: '刘建超',
          registeredCapital: '2000 万人民币',
          shareholders: [{ name: '建超投资', ratio: '80%', isCommon: false }],
          riskFlags: riskScore >= 70 ? ['近一年多次同场参与竞标'] : []
        },
        {
          id: `c-new-2`,
          name: `${name.substring(0, 4)}第二科技集成有限公司`,
          legalPerson: '张大勇',
          registeredCapital: '3000 万人民币',
          shareholders: [{ name: '大勇科技', ratio: '70%', isCommon: false }],
          riskFlags: []
        },
        {
          id: `c-new-3`,
          name: `${name.substring(0, 4)}第三网络建设有限公司`,
          legalPerson: '赵一鸣',
          registeredCapital: '1500 万人民币',
          shareholders: [{ name: '一鸣网络', ratio: '90%', isCommon: false }],
          riskFlags: []
        }
      ],
      equityRelations: [],
      suspiciousFactors: []
    };

    onAdd(newSec);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">新增标段分析节点</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              标段编号
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              标段名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入标段采购名称"
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                投标单位家数
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={companyCount}
                onChange={(e) => setCompanyCount(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                预判综合风险分 (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={riskScore}
                onChange={(e) => setRiskScore(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              招标预算金额
            </label>
            <input
              type="text"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-xs cursor-pointer"
            >
              确认添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
