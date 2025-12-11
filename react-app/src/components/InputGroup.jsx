import React from 'react';

const InputGroup = ({
    id,
    label,
    subLabel,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 0.01,
    placeholder = "0.00"
}) => {
    return (
        <div className="input-group transition-all duration-200">
            <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1.5 flex justify-between">
                <span>{label}</span>
                {subLabel && <span className="text-xs text-slate-400 font-normal">{subLabel}</span>}
            </label>
            <div className="relative">
                <input
                    type="number"
                    id={id}
                    step={step}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="block w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:bg-white transition-all font-medium text-lg placeholder:text-slate-300 mb-2"
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value || 0}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full accent-gold-500"
                />
            </div>
        </div>
    );
};

export default InputGroup;
