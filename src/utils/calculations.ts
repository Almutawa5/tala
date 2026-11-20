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

export interface BudgetResult {
    maxWeight: number;
    priceNoVat: number;
    vatAmount: number;
    rawGoldCost: number;
    totalMaking: number;
    costPerGramInclVat: number;
}

export const calculateBudget = (
    goldPrice: number,
    budget: number,
    makingPerGram: number,
    vatPercentage: number
): BudgetResult => {
    const safeMaking = Math.max(0, makingPerGram);
    const basePerGram = goldPrice + safeMaking;
    const vatMultiplier = 1 + Math.max(0, vatPercentage) / 100;
    const costPerGramInclVat = basePerGram * vatMultiplier;

    if (goldPrice > 0 && budget > 0 && costPerGramInclVat > 0) {
        const maxWeight = budget / costPerGramInclVat;
        const priceNoVat = budget / vatMultiplier;
        const vatAmount = budget - priceNoVat;
        const rawGoldCost = maxWeight * goldPrice;
        const totalMaking = maxWeight * safeMaking;

        return {
            maxWeight,
            priceNoVat,
            vatAmount,
            rawGoldCost,
            totalMaking,
            costPerGramInclVat
        };
    }

    return {
        maxWeight: 0,
        priceNoVat: 0,
        vatAmount: 0,
        rawGoldCost: 0,
        totalMaking: 0,
        costPerGramInclVat
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
            { name: 'Standard', nameAr: 'متوسطة', value: 2.5, color: '#38BDF8' },
            { name: 'Detailed', nameAr: 'متقنة', value: 4.0, color: '#E5A93B' },
            { name: 'Luxury', nameAr: 'فاخرة', value: 6.0, color: '#F87171' },
        ];
    }
    if (['USD', 'EUR'].includes(currency)) {
        return [
            { name: 'Simple', nameAr: 'بسيطة', value: 5, color: '#10B981' },
            { name: 'Standard', nameAr: 'متوسطة', value: 10, color: '#38BDF8' },
            { name: 'Detailed', nameAr: 'متقنة', value: 18, color: '#E5A93B' },
            { name: 'Luxury', nameAr: 'فاخرة', value: 30, color: '#F87171' },
        ];
    }
    // SAR, AED, QAR, etc.
    return [
        { name: 'Simple', nameAr: 'بسيطة', value: 15, color: '#10B981' },
        { name: 'Standard', nameAr: 'متوسطة', value: 25, color: '#38BDF8' },
        { name: 'Detailed', nameAr: 'متقنة', value: 40, color: '#E5A93B' },
        { name: 'Luxury', nameAr: 'فاخرة', value: 60, color: '#F87171' },
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
            label: isAr ? 'صفقة ممتازة · مصنعية منخفضة' : 'Great Deal (Very Low Making)',
            subtext: isAr ? 'أقل من ٨٪ من قيمة الذهب' : '<8% of raw gold spot price',
            color: '#34D399',
            bgColor: 'rgba(16, 185, 129, 0.14)',
            borderColor: 'rgba(52, 211, 153, 0.35)'
        };
    } else if (ratio <= 0.16) {
        return {
            tier: 'fair',
            label: isAr ? 'سعر عادل · متوسط السوق' : 'Fair Price (Market Average)',
            subtext: isAr ? 'مصنعية قياسية ومتداولة' : 'Standard competitive jeweler rate',
            color: '#38BDF8',
            bgColor: 'rgba(56, 189, 248, 0.14)',
            borderColor: 'rgba(56, 189, 248, 0.35)'
        };
    } else if (ratio <= 0.25) {
        return {
            tier: 'premium',
            label: isAr ? 'شغل متقن · تصميم خاص' : 'Premium / Intricate Craft',
            subtext: isAr ? 'مناسب للقطع الدقيقة والأحجار' : 'Typical for detailed or designer work',
            color: '#E5A93B',
            bgColor: 'rgba(229, 169, 59, 0.14)',
            borderColor: 'rgba(229, 169, 59, 0.35)'
        };
    } else {
        return {
            tier: 'high',
            label: isAr ? 'مصنعية مرتفعة · يُنصح بالتفاوض' : 'High Making (Negotiate)',
            subtext: isAr ? 'أعلى من ٢٥٪ — اطلب تخفيضاً من البائع' : '>25% — recommend asking for a discount',
            color: '#F87171',
            bgColor: 'rgba(248, 113, 113, 0.14)',
            borderColor: 'rgba(248, 113, 113, 0.35)'
        };
    }
};
