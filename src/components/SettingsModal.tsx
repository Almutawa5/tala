import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { translations } from '../utils/translations';
import { triggerEclipseTransition } from '../utils/themeTransition';

import { Settings } from '../hooks/useSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, updateSettings }) => {
    const [localSettings, setLocalSettings] = useState<Settings>(settings);
    const t = translations[settings.language];

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const themeColors: Record<string, string> = {
        gold: '#F59E0B',
        dark: '#1E293B'
    };

    const handleThemeClick = (e: React.MouseEvent, theme: string) => {
        const x = e.clientX;
        const y = e.clientY;
        const color = themeColors[theme] || '#F59E0B';

        triggerEclipseTransition(x, y, color, () => {
            const isDarkTheme = theme === 'dark';
            const newSettings = {
                ...localSettings,
                theme,
                darkMode: isDarkTheme
            };
            setLocalSettings(newSettings);
            updateSettings(newSettings);
        });
    };

    const handleSave = () => {
        updateSettings(localSettings);
        onClose();
    };

    const isRtl = settings.language === 'ar';

    const inputClass = "w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="w-full max-w-sm rounded-2xl shadow-2xl transform transition-all scale-100 max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col animate-fade-in-scale"
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t.settingsTitle}</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? 'تخصيص التطبيق' : 'Customize your experience'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Theme Selection */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>
                            {t.themeLabel}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                {
                                    id: 'gold',
                                    label: isRtl ? 'فاتح' : 'Light',
                                    sublabel: isRtl ? 'ذهبي كلاسيكي' : 'Classic Gold',
                                    bg: 'linear-gradient(135deg, #F8FAFC 0%, #FEF3C7 100%)',
                                    accent: '#F59E0B',
                                    textColor: '#0F172A'
                                },
                                {
                                    id: 'dark',
                                    label: isRtl ? 'داكن' : 'Dark',
                                    sublabel: isRtl ? 'وضع الليل' : 'Night Mode',
                                    bg: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                    accent: '#F59E0B',
                                    textColor: '#F8FAFC'
                                }
                            ].map(theme => {
                                const isActive = localSettings.theme === theme.id;
                                return (
                                    <button
                                        key={theme.id}
                                        onClick={(e) => handleThemeClick(e, theme.id)}
                                        className="relative flex flex-col items-center p-4 rounded-2xl transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                        style={{
                                            background: theme.bg,
                                            border: isActive ? `2px solid ${theme.accent}` : '2px solid transparent',
                                            boxShadow: isActive ? `0 0 0 3px ${theme.accent}33` : '0 2px 8px rgba(0,0,0,0.12)'
                                        }}
                                        aria-label={theme.label}
                                        title={`${theme.label} — ${theme.sublabel}`}
                                    >
                                        {/* Color preview bar */}
                                        <div className="w-8 h-8 rounded-full mb-2 shadow-inner" style={{ background: theme.accent, opacity: 0.9 }} />
                                        <span className="text-xs font-bold" style={{ color: theme.textColor }}>{theme.label}</span>
                                        <span className="text-[10px] mt-0.5 opacity-60" style={{ color: theme.textColor }}>{theme.sublabel}</span>
                                        {isActive && (
                                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: theme.accent }}>
                                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                    <path d="M1.5 4L3 5.5L6.5 2" stroke={theme.textColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Currency Selection */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                            {t.currencyLabel}
                        </label>
                        <select
                            value={localSettings.currency}
                            onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                            className={inputClass}
                            style={{
                                background: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border)',
                                border: '1.5px solid var(--border)'
                            }}
                        >
                            <option value="BHD">{isRtl ? 'دينار بحريني (BHD)' : 'Bahraini Dinar (BHD)'}</option>
                            <option value="SAR">{isRtl ? 'ريال سعودي (SAR)' : 'Saudi Riyal (SAR)'}</option>
                            <option value="QAR">{isRtl ? 'ريال قطري (QAR)' : 'Qatari Riyal (QAR)'}</option>
                            <option value="AED">{isRtl ? 'درهم إماراتي (AED)' : 'UAE Dirham (AED)'}</option>
                            <option value="USD">{isRtl ? 'دولار أمريكي (USD)' : 'US Dollar (USD)'}</option>
                        </select>
                    </div>

                    {/* Karat Selection */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                            {t.karatLabel}
                        </label>
                        <select
                            value={localSettings.karat}
                            onChange={(e) => setLocalSettings({ ...localSettings, karat: e.target.value })}
                            className={inputClass}
                            style={{
                                background: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border)',
                                border: '1.5px solid var(--border)'
                            }}
                        >
                            <option value="24">{isRtl ? 'عيار ٢٤ — ذهب خالص' : '24K — Pure Gold'}</option>
                            <option value="22">{isRtl ? 'عيار ٢٢' : '22K'}</option>
                            <option value="21">{isRtl ? 'عيار ٢١' : '21K'}</option>
                            <option value="18">{isRtl ? 'عيار ١٨' : '18K'}</option>
                        </select>
                    </div>

                    {/* VAT Percentage */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                            {t.vatLabel}
                        </label>
                        <input
                            type="number"
                            inputMode="decimal"
                            onFocus={(e) => e.target.select()}
                            min="0"
                            max="100"
                            step="0.1"
                            value={localSettings.vatPercentage}
                            onChange={(e) => setLocalSettings({ ...localSettings, vatPercentage: parseFloat(e.target.value) || 0 })}
                            className={inputClass + ' font-numbers'}
                            style={{
                                background: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                border: '1.5px solid var(--border)'
                            }}
                        />
                    </div>
                </div>

                {/* Save Button */}
                <div className="p-6 pt-0">
                    <button
                        onClick={handleSave}
                        className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-lg"
                        style={{
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                            color: '#0F172A',
                            boxShadow: '0 4px 16px rgba(245,158,11,0.35)'
                        }}
                    >
                        {t.settingsSaveBtn}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
