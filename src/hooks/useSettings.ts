import { useState, useEffect } from 'react';
import { Language } from '../utils/translations';

export type CalcMode = 'quick' | 'detailed';

export interface Settings {
    currency: string;
    karat: string;
    vatPercentage: number;
    theme: string;
    darkMode: boolean;
    language: Language;
    calcMode: CalcMode;
}

const DEFAULT_SETTINGS: Settings = {
    currency: 'BHD',
    karat: '21',
    vatPercentage: 10,
    theme: 'gold',
    darkMode: false,
    language: 'en',
    calcMode: 'quick'
};

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem('goldCalc_settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem('goldCalc_settings', JSON.stringify(settings));

        // Apply theme and dark mode to html and body
        const isDark = settings.theme === 'dark' || settings.darkMode;
        document.documentElement.classList.toggle('dark', isDark);
        document.body.classList.toggle('theme-dark', isDark);
        document.body.classList.toggle('dark-mode', isDark);

        // Apply language direction
        document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = settings.language;

    }, [settings]);

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return { settings, updateSettings };
};
