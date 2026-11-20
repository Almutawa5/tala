import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { translations, Language } from '../utils/translations';
import BottomSheet from './BottomSheet';

interface SaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string) => void;
    language: Language;
}

const SaveModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onConfirm, language }) => {
    const [name, setName] = useState('');
    const t = translations[language];

    useEffect(() => {
        if (isOpen) {
            setName('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(name);
        onClose();
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} maxWidthClass="sm:max-w-sm" ariaLabel={t.saveRecordTitle}>
            <div className="flex justify-between items-center px-5 py-4 sm:p-6 sm:pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Save size={20} style={{ color: 'var(--primary)' }} />
                    {t.saveRecordTitle}
                </h3>
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

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))]">
                <div className="mb-5">
                    <label htmlFor="recordName" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {t.recordNameLabel}
                    </label>
                    <input
                        type="text"
                        id="recordName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.enterNamePlaceholder}
                        enterKeyHint="done"
                        className="w-full min-h-[46px] px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none transition-all"
                        style={{
                            background: 'var(--bg-input)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-primary)'
                        }}
                        autoFocus
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 min-h-[48px] py-3 rounded-xl font-bold text-xs transition-all border active:scale-[0.98]"
                        style={{
                            background: 'var(--bg-muted)',
                            color: 'var(--text-secondary)',
                            borderColor: 'var(--border)'
                        }}
                    >
                        {t.cancelBtn}
                    </button>
                    <button
                        type="submit"
                        data-save-confirm
                        className="flex-1 min-h-[48px] py-3 rounded-xl font-bold text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1.5"
                        style={{
                            background: 'var(--primary-vivid)',
                            color: 'var(--primary-ink)'
                        }}
                    >
                        <Save size={15} />
                        <span>{t.confirmSaveBtn}</span>
                    </button>
                </div>
            </form>
        </BottomSheet>
    );
};

export default SaveModal;
