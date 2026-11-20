import React, { useState } from 'react';
import { X, Trash2, RotateCcw, Clock, Edit2, Check } from 'lucide-react';
import { translations, Language } from '../utils/translations';
import { formatCurrency } from '../utils/calculations';
import { HistoryItem } from '../hooks/useHistory';
import BottomSheet from './BottomSheet';

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
        <BottomSheet isOpen={isOpen} onClose={onClose} maxWidthClass="sm:max-w-md" ariaLabel={t.historyTitle}>
            <div className="flex justify-between items-center px-5 py-4 sm:p-6 sm:pb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Clock size={20} style={{ color: 'var(--primary)' }} />
                    {t.historyTitle}
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

            <div className="flex-grow overflow-y-auto space-y-3 p-5 sm:p-6 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="text-center py-10" style={{ color: 'var(--text-secondary)' }}>
                        <Clock size={44} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm">{t.noHistory}</p>
                    </div>
                ) : (
                    history.map(item => (
                        <div
                            key={item.id}
                            className="rounded-2xl p-3.5 transition-colors shadow-sm border"
                            style={{
                                background: 'var(--bg-input)',
                                borderColor: 'var(--border)'
                            }}
                        >
                            <div className="flex justify-between items-start mb-2 gap-2">
                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className="text-xs font-bold whitespace-nowrap"
                                            style={{ color: item.type === 'breakdown' ? 'var(--primary)' : 'var(--craft-accent)' }}
                                        >
                                            {item.type === 'breakdown' ? t.breakdownType : t.estimatorType}
                                        </span>
                                        <span aria-hidden="true" className="text-xs opacity-40">·</span>

                                        {editingId === item.id ? (
                                            <div className="flex items-center gap-1 flex-1">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border text-sm font-medium focus:outline-none"
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
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); saveEditing(item.id); }}
                                                    className="min-w-[40px] min-h-[40px] flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                                                    aria-label="Save name"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                                                    className="min-w-[40px] min-h-[40px] flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-lg"
                                                    aria-label="Cancel rename"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 min-w-0">
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
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); startEditing(item); }}
                                                    className="p-1.5 opacity-60 hover:opacity-100 rounded-lg transition-opacity"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                    title={t.editNameBtn || "Edit Name"}
                                                    aria-label={t.editNameBtn || "Edit Name"}
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                                        {formatDate(item.timestamp)}
                                    </span>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => { onRestore(item); onClose(); }}
                                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
                                        style={{ color: 'var(--primary)' }}
                                        title={t.restoreBtn}
                                        aria-label={t.restoreBtn}
                                    >
                                        <RotateCcw size={17} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(item.id)}
                                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors hover:text-red-500 hover:bg-red-500/10 active:scale-95"
                                        style={{ color: 'var(--text-secondary)' }}
                                        title={t.deleteBtn}
                                        aria-label={t.deleteBtn}
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
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
                <div className="p-5 sm:p-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))] border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                    <button
                        type="button"
                        onClick={onClear}
                        className="w-full min-h-[46px] py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-500/20"
                    >
                        <Trash2 size={16} />
                        {t.clearHistory}
                    </button>
                </div>
            )}
        </BottomSheet>
    );
};

export default HistoryModal;
