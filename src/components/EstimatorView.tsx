import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Save, X, Gem, Layers, TrendingUp, Activity, RotateCcw, Sparkles, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { calculateEstimator, formatCurrency, getDealRating, getMakingTiers, getMarketBenchmark } from '../utils/calculations';
import { translations } from '../utils/translations';
import { trackEvent } from '../utils/analytics';
import ShareButton from './ShareButton';
import { Settings } from '../hooks/useSettings';
import { HistoryItem } from '../hooks/useHistory';
import ValidationMessages from './ValidationMessages';
import { getCommonInputWarnings, getGoldPriceWarnings, getMakingChargeWarnings, getStoneWeightWarnings, getWeightWarnings, hasErrors } from '../utils/validation';

interface SharedInputs {
    goldPrice: number;
    itemPrice: number;
    weight: number;
    makingPerGram: number;
    stoneWeight: number;
}

interface EstimatorViewProps {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    livePrice: number;
    setLivePriceTrigger: React.Dispatch<React.SetStateAction<((price: string) => void) | null>>;
    onSave: (type: 'estimator', inputs: any, results: any) => void;
    restoredData: HistoryItem | null;
    onClearRestored?: () => void;
    sharedInputs: SharedInputs;
    setSharedInputs: React.Dispatch<React.SetStateAction<SharedInputs>>;
}

const EstimatorView: React.FC<EstimatorViewProps> = ({ settings, updateSettings, livePrice, setLivePriceTrigger, onSave, restoredData, onClearRestored, sharedInputs, setSharedInputs }) => {
    const t = translations[settings.language];
    const isRtl = settings.language === 'ar';
    const curr = settings.currency;

    const mode = settings.calcMode || 'quick';
    const setMode = (nextMode: 'quick' | 'detailed') => updateSettings({ calcMode: nextMode });
    const [showDetails, setShowDetails] = useState(mode === 'detailed');
    const [suggestFlash, setSuggestFlash] = useState(false);

    useEffect(() => {
        setShowDetails(mode === 'detailed');
    }, [mode]);

    const inputs = sharedInputs;
    const setInputs = setSharedInputs;
    const effectiveWeight = mode === 'detailed'
        ? Math.max(0, inputs.weight - (inputs.stoneWeight || 0))
        : inputs.weight;

    const dealRating = getDealRating(inputs.makingPerGram, inputs.goldPrice, settings.language as 'en' | 'ar');
    const [showSaved, setShowSaved] = useState(false);
    const [results, setResults] = useState({ rawGoldCost: 0, totalMaking: 0, vatAmount: 0, totalPrice: 0 });

    const validationMessages = [
        ...getCommonInputWarnings({
            goldPrice: inputs.goldPrice,
            weight: inputs.weight,
            makingPerGram: inputs.makingPerGram,
            ...(mode === 'detailed' ? { stoneWeight: inputs.stoneWeight || 0 } : {})
        }, {
            goldPrice: isRtl ? 'سعر الذهب' : 'Gold price',
            weight: isRtl ? 'الوزن' : 'Weight',
            stoneWeight: isRtl ? 'وزن الفصوص' : 'Stone weight',
            makingPerGram: isRtl ? 'المصنعية للجرام' : 'Making charge per gram'
        }, settings.language),
        ...getGoldPriceWarnings(inputs.goldPrice, settings.language),
        ...getWeightWarnings(inputs.weight, settings.language),
        ...(mode === 'detailed' ? getStoneWeightWarnings(inputs.weight, inputs.stoneWeight || 0, settings.language) : []),
        ...getMakingChargeWarnings(inputs.makingPerGram, inputs.goldPrice, settings.language)
    ];
    const hasValidationErrors = hasErrors(validationMessages);

    const appliedRestoredRef = useRef<HistoryItem | null>(null);

    useEffect(() => {
        if (restoredData && restoredData.type === 'estimator' && appliedRestoredRef.current !== restoredData) {
            appliedRestoredRef.current = restoredData;
            const restoredStone = restoredData.inputs.stoneWeight || 0;
            if (restoredStone > 0) {
                updateSettings({ calcMode: 'detailed' });
            }
            setInputs(prev => ({
                ...prev,
                goldPrice: restoredData.inputs.goldPrice || 0,
                weight: restoredData.inputs.weight || 0,
                makingPerGram: restoredData.inputs.makingPerGram || 0,
                itemPrice: restoredData.inputs.itemPrice ?? restoredData.inputs.sellerPrice ?? 0,
                stoneWeight: restoredStone
            }));
            onClearRestored?.();
        }
    }, [restoredData, onClearRestored, setInputs, updateSettings]);

    useEffect(() => {
        if (setLivePriceTrigger) {
            setLivePriceTrigger(() => (price: string) => {
                setInputs(prev => ({ ...prev, goldPrice: parseFloat(price) }));
            });
        }
    }, [setLivePriceTrigger, setInputs]);

    useEffect(() => {
        const res = calculateEstimator(inputs.goldPrice, effectiveWeight, inputs.makingPerGram, settings.vatPercentage);
        setResults(res);
    }, [inputs.goldPrice, effectiveWeight, inputs.makingPerGram, settings.vatPercentage]);

    const handleChange = (field: keyof typeof inputs, value: string) => {
        setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleClear = (field: keyof typeof inputs) => {
        setInputs(prev => ({ ...prev, [field]: 0 }));
    };

    const handleResetPiece = () => {
        setInputs(prev => ({ ...prev, weight: 0, makingPerGram: 0, itemPrice: 0, stoneWeight: 0 }));
    };

    const handleUseLive = () => {
        const roundedPrice = Math.ceil(livePrice * 100) / 100;
        setInputs(prev => ({ ...prev, goldPrice: roundedPrice }));
    };

    const handleSave = () => {
        const baseInputs = mode === 'detailed' && inputs.stoneWeight > 0
            ? inputs
            : { goldPrice: inputs.goldPrice, weight: inputs.weight, makingPerGram: inputs.makingPerGram, itemPrice: inputs.itemPrice };
        const inputsToSave = inputs.itemPrice > 0 ? { ...baseInputs, sellerPrice: inputs.itemPrice } : baseInputs;
        onSave('estimator', inputsToSave, results);
        trackEvent('save_clicked', { type: 'estimator', inputs: inputsToSave, results });
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    const handleSuggestMaking = () => {
        const tiers = getMakingTiers(curr);
        const standard = tiers[1];
        setInputs(prev => ({ ...prev, makingPerGram: standard.value }));
        setSuggestFlash(true);
        setTimeout(() => setSuggestFlash(false), 2000);
    };

    const isComplete = inputs.goldPrice > 0 && effectiveWeight > 0 && inputs.makingPerGram > 0;

    const netBase = results.rawGoldCost + results.totalMaking;
    const rawGoldPct = netBase > 0
        ? Math.min(100, Math.max(0, Math.round((results.rawGoldCost / netBase) * 100)))
        : 0;
    const makingPct = netBase > 0
        ? Math.max(0, 100 - rawGoldPct)
        : 0;

    const makingTiers = getMakingTiers(curr);
    const canShowRange = mode === 'detailed' && inputs.goldPrice > 0 && effectiveWeight > 0;
    const priceRange = canShowRange
        ? makingTiers.map(tier => ({
            ...tier,
            totalPrice: calculateEstimator(inputs.goldPrice, effectiveWeight, tier.value, settings.vatPercentage).totalPrice
        }))
        : null;

    const benchmark = getMarketBenchmark(inputs.makingPerGram, curr);
    const vatPerGram = effectiveWeight > 0 ? results.vatAmount / effectiveWeight : 0;
    const makingRatioOfGold = inputs.goldPrice > 0 && inputs.makingPerGram > 0
        ? (inputs.makingPerGram / inputs.goldPrice) * 100
        : 0;
    const spotDiffPct = livePrice > 0 && inputs.goldPrice > 0
        ? ((inputs.goldPrice - livePrice) / livePrice) * 100
        : 0;

    // Seller Price (synced with Tag Price) vs Estimated Price discount calculation
    const sellerPrice = inputs.itemPrice || 0;
    const hasSellerComparison = isComplete && sellerPrice > 0 && results.totalPrice > 0;
    const priceDiff = hasSellerComparison ? sellerPrice - results.totalPrice : 0;
    const isSellerHigher = priceDiff > 0.005;
    const isSellerLower = priceDiff < -0.005;
    const discountPct = hasSellerComparison
        ? isSellerHigher
            ? ((sellerPrice - results.totalPrice) / sellerPrice) * 100
            : isSellerLower
                ? ((results.totalPrice - sellerPrice) / results.totalPrice) * 100
                : 0
        : 0;
    const discountStatusColor = isSellerLower ? '#34D399' : isSellerHigher ? '#E5A93B' : '#2DD4BF';
    const discountStatusText = isSellerHigher
        ? t.discountNeeded
        : isSellerLower
            ? t.discountBelowEstimate
            : t.matchesEstimate;

    return (
        <div id="estimator-view" className={`flex flex-col lg:flex-row h-full gap-0 ${isRtl ? 'lg:flex-row-reverse' : ''}`}>
            {/* ── RESULTS PANEL (Top Live Estimate on Mobile, Right Column on Desktop) ── */}
            <div
                id="estimator-results-card"
                className="order-first lg:order-2 lg:w-[45%] flex flex-col justify-between overflow-hidden"
                style={{
                    background: 'var(--verdict-bg)',
                    borderTop: '2px solid rgba(229, 169, 59, 0.35)'
                }}
            >
                <div className="p-4 sm:p-8 lg:p-10 flex-1">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-3 sm:mb-4">
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5 text-[#9B988F]">
                                {isRtl ? 'السعر التقديري' : 'ESTIMATED PRICE'}
                            </p>
                            <p className="text-xs text-white/60 truncate">
                                {isRtl ? 'بحسب سعر الذهب الحالي' : 'Based on current market price'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={hasValidationErrors || !isComplete}
                                className="lg:hidden flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
                                style={{
                                    background: showSaved ? 'rgba(45, 212, 191, 0.16)' : 'var(--primary-vivid)',
                                    color: showSaved ? '#2DD4BF' : 'var(--primary-ink)'
                                }}
                            >
                                <Save size={14} />
                                <span>{showSaved ? (isRtl ? 'تم ✓' : 'Saved') : (isRtl ? 'حفظ' : 'Save')}</span>
                            </button>
                            <ShareButton
                                elementId="estimator-view"
                                language={settings.language}
                                calculationType={t.estimatedPrice}
                                shareData={isComplete ? {
                                    type: 'estimator',
                                    currency: curr,
                                    karat: `${settings.karat}K`,
                                    goldPrice: inputs.goldPrice,
                                    weight: effectiveWeight,
                                    stoneWeight: mode === 'detailed' ? inputs.stoneWeight : 0,
                                    vatPercentage: settings.vatPercentage,
                                    makingPerGram: inputs.makingPerGram,
                                    rawGoldCost: results.rawGoldCost,
                                    totalMaking: results.totalMaking,
                                    vatAmount: results.vatAmount,
                                    totalPrice: results.totalPrice,
                                    sellerPrice: hasSellerComparison ? sellerPrice : undefined,
                                    discountPct: hasSellerComparison ? discountPct : undefined,
                                    priceDiff: hasSellerComparison ? priceDiff : undefined,
                                    discountStatusText: hasSellerComparison ? discountStatusText : undefined,
                                    dealLabel: dealRating?.label,
                                    dealColor: dealRating?.color,
                                } : undefined}
                            />
                        </div>
                    </div>

                    {/* Hero: total price */}
                    <div className="my-2 sm:my-4">
                        <span className="text-xs font-medium text-white/60 block mb-1">
                            {isRtl ? `الإجمالي التقديري (شامل ${settings.vatPercentage}% ضريبة)` : `Total Estimated Price (incl. ${settings.vatPercentage}% VAT)`}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg sm:text-xl font-bold text-[#E5A93B]">{curr}</span>
                            <span
                                className="font-numbers text-4xl sm:text-5xl lg:text-6xl font-black leading-none tracking-tight"
                                style={{ color: isComplete ? '#F6F5F1' : 'rgba(255,255,255,0.2)' }}
                            >
                                {isComplete
                                    ? results.totalPrice.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : '—'
                                }
                            </span>
                        </div>

                        {/* Deal Rating & Market Benchmark */}
                        {dealRating && inputs.makingPerGram > 0 && inputs.goldPrice > 0 && (
                            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                                <span
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold"
                                    style={{
                                        backgroundColor: dealRating.bgColor,
                                        borderColor: dealRating.borderColor,
                                        color: dealRating.color
                                    }}
                                >
                                    <span>{dealRating.label}</span>
                                </span>

                                {benchmark && (
                                    <span className="text-[11px] text-[#9B988F]">
                                        {t.marketBenchmark}:{' '}
                                        <span
                                            className="font-numbers font-bold"
                                            style={{
                                                color: benchmark.deviation === 0 ? '#34D399' : benchmark.isAbove ? '#F87171' : '#34D399'
                                            }}
                                        >
                                            {benchmark.deviation === 0
                                                ? t.benchmarkAt
                                                : `${benchmark.isAbove ? '+' : ''}${benchmark.deviation}% ${benchmark.isAbove ? t.benchmarkAbove : t.benchmarkBelow}`
                                            }
                                        </span>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Seller Price vs Estimated Price Comparison Card */}
                    {hasSellerComparison && (
                        <div
                            className="my-3.5 p-3.5 rounded-2xl border space-y-2.5 animate-fade-in"
                            style={{ background: 'var(--verdict-surface)', borderColor: 'var(--verdict-border)' }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9B988F]">
                                    {t.priceComparison}
                                </span>
                                <span
                                    className="font-numbers text-sm font-black px-2.5 py-0.5 rounded-lg"
                                    style={{
                                        backgroundColor: `${discountStatusColor}20`,
                                        color: discountStatusColor
                                    }}
                                >
                                    {discountPct.toFixed(1)}% · {discountStatusText}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: 'var(--verdict-border)' }}>
                                <div>
                                    <span className="text-[10px] text-[#9B988F] block">{t.sellerPriceShort}</span>
                                    <span className="font-numbers text-xs sm:text-sm font-bold text-[#F6F5F1]">
                                        {curr} {formatCurrency(sellerPrice)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-[#9B988F] block">{t.estimatedPrice}</span>
                                    <span className="font-numbers text-xs sm:text-sm font-bold text-[#E5A93B]">
                                        {curr} {formatCurrency(results.totalPrice)}
                                    </span>
                                </div>
                                <div className="text-end">
                                    <span className="text-[10px] text-[#9B988F] block">{t.discountPercent}</span>
                                    <span className="font-numbers text-xs sm:text-sm font-black" style={{ color: discountStatusColor }}>
                                        {discountPct.toFixed(1)}% ({curr} {formatCurrency(Math.abs(priceDiff))})
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Desktop Gold vs Craftsmanship Visual Bar */}
                    {isComplete && netBase > 0 && (
                        <div
                            className="hidden lg:block my-5 p-3.5 rounded-2xl border space-y-2"
                            style={{ background: 'var(--verdict-surface)', borderColor: 'var(--verdict-border)' }}
                        >
                            <div className="flex justify-between text-xs font-bold text-white/85">
                                <span>{t.goldVsCraft}</span>
                                <span className="text-[#E5A93B] font-numbers">{rawGoldPct}% / {makingPct}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden flex bg-white/10">
                                <div className="h-full bg-gradient-to-r from-[#E5A93B] to-[#F2BC52] transition-all duration-300" style={{ width: `${rawGoldPct}%` }} />
                                <div className="h-full bg-gradient-to-r from-[#0D9488] to-[#2DD4BF] transition-all duration-300" style={{ width: `${makingPct}%` }} />
                            </div>
                            <div className="flex justify-between text-[11px] text-[#9B988F]">
                                <span>
                                    {isRtl ? `ذهب خام: ${curr} ${formatCurrency(results.rawGoldCost)}` : `Gold: ${curr} ${formatCurrency(results.rawGoldCost)}`}
                                </span>
                                <span>
                                    {isRtl ? `مصنعية: ${curr} ${formatCurrency(results.totalMaking)}` : `Making: ${curr} ${formatCurrency(results.totalMaking)}`}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Collapsible Invoice Details */}
                    <div className="pt-1 sm:pt-2">
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className="w-full min-h-[44px] flex items-center justify-between py-2 text-xs font-bold text-white/75 hover:text-white transition-colors border-t"
                            style={{ borderColor: 'var(--verdict-border)' }}
                        >
                            <span>{t.invoiceTaxDetails}</span>
                            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {showDetails && (
                            <div className="space-y-3 pt-2 pb-1 animate-fade-in border-t" style={{ borderColor: 'var(--verdict-border)' }}>
                                {isComplete && netBase > 0 && (
                                    <div
                                        className="lg:hidden p-3 rounded-2xl border space-y-2"
                                        style={{ background: 'var(--verdict-surface)', borderColor: 'var(--verdict-border)' }}
                                    >
                                        <div className="flex justify-between text-xs font-bold text-white/85">
                                            <span>{t.goldVsCraft}</span>
                                            <span className="text-[#E5A93B] font-numbers">{rawGoldPct}% / {makingPct}%</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full overflow-hidden flex bg-white/10">
                                            <div className="h-full bg-gradient-to-r from-[#E5A93B] to-[#F2BC52]" style={{ width: `${rawGoldPct}%` }} />
                                            <div className="h-full bg-gradient-to-r from-[#0D9488] to-[#2DD4BF]" style={{ width: `${makingPct}%` }} />
                                        </div>
                                    </div>
                                )}

                                {/* Detailed Mode: Per-Gram Breakdown */}
                                {mode === 'detailed' && isComplete && (
                                    <div
                                        className="p-3 rounded-2xl border space-y-2"
                                        style={{ background: 'var(--verdict-surface)', borderColor: 'var(--verdict-border)' }}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9B988F] block">
                                            {t.perGramBreakdown}
                                        </span>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <span className="text-[10px] text-[#9B988F] block">{t.goldPerGramShort}</span>
                                                <span className="font-numbers text-xs font-bold text-[#E5A93B]">
                                                    {curr} {formatCurrency(inputs.goldPrice)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[#9B988F] block">{t.makingPerGramShort}</span>
                                                <span className="font-numbers text-xs font-bold text-[#2DD4BF]">
                                                    {curr} {formatCurrency(inputs.makingPerGram)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[#9B988F] block">{t.vatPerGramShort}</span>
                                                <span className="font-numbers text-xs font-bold text-white/90">
                                                    {curr} {formatCurrency(vatPerGram)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <ResultRow
                                    icon={<Gem size={14} />}
                                    label={isRtl ? 'قيمة الذهب الخام' : 'Raw Gold Cost'}
                                    value={isComplete ? `${curr} ${formatCurrency(results.rawGoldCost)}` : '—'}
                                    valueColor="#E5A93B"
                                />
                                <ResultRow
                                    icon={<TrendingUp size={14} />}
                                    label={isRtl ? 'إجمالي المصنعية' : 'Total Making Charge'}
                                    value={isComplete ? `${curr} ${formatCurrency(results.totalMaking)}` : '—'}
                                    valueColor="#2DD4BF"
                                />
                                <ResultRow
                                    icon={<Layers size={14} />}
                                    label={isRtl ? `الضريبة (${settings.vatPercentage}%)` : `VAT (${settings.vatPercentage}%)`}
                                    value={isComplete ? `${curr} ${formatCurrency(results.vatAmount)}` : '—'}
                                />
                                {mode === 'detailed' && isComplete && makingRatioOfGold > 0 && (
                                    <ResultRow
                                        icon={<Percent size={14} />}
                                        label={t.makingRatioOfGold}
                                        value={`${makingRatioOfGold.toFixed(1)}%`}
                                        valueColor="#34D399"
                                    />
                                )}
                                <ResultRow
                                    icon={<Activity size={14} />}
                                    label={isRtl ? 'حالة السوق' : 'Market Status'}
                                    badge={{ text: isRtl ? (t.marketStatusLive || 'مباشر') : (t.marketStatusLive || 'LIVE'), color: '#34D399' }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop Save button */}
                <div className="hidden lg:block p-5 pt-0">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={hasValidationErrors || !isComplete}
                        className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] border hover:bg-white/[0.08]"
                        style={{
                            background: showSaved ? 'rgba(45, 212, 191, 0.14)' : 'var(--verdict-surface)',
                            borderColor: showSaved ? 'rgba(45, 212, 191, 0.3)' : 'var(--verdict-border)',
                            color: (hasValidationErrors || !isComplete) ? 'rgba(255,255,255,0.28)' : showSaved ? '#2DD4BF' : 'rgba(255,255,255,0.88)',
                            cursor: (hasValidationErrors || !isComplete) ? 'not-allowed' : 'pointer',
                        }}
                    >
                        <Save size={15} />
                        {showSaved ? (isRtl ? 'تم الحفظ ✓' : 'Saved ✓') : (isRtl ? 'حفظ في السجل' : 'Save to History')}
                    </button>
                </div>
            </div>

            {/* ── INPUTS PANEL (Below Verdict on Mobile, Left Column on Desktop) ── */}
            <div className="order-2 lg:order-1 lg:w-[55%] p-4 sm:p-8 lg:p-10 space-y-4 sm:space-y-5">

                {/* Section header & Mode Switcher */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                        >
                            <Calculator size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {isRtl ? 'تقدير السعر العادل' : 'Estimate Jewelry Price'}
                            </h2>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                {isRtl ? 'احسب السعر المتوقع قبل الشراء' : 'Calculate expected price before buying'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ms-auto">
                        {/* Quick / Detailed Mode Toggle */}
                        <div className="p-0.5 rounded-xl border flex items-center" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                            <button
                                type="button"
                                onClick={() => setMode('quick')}
                                className="min-h-[38px] px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                                style={mode === 'quick'
                                    ? { background: 'var(--primary-vivid)', color: 'var(--primary-ink)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                                    : { color: 'var(--text-secondary)' }
                                }
                            >
                                {t.simpleMode}
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('detailed')}
                                className="min-h-[38px] px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                                style={mode === 'detailed'
                                    ? { background: 'var(--primary-vivid)', color: 'var(--primary-ink)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                                    : { color: 'var(--text-secondary)' }
                                }
                            >
                                {t.detailedMode}
                            </button>
                        </div>

                        {/* Reset Piece button */}
                        {(inputs.weight > 0 || inputs.makingPerGram > 0 || sellerPrice > 0) && (
                            <button
                                type="button"
                                onClick={handleResetPiece}
                                className="min-h-[44px] sm:min-h-[40px] flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 border whitespace-nowrap"
                                style={{
                                    background: 'var(--bg-input)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-primary)'
                                }}
                                title={t.newPieceTooltip}
                            >
                                <RotateCcw size={14} style={{ color: 'var(--primary)' }} />
                                <span>{t.newPiece}</span>
                            </button>
                        )}
                    </div>
                </div>

                <ValidationMessages messages={validationMessages} />

                {/* ── Quick Mode: Compact Live Rate Indicator ── */}
                {mode === 'quick' && inputs.goldPrice > 0 && (
                    <button
                        type="button"
                        onClick={() => setMode('detailed')}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs transition-all active:scale-[0.99]"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
                    >
                        <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                            <Sparkles size={13} className="shrink-0" style={{ color: 'var(--primary)' }} />
                            <span>{t.usingLiveSpot}:</span>
                            <strong className="font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                                {curr} {formatCurrency(inputs.goldPrice)}/{isRtl ? 'جم' : 'g'}
                            </strong>
                        </span>
                        <span className="text-[11px] font-bold shrink-0" style={{ color: 'var(--primary)' }}>{t.editSpot}</span>
                    </button>
                )}

                {/* ── Detailed Mode: Gold Price Input ── */}
                {mode === 'detailed' && (
                    <div className="space-y-1.5 input-field-group">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                                <label htmlFor="estimator-gold-price" className="input-field-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                                    {isRtl ? `سعر جرام الذهب (${curr})` : `Gold Spot Price (${curr}/g)`}
                                </label>
                                {livePrice > 0 && inputs.goldPrice > 0 && (
                                    <span
                                        className="text-[10px] font-numbers font-bold px-2 py-0.5 rounded-md"
                                        style={{
                                            background: Math.abs(spotDiffPct) < 0.25 ? 'var(--craft-soft)' : 'var(--primary-soft)',
                                            color: Math.abs(spotDiffPct) < 0.25 ? 'var(--craft-accent)' : 'var(--primary)'
                                        }}
                                    >
                                        {Math.abs(spotDiffPct) < 0.25
                                            ? t.matchesLiveSpot
                                            : `${spotDiffPct > 0 ? '+' : ''}${spotDiffPct.toFixed(1)}% ${t.diffFromLiveSpot}`
                                        }
                                    </span>
                                )}
                            </div>
                            {livePrice > 0 && (
                                <button
                                    type="button"
                                    onClick={handleUseLive}
                                    className="flex items-center gap-1 min-h-[36px] px-2 text-xs font-semibold hover:underline"
                                    style={{ color: 'var(--primary)' }}
                                >
                                    <Sparkles size={12} />
                                    <span>{isRtl ? 'تطبيق السعر المباشر' : 'Use Live Spot'}</span>
                                </button>
                            )}
                        </div>

                        <div className="relative flex items-center rounded-2xl input-field-box">
                            <span className="input-field-prefix ps-4 font-numbers text-sm font-bold select-none pointer-events-none transition-colors" style={{ color: 'var(--text-secondary)' }}>{curr}</span>
                            <input
                                id="estimator-gold-price"
                                type="number"
                                inputMode="decimal"
                                enterKeyHint="done"
                                onFocus={e => e.target.select()}
                                value={inputs.goldPrice || ''}
                                onChange={e => handleChange('goldPrice', e.target.value)}
                                placeholder="0.00"
                                className="w-full min-h-[52px] bg-transparent py-3 px-3 text-lg sm:text-xl font-bold font-numbers outline-none"
                                style={{ color: 'var(--text-primary)' }}
                            />
                            {inputs.goldPrice > 0 && (
                                <button
                                    type="button"
                                    onClick={() => handleClear('goldPrice')}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                                    style={{ color: 'var(--text-secondary)' }}
                                    aria-label="Clear"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Weight Input ── */}
                <div className="space-y-1.5 input-field-group">
                    <div className="flex items-center justify-between">
                        <label htmlFor="estimator-weight" className="input-field-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? 'وزن القطعة (بالجرام)' : 'Item Weight (grams)'}
                        </label>
                        <span className="text-[11px] opacity-65" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? 'الوزن على الميزان' : 'From jewelry scale'}
                        </span>
                    </div>

                    <div className="relative flex items-center rounded-2xl input-field-box">
                        <input
                            id="estimator-weight"
                            type="number"
                            inputMode="decimal"
                            enterKeyHint="done"
                            onFocus={e => e.target.select()}
                            value={inputs.weight || ''}
                            onChange={e => handleChange('weight', e.target.value)}
                            placeholder="0.00"
                            className="w-full min-h-[54px] bg-transparent py-3.5 px-4 text-xl sm:text-2xl font-bold font-numbers outline-none"
                            style={{ color: 'var(--text-primary)' }}
                        />
                        <span className="input-field-unit me-1 text-xs font-bold px-2.5 py-1 rounded-lg uppercase select-none pointer-events-none transition-colors" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                            g
                        </span>
                        {inputs.weight > 0 && (
                            <button
                                type="button"
                                onClick={() => handleClear('weight')}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                                style={{ color: 'var(--text-secondary)' }}
                                aria-label="Clear"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Detailed Mode: Stone / Non-Gold Weight Deduction ── */}
                {mode === 'detailed' && (
                    <div className="space-y-1.5 input-field-group">
                        <div className="flex items-center justify-between gap-2">
                            <label htmlFor="estimator-stone-weight" className="input-field-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                                {t.stoneWeight}
                            </label>
                            {inputs.stoneWeight > 0 && inputs.weight > inputs.stoneWeight ? (
                                <span className="text-[11px] font-bold font-numbers" style={{ color: 'var(--primary)' }}>
                                    {t.netGoldWeight}: {effectiveWeight.toFixed(2)}g
                                </span>
                            ) : (
                                <span className="text-[11px] opacity-65" style={{ color: 'var(--text-secondary)' }}>
                                    {t.stoneWeightHint}
                                </span>
                            )}
                        </div>

                        <div className="relative flex items-center rounded-2xl input-field-box">
                            <input
                                id="estimator-stone-weight"
                                type="number"
                                inputMode="decimal"
                                enterKeyHint="done"
                                onFocus={e => e.target.select()}
                                value={inputs.stoneWeight || ''}
                                onChange={e => handleChange('stoneWeight', e.target.value)}
                                placeholder="0.00"
                                className="w-full min-h-[48px] bg-transparent py-2.5 px-4 text-lg font-bold font-numbers outline-none"
                                style={{ color: 'var(--text-primary)' }}
                            />
                            <span className="input-field-unit me-1 text-xs font-bold px-2.5 py-1 rounded-lg uppercase select-none pointer-events-none transition-colors" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                                g
                            </span>
                            {inputs.stoneWeight > 0 && (
                                <button
                                    type="button"
                                    onClick={() => handleClear('stoneWeight')}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                                    style={{ color: 'var(--text-secondary)' }}
                                    aria-label="Clear"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Making Charge per Gram Input ── */}
                <div className="space-y-1.5 input-field-group">
                    <div className="flex items-center justify-between gap-2">
                        <label htmlFor="estimator-making" className="input-field-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? `المصنعية للجرام (${curr})` : `Making Charge per gram (${curr})`}
                        </label>
                        <button
                            type="button"
                            onClick={handleSuggestMaking}
                            className="flex items-center gap-1 min-h-[36px] px-2 text-xs font-semibold transition-all active:scale-95 whitespace-nowrap"
                            style={{ color: suggestFlash ? 'var(--craft-accent)' : 'var(--primary)' }}
                        >
                            <Sparkles size={12} />
                            <span>{suggestFlash ? t.fairMakingApplied : t.suggestMaking}</span>
                        </button>
                    </div>

                    <div className="relative flex items-center rounded-2xl input-field-box">
                        <span className="input-field-prefix ps-4 font-numbers text-sm font-bold select-none pointer-events-none transition-colors" style={{ color: 'var(--text-secondary)' }}>{curr}</span>
                        <input
                            id="estimator-making"
                            type="number"
                            inputMode="decimal"
                            enterKeyHint="done"
                            onFocus={e => e.target.select()}
                            value={inputs.makingPerGram || ''}
                            onChange={e => handleChange('makingPerGram', e.target.value)}
                            placeholder="0.00"
                            className="w-full min-h-[54px] bg-transparent py-3.5 px-4 text-xl sm:text-2xl font-bold font-numbers outline-none"
                            style={{ color: 'var(--text-primary)' }}
                        />
                        {inputs.makingPerGram > 0 && (
                            <button
                                type="button"
                                onClick={() => handleClear('makingPerGram')}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                                style={{ color: 'var(--text-secondary)' }}
                                aria-label="Clear"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* Curated Tiers */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sm:flex-wrap pt-1">
                        {(['BHD', 'KWD', 'OMR'].includes(curr)
                            ? [
                                { val: 1.5, lbl: isRtl ? 'بسيطة' : 'Simple' },
                                { val: 2.5, lbl: isRtl ? 'متوسطة' : 'Std' },
                                { val: 4.0, lbl: isRtl ? 'متقنة' : 'Detail' },
                                { val: 6.0, lbl: isRtl ? 'فاخرة' : 'Luxury' }
                            ]
                            : ['USD', 'EUR'].includes(curr)
                            ? [
                                { val: 5, lbl: isRtl ? 'بسيطة' : 'Simple' },
                                { val: 10, lbl: isRtl ? 'متوسطة' : 'Std' },
                                { val: 18, lbl: isRtl ? 'متقنة' : 'Detail' },
                                { val: 30, lbl: isRtl ? 'فاخرة' : 'Luxury' }
                            ]
                            : [
                                { val: 15, lbl: isRtl ? 'بسيطة' : 'Simple' },
                                { val: 25, lbl: isRtl ? 'متوسطة' : 'Std' },
                                { val: 40, lbl: isRtl ? 'متقنة' : 'Detail' },
                                { val: 60, lbl: isRtl ? 'فاخرة' : 'Luxury' }
                            ]
                        ).map(item => (
                            <button
                                key={item.val}
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, makingPerGram: item.val }))}
                                className="min-h-[44px] sm:min-h-[38px] px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 border flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                                style={{
                                    background: inputs.makingPerGram === item.val ? 'var(--primary-vivid)' : 'var(--bg-input)',
                                    color: inputs.makingPerGram === item.val ? 'var(--primary-ink)' : 'var(--text-primary)',
                                    borderColor: inputs.makingPerGram === item.val ? 'var(--primary-vivid)' : 'var(--border)'
                                }}
                            >
                                <span className="font-numbers">{item.val}</span>
                                <span className="text-[11px] opacity-75">({item.lbl})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Price Range Panel ── */}
                {canShowRange && priceRange && (
                    <div className="rounded-2xl border p-3.5 sm:p-4 space-y-2.5" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                {t.priceRangeTitle}
                            </span>
                            <span className="text-[11px] opacity-65 truncate" style={{ color: 'var(--text-secondary)' }}>
                                {t.priceRangeHint}
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
                                        className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl border transition-all active:scale-[0.98]"
                                        style={{
                                            background: isSelected ? `${tier.color}16` : 'var(--bg-surface)',
                                            borderColor: isSelected ? tier.color : 'var(--border)',
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tier.color }} />
                                            <span className="text-xs font-bold" style={{ color: isSelected ? tier.color : 'var(--text-secondary)' }}>
                                                {isRtl ? tier.nameAr : tier.name}
                                            </span>
                                            <span className="text-[11px] font-numbers opacity-70" style={{ color: 'var(--text-secondary)' }}>
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

                {/* ── Seller's Price Input (Compare against Estimate & see Discount %) ── */}
                <div className="space-y-1.5 pt-1 input-field-group">
                    <div className="flex items-center justify-between gap-2">
                        <label htmlFor="estimator-seller-price" className="input-field-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                            {t.sellerPrice}
                        </label>
                        <span className="text-[11px] opacity-65" style={{ color: 'var(--text-secondary)' }}>
                            {t.sellerPriceHint}
                        </span>
                    </div>

                    <div className="relative flex items-center rounded-2xl input-field-box">
                        <span className="input-field-prefix ps-4 font-numbers text-sm font-bold select-none pointer-events-none transition-colors" style={{ color: 'var(--text-secondary)' }}>{curr}</span>
                        <input
                            id="estimator-seller-price"
                            type="number"
                            inputMode="decimal"
                            enterKeyHint="done"
                            onFocus={e => e.target.select()}
                            value={inputs.itemPrice || ''}
                            onChange={e => handleChange('itemPrice', e.target.value)}
                            placeholder="0.00"
                            className="w-full min-h-[54px] bg-transparent py-3.5 px-4 text-xl sm:text-2xl font-bold font-numbers outline-none"
                            style={{ color: 'var(--text-primary)' }}
                        />
                        {inputs.itemPrice > 0 && (
                            <button
                                type="button"
                                onClick={() => handleClear('itemPrice')}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                                style={{ color: 'var(--text-secondary)' }}
                                aria-label="Clear"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {hasSellerComparison && (
                        <div
                            className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold animate-fade-in"
                            style={{
                                backgroundColor: `${discountStatusColor}14`,
                                borderColor: `${discountStatusColor}38`,
                                color: discountStatusColor
                            }}
                        >
                            <span>
                                {discountStatusText}:{' '}
                                <span className="font-numbers text-sm font-black">{discountPct.toFixed(1)}%</span>
                            </span>
                            <span className="font-numbers">
                                {curr} {formatCurrency(sellerPrice)} vs {curr} {formatCurrency(results.totalPrice)} ({curr} {formatCurrency(Math.abs(priceDiff))})
                            </span>
                        </div>
                    )}
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
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>{icon}</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</span>
        </div>
        {badge ? (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md" style={{ background: `${badge.color}20`, color: badge.color }}>
                {badge.text}
            </span>
        ) : (
            <span className="text-xs font-numbers font-semibold" style={{ color: valueColor || 'rgba(255,255,255,0.92)' }}>{value}</span>
        )}
    </div>
);

export default EstimatorView;
