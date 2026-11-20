import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { translations } from '../utils/translations';

import { Language } from '../utils/translations';

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

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(name);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="rounded-2xl w-full max-w-sm p-6 sm:p-8 shadow-2xl transform transition-all scale-100 animate-fade-in-scale border"
                style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Save size={20} className="text-amber-500" />
                        {t.saveRecordTitle}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="recordName" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                            {t.recordNameLabel}
                        </label>
                        <input
                            type="text"
                            id="recordName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t.enterNamePlaceholder}
                            className="w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none transition-all"
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
                            className="flex-1 py-3 rounded-xl font-bold text-xs transition-all border"
                            style={{
                                background: 'var(--border)',
                                color: 'var(--text-secondary)',
                                borderColor: 'var(--border)'
                            }}
                        >
                            {t.cancelBtn}
                        </button>
                        <button
                            type="submit"
                            data-save-confirm
                            className="flex-1 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                            style={{
                                background: 'var(--primary)',
                                color: '#0F172A'
                            }}
                        >
                            <Save size={14} />
                            <span>{t.confirmSaveBtn}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SaveModal;
