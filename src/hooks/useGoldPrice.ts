import { useState, useEffect, useCallback } from 'react';

const EXCHANGE_RATES: Record<string, number> = {
    'USD': 1,
    'BHD': 0.376,
    'SAR': 3.75,
    'QAR': 3.64,
    'AED': 3.6725
};

export const useGoldPrice = (currency: string, karat: string) => {
    const [price, setPrice] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchPrice = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let priceUSD_oz = 2650.00; // Fallback

            try {
                const response = await fetch('https://api.gold-api.com/price/XAU');
                if (response.ok) {
                    const data = await response.json();
                    priceUSD_oz = data.price;
                }
            } catch (e) {
                console.warn("API fetch failed, using fallback price");
            }

            const priceUSD_gram_24k = priceUSD_oz / 31.1035;
            const rate = EXCHANGE_RATES[currency] || 1;
            const priceLocal_gram_24k = priceUSD_gram_24k * rate;
            const karatFactor = parseInt(karat) / 24;
            const finalPrice = priceLocal_gram_24k * karatFactor;

            setPrice(finalPrice);
            setLastUpdated(new Date());
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred");
            }
        } finally {
            setLoading(false);
        }
    }, [currency, karat]);

    useEffect(() => {
        fetchPrice();
        const interval = setInterval(fetchPrice, 60000);
        return () => clearInterval(interval);
    }, [fetchPrice]);

    return { price, loading, error, lastUpdated, refresh: fetchPrice };
};
