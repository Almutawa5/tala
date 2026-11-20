import React from 'react';
import { X } from 'lucide-react';
import { translations } from '../utils/translations';

import { Language } from '../utils/translations';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, language }) => {
    if (!isOpen) return null;
    const t = translations[language];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100 max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col animate-fade-in-scale border"
                style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t.helpTitle}</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-3.5 help-step">
                    <div className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/20">
                        <h4 className="font-bold text-amber-500 mb-1.5 text-sm">{t.helpStep1Title}</h4>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t.helpStep1}</p>
                    </div>
                    <div className="p-4 rounded-xl border bg-blue-500/10 border-blue-500/20">
                        <h4 className="font-bold text-blue-500 mb-1.5 text-sm">{t.helpStep2Title}</h4>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t.helpStep2}</p>
                    </div>
                    <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/20">
                        <h4 className="font-bold text-emerald-500 mb-1.5 text-sm">{t.helpStep3Title}</h4>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t.helpStep3}</p>
                    </div>
                    <div className="p-4 rounded-xl border bg-purple-500/10 border-purple-500/20">
                        <h4 className="font-bold text-purple-500 mb-1.5 text-sm">{t.helpStep4Title}</h4>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t.helpStep4}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
