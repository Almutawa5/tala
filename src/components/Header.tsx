import React from 'react';
import { formatCurrency } from '../utils/calculations';
import { translations } from '../utils/translations';
import { Settings as SettingsType } from '../hooks/useSettings';
import { Settings, HelpCircle, Clock, PieChart, Calculator, Wallet, Gem, Moon, Sun } from 'lucide-react';
import { triggerEclipseTransition } from '../utils/themeTransition';
import PWAInstallButton from './PWAInstallButton';

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
    const isDark = settings.darkMode || settings.theme === 'dark';

    const toggleDarkMode = (e: React.MouseEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        const color = isDark ? '#F7F6F2' : '#0A0C10';

        triggerEclipseTransition(x, y, color, () => {
            const nextDarkMode = !isDark;
            const nextTheme = nextDarkMode ? 'dark' : 'gold';
            updateSettings({ theme: nextTheme, darkMode: nextDarkMode });
        });
    };

    return (
        <header className="mb-3 sm:mb-5">
            <div
                className="flex items-center justify-between gap-2 sm:gap-6 py-2.5 sm:py-3 px-2.5 sm:px-5 rounded-2xl transition-colors overflow-hidden"
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-card)'
                }}
            >
                {/* Zone 1: Brand */}
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 sm:flex-initial">
                    <div
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{
                            background: 'linear-gradient(135deg, #E5A93B 0%, #B47B1E 100%)',
                            color: '#0A0C10'
                        }}
                    >
                        <Gem size={17} strokeWidth={2.25} />
                    </div>
                    <h1
                        className="text-sm sm:text-lg font-extrabold tracking-tight leading-none whitespace-nowrap truncate"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {t.appTitle}
                    </h1>
                </div>

                {/* Zone 2: Desktop Navigation Tabs */}
                <nav
                    className="hidden sm:flex items-center gap-1 p-1 rounded-xl"
                    style={{ background: 'var(--bg-muted)' }}
                >
                    {[
                        { id: 'breakdown', label: t.tabBreakdown, icon: <PieChart size={15} /> },
                        { id: 'estimator', label: t.tabEstimator, icon: <Calculator size={15} /> },
                        { id: 'budget', label: t.tabBudget, icon: <Wallet size={15} /> }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 min-h-[38px] text-xs font-bold whitespace-nowrap shrink-0 transition-all duration-150 rounded-lg cursor-pointer ${
                                    isActive ? 'shadow-sm' : 'hover:opacity-90'
                                }`}
                                style={isActive
                                    ? { background: 'var(--bg-surface)', color: 'var(--primary)' }
                                    : { color: 'var(--text-secondary)' }
                                }
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Zone 3: Utilities */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <PWAInstallButton language={settings.language} variant="header" />

                    {/* Desktop quick live-price apply */}
                    <button
                        type="button"
                        onClick={onUseLivePrice}
                        className={`hidden lg:inline-flex items-center gap-1.5 px-3.5 min-h-[38px] rounded-xl text-xs font-bold cursor-pointer transition-all hover:opacity-95 active:scale-95 whitespace-nowrap shrink-0 ${loading ? 'opacity-70' : ''}`}
                        style={{
                            background: 'var(--verdict-bg)',
                            color: '#F2BC52',
                            border: '1px solid rgba(229, 169, 59, 0.25)'
                        }}
                        title={settings.language === 'en' ? 'Click to apply live price' : 'انقر لتطبيق السعر المباشر'}
                    >
                        <span className="font-numbers font-bold">
                            {formatCurrency(livePrice)}
                        </span>
                        <span className="text-[10px] opacity-75 font-semibold">{settings.currency}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onToggleLanguage}
                        className="min-h-[42px] w-9 sm:min-h-[38px] sm:w-auto sm:min-w-[38px] sm:px-2.5 rounded-xl text-xs font-bold leading-none transition-all duration-150 active:scale-95 flex items-center justify-center whitespace-nowrap"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                        aria-label={settings.language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
                    >
                        {settings.language === 'en' ? 'AR' : 'EN'}
                    </button>

                    {/* Desktop-only History shortcut */}
                    <button
                        id="history-button-desktop"
                        type="button"
                        onClick={onOpenHistory}
                        className="hidden sm:flex relative min-h-[38px] min-w-[38px] items-center justify-center rounded-xl transition-all duration-150 active:scale-95 hover:opacity-80"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        aria-label={settings.language === 'ar' ? 'السجل' : 'History'}
                    >
                        <Clock size={16} />
                        {historyCount > 0 && (
                            <span
                                className="absolute -top-1.5 -end-1.5 text-[10px] font-numbers font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm"
                                style={{ background: 'var(--primary)', color: 'var(--primary-ink)' }}
                            >
                                {historyCount}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        className="min-h-[42px] w-9 sm:min-h-[38px] sm:w-[38px] flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95 hover:opacity-80"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        aria-label={settings.language === 'ar' ? 'تغيير المظهر' : 'Toggle Theme'}
                    >
                        {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>

                    <button
                        type="button"
                        onClick={onOpenHelp}
                        className="min-h-[42px] w-9 sm:min-h-[38px] sm:w-[38px] flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95 hover:opacity-80"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        aria-label={t.helpTitle}
                    >
                        <HelpCircle size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className="min-h-[42px] w-9 sm:min-h-[38px] sm:w-[38px] flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95 hover:opacity-80"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        aria-label={t.settingsTitle}
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
