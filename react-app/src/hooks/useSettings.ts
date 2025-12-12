import { useState, useEffect } from 'react';
import { Language } from '../utils/translations';

export interface Settings {
    currency: string;
    karat: string;
    vatPercentage: number;
    theme: string;
    language: Language;
}

const DEFAULT_SETTINGS: Settings = {
    currency: 'BHD',
    karat: '21',
    vatPercentage: 10,
    theme: 'gold',
    language: 'en'
};

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem('goldCalc_settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem('goldCalc_settings', JSON.stringify(settings));

        // Apply theme to body
        const themes = ['theme-silver', 'theme-dark', 'theme-light'];
        document.body.classList.remove(...themes);

        if (settings.theme !== 'gold') {
            document.body.classList.add(`theme-${settings.theme}`);
        }

        // Apply language direction
        document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = settings.language;

    }, [settings]);

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return { settings, updateSettings };
};
