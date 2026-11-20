import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { translations } from '../utils/translations';
import { triggerEclipseTransition } from '../utils/themeTransition';
import { Settings } from '../hooks/useSettings';
import BottomSheet from './BottomSheet';
import PWAInstallButton from './PWAInstallButton';

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

    const themeColors: Record<string, string> = {
        gold: '#E5A93B',
        dark: '#0A0C10'
    };

    const handleThemeClick = (e: React.MouseEvent, theme: string) => {
        const x = e.clientX;
        const y = e.clientY;
        const color = themeColors[theme] || '#E5A93B';

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

    const inputClass = "w-full min-h-[46px] px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer";

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} maxWidthClass="sm:max-w-sm" ariaLabel={t.settingsTitle}>
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 sm:p-6 sm:pb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t.settingsTitle}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {isRtl ? 'ضبط العملة والعيار والمظهر' : 'Customize your experience'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
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
                                sublabel: isRtl ? 'ذهبي دافئ' : 'Warm Alabaster',
                                bg: 'linear-gradient(135deg, #FAF8F4 0%, #F3DBA4 100%)',
                                accent: '#C68A1E',
                                textColor: '#141413'
                            },
                            {
                                id: 'dark',
                                label: isRtl ? 'داكن' : 'Dark',
                                sublabel: isRtl ? 'أوبسيديان ليلي' : 'Obsidian Gold',
                                bg: 'linear-gradient(135deg, #0A0C10 0%, #161A26 100%)',
                                accent: '#E5A93B',
                                textColor: '#F6F5F1'
                            }
                        ].map(theme => {
                            const isActive = localSettings.theme === theme.id;
                            return (
                                <button
                                    key={theme.id}
                                    type="button"
                                    onClick={(e) => handleThemeClick(e, theme.id)}
                                    className="relative flex flex-col items-center p-4 min-h-[88px] rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.98]"
                                    style={{
                                        background: theme.bg,
                                        border: isActive ? `2px solid ${theme.accent}` : '1.5px solid var(--border)',
                                        boxShadow: isActive ? `0 0 0 3px ${theme.accent}28` : '0 2px 8px rgba(0,0,0,0.08)'
                                    }}
                                    aria-label={theme.label}
                                >
                                    <div className="w-7 h-7 rounded-full mb-2 shadow-inner" style={{ background: theme.accent }} />
                                    <span className="text-xs font-bold" style={{ color: theme.textColor }}>{theme.label}</span>
                                    <span className="text-[10px] mt-0.5 opacity-70" style={{ color: theme.textColor }}>{theme.sublabel}</span>
                                    {isActive && (
                                        <div className="absolute top-2 end-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: theme.accent }}>
                                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                <path d="M1.5 4L3 5.5L6.5 2" stroke="#0A0C10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                            border: '1.5px solid var(--border)'
                        }}
                    >
                        <option value="24">{isRtl ? 'عيار ٢٤ — ذهب صافي' : '24K — Pure Gold'}</option>
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
                        enterKeyHint="done"
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

                <PWAInstallButton language={settings.language} variant="card" />
            </div>

            {/* Pinned Save Button */}
            <div className="p-5 sm:p-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))] border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                <button
                    type="button"
                    onClick={handleSave}
                    className="w-full min-h-[48px] py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 hover:opacity-95 active:scale-[0.98] shadow-lg"
                    style={{
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-vivid) 100%)',
                        color: 'var(--primary-ink)',
                        boxShadow: '0 6px 20px -4px rgba(198, 138, 30, 0.4)'
                    }}
                >
                    {t.settingsSaveBtn}
                </button>
            </div>
        </BottomSheet>
    );
};

export default SettingsModal;
