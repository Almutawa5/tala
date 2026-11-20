import React from 'react';
import { PieChart, Calculator, ArrowLeftRight, Clock } from 'lucide-react';
import { translations } from '../utils/translations';
import { Language } from '../utils/translations';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onOpenHistory: () => void;
    historyCount: number;
    language: Language;
}

const BottomNav: React.FC<BottomNavProps> = ({
    activeTab,
    setActiveTab,
    onOpenHistory,
    historyCount,
    language
}) => {
    const t = translations[language];

    const tabs = [
        { id: 'breakdown', label: t.tabBreakdown, icon: PieChart },
        { id: 'estimator', label: t.tabEstimator, icon: Calculator },
        { id: 'compare', label: t.tabCompare, icon: ArrowLeftRight },
    ];

    return (
        <nav
            aria-label="Mobile Navigation"
            className="sm:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t transition-colors duration-300 pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))]"
            style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border)',
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)'
            }}
        >
            <div className="grid grid-cols-4 items-center h-14 px-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center justify-center gap-1 h-full py-1 rounded-xl transition-all duration-200 active:scale-90 ${
                                isActive ? 'font-bold' : 'opacity-65 hover:opacity-100'
                            }`}
                            style={{
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)'
                            }}
                        >
                            <div className="relative">
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                {isActive && (
                                    <span
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: 'var(--primary)' }}
                                    />
                                )}
                            </div>
                            <span className="text-[10px] leading-tight tracking-tight">
                                {tab.label}
                            </span>
                        </button>
                    );
                })}

                {/* 4th Tab: History shortcut */}
                <button
                    onClick={onOpenHistory}
                    className="flex flex-col items-center justify-center gap-1 h-full py-1 rounded-xl transition-all duration-200 active:scale-90 opacity-65 hover:opacity-100"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <div className="relative">
                        <Clock size={20} strokeWidth={2} />
                        {historyCount > 0 && (
                            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce-short border border-white">
                                {historyCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] leading-tight tracking-tight">
                        {language === 'ar' ? 'السجل' : 'History'}
                    </span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;
