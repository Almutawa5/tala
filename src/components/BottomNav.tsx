import React from 'react';
import { PieChart, Calculator, ArrowLeftRight, Clock } from 'lucide-react';
import { translations, Language } from '../utils/translations';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onOpenHistory: () => void;
    historyCount: number;
    language: Language;
    isKeyboardOpen?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({
    activeTab,
    setActiveTab,
    onOpenHistory,
    historyCount,
    language,
    isKeyboardOpen = false,
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
            aria-hidden={isKeyboardOpen}
            className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t transition-all duration-200 pb-[max(0.25rem,env(safe-area-inset-bottom,0.25rem))] ${
                isKeyboardOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
            }`}
            style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border)',
                boxShadow: '0 -8px 28px rgba(0, 0, 0, 0.08)'
            }}
        >
            <div className="grid grid-cols-4 items-center h-14 px-2 gap-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] h-full py-1 rounded-xl transition-all duration-150 active:scale-95 whitespace-nowrap ${
                                isActive ? 'font-bold' : 'opacity-70 hover:opacity-100'
                            }`}
                            style={{
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)'
                            }}
                        >
                            <div
                                className="px-3 py-0.5 rounded-full transition-colors"
                                style={{
                                    background: isActive ? 'var(--primary-soft)' : 'transparent'
                                }}
                            >
                                <Icon size={19} strokeWidth={isActive ? 2.4 : 1.9} />
                            </div>
                            <span className="text-[11px] leading-tight tracking-tight">
                                {tab.label}
                            </span>
                        </button>
                    );
                })}

                {/* 4th Tab: History shortcut */}
                <button
                    id="history-button-mobile"
                    type="button"
                    onClick={onOpenHistory}
                    className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] h-full py-1 rounded-xl transition-all duration-150 active:scale-95 opacity-75 hover:opacity-100 whitespace-nowrap"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <div className="relative px-3 py-0.5">
                        <Clock size={19} strokeWidth={1.9} />
                        {historyCount > 0 && (
                            <span
                                className="absolute -top-0.5 end-1 text-[9px] font-numbers font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center"
                                style={{ background: 'var(--primary)', color: 'var(--primary-ink)' }}
                            >
                                {historyCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] leading-tight tracking-tight">
                        {language === 'ar' ? 'السجل' : 'History'}
                    </span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;
