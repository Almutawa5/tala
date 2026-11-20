import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Save, X, TrendingDown, Layers, ReceiptText, Gem, RotateCcw, Sparkles, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { calculateBreakdown, formatCurrency, getDealRating, getMarketBenchmark } from '../utils/calculations';
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

interface BreakdownViewProps {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    livePrice: number;
    setLivePriceTrigger: React.Dispatch<React.SetStateAction<((price: string) => void) | null>>;
    onSave: (type: 'breakdown', inputs: any, results: any) => void;
    restoredData: HistoryItem | null;
    onClearRestored?: () => void;
    sharedInputs: SharedInputs;
    setSharedInputs: React.Dispatch<React.SetStateAction<SharedInputs>>;
}

const BreakdownView: React.FC<BreakdownViewProps> = ({ settings, updateSettings, livePrice, setLivePriceTrigger, onSave, restoredData, onClearRestored, sharedInputs, setSharedInputs }) => {
    const t = translations[settings.language];
    const curr = settings.currency;

    const inputs = sharedInputs;
    const setInputs = setSharedInputs;
    const [showSaved, setShowSaved] = useState(false);
    const mode = settings.calcMode || 'quick';
    const setMode = (nextMode: 'quick' | 'detailed') => updateSettings({ calcMode: nextMode });
    const [showDetails, setShowDetails] = useState(mode === 'detailed');
    const [results, setResults] = useState({ vatAmount: 0, priceNoVat: 0, rawGoldCost: 0, totalMaking: 0, makingPerGram: 0 });
    const isRtl = settings.language === 'ar';

    useEffect(() => {
        setShowDetails(mode === 'detailed');
    }, [mode]);

    const effectiveWeight = mode === 'detailed'
        ? Math.max(0, inputs.weight - (inputs.stoneWeight || 0))
        : inputs.weight;

    const dealRating = getDealRating(results.makingPerGram, inputs.goldPrice, settings.language as 'en' | 'ar');

    const validationMessages = [
        ...getCommonInputWarnings({
            goldPrice: inputs.goldPrice,
            itemPrice: inputs.itemPrice,
            weight: inputs.weight,
            ...(mode === 'detailed' ? { stoneWeight: inputs.stoneWeight || 0 } : {})
        }, {
            goldPrice: isRtl ? 'سعر الذهب' : 'Gold price',
            itemPrice: isRtl ? 'سعر القطعة' : 'Item price',
            weight: isRtl ? 'الوزن' : 'Weight',
            stoneWeight: isRtl ? 'وزن الفصوص' : 'Stone weight'
        }, settings.language),
        ...getGoldPriceWarnings(inputs.goldPrice, settings.language),
        ...getWeightWarnings(inputs.weight, settings.language),
        ...(mode === 'detailed' ? getStoneWeightWarnings(inputs.weight, inputs.stoneWeight || 0, settings.language) : []),
        ...getMakingChargeWarnings(results.makingPerGram, inputs.goldPrice, settings.language)
    ];

    const appliedRestoredRef = useRef<HistoryItem | null>(null);

    useEffect(() => {
        if (restoredData && restoredData.type === 'breakdown' && appliedRestoredRef.current !== restoredData) {
            appliedRestoredRef.current = restoredData;
            const restoredStone = restoredData.inputs.stoneWeight || 0;
            if (restoredStone > 0) {
                updateSettings({ calcMode: 'detailed' });
            }
            setInputs(prev => ({
                ...prev,
                goldPrice: restoredData.inputs.goldPrice || 0,
                itemPrice: restoredData.inputs.itemPrice || 0,
                weight: restoredData.inputs.weight || 0,
                stoneWeight: restoredStone,
                makingPerGram: 0,
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
        const res = calculateBreakdown(inputs.goldPrice, inputs.itemPrice, effectiveWeight, settings.vatPercentage);
        setResults(res);
        const roundedMaking = Math.round(res.makingPerGram * 100) / 100;
        if (Math.abs(roundedMaking - inputs.makingPerGram) > 0.001) {
            setInputs(prev => ({ ...prev, makingPerGram: roundedMaking }));
        }
    }, [inputs.goldPrice, inputs.itemPrice, effectiveWeight, settings.vatPercentage, setInputs, inputs.makingPerGram]);

    const handleChange = (field: keyof typeof inputs, value: string) => {
        setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleClear = (field: keyof typeof inputs) => {
        setInputs(prev => ({ ...prev, [field]: 0 }));
    };

    const handleResetPiece = () => {
        setInputs(prev => ({ ...prev, itemPrice: 0, weight: 0, stoneWeight: 0 }));
    };

    const hasValidationErrors = hasErrors(validationMessages);
    const hasCalculation = inputs.itemPrice > 0 && effectiveWeight > 0;

    const handleSave = () => {
        const inputsToSave = mode === 'detailed' && inputs.stoneWeight > 0
            ? inputs
            : { goldPrice: inputs.goldPrice, itemPrice: inputs.itemPrice, weight: inputs.weight, makingPerGram: inputs.makingPerGram };
        onSave('breakdown', inputsToSave, results);
        trackEvent('save_clicked', { type: 'breakdown', inputs: inputsToSave, results });
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    const handleUseLive = () => {
        const roundedPrice = Math.ceil(livePrice * 100) / 100;
        setInputs(prev => ({ ...prev, goldPrice: roundedPrice }));
    };

    const rawGoldPct = results.priceNoVat > 0 && effectiveWeight > 0
        ? Math.min(100, Math.max(0, Math.round((results.rawGoldCost / results.priceNoVat) * 100)))
        : 0;
    const makingPct = results.priceNoVat > 0 && effectiveWeight > 0
        ? Math.max(0, 100 - rawGoldPct)
        : 0;

    const benchmark = getMarketBenchmark(results.makingPerGram, curr);
    const vatPerGram = effectiveWeight > 0 ? results.vatAmount / effectiveWeight : 0;
    const makingRatioOfGold = inputs.goldPrice > 0 && results.makingPerGram > 0
        ? (results.makingPerGram / inputs.goldPrice) * 100
        : 0;
    const spotDiffPct = livePrice > 0 && inputs.goldPrice > 0
        ? ((inputs.goldPrice - livePrice) / livePrice) * 100
        : 0;

    return (
        <div id="breakdown-view" className={`flex flex-col lg:flex-row h-full gap-0 ${isRtl ? 'lg:flex-row-reverse' : ''}`}>
            {/* ── RESULTS PANEL (Top Live Verdict on Mobile, Right Column on Desktop) ── */}
            <div
                id="breakdown-results-card"
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
                                {isRtl ? 'نتيجة التحليل' : 'BREAKDOWN VERDICT'}
                            </p>
                            <p className="text-xs text-white/60 truncate">
                                {isRtl ? 'صافي تكلفة المصنعية' : 'Net Craftsmanship Cost'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={hasValidationErrors || !hasCalculation}
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
                                elementId="breakdown-view"
                                language={settings.language}
                                calculationType={t.breakdown}
                                shareData={hasCalculation ? {
                                    type: 'breakdown',
                                    currency: curr,
                                    karat: `${settings.karat}K`,
                                    goldPrice: inputs.goldPrice,
                                    weight: effectiveWeight,
                                    stoneWeight: mode === 'detailed' ? inputs.stoneWeight : 0,
                                    vatPercentage: settings.vatPercentage,
                                    itemPrice: inputs.itemPrice,
                                    makingPerGram: results.makingPerGram,
                                    rawGoldCost: results.rawGoldCost,
                                    totalMaking: results.totalMaking,
                                    vatAmount: results.vatAmount,
                                    priceNoVat: results.priceNoVat,
                                    dealLabel: dealRating?.label,
                                    dealColor: dealRating?.color,
                                } : undefined}
                            />
                        </div>
                    </div>

                    {/* Hero: Making per gram */}
                    <div className="my-2 sm:my-4">
                        <span className="text-xs font-medium text-white/60 block mb-1">
                            {isRtl ? 'مصنعية الجرام الواحد' : 'Making Charge per Gram'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg sm:text-xl font-bold text-[#E5A93B]">{curr}</span>
                            <span
                                className="font-numbers text-4xl sm:text-5xl lg:text-6xl font-black leading-none tracking-tight"
                                style={{ color: hasCalculation ? '#F6F5F1' : 'rgba(255,255,255,0.2)' }}
                            >
                                {hasCalculation
                                    ? results.makingPerGram.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : '—'
                                }
                            </span>
                            <span className="text-xs text-[#9B988F] font-semibold">{isRtl ? '/جم' : '/g'}</span>
                        </div>

                        {/* Deal Rating & Market Benchmark */}
                        {dealRating && hasCalculation && (
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

                    {/* Desktop always-visible Gold vs Craftsmanship Visual Bar */}
                    {hasCalculation && results.priceNoVat > 0 && (
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

                    {/* Collapsible Invoice Details (and Gold vs Craft on mobile) */}
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
                                {hasCalculation && results.priceNoVat > 0 && (
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
                                {mode === 'detailed' && hasCalculation && (
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
                                                    {curr} {formatCurrency(results.makingPerGram)}
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
                                    icon={<ReceiptText size={14} />}
                                    label={isRtl ? 'السعر قبل الضريبة' : 'Price ex-VAT'}
                                    value={inputs.itemPrice > 0 ? `${curr} ${formatCurrency(results.priceNoVat)}` : '—'}
                                />
                                <ResultRow
                                    icon={<Layers size={14} />}
                                    label={isRtl ? `الضريبة (${settings.vatPercentage}%)` : `VAT (${settings.vatPercentage}%)`}
                                    value={inputs.itemPrice > 0 ? `${curr} ${formatCurrency(results.vatAmount)}` : '—'}
                                />
                                <ResultRow
                                    icon={<Gem size={14} />}
                                    label={isRtl ? 'قيمة الذهب الخام' : 'Raw Gold Cost'}
                                    value={hasCalculation ? `${curr} ${formatCurrency(results.rawGoldCost)}` : '—'}
                                    valueColor="#E5A93B"
                                />
                                <ResultRow
                                    icon={<TrendingDown size={14} />}
                                    label={isRtl ? 'إجمالي المصنعية' : 'Total Making Charge'}
                                    value={hasCalculation ? `${curr} ${formatCurrency(results.totalMaking)}` : '—'}
                                    valueColor="#2DD4BF"
                                />
                                {mode === 'detailed' && hasCalculation && makingRatioOfGold > 0 && (
                                    <ResultRow
                                        icon={<Percent size={14} />}
                                        label={t.makingRatioOfGold}
                                        value={`${makingRatioOfGold.toFixed(1)}%`}
                                        valueColor="#34D399"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop Save button */}
                <div className="hidden lg:block p-5 pt-0">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={hasValidationErrors || !hasCalculation}
                        className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] border hover:bg-white/[0.08]"
                        style={{
                            background: showSaved ? 'rgba(45, 212, 191, 0.14)' : 'var(--verdict-surface)',
                            borderColor: showSaved ? 'rgba(45, 212, 191, 0.3)' : 'var(--verdict-border)',
                            color: (hasValidationErrors || !hasCalculation) ? 'rgba(255,255,255,0.28)' : showSaved ? '#2DD4BF' : 'rgba(255,255,255,0.88)',
                            cursor: (hasValidationErrors || !hasCalculation) ? 'not-allowed' : 'pointer',
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
                                {isRtl ? 'تحليل سعر القطعة' : 'Jewelry Breakdown'}
                            </h2>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                {isRtl ? 'اعرف تكلفة المصنعية الحقيقية' : 'Reveal real making charges'}
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

                        {/* Reset button */}
                        {(inputs.itemPrice > 0 || inputs.weight > 0) && (
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
                                <label htmlFor="breakdown-gold-price" className="input-field-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
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
                                id="breakdown-gold-price"
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
                        <label htmlFor="breakdown-weight" className="input-field-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? 'وزن القطعة (بالجرام)' : 'Item Weight (grams)'}
                        </label>
                        <span className="text-[11px] opacity-65" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? 'الوزن على الميزان' : 'From jewelry scale'}
                        </span>
                    </div>

                    <div className="relative flex items-center rounded-2xl input-field-box">
                        <input
                            id="breakdown-weight"
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
                            <label htmlFor="breakdown-stone-weight" className="input-field-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
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
                                id="breakdown-stone-weight"
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

                {/* ── Item Price Input ── */}
                <div className="space-y-1.5 input-field-group">
                    <div className="flex items-center justify-between">
                        <label htmlFor="breakdown-item-price" className="input-field-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? `سعر البائع (شامل ${settings.vatPercentage}% ضريبة)` : `Seller's Tag Price (incl. ${settings.vatPercentage}% VAT)`}
                        </label>
                        <span className="text-[11px] opacity-65" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? 'سعر المحل أو بطاقة السعر' : 'From seller / price tag'}
                        </span>
                    </div>

                    <div className="relative flex items-center rounded-2xl input-field-box">
                        <span className="input-field-prefix ps-4 font-numbers text-sm font-bold select-none pointer-events-none transition-colors" style={{ color: 'var(--text-secondary)' }}>{curr}</span>
                        <input
                            id="breakdown-item-price"
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
                </div>
            </div>
        </div>
    );
};

interface ResultRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueColor?: string;
}

const ResultRow: React.FC<ResultRowProps> = ({ icon, label, value, valueColor }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>{icon}</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</span>
        </div>
        <span className="text-xs font-numbers font-semibold" style={{ color: valueColor || 'rgba(255,255,255,0.92)' }}>{value}</span>
    </div>
);

export default BreakdownView;
