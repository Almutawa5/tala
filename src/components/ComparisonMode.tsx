import React, { useState } from 'react';
import { Scale, Plus, Trash2, Copy, Check } from 'lucide-react';
import { calculateBreakdown, formatCurrency } from '../utils/calculations';
import { translations } from '../utils/translations';
import { Settings } from '../hooks/useSettings';
import ValidationMessages from './ValidationMessages';
import { getCommonInputWarnings, getGoldPriceWarnings, getMakingChargeWarnings, getWeightWarnings } from '../utils/validation';

interface ShopEntry {
    id: string;
    name: string;
    itemPrice: number;
    weight: number;
}

interface ComparisonModeProps {
    settings: Settings;
    goldPrice: number;
}

const ComparisonMode: React.FC<ComparisonModeProps> = ({ settings, goldPrice }) => {
    const t = translations[settings.language];
    const isRtl = settings.language === 'ar';
    const curr = settings.currency;

    const [shops, setShops] = useState<ShopEntry[]>([
        { id: '1', name: isRtl ? 'محل ١' : 'Shop 1', itemPrice: 0, weight: 0 },
        { id: '2', name: isRtl ? 'محل ٢' : 'Shop 2', itemPrice: 0, weight: 0 }
    ]);
    const [copied, setCopied] = useState<string | null>(null);

    const addShop = () => {
        const newId = (shops.length + 1).toString();
        setShops([...shops, {
            id: newId,
            name: isRtl ? `محل ${newId}` : `Shop ${newId}`,
            itemPrice: 0,
            weight: 0
        }]);
    };

    const removeShop = (id: string) => {
        if (shops.length > 2) setShops(shops.filter(s => s.id !== id));
    };

    const updateShop = (id: string, field: keyof ShopEntry, value: string | number) => {
        setShops(shops.map(shop =>
            shop.id === id
                ? { ...shop, [field]: typeof value === 'string' && field !== 'name' ? parseFloat(value) || 0 : value }
                : shop
        ));
    };

    const handleShopStep = (id: string, field: 'itemPrice' | 'weight', step: number) => {
        setShops(shops.map(shop => {
            if (shop.id === id) {
                const currentVal = shop[field] || 0;
                const newVal = Math.max(0, Math.round((currentVal + step) * 100) / 100);
                return { ...shop, [field]: newVal };
            }
            return shop;
        }));
    };

    const getResults = (shop: ShopEntry) => calculateBreakdown(goldPrice, shop.itemPrice, shop.weight, settings.vatPercentage);

    const getShopWarnings = (shop: ShopEntry) => {
        const results = getResults(shop);
        return [
            ...getCommonInputWarnings({ itemPrice: shop.itemPrice, weight: shop.weight }, {
                itemPrice: isRtl ? 'سعر القطعة' : 'Item price',
                weight: isRtl ? 'الوزن' : 'Weight'
            }, settings.language),
            ...getWeightWarnings(shop.weight, settings.language),
            ...(shop.itemPrice <= 0 ? [{
                id: `${shop.id}-item-price-missing`,
                level: 'info' as const,
                text: isRtl ? 'أدخل سعر القطعة لإظهار المقارنة.' : 'Enter price to include in comparison.'
            }] : []),
            ...getMakingChargeWarnings(results.makingPerGram, goldPrice, settings.language)
        ];
    };

    const getBestDeal = () => {
        const validShops = shops.filter(s => s.itemPrice > 0 && s.weight > 0);
        if (validShops.length < 2) return null;
        let bestShop = validShops[0];
        let bestMakingPerGram = getResults(validShops[0]).makingPerGram;
        for (const shop of validShops) {
            const making = getResults(shop).makingPerGram;
            if (making < bestMakingPerGram) {
                bestMakingPerGram = making;
                bestShop = shop;
            }
        }
        return bestShop.id;
    };

    const copyResults = (shop: ShopEntry) => {
        const results = getResults(shop);
        const text = `${shop.name}\n${t.weight}: ${shop.weight}g\n${t.itemPrice}: ${formatCurrency(shop.itemPrice)}\n${t.makingPerGram}: ${formatCurrency(results.makingPerGram)}`;
        navigator.clipboard.writeText(text);
        setCopied(shop.id);
        setTimeout(() => setCopied(null), 2000);
    };

    const bestDealId = getBestDeal();
    const globalWarnings = getGoldPriceWarnings(goldPrice, settings.language);

    return (
        <div className="p-4 sm:p-8 lg:p-10 pb-28 lg:pb-10 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}
                    >
                        <Scale size={18} className="text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                            {isRtl ? 'مقارنة المحلات' : 'Compare Shops'}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? 'اكتشف أفضل سعر مصنعية' : 'Find the best making charge deal'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={addShop}
                    disabled={shops.length >= 5}
                    className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-40 cursor-pointer"
                    style={{ background: 'var(--text-primary)', color: 'var(--bg-main)' }}
                >
                    <Plus size={16} strokeWidth={2.5} />
                    <span>{isRtl ? 'إضافة محل' : 'Add Shop'}</span>
                </button>
            </div>

            {/* Gold price context */}
            <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
                <span>{isRtl ? 'سعر الذهب المستخدم:' : 'Using gold price:'}</span>
                <span className="font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(goldPrice)}
                </span>
                <span className="opacity-60 text-xs">{curr}/{settings.karat}K {isRtl ? 'لكل جرام' : 'per g'}</span>
            </div>

            <ValidationMessages messages={globalWarnings} />

            {/* Shop cards */}
            <div className="grid gap-5 md:grid-cols-2">
                {shops.map((shop) => {
                    const results = getResults(shop);
                    const isBest = shop.id === bestDealId;
                    const shopWarnings = getShopWarnings(shop);
                    const hasData = shop.itemPrice > 0 && shop.weight > 0;

                    return (
                        <div
                            key={shop.id}
                            className="relative rounded-3xl overflow-hidden transition-all duration-300"
                            style={{
                                background: 'var(--bg-card)',
                                border: isBest ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                                boxShadow: isBest ? '0 0 0 3px rgba(245,158,11,0.12), 0 8px 32px rgba(0,0,0,0.08)' : '0 2px 12px rgba(0,0,0,0.04)'
                            }}
                        >
                            {/* Best deal badge */}
                            {isBest && (
                                <div
                                    className="absolute top-0 left-0 right-0 py-1.5 text-center text-[11px] font-black uppercase tracking-widest"
                                    style={{ background: 'var(--primary)', color: '#0F172A' }}
                                >
                                    {isRtl ? '★ أفضل سعر!' : '★ Best Deal!'}
                                </div>
                            )}

                            <div className={`p-5 space-y-4 ${isBest ? 'pt-10' : ''}`}>
                                {/* Shop name + actions */}
                                <div className="flex items-center justify-between">
                                    <input
                                        type="text"
                                        value={shop.name}
                                        onChange={(e) => updateShop(shop.id, 'name', e.target.value)}
                                        className="font-bold text-base bg-transparent border-b-2 border-transparent hover:border-current focus:outline-none focus:border-current transition-colors px-1 min-w-0"
                                        style={{ color: 'var(--text-primary)', borderColor: 'transparent' }}
                                        onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                                        onBlur={e => (e.target.style.borderColor = 'transparent')}
                                    />
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => copyResults(shop)}
                                            className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                                            style={{ color: copied === shop.id ? '#34d399' : 'var(--text-secondary)', background: 'var(--border)' }}
                                            title={isRtl ? 'نسخ النتائج' : 'Copy results'}
                                            aria-label="Copy"
                                        >
                                            {copied === shop.id ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                        {shops.length > 2 && (
                                            <button
                                                onClick={() => removeShop(shop.id)}
                                                className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                                                style={{ color: 'var(--text-secondary)', background: 'var(--border)' }}
                                                aria-label="Remove shop"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <ValidationMessages messages={shopWarnings} />

                                {/* Inputs grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Item Price */}
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            {isRtl ? 'السعر' : 'Price'}
                                        </label>
                                        <p className="text-[10px] mb-2 opacity-60" style={{ color: 'var(--text-secondary)' }}>
                                            {isRtl ? 'شامل الضريبة' : `Incl. VAT (${curr})`}
                                        </p>
                                        <div
                                            className="flex items-center rounded-xl p-1 gap-1"
                                            style={{ background: 'var(--bg-input)', border: '1.5px solid var(--border)' }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleShopStep(shop.id, 'itemPrice', -10)}
                                                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all select-none active:scale-90 shrink-0"
                                                style={{ background: 'var(--border)', color: 'var(--text-primary)' }}
                                            >−</button>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                onFocus={e => e.target.select()}
                                                value={shop.itemPrice || ''}
                                                onChange={e => updateShop(shop.id, 'itemPrice', e.target.value)}
                                                placeholder="0"
                                                className="flex-1 bg-transparent border-none text-center focus:outline-none font-numbers text-sm font-bold min-w-0"
                                                style={{ color: 'var(--text-primary)' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleShopStep(shop.id, 'itemPrice', 10)}
                                                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all select-none active:scale-90 shrink-0"
                                                style={{ background: 'var(--border)', color: 'var(--text-primary)' }}
                                            >+</button>
                                        </div>
                                    </div>

                                    {/* Weight */}
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            {isRtl ? 'الوزن' : 'Weight'}
                                        </label>
                                        <p className="text-[10px] mb-2 opacity-60" style={{ color: 'var(--text-secondary)' }}>
                                            {isRtl ? 'بالجرام' : 'In grams (g)'}
                                        </p>
                                        <div
                                            className="flex items-center rounded-xl p-1 gap-1"
                                            style={{ background: 'var(--bg-input)', border: '1.5px solid var(--border)' }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleShopStep(shop.id, 'weight', -1)}
                                                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all select-none active:scale-90 shrink-0"
                                                style={{ background: 'var(--border)', color: 'var(--text-primary)' }}
                                            >−</button>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                onFocus={e => e.target.select()}
                                                value={shop.weight || ''}
                                                onChange={e => updateShop(shop.id, 'weight', e.target.value)}
                                                placeholder="0"
                                                className="flex-1 bg-transparent border-none text-center focus:outline-none font-numbers text-sm font-bold min-w-0"
                                                style={{ color: 'var(--text-primary)' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleShopStep(shop.id, 'weight', 1)}
                                                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all select-none active:scale-90 shrink-0"
                                                style={{ background: 'var(--border)', color: 'var(--text-primary)' }}
                                            >+</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Results */}
                                <div
                                    className="rounded-2xl p-4 space-y-2.5"
                                    style={{ background: 'var(--border)' }}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            {isRtl ? 'مصنعية/جرام' : 'Making/gram'}
                                        </span>
                                        <span
                                            className="font-numbers text-base font-extrabold"
                                            style={{ color: hasData ? (isBest ? '#34d399' : 'var(--primary)') : 'var(--text-secondary)' }}
                                        >
                                            {hasData ? `${curr} ${formatCurrency(results.makingPerGram)}` : '—'}
                                        </span>
                                    </div>
                                    <div className="h-px" style={{ background: 'var(--border)', opacity: 0.5 }} />
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            {isRtl ? 'إجمالي المصنعية' : 'Total making'}
                                        </span>
                                        <span className="font-numbers text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {hasData ? `${curr} ${formatCurrency(results.totalMaking)}` : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Best deal summary */}
            {bestDealId && (
                <div
                    className="p-4 rounded-2xl text-center text-sm font-semibold animate-fade-in"
                    style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
                >
                    {isRtl
                        ? `${shops.find(s => s.id === bestDealId)?.name} لديه أقل مصنعية للجرام!`
                        : `${shops.find(s => s.id === bestDealId)?.name} has the lowest making charge per gram!`
                    }
                </div>
            )}
        </div>
    );
};

export default ComparisonMode;
