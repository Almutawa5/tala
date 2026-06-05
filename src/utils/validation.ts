export type ValidationLevel = 'error' | 'warning' | 'info';

export interface ValidationMessage {
    id: string;
    level: ValidationLevel;
    text: string;
}

export const hasErrors = (messages: ValidationMessage[]) =>
    messages.some(message => message.level === 'error');

export const getCommonInputWarnings = (
    values: Record<string, number>,
    labels: Record<string, string>,
    language: 'en' | 'ar'
): ValidationMessage[] => {
    const messages: ValidationMessage[] = [];

    Object.entries(values).forEach(([key, value]) => {
        const label = labels[key] || key;

        if (value < 0) {
            messages.push({
                id: `${key}-negative`,
                level: 'error',
                text: language === 'en'
                    ? `${label} cannot be negative.`
                    : `${label} لا يمكن أن يكون سالباً.`
            });
        }
    });

    return messages;
};

export const getGoldPriceWarnings = (
    goldPrice: number,
    language: 'en' | 'ar'
): ValidationMessage[] => {
    if (goldPrice > 0) return [];

    return [{
        id: 'gold-price-missing',
        level: 'info',
        text: language === 'en'
            ? 'Enter a gold price or use the live price before relying on results.'
            : 'أدخل سعر الذهب أو استخدم السعر المباشر قبل الاعتماد على النتائج.'
    }];
};

export const getWeightWarnings = (
    weight: number,
    language: 'en' | 'ar'
): ValidationMessage[] => {
    if (weight > 0) return [];

    return [{
        id: 'weight-missing',
        level: 'info',
        text: language === 'en'
            ? 'Enter the item weight to calculate per-gram values.'
            : 'أدخل وزن القطعة لحساب القيم لكل جرام.'
    }];
};

export const getMakingChargeWarnings = (
    makingPerGram: number,
    goldPrice: number,
    language: 'en' | 'ar'
): ValidationMessage[] => {
    const messages: ValidationMessage[] = [];

    if (makingPerGram < 0) {
        messages.push({
            id: 'making-negative',
            level: 'warning',
            text: language === 'en'
                ? 'Making charge is negative. Check item price, weight, and gold price.'
                : 'المصنعية سالبة. تحقق من سعر القطعة والوزن وسعر الذهب.'
        });
    }

    if (makingPerGram > 0 && goldPrice > 0 && makingPerGram > goldPrice * 0.5) {
        messages.push({
            id: 'making-high',
            level: 'warning',
            text: language === 'en'
                ? 'Making charge is unusually high compared with the gold value.'
                : 'المصنعية مرتفعة بشكل غير معتاد مقارنة بقيمة الذهب.'
        });
    }

    return messages;
};
