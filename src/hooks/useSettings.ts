import { useState, useEffect } from 'react';
import { Language } from '../utils/translations';

export interface Settings {
    currency: string;
    karat: string;
    vatPercentage: number;
    theme: string;
    darkMode: boolean;
    language: Language;
}

const DEFAULT_SETTINGS: Settings = {
    currency: 'BHD',
    karat: '21',
    vatPercentage: 10,
    theme: 'gold',
    darkMode: false,
    language: 'en'
};

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem('goldCalc_settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem('goldCalc_settings', JSON.stringify(settings));

        // Apply theme and dark mode to body
        const themes = ['theme-silver', 'theme-dark', 'theme-light', 'theme-high-contrast'];
        document.body.classList.remove(...themes, 'dark-mode');

        if (settings.theme !== 'gold') {
            document.body.classList.add(`theme-${settings.theme}`);
        }

        if (settings.darkMode || settings.theme === 'dark') {
            document.body.classList.add('dark-mode');
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
