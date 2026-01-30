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
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Scale size={20} className="text-gold-500" />
                    {settings.language === 'en' ? 'Compare Shops' : 'مقارنة المحلات'}
                </h3>
                <button
                    onClick={addShop}
                    disabled={shops.length >= 5}
                    className="flex items-center gap-1 text-sm bg-gold-500 hover:bg-gold-600 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Plus size={16} />
                    {settings.language === 'en' ? 'Add Shop' : 'إضافة محل'}
                </button>
            </div>

            <div className="text-sm text-slate-500 mb-4 p-2 bg-slate-100 rounded-lg">
                {settings.language === 'en'
                    ? `Using gold price: ${formatCurrency(goldPrice)} ${settings.currency}/${settings.karat}K per gram`
                    : `سعر الذهب: ${formatCurrency(goldPrice)} ${settings.currency}/${settings.karat}ك للجرام`
                }
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {shops.map((shop) => {
                    const results = getResults(shop);
                    const isBest = shop.id === bestDealId;

                    return (
                        <div
                            key={shop.id}
                            className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${isBest
                                ? 'border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-100'
                                : 'border-slate-200 bg-white'
                                }`}
                        >
                            {isBest && (
                                <div className="absolute -top-3 left-4 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-bounce">
                                    {settings.language === 'en' ? '⭐ Best Deal!' : '⭐ أفضل سعر!'}
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-3">
                                <input
                                    type="text"
                                    value={shop.name}
                                    onChange={(e) => updateShop(shop.id, 'name', e.target.value)}
                                    className="font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-gold-400 focus:outline-none transition-colors px-1"
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
                                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:border-gold-400 focus:outline-none"
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
                                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:border-gold-400 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">{t.makingPerGram}</span>
                                        <span className={`font-mono font-medium ${isBest ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            {shop.itemPrice > 0 && shop.weight > 0
                                                ? formatCurrency(results.makingPerGram)
                                                : '--'
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-slate-500">{t.totalMaking}</span>
                                        <span className="font-mono text-slate-700">
                                            {shop.itemPrice > 0 && shop.weight > 0
                                                ? formatCurrency(results.totalMaking)
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
