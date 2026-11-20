import React, { useState, useEffect } from 'react';
import { Calculator, Save, X, Gem, Layers, TrendingUp, Activity, RotateCcw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateEstimator, formatCurrency, getDealRating, getMakingTiers, getMarketBenchmark } from '../utils/calculations';
import { translations } from '../utils/translations';
import { trackEvent } from '../utils/analytics';
import ShareButton, { ShareCardData } from './ShareButton';
import { Settings } from '../hooks/useSettings';
import { HistoryItem } from '../hooks/useHistory';
import ValidationMessages from './ValidationMessages';
import { getCommonInputWarnings, getGoldPriceWarnings, getMakingChargeWarnings, getWeightWarnings, hasErrors } from '../utils/validation';

interface EstimatorViewProps {
    settings: Settings;
    livePrice: number;
    setLivePriceTrigger: React.Dispatch<React.SetStateAction<((price: string) => void) | null>>;
    onSave: (type: 'estimator', inputs: any, results: any) => void;
    restoredData: HistoryItem | null;
    sharedInputs: { goldPrice: number; itemPrice: number; weight: number; makingPerGram: number };
    setSharedInputs: React.Dispatch<React.SetStateAction<{ goldPrice: number; itemPrice: number; weight: number; makingPerGram: number }>>;
}

const EstimatorView: React.FC<EstimatorViewProps> = ({ settings, livePrice, setLivePriceTrigger, onSave, restoredData, sharedInputs, setSharedInputs }) => {
    const t = translations[settings.language];
    const isRtl = settings.language === 'ar';
    const curr = settings.currency;

    const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
    const [showDetails, setShowDetails] = useState(false);
    const [suggestFlash, setSuggestFlash] = useState(false);

    const inputs = sharedInputs;
    const setInputs = setSharedInputs;
    const dealRating = getDealRating(inputs.makingPerGram, inputs.goldPrice, settings.language as 'en' | 'ar');
    const [lastFilledLivePrice, setLastFilledLivePrice] = useState<number>(0);
    const [forcePrefill, setForcePrefill] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [results, setResults] = useState({ rawGoldCost: 0, totalMaking: 0, vatAmount: 0, totalPrice: 0 });

    const validationMessages = [
        ...getCommonInputWarnings({
            goldPrice: inputs.goldPrice,
            weight: inputs.weight,
            makingPerGram: inputs.makingPerGram
        }, {
            goldPrice: isRtl ? 'سعر الذهب' : 'Gold price',
            weight: isRtl ? 'الوزن' : 'Weight',
            makingPerGram: isRtl ? 'المصنعية للجرام' : 'Making charge per gram'
        }, settings.language),
        ...getGoldPriceWarnings(inputs.goldPrice, settings.language),
        ...getWeightWarnings(inputs.weight, settings.language),
        ...getMakingChargeWarnings(inputs.makingPerGram, inputs.goldPrice, settings.language)
    ];
    const hasValidationErrors = hasErrors(validationMessages);

    useEffect(() => {
        const roundedPrice = Math.ceil(livePrice * 100) / 100;
        if (livePrice > 0 && (inputs.goldPrice === 0 || inputs.goldPrice === lastFilledLivePrice || forcePrefill)) {
            setInputs(prev => ({ ...prev, goldPrice: roundedPrice }));
            setLastFilledLivePrice(roundedPrice);
            setForcePrefill(false);
        }
    }, [livePrice, inputs.goldPrice, lastFilledLivePrice, forcePrefill]);

    useEffect(() => {
        if (restoredData && restoredData.type === 'estimator') {
            setInputs({
                goldPrice: restoredData.inputs.goldPrice || 0,
                weight: restoredData.inputs.weight || 0,
                makingPerGram: restoredData.inputs.makingPerGram || 0,
                itemPrice: restoredData.inputs.itemPrice || 0
            });
            setLastFilledLivePrice(0);
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
        const roundedTotal = Math.round(res.totalPrice * 100) / 100;
        if (Math.abs(roundedTotal - inputs.itemPrice) > 0.001) {
            setInputs(prev => ({ ...prev, itemPrice: roundedTotal }));
        }
    }, [inputs.goldPrice, inputs.weight, inputs.makingPerGram, settings.vatPercentage]);

    const handleChange = (field: keyof typeof inputs, value: string) => {
        setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleStep = (field: keyof typeof inputs, step: number) => {
        setInputs(prev => {
            const currentVal = prev[field] || 0;
            const newVal = Math.max(0, Math.round((currentVal + step) * 100) / 100);
            return { ...prev, [field]: newVal };
        });
    };

    const handleClear = (field: keyof typeof inputs) => {
        setInputs(prev => ({ ...prev, [field]: 0 }));
    };

    const handleResetPiece = () => {
        setInputs(prev => ({ ...prev, weight: 0, makingPerGram: 0, itemPrice: 0 }));
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

    const handleSuggestMaking = () => {
        const tiers = getMakingTiers(curr);
        const standard = tiers[1]; // "Standard" tier
        setInputs(prev => ({ ...prev, makingPerGram: standard.value }));
        setSuggestFlash(true);
        setTimeout(() => setSuggestFlash(false), 2000);
    };

    const isComplete = inputs.goldPrice > 0 && inputs.weight > 0 && inputs.makingPerGram > 0;

    // Calculate ratio
    const netBase = results.rawGoldCost + results.totalMaking;
    const rawGoldPct = netBase > 0
        ? Math.min(100, Math.max(0, Math.round((results.rawGoldCost / netBase) * 100)))
        : 0;
    const makingPct = netBase > 0
        ? Math.max(0, 100 - rawGoldPct)
        : 0;

    // Price range: estimate total price across all tiers (when weight & goldPrice filled)
    const makingTiers = getMakingTiers(curr);
    const canShowRange = inputs.goldPrice > 0 && inputs.weight > 0;
    const priceRange = canShowRange
        ? makingTiers.map(tier => ({
            ...tier,
            totalPrice: calculateEstimator(inputs.goldPrice, inputs.weight, tier.value, settings.vatPercentage).totalPrice
        }))
        : null;

    // Market benchmark for current making charge
    const benchmark = getMarketBenchmark(inputs.makingPerGram, curr);

    return (
        <div id="estimator-view" className={`flex flex-col lg:flex-row h-full gap-0 pb-24 lg:pb-0 ${isRtl ? 'lg:flex-row-reverse' : ''}`}>
            {/* ── LEFT: Parameters ── */}
            <div className="lg:w-[55%] p-4 sm:p-8 lg:p-10 space-y-5">

                {/* Section header & Mode Switcher */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                            <Calculator size={18} className="text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {isRtl ? 'احسب السعر التقديري' : 'Estimate Jewelry Price'}
                            </h2>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                {isRtl ? 'توقع تكلفة القطعة قبل الشراء' : 'Calculate expected price before buying'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ms-auto">
                        {/* Quick / Detailed Mode Toggle */}
                        <div className="p-0.5 rounded-xl border flex items-center" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                            <button
                                type="button"
                                onClick={() => setMode('quick')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    mode === 'quick' ? 'bg-amber-500 text-slate-900 shadow-sm' : 'opacity-60 hover:opacity-100'
                                }`}
                                style={mode !== 'quick' ? { color: 'var(--text-secondary)' } : {}}
                            >
                                {t.simpleMode}
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('detailed')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    mode === 'detailed' ? 'bg-amber-500 text-slate-900 shadow-sm' : 'opacity-60 hover:opacity-100'
                                }`}
                                style={mode !== 'detailed' ? { color: 'var(--text-secondary)' } : {}}
                            >
                                {t.detailedMode}
                            </button>
                        </div>

                        {/* Reset Piece button */}
                        {(inputs.weight > 0 || inputs.makingPerGram > 0) && (
                            <button
                                type="button"
                                onClick={handleResetPiece}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border"
                                style={{
                                    background: 'var(--bg-input)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-primary)'
                                }}
                                title={t.newPieceTooltip}
                            >
                                <RotateCcw size={13} className="text-amber-500" />
                                <span>{t.newPiece}</span>
                            </button>
                        )}
                    </div>
                </div>

                <ValidationMessages messages={validationMessages} />

                {/* ── Quick Mode: Live Gold Spot Pill ── */}
                {mode === 'quick' && (
                    <div
                        className="flex items-center justify-between p-3 rounded-2xl border transition-all"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                {isRtl ? 'سعر الذهب المعتمد:' : 'Gold Spot Rate:'}
                            </span>
                            <span className="font-numbers font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                {inputs.goldPrice > 0 ? formatCurrency(inputs.goldPrice) : (livePrice > 0 ? formatCurrency(livePrice) : '—')} {curr}/g
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setMode('detailed')}
                            className="text-xs font-bold text-amber-500 hover:underline"
                        >
                            {isRtl ? 'تغيير' : 'Edit'}
                        </button>
                    </div>
                )}

                {/* ── Detailed Mode: Gold Price Input ── */}
                {mode === 'detailed' && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                {isRtl ? `سعر جرام الذهب (${curr})` : `Gold Spot Price (${curr}/g)`}
                            </label>
                            {livePrice > 0 && (
                                <button
                                    type="button"
                                    onClick={handleUseLive}
                                    className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:underline"
                                >
                                    <Sparkles size={12} />
                                    <span>{isRtl ? 'تعبئة السعر المباشر' : 'Use Live Spot'}</span>
                                </button>
                            )}
                        </div>

                        <div
                            className="relative flex items-center rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-amber-500/20"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
                        >
                            <span className="ps-4 font-numbers text-sm font-bold text-slate-400 select-none">{curr}</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                onFocus={e => e.target.select()}
                                value={inputs.goldPrice || ''}
                                onChange={e => handleChange('goldPrice', e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-transparent py-3 px-3 text-lg sm:text-xl font-bold font-numbers outline-none"
                                style={{ color: 'var(--text-primary)' }}
                            />
                            {inputs.goldPrice > 0 && (
                                <button
                                    type="button"
                                    onClick={() => handleClear('goldPrice')}
                                    className="pe-3 text-slate-400 hover:text-slate-600 transition-colors"
                                    aria-label="Clear"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Weight Input ── */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? 'وزن القطعة (جرام)' : 'Item Weight (grams)'}
                        </label>
                        <span className="text-[11px] opacity-60" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? 'من الميزان' : 'From jewelry scale'}
                        </span>
                    </div>

                    <div
                        className="relative flex items-center rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-amber-500/20"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
                    >
                        <input
                            type="number"
                            inputMode="decimal"
                            onFocus={e => e.target.select()}
                            value={inputs.weight || ''}
                            onChange={e => handleChange('weight', e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-transparent py-3.5 px-4 text-xl sm:text-2xl font-bold font-numbers outline-none"
                            style={{ color: 'var(--text-primary)' }}
                        />
                        <span className="pe-3 text-xs font-bold px-2 py-1 rounded-lg uppercase select-none" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
                            g
                        </span>
                        {inputs.weight > 0 && (
                            <button
                                type="button"
                                onClick={() => handleClear('weight')}
                                className="pe-3 text-slate-400 hover:text-slate-600 transition-colors"
                                aria-label="Clear"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {[2, 5, 10, 20, 50].map((w) => (
                            <button
                                key={w}
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, weight: w }))}
                                className="px-2.5 py-1 rounded-lg text-xs font-numbers font-bold transition-all active:scale-95 border"
                                style={{
                                    background: inputs.weight === w ? 'var(--primary)' : 'var(--bg-input)',
                                    color: inputs.weight === w ? '#0F172A' : 'var(--text-primary)',
                                    borderColor: inputs.weight === w ? 'var(--primary)' : 'var(--border)'
                                }}
                            >
                                {w}g
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => handleStep('weight', 1)}
                            className="px-2 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 border opacity-75 hover:opacity-100"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        >
                            +1g
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStep('weight', 5)}
                            className="px-2 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 border opacity-75 hover:opacity-100"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        >
                            +5g
                        </button>
                    </div>
                </div>

                {/* ── Making Charge per Gram Input ── */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? `المصنعية للجرام (${curr})` : `Making Charge per gram (${curr})`}
                        </label>
                        <button
                            type="button"
                            onClick={handleSuggestMaking}
                            className="flex items-center gap-1 text-xs font-semibold transition-all active:scale-95"
                            style={{ color: suggestFlash ? '#10B981' : 'var(--primary)' }}
                        >
                            <Sparkles size={12} />
                            <span>{suggestFlash ? (isRtl ? t.fairMakingApplied : t.fairMakingApplied) : (isRtl ? t.suggestMaking : t.suggestMaking)}</span>
                        </button>
                    </div>

                    <div
                        className="relative flex items-center rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-amber-500/20"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
                    >
                        <span className="ps-4 font-numbers text-sm font-bold text-slate-400 select-none">{curr}</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            onFocus={e => e.target.select()}
                            value={inputs.makingPerGram || ''}
                            onChange={e => handleChange('makingPerGram', e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-transparent py-3.5 px-4 text-xl sm:text-2xl font-bold font-numbers outline-none"
                            style={{ color: 'var(--text-primary)' }}
                        />
                        {inputs.makingPerGram > 0 && (
                            <button
                                type="button"
                                onClick={() => handleClear('makingPerGram')}
                                className="pe-3 text-slate-400 hover:text-slate-600 transition-colors"
                                aria-label="Clear"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Curated Tiers */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 mr-1" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? 'فئات المصنعية:' : 'Making Tiers:'}
                        </span>
                        {(['BHD', 'KWD', 'OMR'].includes(curr)
                            ? [
                                { val: 1.5, lbl: isRtl ? 'بسيطة' : 'Simple' },
                                { val: 2.5, lbl: isRtl ? 'عادية' : 'Std' },
                                { val: 4.0, lbl: isRtl ? 'متقنة' : 'Detail' },
                                { val: 6.0, lbl: isRtl ? 'فاخرة' : 'Luxury' }
                            ]
                            : ['USD', 'EUR'].includes(curr)
                            ? [
                                { val: 5, lbl: isRtl ? 'بسيطة' : 'Simple' },
                                { val: 10, lbl: isRtl ? 'عادية' : 'Std' },
                                { val: 18, lbl: isRtl ? 'متقنة' : 'Detail' },
                                { val: 30, lbl: isRtl ? 'فاخرة' : 'Luxury' }
                            ]
                            : [
                                { val: 15, lbl: isRtl ? 'بسيطة' : 'Simple' },
                                { val: 25, lbl: isRtl ? 'عادية' : 'Std' },
                                { val: 40, lbl: isRtl ? 'متقنة' : 'Detail' },
                                { val: 60, lbl: isRtl ? 'فاخرة' : 'Luxury' }
                            ]
                        ).map(item => (
                            <button
                                key={item.val}
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, makingPerGram: item.val }))}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 border flex items-center gap-1"
                                style={{
                                    background: inputs.makingPerGram === item.val ? 'var(--primary)' : 'var(--bg-input)',
                                    color: inputs.makingPerGram === item.val ? '#0F172A' : 'var(--text-primary)',
                                    borderColor: inputs.makingPerGram === item.val ? 'var(--primary)' : 'var(--border)'
                                }}
                            >
                                <span className="font-numbers">{item.val}</span>
                                <span className="text-[10px] opacity-75">({item.lbl})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Price Range Panel (shown when weight + gold filled) ── */}
                {canShowRange && priceRange && (
                    <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                {isRtl ? t.priceRangeTitle : t.priceRangeTitle}
                            </span>
                            <span className="text-[10px] opacity-60" style={{ color: 'var(--text-secondary)' }}>
                                {isRtl ? t.priceRangeHint : t.priceRangeHint}
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            {priceRange.map((tier) => {
                                const isSelected = inputs.makingPerGram === tier.value;
                                return (
                                    <button
                                        key={tier.value}
                                        type="button"
                                        onClick={() => setInputs(prev => ({ ...prev, makingPerGram: tier.value }))}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all active:scale-[0.98]"
                                        style={{
                                            background: isSelected ? `${tier.color}18` : 'transparent',
                                            borderColor: isSelected ? tier.color : 'var(--border)',
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tier.color }} />
                                            <span className="text-xs font-bold" style={{ color: isSelected ? tier.color : 'var(--text-secondary)' }}>
                                                {isRtl ? tier.nameAr : tier.name}
                                            </span>
                                            <span className="text-[10px] font-numbers opacity-70" style={{ color: 'var(--text-secondary)' }}>
                                                ({curr} {tier.value}/g)
                                            </span>
                                        </div>
                                        <span className="font-numbers text-sm font-black" style={{ color: isSelected ? tier.color : 'var(--text-primary)' }}>
                                            {curr} {formatCurrency(tier.totalPrice)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ── RIGHT: Results dark panel ── */}
            <div
                id="estimator-results-card"
                className="lg:w-[45%] flex flex-col justify-between overflow-hidden"
                style={{ background: 'linear-gradient(165deg, #0F172A 0%, #1E293B 100%)' }}
            >
                <div className="p-5 sm:p-8 lg:p-10 flex-1">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1 text-slate-400">
                                {isRtl ? 'القيمة التقديرية' : 'ESTIMATED PRICE'}
                            </p>
                            <p className="text-xs text-slate-500">
                                {isRtl ? 'بناءً على سعر السوق الحالي' : 'Based on current market price'}
                            </p>
                        </div>
                        <ShareButton
                            elementId="estimator-view"
                            language={settings.language}
                            calculationType={t.estimatedPrice}
                            shareData={isComplete ? {
                                type: 'estimator',
                                currency: curr,
                                karat: `${settings.karat}K`,
                                goldPrice: inputs.goldPrice,
                                weight: inputs.weight,
                                vatPercentage: settings.vatPercentage,
                                makingPerGram: inputs.makingPerGram,
                                rawGoldCost: results.rawGoldCost,
                                totalMaking: results.totalMaking,
                                vatAmount: results.vatAmount,
                                totalPrice: results.totalPrice,
                                dealLabel: dealRating?.label,
                                dealColor: dealRating?.color,
                            } : undefined}
                        />
                    </div>

                    {/* Hero: total price */}
                    <div className="my-4">
                        <span className="text-xs font-medium text-slate-400 block mb-1">
                            {isRtl ? 'السعر الكلي المقدر (شامل الضريبة)' : `Total Estimated Price (incl. ${settings.vatPercentage}% VAT)`}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-amber-500">{curr}</span>
                            <span
                                className="font-numbers text-5xl sm:text-6xl font-black leading-none"
                                style={{ color: isComplete ? '#FFFFFF' : 'rgba(255,255,255,0.2)' }}
                            >
                                {isComplete
                                    ? results.totalPrice.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : '—'
                                }
                            </span>
                        </div>

                        {/* Deal Rating Badge */}
                        {dealRating && inputs.makingPerGram > 0 && inputs.goldPrice > 0 && (
                            <div
                                className="mt-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold animate-fade-in"
                                style={{
                                    backgroundColor: dealRating.bgColor,
                                    borderColor: dealRating.borderColor,
                                    color: dealRating.color
                                }}
                            >
                                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: dealRating.color }} />
                                <span>{dealRating.label}</span>
                                <span className="opacity-75 text-[10px] hidden sm:inline">• {dealRating.subtext}</span>
                            </div>
                        )}

                        {/* Market Benchmark row */}
                        {benchmark && inputs.makingPerGram > 0 && (
                            <div className="mt-3 flex items-center gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                <span>📊</span>
                                <span>
                                    {isRtl ? t.marketBenchmark : t.marketBenchmark}:&nbsp;
                                    <span className="font-numbers font-bold" style={{
                                        color: benchmark.deviation === 0 ? '#10B981' : benchmark.isAbove ? '#EF4444' : '#10B981'
                                    }}>
                                        {benchmark.deviation === 0
                                            ? (isRtl ? t.benchmarkAt : t.benchmarkAt)
                                            : `${benchmark.isAbove ? '+' : ''}${benchmark.deviation}% ${isRtl ? (benchmark.isAbove ? t.benchmarkAbove : t.benchmarkBelow) : (benchmark.isAbove ? t.benchmarkAbove : t.benchmarkBelow)}`
                                        }
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Gold vs Craftsmanship Visual Bar */}
                    {isComplete && netBase > 0 && (
                        <div className="my-5 p-3.5 rounded-2xl border space-y-2 bg-slate-900/60 border-slate-800">
                            <div className="flex justify-between text-xs font-bold text-slate-300">
                                <span>{t.goldVsCraft}</span>
                                <span className="text-amber-400 font-numbers">{rawGoldPct}% / {makingPct}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-800">
                                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300" style={{ width: `${rawGoldPct}%` }} />
                                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300" style={{ width: `${makingPct}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                                    {isRtl ? `ذهب خام: ${curr} ${formatCurrency(results.rawGoldCost)}` : `Gold: ${curr} ${formatCurrency(results.rawGoldCost)}`}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                                    {isRtl ? `مصنعية: ${curr} ${formatCurrency(results.totalMaking)}` : `Making: ${curr} ${formatCurrency(results.totalMaking)}`}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Collapsible Invoice Details */}
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors border-t border-slate-800/80"
                        >
                            <span>{t.invoiceTaxDetails}</span>
                            {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>

                        {showDetails && (
                            <div className="space-y-3 pt-3 animate-fade-in border-t border-slate-800/40 mt-1">
                                <ResultRow
                                    icon={<Gem size={14} />}
                                    label={isRtl ? 'تكلفة الذهب الخام' : 'Raw Gold Cost'}
                                    value={isComplete ? `${curr} ${formatCurrency(results.rawGoldCost)}` : '—'}
                                    valueColor="#F59E0B"
                                />
                                <ResultRow
                                    icon={<TrendingUp size={14} />}
                                    label={isRtl ? 'إجمالي المصنعية' : 'Total Making Charge'}
                                    value={isComplete ? `${curr} ${formatCurrency(results.totalMaking)}` : '—'}
                                    valueColor="#8B5CF6"
                                />
                                <ResultRow
                                    icon={<Layers size={14} />}
                                    label={isRtl ? `الضريبة (${settings.vatPercentage}%)` : `VAT (${settings.vatPercentage}%)`}
                                    value={isComplete ? `${curr} ${formatCurrency(results.vatAmount)}` : '—'}
                                />
                                <ResultRow
                                    icon={<Activity size={14} />}
                                    label={isRtl ? 'حالة السوق' : 'Market Status'}
                                    badge={{ text: isRtl ? (t.marketStatusLive || 'مباشر') : (t.marketStatusLive || 'LIVE'), color: '#34d399' }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Save button */}
                <div className="p-5 pt-0">
                    <button
                        onClick={handleSave}
                        disabled={hasValidationErrors || !isComplete}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                        style={{
                            background: showSaved ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)',
                            color: (hasValidationErrors || !isComplete) ? 'rgba(255,255,255,0.3)' : showSaved ? '#34d399' : 'rgba(255,255,255,0.7)',
                            cursor: (hasValidationErrors || !isComplete) ? 'not-allowed' : 'pointer',
                            border: 'none'
                        }}
                    >
                        <Save size={15} />
                        {showSaved ? (isRtl ? 'تم الحفظ ✓' : 'Saved ✓') : (isRtl ? 'حفظ في السجل' : 'Save to History')}
                    </button>
                </div>
            </div>

            {/* ── MOBILE ONLY STICKY BOTTOM BAR (Floats above bottom nav) ── */}
            <div
                className="lg:hidden fixed bottom-[68px] left-3 right-3 z-40 backdrop-blur-xl border p-3 rounded-2xl flex items-center justify-between shadow-2xl animate-slide-up"
                style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(245, 158, 11, 0.35)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)'
                }}
            >
                <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {isRtl ? 'السعر المقدر' : 'Estimated Total'}
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xs font-bold text-amber-400">{curr}</span>
                        <span className="font-numbers text-xl font-black text-white">
                            {isComplete
                                ? results.totalPrice.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : '—'
                            }
                        </span>
                    </div>
                    {dealRating && inputs.makingPerGram > 0 && (
                        <span className="text-[10px] font-bold truncate mt-0.5" style={{ color: dealRating.color }}>
                            ● {dealRating.label.split('(')[0].trim()}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => {
                            const resultsEl = document.getElementById('estimator-results-card');
                            if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-3 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all border border-slate-700 bg-slate-800 active:scale-95"
                    >
                        {isRtl ? 'التفاصيل ↓' : 'Details ↓'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={hasValidationErrors || !isComplete}
                        className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1 transition-all active:scale-95 disabled:opacity-40 ${
                            showSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : ''
                        }`}
                        style={!showSaved ? { background: 'var(--primary)', color: '#0F172A' } : {}}
                    >
                        <Save size={13} />
                        {showSaved ? (isRtl ? 'تم ✓' : '✓') : (isRtl ? 'حفظ' : 'Save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ResultRowProps {
    icon: React.ReactNode;
    label: string;
    value?: string;
    valueColor?: string;
    badge?: { text: string; color: string };
}

const ResultRow: React.FC<ResultRowProps> = ({ icon, label, value, valueColor, badge }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>{icon}</span>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
        </div>
        {badge ? (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md" style={{ background: `${badge.color}22`, color: badge.color }}>
                {badge.text}
            </span>
        ) : (
            <span className="text-sm font-numbers font-semibold" style={{ color: valueColor || 'rgba(255,255,255,0.75)' }}>{value}</span>
        )}
    </div>
);

export default EstimatorView;
