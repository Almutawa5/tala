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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100 max-h-[80vh] overflow-y-auto custom-scrollbar flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h3 className="text-lg font-bold text-slate-900">{t.helpTitle}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4 help-step">
                    <div className="p-4 bg-gold-50 rounded-xl">
                        <h4 className="font-bold text-gold-900 mb-2">{t.helpStep1Title}</h4>
                        <p className="text-sm text-slate-700">{t.helpStep1}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl">
                        <h4 className="font-bold text-blue-900 mb-2">{t.helpStep2Title}</h4>
                        <p className="text-sm text-slate-700">{t.helpStep2}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                        <h4 className="font-bold text-emerald-900 mb-2">{t.helpStep3Title}</h4>
                        <p className="text-sm text-slate-700">{t.helpStep3}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl">
                        <h4 className="font-bold text-purple-900 mb-2">{t.helpStep4Title}</h4>
                        <p className="text-sm text-slate-700">{t.helpStep4}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
