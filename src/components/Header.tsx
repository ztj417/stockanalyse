import React from 'react';
import { ShieldAlert, RefreshCw, Layers, Plus } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onAddClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-5 lg:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                招标风险监管与标段分析系统
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                实时监控中
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              智慧招投标围标串标预警及股权穿透监管平台
            </p>
          </div>
        </div>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            title="重置测试数据"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xs:inline">重置数据</span>
          </button>
        </div>
      </div>
    </header>
  );
};
