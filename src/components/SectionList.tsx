import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionItem, RiskLevel } from '../types';

interface SectionListProps {
  sections: SectionItem[];
  onSelectSection: (section: SectionItem) => void;
}

export const SectionList: React.FC<SectionListProps> = ({
  sections,
  onSelectSection,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | RiskLevel | 'normal'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setCurrentPage(1);
  };

  // Filter sections based on risk filter & search
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      let matchRisk = true;
      if (selectedRiskFilter === 'normal') {
        matchRisk = sec.riskLevel === 'low' && (sec.riskCount === 0 || !sec.riskCount);
      } else if (selectedRiskFilter !== 'all') {
        matchRisk = sec.riskLevel === selectedRiskFilter;
      }

      const query = appliedSearch.trim().toLowerCase();
      const matchSearch =
        !query ||
        sec.code.toLowerCase().includes(query) ||
        sec.name.toLowerCase().includes(query);

      return matchRisk && matchSearch;
    });
  }, [sections, selectedRiskFilter, appliedSearch]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredSections.length / pageSize));
  const pageSections = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSections.slice(start, start + pageSize);
  }, [filteredSections, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Section Name Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <label className="text-sm font-medium text-slate-600 shrink-0">
              标段名称:
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setAppliedSearch(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="请输入标段或编号名称..."
              className="block w-full px-3.5 py-1.5 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Risk Status Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-sm font-medium text-slate-600 shrink-0">
              风险状态:
            </label>
            <select
              value={selectedRiskFilter}
              onChange={(e) => {
                setSelectedRiskFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer min-w-[120px]"
            >
              <option value="all">全部风险</option>
              <option value="high">高风险</option>
              <option value="medium">中风险</option>
              <option value="low">低风险</option>
              <option value="normal">正常</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            搜索
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-sm font-semibold text-slate-600">
                <th className="py-3.5 px-4 w-[60px] text-center">序</th>
                <th className="py-3.5 px-4 w-[180px]">标段编号</th>
                <th className="py-3.5 px-4 min-w-[280px]">标段名称</th>
                <th className="py-3.5 px-4 w-[120px] text-center">投标单位家数</th>
                <th className="py-3.5 px-4 w-[110px] text-center">问题数量</th>
                <th className="py-3.5 px-4 w-[120px] text-center">风险状态</th>
                <th className="py-3.5 px-4 w-[80px] text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pageSections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    未匹配到相关标段数据
                  </td>
                </tr>
              ) : (
                pageSections.map((sec, index) => {
                  const seqNum = (currentPage - 1) * pageSize + index + 1;
                  const count =
                    sec.riskCount ??
                    (sec.mainRiskTypes?.length ||
                      sec.suspiciousFactors?.length ||
                      (sec.riskLevel === 'high' ? 3 : sec.riskLevel === 'medium' ? 1 : 0));

                  return (
                    <tr
                      key={sec.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Index */}
                      <td className="py-4 px-4 text-center text-slate-400 text-sm">
                        {seqNum}
                      </td>

                      {/* Code */}
                      <td className="py-4 px-4 text-slate-600 font-mono text-sm whitespace-nowrap">
                        {sec.code}
                      </td>

                      {/* Name */}
                      <td className="py-4 px-4 font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                        {sec.name}
                      </td>

                      {/* Company count */}
                      <td className="py-4 px-4 text-center text-slate-700 font-semibold whitespace-nowrap">
                        {sec.companyCount}
                      </td>

                      {/* Problem / Risk Count */}
                      <td className="py-4 px-4 text-center text-slate-700 font-semibold whitespace-nowrap">
                        {count}
                      </td>

                      {/* Risk Level Badge */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {sec.riskLevel === 'high' && (
                          <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                            高风险
                          </span>
                        )}
                        {sec.riskLevel === 'medium' && (
                          <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                            中风险
                          </span>
                        )}
                        {sec.riskLevel === 'low' && count > 0 && (
                          <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                            低风险
                          </span>
                        )}
                        {(sec.riskLevel === 'low' && count === 0) && (
                          <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                            正常
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onSelectSection(sec)}
                          title="查看详情"
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <Search className="w-4 h-4" />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-slate-100 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <span>共 {filteredSections.length} 条</span>
            <span className="text-slate-400">10条/页</span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded text-xs font-medium transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

