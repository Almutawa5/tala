export type ValidationLevel = 'error' | 'warning' | 'info';

export interface ValidationMessage {
    id: string;
    level: ValidationLevel;
    text: string;
}

export const hasErrors = (messages: ValidationMessage[]) =>
    messages.some(message => message.level === 'error');

const DEFAULT_LABELS: Record<string, Record<'en' | 'ar', string>> = {
    goldPrice: { en: 'Gold price', ar: 'سعر الذهب' },
    itemPrice: { en: 'Item price', ar: 'سعر القطعة' },
    weight: { en: 'Weight', ar: 'الوزن' },
    stoneWeight: { en: 'Stone weight', ar: 'وزن الفصوص' },
    makingPerGram: { en: 'Making charge per gram', ar: 'المصنعية للجرام' },
    budget: { en: 'Budget', ar: 'الميزانية' }
};

export const getCommonInputWarnings = (
    values: Record<string, number>,
    labels: Record<string, string>,
    language: 'en' | 'ar'
): ValidationMessage[] => {
    const messages: ValidationMessage[] = [];

    Object.entries(values).forEach(([key, value]) => {
        const label = labels[key] || DEFAULT_LABELS[key]?.[language] || key;

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
            : 'أدخل سعر الذهب أو اضغط تحديث لجلب السعر المباشر.'
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
            : 'أدخل وزن القطعة لحساب التكلفة لكل جرام.'
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
                : 'المصنعية سالبة؛ تأكد من صحة السعر والوزن وسعر الذهب.'
        });
    }

    if (makingPerGram > 0 && goldPrice > 0 && makingPerGram > goldPrice * 0.5) {
        messages.push({
            id: 'making-high',
            level: 'warning',
            text: language === 'en'
                ? 'Making charge is unusually high compared with the gold value.'
                : 'المصنعية مرتفعة جداً مقارنة بقيمة الذهب الخام.'
        });
    }

    return messages;
};

export const getStoneWeightWarnings = (
    weight: number,
    stoneWeight: number,
    language: 'en' | 'ar'
): ValidationMessage[] => {
    if (stoneWeight > 0 && weight > 0 && stoneWeight >= weight) {
        return [{
            id: 'stone-weight-exceeds',
            level: 'error',
            text: language === 'en'
                ? 'Stone weight must be less than total item weight.'
                : 'يجب أن يكون وزن الفصوص أقل من الوزن الإجمالي للقطعة.'
        }];
    }
    return [];
};
