import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Save, X, Gem, Layers, ReceiptText, TrendingUp, Activity, RotateCcw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateBudget, formatCurrency, getDealRating, getMakingTiers, getMarketBenchmark } from '../utils/calculations';
import { translations } from '../utils/translations';
import { trackEvent } from '../utils/analytics';
import ShareButton from './ShareButton';
import { Settings } from '../hooks/useSettings';
import { HistoryItem } from '../hooks/useHistory';
import ValidationMessages from './ValidationMessages';
import { getCommonInputWarnings, getGoldPriceWarnings, getMakingChargeWarnings, hasErrors } from '../utils/validation';

interface SharedInputs {
    goldPrice: number;
    itemPrice: number;
    weight: number;
    makingPerGram: number;
    stoneWeight: number;
    budget: number;
}

interface BudgetViewProps {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    livePrice: number;
    setLivePriceTrigger: React.Dispatch<React.SetStateAction<((price: string) => void) | null>>;
    onSave: (type: 'budget', inputs: any, results: any) => void;
    restoredData: HistoryItem | null;
    onClearRestored?: () => void;
    sharedInputs: SharedInputs;
    setSharedInputs: React.Dispatch<React.SetStateAction<SharedInputs>>;
}

const BudgetView: React.FC<BudgetViewProps> = ({
    settings,
    updateSettings,
    livePrice,
    setLivePriceTrigger,
    onSave,
    restoredData,
    onClearRestored,
    sharedInputs,
    setSharedInputs
}) => {
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

    const dealRating = getDealRating(inputs.makingPerGram, inputs.goldPrice, settings.language as 'en' | 'ar');
    const [showSaved, setShowSaved] = useState(false);
    const [results, setResults] = useState({
        maxWeight: 0,
        priceNoVat: 0,
        vatAmount: 0,
        rawGoldCost: 0,
        totalMaking: 0,
        costPerGramInclVat: 0
    });

    const validationMessages = [
        ...getCommonInputWarnings({
            goldPrice: inputs.goldPrice,
            budget: inputs.budget,
            makingPerGram: inputs.makingPerGram
        }, {
            goldPrice: isRtl ? 'سعر الذهب' : 'Gold price',
            budget: isRtl ? 'الميزانية' : 'Budget',
            makingPerGram: isRtl ? 'المصنعية للجرام' : 'Making charge per gram'
        }, settings.language),
        ...getGoldPriceWarnings(inputs.goldPrice, settings.language),
        ...(inputs.budget <= 0 ? [{
            id: 'budget-missing',
            level: 'info' as const,
            text: isRtl
                ? 'أدخل الميزانية المتوفرة لحساب أقصى وزن يمكنك شراؤه.'
                : 'Enter your available budget to calculate the maximum weight you can buy.'
        }] : []),
        ...getMakingChargeWarnings(inputs.makingPerGram, inputs.goldPrice, settings.language)
    ];
    const hasValidationErrors = hasErrors(validationMessages);

    const appliedRestoredRef = useRef<HistoryItem | null>(null);

    useEffect(() => {
        if (restoredData && restoredData.type === 'budget' && appliedRestoredRef.current !== restoredData) {
            appliedRestoredRef.current = restoredData;
            setInputs(prev => ({
                ...prev,
                goldPrice: restoredData.inputs.goldPrice || 0,
                budget: restoredData.inputs.budget || 0,
                makingPerGram: restoredData.inputs.makingPerGram || 0,
            }));
            onClearRestored?.();
        }
    }, [restoredData, onClearRestored, setInputs]);

    useEffect(() => {
        if (setLivePriceTrigger) {
            setLivePriceTrigger(() => (price: string) => {
                setInputs(prev => ({ ...prev, goldPrice: parseFloat(price) }));
            });
        }
    }, [setLivePriceTrigger, setInputs]);

    useEffect(() => {
        const res = calculateBudget(inputs.goldPrice, inputs.budget, inputs.makingPerGram, settings.vatPercentage);
        setResults(res);
    }, [inputs.goldPrice, inputs.budget, inputs.makingPerGram, settings.vatPercentage]);

    const handleChange = (field: keyof typeof inputs, value: string) => {
        setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleClear = (field: keyof typeof inputs) => {
        setInputs(prev => ({ ...prev, [field]: 0 }));
    };

    const handleReset = () => {
        setInputs(prev => ({ ...prev, budget: 0, makingPerGram: 0 }));
    };

    const handleUseLive = () => {
        const roundedPrice = Math.ceil(livePrice * 100) / 100;
        setInputs(prev => ({ ...prev, goldPrice: roundedPrice }));
    };

    const handleSave = () => {
        const inputsToSave = {
            goldPrice: inputs.goldPrice,
            budget: inputs.budget,
            weight: Math.round(results.maxWeight * 100) / 100,
            makingPerGram: inputs.makingPerGram
        };
        onSave('budget', inputsToSave, results);
        trackEvent('save_clicked', { type: 'budget', inputs: inputsToSave, results });
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

    const isComplete = inputs.goldPrice > 0 && inputs.budget > 0 && results.maxWeight > 0;
    const ounces = results.maxWeight > 0 ? results.maxWeight / 31.1034768 : 0;

    const netBase = results.rawGoldCost + results.totalMaking;
    const rawGoldPct = netBase > 0
        ? Math.min(100, Math.max(0, Math.round((results.rawGoldCost / netBase) * 100)))
        : 0;
    const makingPct = netBase > 0
        ? Math.max(0, 100 - rawGoldPct)
        : 0;

    const makingTiers = getMakingTiers(curr);
    const canShowTiers = mode === 'detailed' && inputs.goldPrice > 0 && inputs.budget > 0;
    const weightByTier = canShowTiers
        ? makingTiers.map(tier => ({
            ...tier,
            maxWeight: calculateBudget(inputs.goldPrice, inputs.budget, tier.value, settings.vatPercentage).maxWeight
        }))
        : null;

    const benchmark = getMarketBenchmark(inputs.makingPerGram, curr);
    const spotDiffPct = livePrice > 0 && inputs.goldPrice > 0
        ? ((inputs.goldPrice - livePrice) / livePrice) * 100
        : 0;

    return (
        <div id="budget-view" className={`flex flex-col lg:flex-row h-full gap-0 ${isRtl ? 'lg:flex-row-reverse' : ''}`}>
            {/* ── RESULTS PANEL (Top Live Verdict on Mobile, Right Column on Desktop) ── */}
            <div
                id="budget-results-card"
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
                                {isRtl ? 'الوزن المتاح بميزانيتك' : 'BUDGET CAPACITY'}
                            </p>
                            <p className="text-xs text-white/60 truncate">
                                {isRtl ? 'شامل المصنعية والضريبة' : 'Including making & VAT'}
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
                                elementId="budget-view"
                                language={settings.language}
                                calculationType={t.budgetTitle}
                                shareData={isComplete ? {
                                    type: 'budget',
                                    currency: curr,
                                    karat: `${settings.karat}K`,
                                    goldPrice: inputs.goldPrice,
                                    weight: results.maxWeight,
                                    vatPercentage: settings.vatPercentage,
                                    budget: inputs.budget,
                                    maxWeight: results.maxWeight,
                                    makingPerGram: inputs.makingPerGram,
                                    rawGoldCost: results.rawGoldCost,
                                    totalMaking: results.totalMaking,
                                    vatAmount: results.vatAmount,
                                    priceNoVat: results.priceNoVat,
                                    costPerGramInclVat: results.costPerGramInclVat,
                                    dealLabel: dealRating?.label,
                                    dealColor: dealRating?.color,
                                } : undefined}
                            />
                        </div>
                    </div>

                    {/* Hero: Maximum Weight */}
                    <div className="my-2 sm:my-4">
                        <span className="text-xs font-medium text-white/60 block mb-1">
                            {t.maxWeight}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span
                                className="font-numbers text-4xl sm:text-5xl lg:text-6xl font-black leading-none tracking-tight"
                                style={{ color: isComplete ? '#F6F5F1' : 'rgba(255,255,255,0.2)' }}
                            >
                                {isComplete
                                    ? results.maxWeight.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : '—'
                                }
                            </span>
                            <span className="text-lg sm:text-xl font-bold text-[#E5A93B]">
                                {isRtl ? 'جم' : 'g'}
                            </span>
                            {isComplete && ounces > 0 && (
                                <span className="text-xs font-numbers text-[#9B988F] ms-1">
                                    ({ounces.toFixed(2)} {isRtl ? 'أونصة' : 'oz'})
                                </span>
                            )}
                        </div>

                        {inputs.goldPrice > 0 && results.costPerGramInclVat > 0 && (
                            <p className="mt-2 text-[11px] text-[#9B988F] font-medium">
                                {t.costPerGramInclVat}:{' '}
                                <span className="font-numbers font-bold text-white/85">
                                    {curr} {formatCurrency(results.costPerGramInclVat)}/{isRtl ? 'جم' : 'g'}
                                </span>
                            </p>
                        )}

                        {/* Deal Rating & Market Benchmark */}
                        {dealRating && inputs.makingPerGram > 0 && (
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

                    {/* Desktop Gold vs Craftsmanship Bar */}
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

                    {/* Collapsible Budget Details */}
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

                                <ResultRow
                                    icon={<ReceiptText size={14} />}
                                    label={isRtl ? 'السعر قبل الضريبة' : 'Price ex-VAT'}
                                    value={isComplete ? `${curr} ${formatCurrency(results.priceNoVat)}` : '—'}
                                />
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
                                <ResultRow
                                    icon={<Activity size={14} />}
                                    label={t.costPerGramInclVat}
                                    value={inputs.goldPrice > 0 ? `${curr} ${formatCurrency(results.costPerGramInclVat)}/${isRtl ? 'جم' : 'g'}` : '—'}
                                    valueColor="#F2BC52"
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

            {/* ── INPUTS PANEL ── */}
            <div className="order-2 lg:order-1 lg:w-[55%] p-4 sm:p-8 lg:p-10 space-y-4 sm:space-y-5">

                {/* Section header & Mode Switcher */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                        >
                            <Wallet size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {t.budgetTitle}
                            </h2>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                {t.budgetSubtitle}
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
                        {(inputs.budget > 0 || inputs.makingPerGram > 0) && (
                            <button
                                type="button"
                                onClick={handleReset}
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

                {/* ── Gold Price Input (Editable in both Quick & Detailed modes) ── */}
                <div className="space-y-1.5 input-field-group">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label htmlFor="budget-gold-price" className="input-field-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
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
                            id="budget-gold-price"
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

                {/* ── Available Budget Input ── */}
                <div className="space-y-1.5 input-field-group">
                    <div className="flex items-center justify-between gap-2">
                        <label htmlFor="budget-amount" className="input-field-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                            {t.availableBudget}
                        </label>
                        <span className="text-[11px] opacity-65" style={{ color: 'var(--text-secondary)' }}>
                            {t.availableBudgetHint}
                        </span>
                    </div>

                    <div className="relative flex items-center rounded-2xl input-field-box">
                        <span className="input-field-prefix ps-4 font-numbers text-sm font-bold select-none pointer-events-none transition-colors" style={{ color: 'var(--text-secondary)' }}>{curr}</span>
                        <input
                            id="budget-amount"
                            type="number"
                            inputMode="decimal"
                            enterKeyHint="done"
                            onFocus={e => e.target.select()}
                            value={inputs.budget || ''}
                            onChange={e => handleChange('budget', e.target.value)}
                            placeholder={['BHD', 'KWD', 'OMR'].includes(curr) ? '500.00' : '5000.00'}
                            className="w-full min-h-[54px] bg-transparent py-3.5 px-4 text-xl sm:text-2xl font-bold font-numbers outline-none"
                            style={{ color: 'var(--text-primary)' }}
                        />
                        {inputs.budget > 0 && (
                            <button
                                type="button"
                                onClick={() => handleClear('budget')}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                                style={{ color: 'var(--text-secondary)' }}
                                aria-label="Clear"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Making Charge per Gram Input ── */}
                <div className="space-y-1.5 input-field-group">
                    <div className="flex items-center justify-between gap-2">
                        <label htmlFor="budget-making" className="input-field-label text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? `المصنعية المتوقعة للجرام (${curr})` : `Making Charge per gram (${curr})`}
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
                            id="budget-making"
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
                        {makingTiers.map(tier => (
                            <button
                                key={tier.value}
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, makingPerGram: tier.value }))}
                                className="min-h-[44px] sm:min-h-[38px] px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 border flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                                style={{
                                    background: inputs.makingPerGram === tier.value ? 'var(--primary-vivid)' : 'var(--bg-input)',
                                    color: inputs.makingPerGram === tier.value ? 'var(--primary-ink)' : 'var(--text-primary)',
                                    borderColor: inputs.makingPerGram === tier.value ? 'var(--primary-vivid)' : 'var(--border)'
                                }}
                            >
                                <span className="font-numbers">{tier.value}</span>
                                <span className="text-[11px] opacity-75">({isRtl ? tier.nameAr : tier.name})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Detailed Mode: Max Weight across Making Tiers ── */}
                {canShowTiers && weightByTier && (
                    <div className="rounded-2xl border p-3.5 sm:p-4 space-y-2.5" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                {t.budgetByTierTitle}
                            </span>
                            <span className="text-[11px] opacity-65 truncate" style={{ color: 'var(--text-secondary)' }}>
                                {t.budgetByTierHint}
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            {weightByTier.map((tier) => {
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
                                            {tier.maxWeight.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {isRtl ? 'جم' : 'g'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
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

export default BudgetView;
