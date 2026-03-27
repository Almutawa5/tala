import React, { useState, useEffect } from 'react';
import { Calculator, Save, RefreshCw } from 'lucide-react';
import { calculateEstimator, formatCurrency } from '../utils/calculations';
import { translations } from '../utils/translations';
import { trackEvent } from '../utils/analytics';
import ShareButton from './ShareButton';
import { Settings } from '../hooks/useSettings';
import { HistoryItem } from '../hooks/useHistory';

interface EstimatorViewProps {
    settings: Settings;
    livePrice: number;
    setLivePriceTrigger: React.Dispatch<React.SetStateAction<((price: string) => void) | null>>;
    onSave: (type: 'estimator', inputs: any, results: any) => void;
    restoredData: HistoryItem | null;
}

const KARAT_OPTIONS = [24, 22, 21, 18, 14, 10, 9];

const EstimatorView: React.FC<EstimatorViewProps> = ({ settings, livePrice, setLivePriceTrigger, onSave, restoredData }) => {
    const t = translations[settings.language];
    const isRtl = settings.language === 'ar';
    const curr = settings.currency;

    const [inputs, setInputs] = useState({ goldPrice: 0, weight: 0, makingPerGram: 0 });
    const [selectedKarat, setSelectedKarat] = useState<number>(
        typeof settings.karat === 'number' ? settings.karat : parseInt(settings.karat as string) || 18
    );
    const [showSaved, setShowSaved] = useState(false);
    const [results, setResults] = useState({ rawGoldCost: 0, totalMaking: 0, vatAmount: 0, totalPrice: 0 });

    useEffect(() => {
        if (restoredData && restoredData.type === 'estimator') {
            setInputs({
                goldPrice: restoredData.inputs.goldPrice || 0,
                weight: restoredData.inputs.weight || 0,
                makingPerGram: restoredData.inputs.makingPerGram || 0,
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
        const res = calculateEstimator(inputs.goldPrice, inputs.weight, inputs.makingPerGram, settings.vatPercentage);
        setResults(res);
    }, [inputs, settings.vatPercentage]);

    const handleChange = (field: keyof typeof inputs, value: string) => {
        setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleUseLive = () => {
        const roundedPrice = Math.ceil(livePrice * 100) / 100;
        setInputs(prev => ({ ...prev, goldPrice: roundedPrice }));
    };

    const handleSave = () => {
        onSave('estimator', inputs, results);
        trackEvent('save_clicked', { type: 'estimator', inputs, results });
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    return (
        <div id="estimator-view" className={`flex flex-col lg:flex-row h-full gap-0 ${isRtl ? 'lg:flex-row-reverse' : ''}`}>

            {/* ── LEFT: Parameters ── */}
            <div className="lg:w-[55%] p-7 lg:p-8 space-y-6">
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
                            {isRtl ? 'أدخل تفاصيل المجوهرات' : 'Enter your jewelry details'}
                        </p>
                    </div>
                </div>

                {/* Weight */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-secondary)' }}>
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
                        <span className="ml-2 text-sm font-bold px-3 py-1 rounded-xl" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>g</span>
                    </div>
                </div>

                {/* Karat selector */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-secondary)' }}>
                        {isRtl ? 'العيار (قيراط)' : 'Purity (Karat)'}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {KARAT_OPTIONS.map(k => {
                            const isActive = selectedKarat === k;
                            return (
                                <button
                                    key={k}
                                    onClick={() => setSelectedKarat(k)}
                                    className="py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
                                    style={isActive ? {
                                        background: 'rgba(212,175,55,0.1)',
                                        border: '1.5px solid #D4AF37',
                                        color: '#D4AF37'
                                    } : {
                                        background: 'var(--bg-input)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    {k}K
                                </button>
                            );
                        })}
                        <div />
                    </div>
                </div>

                {/* Gold spot price */}
                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? `سعر الذهب (${settings.currency}/جم)` : `Gold Spot Price (${settings.currency}/g)`}
                        </label>
                        <button
                            onClick={handleUseLive}
                            className="flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:text-[#e8c43d] transition-colors"
                        >
                            <RefreshCw size={11} />
                            {isRtl ? 'السعر المباشر' : 'Get Live Price'}
                        </button>
                    </div>
                    <div
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]"
                        style={{ background: 'var(--bg-input)' }}
                    >
                        <span className="text-xl font-semibold font-numbers" style={{ color: 'var(--text-secondary)' }}>{curr}</span>
                        <input
                            type="number"
                            value={inputs.goldPrice || ''}
                            onChange={e => handleChange('goldPrice', e.target.value)}
                            placeholder="0.00"
                            className="flex-1 bg-transparent outline-none text-xl font-semibold font-numbers"
                            style={{ color: 'var(--text-primary)' }}
                        />
                    </div>
                </div>

                {/* Making per gram */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-secondary)' }}>
                        {t.makingPerGramInput}
                    </label>
                    <div
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]"
                        style={{ background: 'var(--bg-input)' }}
                    >
                        <span className="text-xl font-semibold font-numbers" style={{ color: 'var(--text-secondary)' }}>{curr}</span>
                        <input
                            type="number"
                            value={inputs.makingPerGram || ''}
                            onChange={e => handleChange('makingPerGram', e.target.value)}
                            placeholder="0.00"
                            className="flex-1 bg-transparent outline-none text-xl font-semibold font-numbers"
                            style={{ color: 'var(--text-primary)' }}
                        />
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Results dark panel ── */}
            <div
                className="lg:w-[45%] flex flex-col rounded-b-3xl lg:rounded-none lg:rounded-e-3xl overflow-hidden"
                style={{ background: 'linear-gradient(165deg, #111318 0%, #1a1d26 100%)' }}
            >
                <div className="p-7 lg:p-8 flex-1">
                    {/* Panel header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                {isRtl ? 'القيمة التقديرية' : 'ESTIMATED VALUE'}
                            </p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                {isRtl ? 'بناءً على سعر السوق الحالي' : 'Based on current market price'}
                            </p>
                        </div>
                        <ShareButton elementId="estimator-view" language={settings.language} calculationType={t.estimatedPrice} />
                    </div>

                    {/* Hero: total price */}
                    <div className="mb-6">
                        <div className="flex items-start gap-4">
                            <span className="text-xl font-bold mt-3" style={{ color: '#D4AF37' }}>{curr}</span>
                            <span className="font-numbers text-6xl font-extrabold leading-none" style={{ color: '#ffffff' }}>
                                {results.totalPrice.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t mb-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                    {/* Detail rows */}
                    <div className="space-y-4">
                        <ResultLine label={isRtl ? 'تكلفة الذهب الخام' : 'Raw Gold Cost'} value={`${curr} ${formatCurrency(results.rawGoldCost)}`} valueColor="#D4AF37" />
                        <ResultLine label={isRtl ? 'إجمالي المصنعية' : 'Total Making'} value={`${curr} ${formatCurrency(results.totalMaking)}`} valueColor="#34d399" />
                        <ResultLine
                            label={isRtl ? `الضريبة (${settings.vatPercentage}%)` : `VAT (${settings.vatPercentage}%)`}
                            value={`${curr} ${formatCurrency(results.vatAmount)}`}
                        />
                        <ResultLine
                            label={isRtl ? 'حالة السوق' : 'Market Status'}
                            badge={{ text: 'LIVE', color: '#34d399' }}
                        />
                    </div>
                </div>

                {/* Save button */}
                <div className="p-5 pt-0">
                    <button
                        onClick={handleSave}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                        style={{
                            background: showSaved ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)',
                            color: showSaved ? '#34d399' : 'rgba(255,255,255,0.7)',
                            border: 'none'
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

interface ResultLineProps {
    label: string;
    value?: string;
    valueColor?: string;
    badge?: { text: string; color: string };
}

const ResultLine: React.FC<ResultLineProps> = ({ label, value, valueColor, badge }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
        {badge ? (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md" style={{ background: `${badge.color}22`, color: badge.color }}>
                {badge.text}
            </span>
        ) : (
            <span className="text-sm font-numbers font-semibold" style={{ color: valueColor || 'rgba(255,255,255,0.75)' }}>
                {value}
            </span>
        )}
    </div>
);

export default EstimatorView;
