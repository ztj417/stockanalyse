import React from 'react';
import { SectionItem } from '../types';

interface MetricCardsProps {
  sections: SectionItem[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ sections }) => {
  const totalSections = sections.length;
  const highRiskCount = sections.filter((s) => s.riskLevel === 'high').length;
  const mediumRiskCount = sections.filter((s) => s.riskLevel === 'medium').length;
  const totalCompanies = sections.reduce((acc, s) => acc + s.companyCount, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
      {/* Card 1: 监管标段总数 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-sm transition-shadow">
        <div className="text-sm font-semibold text-slate-500 mb-3">
          监管标段总数
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">
            {totalSections}
          </span>
          <span className="text-sm text-slate-400 font-medium flex items-center gap-0.5">
            个
            <span className="text-slate-400 text-xs">↑</span>
          </span>
        </div>
      </div>

      {/* Card 2: 高风险警示标段 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-sm transition-shadow">
        <div className="text-sm font-semibold text-red-500 mb-3">
          高风险警示标段
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-bold text-red-600 tracking-tight">
            {highRiskCount}
          </span>
          <span className="text-sm text-slate-400 font-medium">
            组
          </span>
        </div>
      </div>

      {/* Card 3: 中风险监控标段 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-sm transition-shadow">
        <div className="text-sm font-semibold text-amber-500 mb-3">
          中风险监控标段
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-bold text-amber-500 tracking-tight">
            {mediumRiskCount}
          </span>
          <span className="text-sm text-slate-400 font-medium">
            组
          </span>
        </div>
      </div>

      {/* Card 4: 参评单位总数 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-sm transition-shadow">
        <div className="text-sm font-semibold text-slate-500 mb-3">
          参评单位总数
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">
            {totalCompanies}
          </span>
          <span className="text-sm text-slate-400 font-medium">
            家
          </span>
        </div>
      </div>
    </div>
  );
};
