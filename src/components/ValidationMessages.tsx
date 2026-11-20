import React from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { ValidationMessage } from '../utils/validation';

interface ValidationMessagesProps {
    messages: ValidationMessage[];
}

const LEVEL_STYLES = {
    error: {
        icon: XCircle,
        className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25'
    },
    warning: {
        icon: AlertTriangle,
        className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25'
    },
    info: {
        icon: Info,
        className: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25'
    }
};

const ValidationMessages: React.FC<ValidationMessagesProps> = ({ messages }) => {
    if (messages.length === 0) return null;

    return (
        <div className="space-y-2" role="status" aria-live="polite">
            {messages.map(message => {
                const style = LEVEL_STYLES[message.level];
                const Icon = style.icon;

                return (
                    <div
                        key={message.id}
                        className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-medium leading-relaxed ${style.className}`}
                    >
                        <Icon size={15} className="mt-0.5 flex-shrink-0" />
                        <span>{message.text}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default ValidationMessages;
