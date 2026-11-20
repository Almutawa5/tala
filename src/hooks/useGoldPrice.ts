import { useState, useEffect, useCallback } from 'react';

const EXCHANGE_RATES: Record<string, number> = {
    'USD': 1,
    'BHD': 0.376,
    'SAR': 3.75,
    'QAR': 3.64,
    'AED': 3.6725
};

const CACHE_KEY = 'tala_cached_xau_usd';
const DEFAULT_FALLBACK_USD_OZ = 2650.00;

interface CachedGoldRate {
    priceUSD_oz: number;
    timestamp: string;
}

function readCachedGoldRate(): CachedGoldRate | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CachedGoldRate;
        if (typeof parsed.priceUSD_oz === 'number' && parsed.priceUSD_oz > 0 && parsed.timestamp) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
}

function computeLocalGramPrice(priceUSD_oz: number, currency: string, karat: string): number {
    const priceUSD_gram_24k = priceUSD_oz / 31.1035;
    const rate = EXCHANGE_RATES[currency] || 1;
    const priceLocal_gram_24k = priceUSD_gram_24k * rate;
    const karatFactor = parseInt(karat, 10) / 24;
    return priceLocal_gram_24k * karatFactor;
}

export const useGoldPrice = (currency: string, karat: string) => {
    const [priceUSD, setPriceUSD] = useState<number>(() => {
        const cached = readCachedGoldRate();
        return cached ? cached.priceUSD_oz : DEFAULT_FALLBACK_USD_OZ;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCached, setIsCached] = useState<boolean>(() => !!readCachedGoldRate());
    const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
        const cached = readCachedGoldRate();
        return cached ? new Date(cached.timestamp) : null;
    });

    const fetchPrice = useCallback(async () => {
        setLoading(true);
        setError(null);

        const cached = readCachedGoldRate();
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            if (cached) {
                setPriceUSD(cached.priceUSD_oz);
                setLastUpdated(new Date(cached.timestamp));
                setIsCached(true);
            }
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch('https://api.gold-api.com/price/XAU', {
                signal: controller.signal
            });

            if (response.ok) {
                const data = await response.json();
                if (typeof data.price === 'number' && data.price > 0) {
                    const now = new Date();
                    setPriceUSD(data.price);
                    setLastUpdated(now);
                    setIsCached(false);
                    try {
                        localStorage.setItem(CACHE_KEY, JSON.stringify({
                            priceUSD_oz: data.price,
                            timestamp: now.toISOString()
                        }));
                    } catch {
                        // Ignore storage quota errors
                    }
                    return;
                }
            }

            if (cached) {
                setPriceUSD(cached.priceUSD_oz);
                setLastUpdated(new Date(cached.timestamp));
                setIsCached(true);
            }
        } catch (err) {
            if (cached) {
                setPriceUSD(cached.priceUSD_oz);
                setLastUpdated(new Date(cached.timestamp));
                setIsCached(true);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrice();
        const interval = setInterval(fetchPrice, 60000);
        const handleOnline = () => {
            fetchPrice();
        };
        window.addEventListener('online', handleOnline);
        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
        };
    }, [fetchPrice]);

    const price = computeLocalGramPrice(priceUSD, currency, karat);

    return { price, loading, error, lastUpdated, isCached, refresh: fetchPrice };
};
