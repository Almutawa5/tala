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
        silver: '#E0E0E0',
        light: '#3b82f6'
    };

    const handleThemeClick = (e: React.MouseEvent, theme: string) => {
        const x = e.clientX;
        const y = e.clientY;
        const color = themeColors[theme] || '#F59E0B';

        triggerEclipseTransition(x, y, color, () => {
            const newSettings = {
                ...localSettings,
                theme,
                darkMode: theme === 'dark' ? true : localSettings.darkMode
            };
            setLocalSettings(newSettings);
            updateSettings(newSettings);
        });
    };

    const handleSave = () => {
        updateSettings(localSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl transform transition-all scale-100 max-h-[80vh] overflow-y-auto custom-scrollbar flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h3 className="text-lg font-bold text-slate-900">{t.settingsTitle}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Theme Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.themeLabel}</label>
                        <div className="flex gap-3 flex-wrap">
                            {['gold', 'silver', 'light'].map(theme => (
                                <div
                                    key={theme}
                                    className={`theme-swatch ${localSettings.theme === theme ? 'active' : ''} ${theme === 'high-contrast' ? 'high-contrast' : ''}`}
                                    data-theme={theme}
                                    onClick={(e) => handleThemeClick(e, theme)}
                                    style={theme !== 'high-contrast' ? {
                                        background: theme === 'gold' ? 'linear-gradient(135deg, #D97706, #F59E0B)' :
                                            theme === 'silver' ? 'linear-gradient(135deg, #71717a, #a1a1aa)' :
                                                theme === 'dark' ? 'linear-gradient(135deg, #0f172a, #1e293b)' :
                                                    'linear-gradient(135deg, #3b82f6, #60a5fa)'
                                    } : undefined}
                                    title={theme === 'high-contrast'
                                        ? (settings.language === 'en' ? 'High Contrast (Accessibility)' : 'تباين عالي (إمكانية الوصول)')
                                        : theme.charAt(0).toUpperCase() + theme.slice(1)}
                                />
                            ))}
                        </div>
                    </div>



                    {/* Currency Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.currencyLabel}</label>
                        <select
                            value={localSettings.currency}
                            onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-none bg-slate-100 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 font-numbers"
                        >
                            <option value="BHD">Bahraini Dinar (BHD)</option>
                            <option value="SAR">Saudi Riyal (SAR)</option>
                            <option value="QAR">Qatari Riyal (QAR)</option>
                            <option value="AED">UAE Dirham (AED)</option>
                            <option value="USD">US Dollar (USD)</option>
                        </select>
                    </div>

                    {/* Karat Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.karatLabel}</label>
                        <select
                            value={localSettings.karat}
                            onChange={(e) => setLocalSettings({ ...localSettings, karat: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-none bg-slate-100 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 font-numbers"
                        >
                            <option value="24">24K</option>
                            <option value="22">22K</option>
                            <option value="21">21K</option>
                            <option value="18">18K</option>
                        </select>
                    </div>

                    {/* VAT Percentage */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.vatLabel}</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={localSettings.vatPercentage}
                            onChange={(e) => setLocalSettings({ ...localSettings, vatPercentage: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-3 rounded-xl border-none bg-slate-100 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 font-numbers"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full mt-6 bg-gold-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-gold-500/30 hover:bg-gold-600 transition-all"
                >
                    {t.settingsSaveBtn}
                </button>
            </div>
        </div>
    );
};

export default SettingsModal;
