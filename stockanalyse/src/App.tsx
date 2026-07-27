import React, { useState } from 'react';
import { Header } from './components/Header';
import { SectionList } from './components/SectionList';
import { EquityAnalysisModal } from './components/EquityAnalysisModal';
import { AddSectionModal } from './components/AddSectionModal';
import { INITIAL_SECTIONS } from './data/mockData';
import { SectionItem } from './types';

export default function App() {
  const [sections, setSections] = useState<SectionItem[]>(INITIAL_SECTIONS);
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleResetData = () => {
    setSections(INITIAL_SECTIONS);
    setSelectedSection(null);
  };

  const handleAddSection = (newSec: SectionItem) => {
    setSections((prev) => [newSec, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900 font-sans pb-16">
      {/* Top Header */}
      <Header
        onReset={handleResetData}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      {/* Main Container */}
      <main className="w-full max-w-[1800px] mx-auto px-3 sm:px-5 lg:px-6 pt-4 sm:pt-6">
        {/* Section Analysis Table List Card */}
        <SectionList
          sections={sections}
          onSelectSection={(sec) => setSelectedSection(sec)}
        />
      </main>

      {/* Equity & Ownership Analysis Modal */}
      <EquityAnalysisModal
        section={selectedSection}
        onClose={() => setSelectedSection(null)}
      />

      {/* Add Section Modal */}
      <AddSectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSection}
      />
    </div>
  );
}
