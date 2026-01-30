import React from 'react';
import { ArrowRightLeft } from 'lucide-react';

export type WeightUnit = 'grams' | 'ounces';

interface WeightUnitToggleProps {
    unit: WeightUnit;
    onChange: (unit: WeightUnit) => void;
    language: 'en' | 'ar';
}

// Conversion factors
export const GRAMS_PER_OUNCE = 31.1035; // Troy ounce

export const convertWeight = (value: number, from: WeightUnit, to: WeightUnit): number => {
    if (from === to) return value;
    if (from === 'grams' && to === 'ounces') {
        return value / GRAMS_PER_OUNCE;
    }
    return value * GRAMS_PER_OUNCE; // ounces to grams
};

export const formatWeight = (value: number, unit: WeightUnit): string => {
    const decimals = unit === 'ounces' ? 4 : 2;
    return value.toFixed(decimals);
};

const WeightUnitToggle: React.FC<WeightUnitToggleProps> = ({ unit, onChange, language }) => {
    const labels = {
        grams: language === 'en' ? 'Grams' : 'جرام',
        ounces: language === 'en' ? 'oz (Troy)' : 'أونصة'
    };

    const toggle = () => {
        onChange(unit === 'grams' ? 'ounces' : 'grams');
    };

    return (
        <button
            onClick={toggle}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-200 group"
            title={language === 'en' ? 'Toggle weight unit' : 'تغيير وحدة الوزن'}
        >
            <span className={unit === 'grams' ? 'text-gold-600 font-semibold' : ''}>
                {labels.grams}
            </span>
            <ArrowRightLeft
                size={14}
                className="text-slate-400 group-hover:text-gold-500 transition-colors group-hover:rotate-180 duration-300"
            />
            <span className={unit === 'ounces' ? 'text-gold-600 font-semibold' : ''}>
                {labels.ounces}
            </span>
        </button>
    );
};

export default WeightUnitToggle;
