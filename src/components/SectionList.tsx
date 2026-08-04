import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionItem, RiskLevel } from '../types';

interface SectionListProps {
  sections: SectionItem[];
  onSelectSection: (section: SectionItem) => void;
}

export const SectionList: React.FC<SectionListProps> = ({
  sections,
  onSelectSection,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | RiskLevel>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Filter sections based on risk filter & search
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchRisk =
        selectedRiskFilter === 'all' || sec.riskLevel === selectedRiskFilter;
      const matchSearch =
        sec.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sec.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchRisk && matchSearch;
    });
  }, [sections, selectedRiskFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredSections.length / pageSize));
  const pageSections = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSections.slice(start, start + pageSize);
  }, [filteredSections, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6 transition-all">
      {/* Top Header Controls: Title, Search, Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        {/* Left Side: Title & Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          <h2 className="text-lg font-bold text-slate-800 shrink-0">
            标段分析列表
          </h2>

          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="搜索标段编号、标段名称..."
              className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Right Side: Risk Filter Pills */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-slate-500">筛选风险:</span>
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => {
                setSelectedRiskFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer ${
                selectedRiskFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => {
                setSelectedRiskFilter('high');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer ${
                selectedRiskFilter === 'high'
                  ? 'bg-white text-red-600 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-red-600'
              }`}
            >
              高风险
            </button>
            <button
              onClick={() => {
                setSelectedRiskFilter('medium');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer ${
                selectedRiskFilter === 'medium'
                  ? 'bg-white text-amber-600 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-amber-600'
              }`}
            >
              中风险
            </button>
            <button
              onClick={() => {
                setSelectedRiskFilter('low');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer ${
                selectedRiskFilter === 'low'
                  ? 'bg-white text-emerald-600 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              低风险
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto -mx-5 sm:-mx-6">
        <table className="w-full text-left border-collapse min-w-[920px]">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-5 sm:px-6 w-[140px]">标段编号</th>
              <th className="py-3.5 px-4 min-w-[220px]">标段名称</th>
              <th className="py-3.5 px-4 min-w-[240px]">风险情况</th>
              <th className="py-3.5 px-4 w-[120px]">投标单位家数</th>
              <th className="py-3.5 px-4 w-[110px]">综合风险分</th>
              <th className="py-3.5 px-4 w-[110px]">风险状态</th>
              <th className="py-3.5 px-5 sm:px-6 text-right w-[140px]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-sm">
            {pageSections.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  未匹配到相关标段数据
                </td>
              </tr>
            ) : (
              pageSections.map((sec) => {
                const riskTypes = sec.mainRiskTypes || [];

                return (
                  <tr
                    key={sec.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Code */}
                    <td className="py-4 px-5 sm:px-6 text-slate-400 font-mono text-xs sm:text-sm font-medium whitespace-nowrap">
                      {sec.code}
                    </td>

                    {/* Name */}
                    <td className="py-4 px-4 font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {sec.name}
                    </td>

                    {/* Risk Types / Situation */}
                    <td className="py-4 px-4">
                      {riskTypes.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {riskTypes.map((rt, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100/90 text-slate-700 border border-slate-200/60"
                            >
                              {rt}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    {/* Company count pill */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                        {sec.companyCount} 家
                      </span>
                    </td>

                    {/* Risk Score */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-700 font-medium">
                      <span className="font-semibold text-slate-800">{sec.riskScore}</span> 分
                    </td>

                    {/* Risk Level Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {sec.riskLevel === 'high' && (
                        <span className="inline-flex items-center gap-1.5 font-bold text-red-600 text-sm">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          高风险
                        </span>
                      )}
                      {sec.riskLevel === 'medium' && (
                        <span className="inline-flex items-center gap-1.5 font-bold text-amber-500 text-sm">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          中风险
                        </span>
                      )}
                      {sec.riskLevel === 'low' && (
                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 text-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          低风险
                        </span>
                      )}
                    </td>

                    {/* Action Link */}
                    <td className="py-4 px-5 sm:px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectSection(sec)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer group/btn"
                      >
                        查看股权分析
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-500">
        <div>
          显示 1 到 {filteredSections.length} / 共 {sections.length} 条记录
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
