export const calculateBreakdown = (goldPrice, itemPrice, weight, vatPercentage) => {
    if (goldPrice > 0 && itemPrice > 0 && weight > 0) {
        const vatAmount = itemPrice * (vatPercentage / 100);
        const priceNoVat = itemPrice - vatAmount;
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

export const calculateEstimator = (goldPrice, weight, makingPerGram, vatPercentage) => {
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

export const formatCurrency = (num) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
