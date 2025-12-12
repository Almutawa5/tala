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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Save size={20} className="text-gold-500" />
                        {t.saveRecordTitle}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="recordName" className="block text-sm font-medium text-slate-700 mb-2">
                            {t.recordNameLabel}
                        </label>
                        <input
                            type="text"
                            id="recordName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t.enterNamePlaceholder}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-gold-500 transition-colors"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            {t.cancelBtn}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-gold-500 hover:bg-gold-600 shadow-lg shadow-gold-500/30 transition-colors"
                        >
                            {t.confirmSaveBtn}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SaveModal;
