import React, { useState } from 'react';
import { X, Trash2, RotateCcw, Clock, Edit2, Check } from 'lucide-react';
import { translations } from '../utils/translations';
import { formatCurrency } from '../utils/calculations';

import { HistoryItem } from '../hooks/useHistory';
import { Language } from '../utils/translations';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onDelete: (id: number) => void;
    onClear: () => void;
    onRestore: (item: HistoryItem) => void;
    onRename: (id: number, name: string) => void;
    language: Language;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onDelete, onClear, onRestore, onRename, language }) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    if (!isOpen) return null;
    const t = translations[language];

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ar-SA', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    const startEditing = (item: HistoryItem) => {
        setEditingId(item.id);
        setEditName(item.name || '');
    };

    const saveEditing = (id: number) => {
        onRename(id, editName);
        setEditingId(null);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100 max-h-[85vh] flex flex-col overflow-hidden animate-fade-in-scale border"
                style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Clock size={20} className="text-amber-500" />
                        {t.historyTitle}
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

                <div className="flex-grow overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                            <Clock size={48} className="mx-auto mb-3 opacity-20" />
                            <p>{t.noHistory}</p>
                        </div>
                    ) : (
                        history.map(item => (
                            <div
                                key={item.id}
                                className="rounded-xl p-3 transition-colors shadow-sm border"
                                style={{
                                    background: 'var(--bg-input)',
                                    borderColor: 'var(--border)'
                                }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                                item.type === 'breakdown'
                                                    ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                                                    : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                            }`}>
                                                {item.type === 'breakdown' ? t.breakdownType : t.estimatorType}
                                            </span>

                                            {editingId === item.id ? (
                                                <div className="flex items-center gap-1 flex-1">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="w-full px-3 py-1.5 rounded-lg border text-sm font-medium focus:outline-none"
                                                        style={{
                                                            background: 'var(--bg-card)',
                                                            borderColor: 'var(--primary)',
                                                            color: 'var(--text-primary)'
                                                        }}
                                                        placeholder={t.enterNamePlaceholder}
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveEditing(item.id);
                                                            if (e.key === 'Escape') cancelEditing();
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); saveEditing(item.id); }}
                                                        className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                                                        className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 min-w-0 group">
                                                    {item.name ? (
                                                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                                            {item.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm italic truncate" style={{ color: 'var(--text-secondary)' }}>
                                                            {t.untitledRecord}
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); startEditing(item); }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 transition-opacity text-slate-400 hover:text-amber-500"
                                                        title={t.editNameBtn || "Edit Name"}
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs ms-1" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                                            {formatDate(item.timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 ms-2">
                                        <button
                                            onClick={() => { onRestore(item); onClose(); }}
                                            className="p-1.5 rounded-lg transition-colors hover:text-amber-500 hover:bg-amber-500/10"
                                            style={{ color: 'var(--text-secondary)' }}
                                            title={t.restoreBtn}
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(item.id)}
                                            className="p-1.5 rounded-lg transition-colors hover:text-red-500 hover:bg-red-500/10"
                                            style={{ color: 'var(--text-secondary)' }}
                                            title={t.deleteBtn}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm pt-1">
                                    <div>
                                        <span className="text-xs block" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>{t.goldPrice}</span>
                                        <span className="font-numbers font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.inputs.goldPrice)}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs block" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>{t.weight}</span>
                                        <span className="font-numbers font-medium" style={{ color: 'var(--text-primary)' }}>{item.inputs.weight}g</span>
                                    </div>
                                    {item.type === 'breakdown' && (
                                        <div className="col-span-2">
                                            <span className="text-xs block" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>{t.itemPrice}</span>
                                            <span className="font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.inputs.itemPrice || 0)} {item.currency}</span>
                                        </div>
                                    )}
                                    {item.type === 'estimator' && (
                                        <div className="col-span-2 font-bold">
                                            <span className="text-xs block font-normal" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>{t.totalPrice}</span>
                                            <span className="font-numbers" style={{ color: 'var(--primary)' }}>{formatCurrency(item.results.totalPrice || 0)} {item.currency}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {history.length > 0 && (
                    <button
                        onClick={onClear}
                        className="w-full mt-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-500/20"
                    >
                        <Trash2 size={16} />
                        {t.clearHistory}
                    </button>
                )}
            </div>
        </div>
    );
};

export default HistoryModal;
