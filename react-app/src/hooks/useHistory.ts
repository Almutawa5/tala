import { useState, useEffect } from 'react';

const MAX_HISTORY = 50;

export interface HistoryInput {
    goldPrice: number;
    weight: number;
    itemPrice?: number;
    makingPerGram?: number;
}

export interface HistoryResult {
    vatAmount?: number;
    priceNoVat?: number;
    rawGoldCost: number;
    totalMaking: number;
    makingPerGram?: number;
    totalPrice?: number;
}

export interface HistoryItem {
    id: number;
    timestamp: string;
    type: 'breakdown' | 'estimator';
    inputs: HistoryInput;
    results: HistoryResult;
    currency: string;
    name?: string;
}

export const useHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        const saved = localStorage.getItem('goldCalc_history');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('goldCalc_history', JSON.stringify(history));
    }, [history]);

    const saveCalculation = (
        type: 'breakdown' | 'estimator',
        inputs: HistoryInput,
        results: HistoryResult,
        currency: string,
        name: string = ''
    ) => {
        const newItem: HistoryItem = {
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

    const deleteCalculation = (id: number) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const renameCalculation = (id: number, newName: string) => {
        setHistory(prev => prev.map(item =>
            item.id === id ? { ...item, name: newName } : item
        ));
    };

    return { history, saveCalculation, deleteCalculation, clearHistory, renameCalculation };
};
