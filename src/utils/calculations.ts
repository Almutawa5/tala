export interface BreakdownResult {
    vatAmount: number;
    priceNoVat: number;
    rawGoldCost: number;
    totalMaking: number;
    makingPerGram: number;
}

export const calculateBreakdown = (
    goldPrice: number,
    itemPrice: number,
    weight: number,
    vatPercentage: number
): BreakdownResult => {
    if (goldPrice > 0 && itemPrice > 0 && weight > 0) {
        const priceNoVat = itemPrice / (1 + vatPercentage / 100);
        const vatAmount = itemPrice - priceNoVat;
        const rawGoldCost = weight * goldPrice;
        const totalMaking = priceNoVat - rawGoldCost;
        const makingPerGram = totalMaking / weight;

        return {
            vatAmount,
            priceNoVat,
            rawGoldCost,
            totalMaking,
            makingPerGram
        };
    }
    return {
        vatAmount: 0,
        priceNoVat: 0,
        rawGoldCost: 0,
        totalMaking: 0,
        makingPerGram: 0
    };
};

export interface EstimatorResult {
    rawGoldCost: number;
    totalMaking: number;
    vatAmount: number;
    totalPrice: number;
}

export const calculateEstimator = (
    goldPrice: number,
    weight: number,
    makingPerGram: number,
    vatPercentage: number
): EstimatorResult => {
    if (goldPrice > 0 && weight > 0) {
        const rawGoldCost = weight * goldPrice;
        const totalMaking = weight * makingPerGram;
        const priceNoVat = rawGoldCost + totalMaking;
        const vatAmount = priceNoVat * (vatPercentage / 100);
        const totalPrice = priceNoVat + vatAmount;

        return {
            rawGoldCost,
            totalMaking,
            vatAmount,
            totalPrice
        };
    }
    return {
        rawGoldCost: 0,
        totalMaking: 0,
        vatAmount: 0,
        totalPrice: 0
    };
};

export const formatCurrency = (num: number): string => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export interface DealRating {
    tier: 'great' | 'fair' | 'premium' | 'high';
    label: string;
    subtext: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

// Market tiers based on typical making charges per region/currency
export interface MakingTier {
    name: string;
    nameAr: string;
    value: number;
    color: string;
}

export const getMakingTiers = (currency: string): MakingTier[] => {
    if (['BHD', 'KWD', 'OMR'].includes(currency)) {
        return [
            { name: 'Simple', nameAr: 'بسيطة', value: 1.5, color: '#10B981' },
            { name: 'Standard', nameAr: 'عادية', value: 2.5, color: '#3B82F6' },
            { name: 'Detailed', nameAr: 'متقنة', value: 4.0, color: '#F59E0B' },
            { name: 'Luxury', nameAr: 'فاخرة', value: 6.0, color: '#EF4444' },
        ];
    }
    if (['USD', 'EUR'].includes(currency)) {
        return [
            { name: 'Simple', nameAr: 'بسيطة', value: 5, color: '#10B981' },
            { name: 'Standard', nameAr: 'عادية', value: 10, color: '#3B82F6' },
            { name: 'Detailed', nameAr: 'متقنة', value: 18, color: '#F59E0B' },
            { name: 'Luxury', nameAr: 'فاخرة', value: 30, color: '#EF4444' },
        ];
    }
    // SAR, AED, QAR, etc.
    return [
        { name: 'Simple', nameAr: 'بسيطة', value: 15, color: '#10B981' },
        { name: 'Standard', nameAr: 'عادية', value: 25, color: '#3B82F6' },
        { name: 'Detailed', nameAr: 'متقنة', value: 40, color: '#F59E0B' },
        { name: 'Luxury', nameAr: 'فاخرة', value: 60, color: '#EF4444' },
    ];
};

export interface MarketBenchmark {
    tier: MakingTier;
    deviation: number;   // % above or below the standard tier
    isAbove: boolean;
}

export const getMarketBenchmark = (makingPerGram: number, currency: string): MarketBenchmark | null => {
    if (makingPerGram <= 0) return null;
    const tiers = getMakingTiers(currency);
    const standard = tiers[1]; // "Standard" tier as benchmark
    const deviation = ((makingPerGram - standard.value) / standard.value) * 100;
    return {
        tier: standard,
        deviation: Math.round(deviation),
        isAbove: deviation > 0
    };
};

export const getDealRating = (
    makingPerGram: number,
    goldPrice: number,
    language: 'en' | 'ar' = 'en'
): DealRating | null => {
    if (makingPerGram <= 0 || goldPrice <= 0) return null;
    const ratio = makingPerGram / goldPrice;
    const isAr = language === 'ar';

    if (ratio <= 0.08) {
        return {
            tier: 'great',
            label: isAr ? 'صفقة ممتازة (مصنعية منخفضة)' : 'Great Deal (Very Low Making)',
            subtext: isAr ? 'أقل من ٨٪ من سعر الذهب' : '<8% of raw gold spot price',
            color: '#10B981',
            bgColor: 'rgba(16, 185, 129, 0.15)',
            borderColor: 'rgba(16, 185, 129, 0.35)'
        };
    } else if (ratio <= 0.16) {
        return {
            tier: 'fair',
            label: isAr ? 'سعر عادل (متوسط السوق)' : 'Fair Price (Market Average)',
            subtext: isAr ? 'مصنعية قياسية ومتداولة' : 'Standard competitive jeweler rate',
            color: '#3B82F6',
            bgColor: 'rgba(59, 130, 246, 0.15)',
            borderColor: 'rgba(59, 130, 246, 0.35)'
        };
    } else if (ratio <= 0.25) {
        return {
            tier: 'premium',
            label: isAr ? 'شغل متقن / تصاميم خاصة' : 'Premium / Intricate Craft',
            subtext: isAr ? 'مناسب للقطع المعقدة والأحجار' : 'Typical for detailed or designer work',
            color: '#F59E0B',
            bgColor: 'rgba(245, 158, 11, 0.15)',
            borderColor: 'rgba(245, 158, 11, 0.35)'
        };
    } else {
        return {
            tier: 'high',
            label: isAr ? 'مصنعية مرتفعة (تفاوض)' : 'High Making (Negotiate)',
            subtext: isAr ? 'أعلى من ٢٥٪ — حاول التفاوض للتخفيض' : '>25% — recommend asking for a discount',
            color: '#EF4444',
            bgColor: 'rgba(239, 68, 68, 0.15)',
            borderColor: 'rgba(239, 68, 68, 0.35)'
        };
    }
};
