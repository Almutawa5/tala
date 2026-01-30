import React, { useState, useCallback } from 'react';

interface InputGroupProps {
    id: string;
    label: string;
    subLabel?: string;
    value: number | string;
    onChange: (value: string | number) => void;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    errorMessage?: string;
    showError?: boolean;
}

const InputGroup: React.FC<InputGroupProps> = ({
    id,
    label,
    subLabel,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 0.01,
    placeholder = "0.00",
    errorMessage,
    showError = false
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const validateAndChange = useCallback((inputValue: string) => {
        // Remove any non-numeric characters except decimal point and minus
        const sanitized = inputValue.replace(/[^0-9.-]/g, '');
        
        // Parse the value
        const numValue = parseFloat(sanitized);
        
        // Clear error first
        setLocalError(null);
        
        // Handle empty input
        if (sanitized === '' || sanitized === '-') {
            onChange(0);
            return;
        }
        
        // Prevent negative values
        if (numValue < 0) {
            setLocalError('Value cannot be negative');
            onChange(0);
            return;
        }
        
        // Check max value
        if (numValue > max) {
            setLocalError(`Maximum value is ${max}`);
            onChange(max);
            return;
        }
        
        // Valid value
        onChange(numValue);
    }, [max, onChange]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Prevent minus key
        if (e.key === '-') {
            e.preventDefault();
            setLocalError('Negative values not allowed');
            setTimeout(() => setLocalError(null), 2000);
        }
    };

    const displayError = showError ? errorMessage : localError;

    return (
        <div className={`input-group transition-all duration-300 ${isFocused ? 'scale-[1.01]' : ''}`}>
            <label 
                htmlFor={id} 
                className={`block text-sm font-medium mb-1.5 flex justify-between transition-colors duration-200 ${
                    isFocused ? 'text-gold-600' : 'text-slate-600'
                }`}
            >
                <span>{label}</span>
                {subLabel && <span className="text-xs text-slate-400 font-normal">{subLabel}</span>}
            </label>
            <div className="relative">
                <input
                    type="number"
                    id={id}
                    step={step}
                    min={0}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => validateAndChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`block w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 focus:outline-none focus:bg-white transition-all duration-200 font-medium text-lg placeholder:text-slate-300 mb-2 ${
                        displayError 
                            ? 'border-red-400 ring-2 ring-red-100' 
                            : isFocused 
                                ? 'border-gold-400 ring-2 ring-gold-100' 
                                : 'border-slate-200'
                    }`}
                />
                {displayError && (
                    <p className="text-red-500 text-xs mt-1 mb-2 animate-fade-in">
                        {displayError}
                    </p>
                )}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={typeof value === 'number' ? value : parseFloat(value as string) || 0}
                    onChange={(e) => validateAndChange(e.target.value)}
                    className="w-full accent-gold-500 transition-opacity duration-200 hover:opacity-80"
                />
            </div>
        </div>
    );
};

export default InputGroup;
