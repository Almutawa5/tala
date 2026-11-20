import React, { useState } from 'react';
import { RefreshCw, Check, ChevronDown } from 'lucide-react';
import { Settings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/calculations';
import { translations } from '../utils/translations';

interface QuickParamBarProps {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    livePrice: number;
    loading: boolean;
    lastUpdated: Date | null;
    isCached?: boolean;
    onSyncLivePrice: () => void;
}

const KARATS = ['18', '21', '22', '24'];
const CURRENCIES = ['BHD', 'SAR', 'AED', 'QAR', 'USD'];
const VAT_PRESETS = [0, 5, 10, 15];

const QuickParamBar: React.FC<QuickParamBarProps> = ({
    settings,
    updateSettings,
    livePrice,
    loading,
    lastUpdated,
    isCached = false,
    onSyncLivePrice,
}) => {
    const t = translations[settings.language];
    const isRtl = settings.language === 'ar';
    const [justSynced, setJustSynced] = useState(false);

    const handleCycleVat = () => {
        const currentIndex = VAT_PRESETS.indexOf(settings.vatPercentage);
        const nextVat = currentIndex === -1
            ? VAT_PRESETS[0]
            : VAT_PRESETS[(currentIndex + 1) % VAT_PRESETS.length];
        updateSettings({ vatPercentage: nextVat });
    };

    const handleSyncClick = () => {
        onSyncLivePrice();
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 1500);
    };

    const formatTimestamp = (date: Date | null) => {
        if (!date) return '--';
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return isRtl ? 'الآن' : 'Just now';
        if (diff < 3600) {
            const mins = Math.floor(diff / 60);
            return isRtl ? `منذ ${mins} د` : `${mins}m ago`;
        }
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    return (
        <div
            className="mb-3 sm:mb-5 p-2.5 sm:p-3 rounded-2xl space-y-2 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-3 transition-colors"
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)'
            }}
        >
            {/* Row 1 on mobile / Left group on desktop: Karat + Currency + VAT */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {/* Karat segmented control */}
                <div
                    className="flex items-center p-1 rounded-xl w-full sm:w-auto sm:flex-initial"
                    style={{ background: 'var(--bg-muted)' }}
                    role="group"
                    aria-label={t.karatLabel}
                >
                    {KARATS.map((k) => {
                        const isActive = settings.karat === k;
                        return (
                            <button
                                key={k}
                                type="button"
                                onClick={() => updateSettings({ karat: k })}
                                className={`flex-1 sm:flex-initial min-h-[40px] sm:min-h-[36px] px-2.5 sm:px-3 rounded-lg text-xs font-numbers font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                                    isActive ? 'shadow-sm' : 'hover:opacity-90'
                                }`}
                                style={{
                                    background: isActive ? 'var(--primary-vivid)' : 'transparent',
                                    color: isActive ? '#0A0C10' : 'var(--text-secondary)',
                                }}
                                aria-pressed={isActive}
                            >
                                {k}K
                            </button>
                        );
                    })}
                </div>

                {/* Currency dropdown + VAT quick toggle */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <select
                            value={settings.currency}
                            onChange={(e) => updateSettings({ currency: e.target.value })}
                            aria-label={t.currencyLabel}
                            className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px] appearance-none ps-3.5 pe-8 rounded-xl text-xs font-bold font-numbers cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 transition-all"
                            style={{
                                background: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={14}
                            className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-2.5 opacity-60"
                            style={{ color: 'var(--text-secondary)' }}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleCycleVat}
                        className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-[40px] px-3.5 rounded-xl text-xs font-bold font-numbers whitespace-nowrap transition-all duration-150 active:scale-95 border flex items-center justify-center gap-1.5"
                        style={{
                            background: 'var(--bg-input)',
                            color: settings.vatPercentage > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                            borderColor: 'var(--border)',
                        }}
                        title={isRtl ? 'اضغط لتغيير نسبة الضريبة بسرعة' : 'Tap to cycle VAT rate (0%, 5%, 10%, 15%)'}
                    >
                        <span>{isRtl ? 'الضريبة' : 'VAT'}</span>
                        <span style={{ color: 'var(--primary)' }}>{settings.vatPercentage}%</span>
                    </button>
                </div>
            </div>

            {/* Row 2 on mobile / Right on desktop: 1-Tap Live Spot Sync */}
            <button
                type="button"
                onClick={handleSyncClick}
                className="w-full lg:w-auto min-h-[44px] sm:min-h-[40px] px-3 sm:px-3.5 rounded-xl flex items-center justify-between lg:justify-end gap-2 sm:gap-3 transition-all duration-150 active:scale-[0.98] border overflow-hidden"
                style={{
                    background: 'var(--verdict-bg)',
                    borderColor: justSynced ? 'rgba(16, 185, 129, 0.5)' : 'rgba(229, 169, 59, 0.28)',
                    color: '#F6F5F1',
                }}
                title={isRtl ? 'تحديث وتطبيق السعر المباشر' : 'Tap to refresh & apply live gold spot price'}
            >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                    <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: '#9B988F' }}>
                        {isRtl ? `عيار ${settings.karat}` : `${settings.karat}K Spot`}
                    </span>
                    <span className="font-numbers text-sm font-bold whitespace-nowrap truncate" style={{ color: '#F2BC52' }}>
                        {livePrice > 0 ? `${formatCurrency(livePrice)} ${settings.currency}/g` : (loading ? '...' : '—')}
                    </span>
                    <span className="text-[10px] hidden sm:inline whitespace-nowrap" style={{ color: '#9B988F' }}>
                        · {isCached ? (isRtl ? 'محفوظ' : 'Cached') + ' · ' : ''}{formatTimestamp(lastUpdated)}
                    </span>
                </div>

                <span
                    className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap shrink-0"
                    style={{ color: justSynced ? '#34D399' : '#F2BC52' }}
                >
                    {justSynced ? (
                        <>
                            <Check size={14} />
                            <span>{t.syncedSpot}</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                            <span>{t.syncSpot}</span>
                        </>
                    )}
                </span>
            </button>
        </div>
    );
};

export default QuickParamBar;
