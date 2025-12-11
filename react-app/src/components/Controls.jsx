import React from 'react';
import { Settings, HelpCircle, Globe, Clock } from 'lucide-react';
import { translations } from '../utils/translations';

const Controls = ({
    activeTab,
    setActiveTab,
    onOpenSettings,
    onOpenHelp,
    onOpenHistory,
    onToggleLanguage,
    language
}) => {
    const t = translations[language];

    return (
        <div className="flex justify-between items-center mb-4 gap-2">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                    onClick={() => setActiveTab('breakdown')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'breakdown'
                        ? 'text-white bg-gold-500 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    {t.tabBreakdown}
                </button>
                <button
                    onClick={() => setActiveTab('estimator')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'estimator'
                        ? 'text-white bg-gold-500 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    {t.tabEstimator}
                </button>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onOpenHistory}
                    className="text-xs font-medium bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm text-slate-600"
                >
                    <Clock size={16} />
                </button>

                <button
                    onClick={onOpenHelp}
                    className="text-xs font-medium bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm text-slate-600"
                >
                    <HelpCircle size={16} />
                </button>

                <button
                    onClick={onOpenSettings}
                    className="text-xs font-medium bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm text-slate-600"
                >
                    <Settings size={16} />
                </button>

                <button
                    onClick={onToggleLanguage}
                    className="text-xs font-medium bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm text-slate-600"
                >
                    <Globe size={16} />
                    <span>{language === 'en' ? 'العربية' : 'English'}</span>
                </button>
            </div>
        </div>
    );
};

export default Controls;
