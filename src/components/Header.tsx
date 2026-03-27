import React from 'react';
import { formatCurrency } from '../utils/calculations';
import { translations } from '../utils/translations';
import { Settings as SettingsType } from '../hooks/useSettings';
import { Settings, HelpCircle, Clock, PieChart, Calculator, ArrowLeftRight, Sparkles, Moon, Sun } from 'lucide-react';
import { triggerEclipseTransition } from '../utils/themeTransition';

interface HeaderProps {
    settings: SettingsType;
    livePrice: number;
    lastUpdated: Date | null;
    onUseLivePrice: () => void;
    loading: boolean;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onOpenSettings: () => void;
    onOpenHelp: () => void;
    onOpenHistory: () => void;
    onToggleLanguage: () => void;
    updateSettings: (settings: Partial<SettingsType>) => void;
    historyCount: number;
}

const Header: React.FC<HeaderProps> = ({
    settings,
    livePrice,
    lastUpdated,
    onUseLivePrice,
    loading,
    activeTab,
    setActiveTab,
    onOpenSettings,
    onOpenHelp,
    onOpenHistory,
    onToggleLanguage,
    updateSettings,
    historyCount
}) => {
    const t = translations[settings.language];

    const toggleDarkMode = (e: React.MouseEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        const isCurrentlyDark = settings.darkMode || settings.theme === 'dark';
        const color = isCurrentlyDark ? '#FFFFFF' : '#0A0A0A';

        triggerEclipseTransition(x, y, color, () => {
            const nextDarkMode = !isCurrentlyDark;
            const nextTheme = nextDarkMode ? 'dark' : 'gold';
            updateSettings({ theme: nextTheme, darkMode: nextDarkMode });
        });
    };

    const formatTimestamp = (date: Date | null) => {
        if (!date) return '--';
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return settings.language === 'en' ? 'Just now' : 'الآن';
        if (diff < 3600) {
            const mins = Math.floor(diff / 60);
            return settings.language === 'en' ? `${mins} min${mins > 1 ? 's' : ''} ago` : `منذ ${mins} دقيقة`;
        }
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    return (
        <div className="mb-6 space-y-4">
            {/* Main Navigation Bar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 py-4 px-2 sm:px-4 bg-white/40 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-sm">
                {/* Brand & Tabs Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#F0CC60] rounded-xl shadow-lg ring-1 ring-white/20">
                            <Sparkles size={22} className="text-white drop-shadow-sm" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-xl font-black tracking-tight leading-none whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                            {t.appTitle}
                        </h1>
                    </div>

                    {/* Desktop Tabs */}
                    <div className="hidden sm:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
                        {[
                            { id: 'breakdown', label: t.tabBreakdown, icon: <PieChart size={17} /> },
                            { id: 'estimator', label: t.tabEstimator, icon: <Calculator size={17} /> },
                            { id: 'compare', label: t.tabCompare, icon: <ArrowLeftRight size={17} /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-lg ${activeTab === tab.id
                                    ? 'text-slate-900 bg-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Live Price & Global Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full lg:w-auto">
                    {/* Live Price Badge */}
                    <div
                        onClick={onUseLivePrice}
                        className={`group inline-flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg cursor-pointer hover:bg-slate-800 transition-all duration-300 border border-slate-700/50 ${loading ? 'animate-pulse' : ''}`}
                        style={{ color: '#F0CC60' }}
                        title={settings.language === 'en' ? 'Click to use this price' : 'انقر لاستخدام هذا السعر'}
                    >
                        <span className="font-bold font-numbers">{formatCurrency(livePrice)} <span className="text-[10px] opacity-70">{settings.currency}</span></span>
                    </div>

                    <div className="w-[1px] h-6 bg-slate-200 hidden sm:block" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onToggleLanguage}
                            className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-black leading-none transition-all duration-200 hover:shadow-sm"
                        >
                            {settings.language === 'en' ? 'AR' : 'EN'}
                        </button>

                        <div className="flex items-center gap-1 bg-slate-100/40 p-1 rounded-lg">
                            <button
                                id="history-button"
                                onClick={onOpenHistory}
                                className="relative p-1.5 text-slate-400 hover:text-[#D4AF37] hover:bg-white rounded-md transition-all duration-200"
                                aria-label="History"
                            >
                                <Clock size={16} />
                                {historyCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce-short border-2 border-white">
                                        {historyCount}
                                    </span>
                                )}
                            </button>
                            {[
                                { onClick: toggleDarkMode, icon: settings.darkMode ? <Sun size={16} /> : <Moon size={16} />, label: 'Toggle Theme' },
                                { onClick: onOpenSettings, icon: <Settings size={16} />, label: 'Settings' },
                                { onClick: onOpenHelp, icon: <HelpCircle size={16} />, label: 'Help' }
                            ].map((btn, i) => (
                                <button
                                    key={i}
                                    onClick={btn.onClick}
                                    className="p-1.5 text-slate-400 hover:text-[#D4AF37] hover:bg-white rounded-md transition-all duration-200"
                                    aria-label={btn.label}
                                >
                                    {btn.icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Tabs Wrapper */}
            <div className="sm:hidden flex items-center justify-center gap-1 bg-slate-100/50 p-1 rounded-xl">
                {[
                    { id: 'breakdown', label: t.tabBreakdown, icon: <PieChart size={17} /> },
                    { id: 'estimator', label: t.tabEstimator, icon: <Calculator size={17} /> },
                    { id: 'compare', label: t.tabCompare, icon: <ArrowLeftRight size={17} /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-black transition-all duration-300 rounded-lg ${activeTab === tab.id
                            ? 'text-slate-900 bg-white shadow-sm'
                            : 'text-slate-500'
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <p className="text-[10px] text-center sm:text-right opacity-40 px-2 leading-none" style={{ color: 'var(--text-secondary)' }}>
                {settings.language === 'en' ? 'Updated ' : 'آخر تحديث '}
                <span className="font-semibold">{formatTimestamp(lastUpdated)}</span>
            </p>
        </div>
    );
};

export default Header;
