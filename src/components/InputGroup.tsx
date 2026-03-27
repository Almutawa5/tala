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
                className={`block text-sm font-medium mb-1.5 flex justify-between transition-colors duration-200 ${isFocused ? 'text-gold-600' : 'text-slate-600'
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
                    className={`block w-full px-5 py-3.5 rounded-2xl border-transparent bg-white/50 backdrop-blur-sm text-slate-900 focus:outline-none focus:bg-white transition-all duration-300 font-medium font-numbers text-lg placeholder:text-slate-400 mb-2 shadow-sm hover:shadow-md ${displayError
                        ? 'border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]'
                        : isFocused
                            ? 'border-primary shadow-[0_0_20px_rgba(212,175,55,0.2)] ring-1 ring-primary-light'
                            : 'border-transparent'
                        }`}
                />
                {displayError && (
                    <p className="text-red-500 text-xs mt-1 mb-2 animate-fade-in pl-2">
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
