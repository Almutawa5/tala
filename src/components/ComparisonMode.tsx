import React, { useState } from 'react';
import { Scale, Plus, Trash2, Copy } from 'lucide-react';
import { calculateBreakdown, formatCurrency } from '../utils/calculations';
import { translations } from '../utils/translations';
import { Settings } from '../hooks/useSettings';

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
    const [shops, setShops] = useState<ShopEntry[]>([
        { id: '1', name: settings.language === 'en' ? 'Shop 1' : 'محل ١', itemPrice: 0, weight: 0 },
        { id: '2', name: settings.language === 'en' ? 'Shop 2' : 'محل ٢', itemPrice: 0, weight: 0 }
    ]);
    const [copied, setCopied] = useState<string | null>(null);

    const addShop = () => {
        const newId = (shops.length + 1).toString();
        setShops([...shops, {
            id: newId,
            name: settings.language === 'en' ? `Shop ${newId}` : `محل ${newId}`,
            itemPrice: 0,
            weight: 0
        }]);
    };

    const removeShop = (id: string) => {
        if (shops.length > 2) {
            setShops(shops.filter(s => s.id !== id));
        }
    };

    const updateShop = (id: string, field: keyof ShopEntry, value: string | number) => {
        setShops(shops.map(shop =>
            shop.id === id
                ? { ...shop, [field]: typeof value === 'string' && field !== 'name' ? parseFloat(value) || 0 : value }
                : shop
        ));
    };

    const getResults = (shop: ShopEntry) => {
        return calculateBreakdown(goldPrice, shop.itemPrice, shop.weight, settings.vatPercentage);
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
        const text = `${shop.name}\n` +
            `${t.weight}: ${shop.weight}g\n` +
            `${t.itemPrice}: ${formatCurrency(shop.itemPrice)}\n` +
            `${t.makingPerGram}: ${formatCurrency(results.makingPerGram)}`;

        navigator.clipboard.writeText(text);
        setCopied(shop.id);
        setTimeout(() => setCopied(null), 2000);
    };

    const bestDealId = getBestDeal();

    return (
        <div className="p-8 lg:p-10 space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gold-50 rounded-xl">
                        <Scale size={20} className="text-[#F59E0B]" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                            {settings.language === 'en' ? 'Compare Shops' : 'مقارنة المحلات'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Find the best making charge deal</p>
                    </div>
                </div>
                <button
                    onClick={addShop}
                    disabled={shops.length >= 5}
                    className="flex items-center gap-2 text-sm bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    <span className="font-bold">{settings.language === 'en' ? 'Add Shop' : 'إضافة محل'}</span>
                </button>
            </div>

            <div className="text-[13px] text-slate-600 mb-6 p-4 bg-slate-50/80 rounded-xl inline-block">
                {settings.language === 'en'
                    ? <span className="flex items-center gap-2 font-medium">Using gold price: <span className="font-numbers text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm">{formatCurrency(goldPrice)}</span> <span className="opacity-60">{settings.currency}/{settings.karat}K per gram</span></span>
                    : <span className="flex items-center gap-2 font-medium">سعر الذهب: <span className="font-numbers text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm">{formatCurrency(goldPrice)}</span> <span className="opacity-60">{settings.currency}/{settings.karat}ك للجرام</span></span>
                }
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {shops.map((shop) => {
                    const results = getResults(shop);
                    const isBest = shop.id === bestDealId;

                    return (
                        <div
                            key={shop.id}
                            className={`relative p-6 rounded-3xl transition-all duration-300 ${isBest
                                ? 'bg-white shadow-xl ring-2 ring-[#F59E0B] ring-opacity-50 shadow-[#F59E0B]/10'
                                : 'bg-slate-50/50 hover:bg-white hover:shadow-lg'
                                }`}
                        >
                            {isBest && (
                                <div className="absolute -top-3 left-6 bg-[#F59E0B] text-white text-[10px] sm:text-xs px-3 py-1 rounded-full font-bold shadow-lg uppercase tracking-wider">
                                    {settings.language === 'en' ? '⭐ Best Deal!' : '⭐ أفضل سعر!'}
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-3">
                                <input
                                    type="text"
                                    value={shop.name}
                                    onChange={(e) => updateShop(shop.id, 'name', e.target.value)}
                                    className="font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none transition-colors px-1"
                                />
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => copyResults(shop)}
                                        className="p-1.5 text-slate-400 hover:text-gold-500 transition-colors"
                                        title={settings.language === 'en' ? 'Copy results' : 'نسخ النتائج'}
                                    >
                                        {copied === shop.id ? (
                                            <span className="text-emerald-500 text-xs">✓</span>
                                        ) : (
                                            <Copy size={14} />
                                        )}
                                    </button>
                                    {shops.length > 2 && (
                                        <button
                                            onClick={() => removeShop(shop.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-500">
                                            {settings.language === 'en' ? 'Item Price' : 'سعر القطعة'}
                                        </label>
                                        <input
                                            type="number"
                                            value={shop.itemPrice || ''}
                                            onChange={(e) => updateShop(shop.id, 'itemPrice', e.target.value)}
                                            placeholder="0.00"
                                            min={0}
                                            className="w-full px-2 py-1.5 text-sm bg-slate-100/30 border-none rounded-lg focus:outline-none font-numbers"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">
                                            {settings.language === 'en' ? 'Weight (g)' : 'الوزن (جم)'}
                                        </label>
                                        <input
                                            type="number"
                                            value={shop.weight || ''}
                                            onChange={(e) => updateShop(shop.id, 'weight', e.target.value)}
                                            placeholder="0.00"
                                            min={0}
                                            className="w-full px-2 py-1.5 text-sm bg-slate-100/30 border-none rounded-lg focus:outline-none font-numbers"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 mt-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">{t.makingPerGram}</span>
                                        <span className={`font-numbers font-medium ${isBest ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            {shop.itemPrice > 0 && shop.weight > 0
                                                ? <span className="font-numbers text-emerald-600">{formatCurrency(results.makingPerGram)}</span>
                                                : '--'
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-slate-500">{t.totalMaking}</span>
                                        <span className="font-numbers text-slate-700">
                                            {shop.itemPrice > 0 && shop.weight > 0
                                                ? <span className="font-numbers text-slate-700">{formatCurrency(results.totalMaking)}</span>
                                                : '--'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {bestDealId && (
                <div className="mt-4 p-3 bg-emerald-100 rounded-lg text-center text-sm text-emerald-700 animate-fade-in">
                    {settings.language === 'en'
                        ? `${shops.find(s => s.id === bestDealId)?.name} has the lowest making charge per gram!`
                        : `${shops.find(s => s.id === bestDealId)?.name} لديه أقل مصنعية للجرام!`
                    }
                </div>
            )}
        </div>
    );
};

export default ComparisonMode;
