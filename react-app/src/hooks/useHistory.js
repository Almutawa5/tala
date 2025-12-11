import { useState, useEffect } from 'react';

const MAX_HISTORY = 50;

export const useHistory = () => {
    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem('goldCalc_history');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('goldCalc_history', JSON.stringify(history));
    }, [history]);

    const saveCalculation = (type, inputs, results, currency, name = '') => {
        const newItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            type,
            inputs,
            results,
            currency,
            name
        };

        setHistory(prev => {
            const newHistory = [newItem, ...prev];
            return newHistory.slice(0, MAX_HISTORY);
        });
    };

    const deleteCalculation = (id) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    };

    const clearHistory = () => {
        setHistory([]);
    };

    return { history, saveCalculation, deleteCalculation, clearHistory };
};
