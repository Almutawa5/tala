import React from 'react';
import { formatCurrency } from '../utils/calculations';
import { translations } from '../utils/translations';

const Header = ({
    settings,
    livePrice,
    lastUpdated,
    onUseLivePrice,
    loading
}) => {
    const t = translations[settings.language];

    const formatTimestamp = (date) => {
        if (!date) return '--';
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

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
            <div className="inline-flex items-center justify-center p-3 bg-gold-100 rounded-full mb-4 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.appTitle}</h1>

            <div
                onClick={onUseLivePrice}
                className="inline-flex items-center gap-2 bg-slate-900 text-gold-400 px-4 py-2 rounded-full text-sm font-medium shadow-md cursor-pointer hover:bg-slate-800 transition-colors mb-2 active:ring-2 active:ring-gold-400"
                title="Click to use this price"
            >
                <span className="animate-pulse">●</span>
                <span>{settings.language === 'en' ? 'Live:' : 'مباشر:'}</span>
                <span>
                    {loading ? 'Loading...' : `${formatCurrency(livePrice)} ${settings.currency} (${settings.karat}K)`}
                </span>
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
