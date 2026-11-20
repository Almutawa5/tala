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
        const unit = isRtl ? 'جم' : 'g';
        const lines = [
            `🏪 *${shop.name}*`,
            `✨ ${isRtl ? `عيار ${settings.karat}` : `${settings.karat}K`} | ⚖️ ${t.weight}: ${shop.weight} ${unit}`,
            `🏷️ ${t.itemPrice}: ${curr} ${formatCurrency(shop.itemPrice)}`,
            `🔨 ${t.makingPerGram}: ${curr} ${formatCurrency(results.makingPerGram)}/${unit}`,
            `🛠️ ${t.totalMaking}: ${curr} ${formatCurrency(results.totalMaking)}`
        ];
        navigator.clipboard.writeText(lines.join('\n'));
        setCopied(shop.id);
        setTimeout(() => setCopied(null), 2000);
    };

    const bestDealId = getBestDeal();
    const globalWarnings = getGoldPriceWarnings(goldPrice, settings.language);

    return (
        <div className="p-4 sm:p-8 lg:p-10 pb-8 lg:pb-10 space-y-5 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                    >
                        <Scale size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                            {isRtl ? 'مقارنة المحلات' : 'Compare Shops'}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {isRtl ? 'قارن الأسعار واختر أقل مصنعية' : 'Find the best making charge deal'}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={addShop}
                    disabled={shops.length >= 5}
                    className="flex items-center gap-2 min-h-[44px] text-sm px-4 py-2 rounded-xl font-bold transition-all duration-150 active:scale-95 disabled:opacity-40 cursor-pointer whitespace-nowrap"
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
                <span>{isRtl ? 'سعر الذهب المعتمد:' : 'Using gold price:'}</span>
                <span className="font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(goldPrice)}
                </span>
                <span className="opacity-65 text-xs">
                    {isRtl ? `${curr} · عيار ${settings.karat} / جم` : `${curr}/${settings.karat}K per g`}
                </span>
            </div>

            <ValidationMessages messages={globalWarnings} />

            {/* Shop cards */}
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
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
                                background: 'var(--bg-surface)',
                                border: isBest ? '1.5px solid var(--primary-vivid)' : '1px solid var(--border)',
                                boxShadow: isBest ? '0 0 0 3px var(--primary-soft), var(--shadow-card)' : 'var(--shadow-card)'
                            }}
                        >
                            {/* Best deal badge */}
                            {isBest && (
                                <div
                                    className="absolute top-0 left-0 right-0 py-1.5 text-center text-[11px] font-black uppercase tracking-widest"
                                    style={{ background: 'var(--primary-vivid)', color: 'var(--primary-ink)' }}
                                >
                                    {isRtl ? '★ الأفضل سعراً' : '★ Best Deal!'}
                                </div>
                            )}

                            <div className={`p-4 sm:p-5 space-y-4 ${isBest ? 'pt-10' : ''}`}>
                                {/* Shop name + actions */}
                                <div className="flex items-center justify-between gap-2">
                                    <input
                                        type="text"
                                        value={shop.name}
                                        enterKeyHint="done"
                                        onChange={(e) => updateShop(shop.id, 'name', e.target.value)}
                                        className="font-bold text-base min-h-[44px] bg-transparent border-b-2 border-transparent hover:border-current focus:outline-none focus:border-current transition-colors px-1 min-w-0 flex-1"
                                        style={{ color: 'var(--text-primary)', borderColor: 'transparent' }}
                                        onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                                        onBlur={e => (e.target.style.borderColor = 'transparent')}
                                    />
                                    <div className="flex gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => copyResults(shop)}
                                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95"
                                            style={{ color: copied === shop.id ? 'var(--craft-accent)' : 'var(--text-secondary)', background: 'var(--bg-muted)' }}
                                            title={isRtl ? 'نسخ النتائج' : 'Copy results'}
                                            aria-label="Copy"
                                        >
                                            {copied === shop.id ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                        {shops.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeShop(shop.id)}
                                                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95"
                                                style={{ color: 'var(--text-secondary)', background: 'var(--bg-muted)' }}
                                                aria-label="Remove shop"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <ValidationMessages messages={shopWarnings} />

                                {/* Inputs grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Item Price */}
                                    <div className="input-field-group">
                                        <div className="flex items-baseline justify-between mb-1.5">
                                            <label htmlFor={`shop-price-${shop.id}`} className="input-field-label text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                                                {isRtl ? 'السعر' : 'Price'}
                                            </label>
                                            <span className="text-[10px] opacity-65" style={{ color: 'var(--text-secondary)' }}>
                                                {isRtl ? 'شامل الضريبة' : `Incl. VAT (${curr})`}
                                            </span>
                                        </div>
                                        <div className="flex items-center rounded-xl p-1 gap-1 input-field-box">
                                            <button
                                                type="button"
                                                onClick={() => handleShopStep(shop.id, 'itemPrice', -10)}
                                                className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-base transition-all select-none active:scale-90 shrink-0"
                                                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                                                aria-label="Decrease price"
                                            >−</button>
                                            <input
                                                id={`shop-price-${shop.id}`}
                                                type="number"
                                                inputMode="decimal"
                                                enterKeyHint="done"
                                                onFocus={e => e.target.select()}
                                                value={shop.itemPrice || ''}
                                                onChange={e => updateShop(shop.id, 'itemPrice', e.target.value)}
                                                placeholder="0"
                                                className="flex-1 min-h-[44px] bg-transparent border-none text-center focus:outline-none font-numbers text-base font-bold min-w-0"
                                                style={{ color: 'var(--text-primary)' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleShopStep(shop.id, 'itemPrice', 10)}
                                                className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-base transition-all select-none active:scale-90 shrink-0"
                                                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                                                aria-label="Increase price"
                                            >+</button>
                                        </div>
                                    </div>

                                    {/* Weight */}
                                    <div className="input-field-group">
                                        <div className="flex items-baseline justify-between mb-1.5">
                                            <label htmlFor={`shop-weight-${shop.id}`} className="input-field-label text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                                                {isRtl ? 'الوزن' : 'Weight'}
                                            </label>
                                            <span className="text-[10px] opacity-65" style={{ color: 'var(--text-secondary)' }}>
                                                {isRtl ? 'بالجرام' : 'In grams (g)'}
                                            </span>
                                        </div>
                                        <div className="flex items-center rounded-xl p-1 gap-1 input-field-box">
                                            <button
                                                type="button"
                                                onClick={() => handleShopStep(shop.id, 'weight', -1)}
                                                className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-base transition-all select-none active:scale-90 shrink-0"
                                                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                                                aria-label="Decrease weight"
                                            >−</button>
                                            <input
                                                id={`shop-weight-${shop.id}`}
                                                type="number"
                                                inputMode="decimal"
                                                enterKeyHint="done"
                                                onFocus={e => e.target.select()}
                                                value={shop.weight || ''}
                                                onChange={e => updateShop(shop.id, 'weight', e.target.value)}
                                                placeholder="0"
                                                className="flex-1 min-h-[44px] bg-transparent border-none text-center focus:outline-none font-numbers text-base font-bold min-w-0"
                                                style={{ color: 'var(--text-primary)' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleShopStep(shop.id, 'weight', 1)}
                                                className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-base transition-all select-none active:scale-90 shrink-0"
                                                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                                                aria-label="Increase weight"
                                            >+</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Results */}
                                <div
                                    className="rounded-2xl p-4 space-y-2.5 border"
                                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            {isRtl ? 'مصنعية الجرام' : 'Making/gram'}
                                        </span>
                                        <span
                                            className="font-numbers text-base font-extrabold"
                                            style={{ color: hasData ? (isBest ? 'var(--craft-accent)' : 'var(--primary)') : 'var(--text-secondary)' }}
                                        >
                                            {hasData ? `${curr} ${formatCurrency(results.makingPerGram)}` : '—'}
                                        </span>
                                    </div>
                                    <div className="h-px" style={{ background: 'var(--border)' }} />
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
                    style={{ background: 'var(--craft-soft)', color: 'var(--craft-accent)', border: '1px solid rgba(13, 148, 136, 0.25)' }}
                >
                    {isRtl
                        ? `${shops.find(s => s.id === bestDealId)?.name} يقدم أقل مصنعية للجرام!`
                        : `${shops.find(s => s.id === bestDealId)?.name} has the lowest making charge per gram!`
                    }
                </div>
            )}
        </div>
    );
};

export default ComparisonMode;
