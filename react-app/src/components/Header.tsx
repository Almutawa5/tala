import React from 'react';
import logo from '../assets/logo.png';
import { formatCurrency } from '../utils/calculations';
import { translations } from '../utils/translations';

import { Settings } from '../hooks/useSettings';

interface HeaderProps {
    settings: Settings;
    livePrice: number;
    lastUpdated: Date | null;
    onUseLivePrice: () => void;
    loading: boolean;
}

const Header: React.FC<HeaderProps> = ({
    settings,
    livePrice,
    lastUpdated,
    onUseLivePrice,
    loading
}) => {
    const t = translations[settings.language];

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
        <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 mb-4">
                <img src={logo} alt="Tala Logo" className="h-20 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.appTitle}</h1>

            <div
                onClick={onUseLivePrice}
                className={`inline-flex items-center gap-2 bg-slate-900 text-gold-400 px-4 py-2 rounded-full text-sm font-medium shadow-md cursor-pointer hover:bg-slate-800 transition-all duration-300 mb-2 active:ring-2 active:ring-gold-400 ${loading ? 'animate-pulse' : ''}`}
                title="Click to use this price"
            >
                <span className={`${loading ? '' : 'animate-pulse'}`}>●</span>
                <span>{settings.language === 'en' ? 'Live:' : 'مباشر:'}</span>
                {loading ? (
                    <span className="inline-block w-24 h-4 bg-slate-700 rounded animate-shimmer" />
                ) : (
                    <span className="transition-all duration-300">{`${formatCurrency(livePrice)} ${settings.currency} (${settings.karat}K)`}</span>
                )}
            </div>

            <p className="text-slate-400 text-xs mt-1">
                {settings.language === 'en' ? 'Last updated: ' : 'آخر تحديث: '}
                {formatTimestamp(lastUpdated)}
            </p>

            <p className="text-slate-500 text-xs mt-1">{t.appSubtitle}</p>
        </div>
    );
};

export default Header;
