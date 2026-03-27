import React, { useState, useEffect } from 'react';
import { Calculator, Save, RefreshCw } from 'lucide-react';
import { calculateBreakdown, formatCurrency } from '../utils/calculations';
import { translations } from '../utils/translations';
import { trackEvent } from '../utils/analytics';
import ShareButton from './ShareButton';
import { Settings } from '../hooks/useSettings';
import { HistoryItem } from '../hooks/useHistory';

interface BreakdownViewProps {
    settings: Settings;
    livePrice: number;
    setLivePriceTrigger: React.Dispatch<React.SetStateAction<((price: string) => void) | null>>;
    onSave: (type: 'breakdown', inputs: any, results: any) => void;
    restoredData: HistoryItem | null;
}

const BreakdownView: React.FC<BreakdownViewProps> = ({ settings, livePrice, setLivePriceTrigger, onSave, restoredData }) => {
    const t = translations[settings.language];
    const curr = settings.currency;

    const [inputs, setInputs] = useState({ goldPrice: 0, itemPrice: 0, weight: 0 });
    const [showSaved, setShowSaved] = useState(false);
    const [results, setResults] = useState({ vatAmount: 0, priceNoVat: 0, rawGoldCost: 0, totalMaking: 0, makingPerGram: 0 });
    const isRtl = settings.language === 'ar';

    useEffect(() => {
        if (restoredData && restoredData.type === 'breakdown') {
            setInputs({
                goldPrice: restoredData.inputs.goldPrice || 0,
                itemPrice: restoredData.inputs.itemPrice || 0,
                weight: restoredData.inputs.weight || 0,
            });
        }
    }, [restoredData]);

    useEffect(() => {
        if (setLivePriceTrigger) {
            setLivePriceTrigger(() => (price: string) => {
                setInputs(prev => ({ ...prev, goldPrice: parseFloat(price) }));
            });
        }
    }, [setLivePriceTrigger]);

    useEffect(() => {
        const res = calculateBreakdown(inputs.goldPrice, inputs.itemPrice, inputs.weight, settings.vatPercentage);
        setResults(res);
    }, [inputs, settings.vatPercentage]);

    const handleChange = (field: keyof typeof inputs, value: string) => {
        setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleSave = () => {
        onSave('breakdown', inputs, results);
        trackEvent('save_clicked', { type: 'breakdown', inputs, results });
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    const handleUseLive = () => {
        const roundedPrice = Math.ceil(livePrice * 100) / 100;
        setInputs(prev => ({ ...prev, goldPrice: roundedPrice }));
    };

    return (
        <div id="breakdown-view" className={`flex flex-col lg:flex-row h-full gap-0 ${isRtl ? 'lg:flex-row-reverse' : ''}`}>

            {/* ── LEFT: Parameters ── */}
            <div className="lg:w-[55%] p-7 lg:p-8 space-y-7">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                        <Calculator size={18} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                            {isRtl ? 'المدخلات' : 'Parameters'}
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? 'أدخل تفاصيل القطعة' : 'Enter your jewelry details'}
                        </p>
                    </div>
                </div>

                {/* Gold price input */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {t.goldPrice}
                    </label>
                    <div className="flex items-center gap-3">
                        <div
                            className="flex-1 flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]"
                            style={{ background: 'var(--bg-input)' }}
                        >
                            <span className="text-xl font-semibold font-numbers" style={{ color: 'var(--text-secondary)' }}>
                                {curr}
                            </span>
                            <input
                                type="number"
                                value={inputs.goldPrice || ''}
                                onChange={e => handleChange('goldPrice', e.target.value)}
                                placeholder="0.00"
                                className="flex-1 bg-transparent outline-none text-xl font-semibold font-numbers"
                                style={{ color: 'var(--text-primary)' }}
                            />
                        </div>
                        <button
                            onClick={handleUseLive}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:text-[#e8c43d] transition-colors whitespace-nowrap"
                        >
                            <RefreshCw size={13} />
                            {isRtl ? 'السعر المباشر' : 'Get Live'}
                        </button>
                    </div>
                </div>

                {/* Item price input */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {isRtl ? `سعر القطعة (مع ${settings.vatPercentage}% ضريبة)` : `Item Price (incl. ${settings.vatPercentage}% VAT)`}
                    </label>
                    <div
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]"
                        style={{ background: 'var(--bg-input)' }}
                    >
                        <span className="text-xl font-semibold font-numbers" style={{ color: 'var(--text-secondary)' }}>
                            {curr}
                        </span>
                        <input
                            type="number"
                            value={inputs.itemPrice || ''}
                            onChange={e => handleChange('itemPrice', e.target.value)}
                            placeholder="0.00"
                            className="flex-1 bg-transparent outline-none text-xl font-semibold font-numbers"
                            style={{ color: 'var(--text-primary)' }}
                        />
                    </div>
                </div>

                {/* Weight input */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {t.weight}
                    </label>
                    <div
                        className="flex items-center rounded-2xl px-4 py-3 transition-all duration-200 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]"
                        style={{ background: 'var(--bg-input)' }}
                    >
                        <input
                            type="number"
                            value={inputs.weight || ''}
                            onChange={e => handleChange('weight', e.target.value)}
                            placeholder="0.00"
                            className="flex-1 bg-transparent outline-none text-xl font-semibold font-numbers"
                            style={{ color: 'var(--text-primary)' }}
                        />
                        <span className="text-sm font-bold ml-2" style={{ color: 'var(--text-secondary)' }}>g</span>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Results dark panel ── */}
            <div
                className="lg:w-[45%] flex flex-col rounded-b-3xl lg:rounded-none lg:rounded-e-3xl overflow-hidden"
                style={{ background: 'linear-gradient(165deg, #111318 0%, #1a1d26 100%)' }}
            >
                {/* Top area: hero value */}
                <div className="p-7 lg:p-8 flex-1">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                {isRtl ? 'تفاصيل المصنعية' : 'MAKING CHARGE'}
                            </p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                {isRtl ? 'بناءً على بيانات المدخلات' : 'Based on your inputs'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <ShareButton elementId="breakdown-view" language={settings.language} calculationType={t.breakdown} />
                        </div>
                    </div>

                    {/* Hero: making per gram */}
                    <div className="mb-6">
                        <div className="flex items-start gap-4">
                            <span className="text-xl font-bold mt-3" style={{ color: '#D4AF37' }}>{curr}</span>
                            <span className="font-numbers text-6xl font-extrabold leading-none" style={{ color: '#ffffff' }}>
                                {results.makingPerGram.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <p className="text-xs mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {isRtl ? 'مصنعية / جرام' : 'Making per gram'}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="border-t mb-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                    {/* Detail rows */}
                    <div className="space-y-4">
                        <ResultLine label={isRtl ? 'سعر بدون ضريبة' : 'Price w/o VAT'} value={`${curr} ${formatCurrency(results.priceNoVat)}`} />
                        <ResultLine label={isRtl ? `الضريبة (${settings.vatPercentage}%)` : `VAT (${settings.vatPercentage}%)`} value={`${curr} ${formatCurrency(results.vatAmount)}`} />
                        <ResultLine label={isRtl ? 'تكلفة الذهب الخام' : 'Raw Gold Cost'} value={`${curr} ${formatCurrency(results.rawGoldCost)}`} valueColor="#D4AF37" />
                        <ResultLine label={isRtl ? 'إجمالي المصنعية' : 'Total Making'} value={`${curr} ${formatCurrency(results.totalMaking)}`} valueColor="#34d399" />
                    </div>
                </div>

                {/* Bottom: Save button */}
                <div className="p-5 pt-0">
                    <button
                        onClick={handleSave}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                        style={{
                            background: showSaved ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)',
                            color: showSaved ? '#34d399' : 'rgba(255,255,255,0.7)',
                        }}
                    >
                        <Save size={15} />
                        {showSaved ? (isRtl ? 'تم الحفظ ✓' : 'Saved ✓') : (isRtl ? 'حفظ في السجل' : 'Save to History')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ResultLine: React.FC<{ label: string; value: string; valueColor?: string }> = ({ label, value, valueColor }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
        <span className="text-sm font-numbers font-semibold" style={{ color: valueColor || 'rgba(255,255,255,0.75)' }}>{value}</span>
    </div>
);

export default BreakdownView;
