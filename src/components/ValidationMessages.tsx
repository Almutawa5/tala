import React from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { ValidationMessage } from '../utils/validation';

interface ValidationMessagesProps {
    messages: ValidationMessage[];
}

const LEVEL_STYLES = {
    error: {
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200'
    },
    warning: {
        icon: AlertTriangle,
        className: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    info: {
        icon: Info,
        className: 'bg-sky-50 text-sky-800 border-sky-200'
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
