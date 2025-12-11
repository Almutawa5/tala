import { useState, useEffect } from 'react';

const DEFAULT_SETTINGS = {
    currency: 'BHD',
    karat: '21',
    vatPercentage: 10,
    theme: 'gold',
    language: 'en'
};

export const useSettings = () => {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('goldCalc_settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem('goldCalc_settings', JSON.stringify(settings));

        // Apply theme to body
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        if (settings.theme !== 'gold') {
            document.body.classList.add(`theme-${settings.theme}`);
        }

        // Apply language direction
        document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = settings.language;

    }, [settings]);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return { settings, updateSettings };
};
