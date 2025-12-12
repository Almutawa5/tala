import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import InputGroup from './InputGroup';
import { calculateBreakdown, formatCurrency } from '../utils/calculations';
import { translations } from '../utils/translations';

import { Settings } from '../hooks/useSettings';
import { HistoryItem } from '../hooks/useHistory';

interface BreakdownViewProps {
    settings: Settings;
    livePrice: number;
    setLivePriceTrigger: React.Dispatch<React.SetStateAction<((price: string) => void) | null>>;
    onSave: (type: 'breakdown', inputs: any, results: any) => void;
    restoredData: HistoryItem | null;
}

const BreakdownView: React.FC<BreakdownViewProps> = ({ settings, setLivePriceTrigger, onSave, restoredData }) => {
    const t = translations[settings.language];
    const [inputs, setInputs] = useState({
        goldPrice: 0,
        itemPrice: 0,
        weight: 0
    });
    const [showSaved, setShowSaved] = useState(false);

    // Handle restored data
    useEffect(() => {
        if (restoredData && restoredData.type === 'breakdown') {
            setInputs({
                goldPrice: restoredData.inputs.goldPrice || 0,
                itemPrice: restoredData.inputs.itemPrice || 0,
                weight: restoredData.inputs.weight || 0
            });
        }
    }, [restoredData]);
    const [results, setResults] = useState({
        vatAmount: 0,
        priceNoVat: 0,
        rawGoldCost: 0,
        totalMaking: 0,
        makingPerGram: 0
    });

    // Update inputs when live price is triggered from parent
    useEffect(() => {
        if (setLivePriceTrigger) {
            setLivePriceTrigger(() => (price: string) => {
                setInputs(prev => ({ ...prev, goldPrice: parseFloat(price) }));
            });
        }
    }, [setLivePriceTrigger]);

    useEffect(() => {
        const res = calculateBreakdown(
            inputs.goldPrice,
            inputs.itemPrice,
            inputs.weight,
            settings.vatPercentage
        );
        setResults(res);
    }, [inputs, settings.vatPercentage]);

    const handleChange = (field: keyof typeof inputs, value: string | number) => {
        setInputs(prev => ({ ...prev, [field]: parseFloat(value.toString()) || 0 }));
    };

    const handleSave = () => {
        onSave('breakdown', inputs, results);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 space-y-6 flex-grow">
                <InputGroup
                    id="goldPrice"
                    label={t.goldPrice}
                    subLabel={t.dailyPrice}
                    value={inputs.goldPrice}
                    onChange={(val) => handleChange('goldPrice', val)}
                    max={100}
                />
                <InputGroup
                    id="itemPrice"
                    label={settings.language === 'en' ? `Item Price (with ${settings.vatPercentage}% VAT)` : `سعر القطعة (مع ${settings.vatPercentage}% ضريبة)`}
                    subLabel={t.totalPrice}
                    value={inputs.itemPrice}
                    onChange={(val) => handleChange('itemPrice', val)}
                    max={1000}
                    step={1}
                />
                <InputGroup
                    id="weight"
                    label={t.weight}
                    subLabel={t.netWeight}
                    value={inputs.weight}
                    onChange={(val) => handleChange('weight', val)}
                    max={50}
                />
            </div>

            <div className="bg-slate-900 p-6 text-white border-t border-slate-800 mt-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gold-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gold-500"></span>
                        <span>{t.breakdown}</span>
                    </h3>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-gold-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {showSaved ? (
                            <span className="text-emerald-400">{t.savedSuccess}</span>
                        ) : (
                            <>
                                <Save size={14} />
                                <span>{t.saveBtn}</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                        <span className="text-slate-400 text-sm">
                            {settings.language === 'en' ? `VAT Amount (${settings.vatPercentage}%)` : `قيمة الضريبة (${settings.vatPercentage}%)`}
                        </span>
                        <span className="font-mono text-lg font-medium text-white">{formatCurrency(results.vatAmount)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                        <span className="text-slate-400 text-sm">{t.priceNoVat}</span>
                        <span className="font-mono text-lg font-medium text-white">{formatCurrency(results.priceNoVat)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                        <span className="text-slate-400 text-sm">{t.rawGold}</span>
                        <span className="font-mono text-lg font-medium text-gold-400">{formatCurrency(results.rawGoldCost)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                        <span className="text-slate-400 text-sm">{t.totalMaking}</span>
                        <span className="font-mono text-lg font-medium text-emerald-400">{formatCurrency(results.totalMaking)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-400 text-sm">{t.makingPerGram}</span>
                        <span className="font-mono text-lg font-medium text-emerald-400">{formatCurrency(results.makingPerGram)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BreakdownView;
