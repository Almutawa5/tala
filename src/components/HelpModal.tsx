import React from 'react';
import { X } from 'lucide-react';
import { translations, Language } from '../utils/translations';
import BottomSheet from './BottomSheet';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, language }) => {
    const t = translations[language];

    const steps = [
        { title: t.helpStep1Title, body: t.helpStep1 },
        { title: t.helpStep2Title, body: t.helpStep2 },
        { title: t.helpStep3Title, body: t.helpStep3 },
        { title: t.helpStep4Title, body: t.helpStep4 },
    ];

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} maxWidthClass="sm:max-w-md" ariaLabel={t.helpTitle}>
            <div className="flex justify-between items-center px-5 py-4 sm:p-6 sm:pb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t.helpTitle}</h3>
                <button
                    type="button"
                    onClick={onClose}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="p-5 sm:p-6 space-y-3 overflow-y-auto custom-scrollbar pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))] help-step">
                {steps.map((step, idx) => (
                    <div
                        key={idx}
                        className="p-4 rounded-2xl border transition-colors"
                        style={{
                            background: 'var(--bg-input)',
                            borderColor: 'var(--border)'
                        }}
                    >
                        <h4
                            className="font-bold mb-1.5 text-sm"
                            style={{ color: idx % 2 === 0 ? 'var(--primary)' : 'var(--craft-accent)' }}
                        >
                            {step.title}
                        </h4>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {step.body}
                        </p>
                    </div>
                ))}
            </div>
        </BottomSheet>
    );
};

export default HelpModal;
