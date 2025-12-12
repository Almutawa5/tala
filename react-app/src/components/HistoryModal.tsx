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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100 max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Clock size={20} className="text-gold-500" />
                        {t.historyTitle}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <Clock size={48} className="mx-auto mb-3 opacity-20" />
                            <p>{t.noHistory}</p>
                        </div>
                    ) : (
                        history.map(item => (
                            <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 hover:border-gold-200 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${item.type === 'breakdown' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {item.type === 'breakdown' ? t.breakdownType : t.estimatorType}
                                            </span>

                                            {editingId === item.id ? (
                                                <div className="flex items-center gap-1 flex-1">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-6 text-sm px-2 rounded border border-gold-300 focus:outline-none focus:border-gold-500 w-full min-w-[100px]"
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
                                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 min-w-0 group">
                                                    {item.name ? (
                                                        <span className="text-sm font-semibold text-slate-800 truncate">
                                                            {item.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-slate-400 italic truncate">
                                                            {t.untitledRecord}
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); startEditing(item); }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-gold-500 transition-opacity"
                                                        title={t.editNameBtn || "Edit Name"}
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400 rtl:mr-1">{formatDate(item.timestamp)}</span>
                                    </div>
                                    <div className="flex gap-1 ml-2 rtl:ml-0 rtl:mr-2">
                                        <button
                                            onClick={() => { onRestore(item); onClose(); }}
                                            className="p-1.5 text-slate-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                                            title={t.restoreBtn}
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(item.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title={t.deleteBtn}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-slate-600">
                                        <span className="text-xs text-slate-400 block">{t.goldPrice}</span>
                                        {formatCurrency(item.inputs.goldPrice)}
                                    </div>
                                    <div className="text-slate-600">
                                        <span className="text-xs text-slate-400 block">{t.weight}</span>
                                        {item.inputs.weight}g
                                    </div>
                                    {item.type === 'breakdown' && (
                                        <div className="text-slate-600 col-span-2">
                                            <span className="text-xs text-slate-400 block">{t.itemPrice}</span>
                                            {formatCurrency(item.inputs.itemPrice || 0)} {item.currency}
                                        </div>
                                    )}
                                    {item.type === 'estimator' && (
                                        <div className="text-slate-900 font-bold col-span-2">
                                            <span className="text-xs text-slate-400 block font-normal">{t.totalPrice}</span>
                                            {formatCurrency(item.results.totalPrice || 0)} {item.currency}
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
                        className="w-full mt-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
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
