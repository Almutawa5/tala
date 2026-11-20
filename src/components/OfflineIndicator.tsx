import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Language } from '../utils/translations';

interface OfflineIndicatorProps {
    language: Language;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language }) => {
    const isOnline = useOnlineStatus();
    const isAr = language === 'ar';

    if (isOnline) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-20 sm:bottom-4 start-4 z-40 flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold shadow-lg border backdrop-blur-md animate-fade-in"
            style={{
                background: 'rgba(10, 12, 16, 0.94)',
                borderColor: 'rgba(229, 169, 59, 0.4)',
                color: '#E5A93B'
            }}
        >
            <WifiOff size={14} className="shrink-0" />
            <span>
                {isAr
                    ? 'بدون إنترنت — يعمل التطبيق بآخر سعر محفوظ'
                    : 'Offline Mode — Using cached gold rate'}
            </span>
        </div>
    );
};

export default OfflineIndicator;
