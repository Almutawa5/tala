import React, { useEffect } from 'react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidthClass?: string;
    ariaLabel?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    children,
    maxWidthClass = 'sm:max-w-md',
    ariaLabel,
}) => {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
        >
            <div
                className={`w-full ${maxWidthClass} rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[88dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-sheet-up sm:animate-fade-in-scale border`}
                style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile drag handle affordance */}
                <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div
                        className="w-10 h-1.5 rounded-full opacity-35"
                        style={{ backgroundColor: 'var(--text-secondary)' }}
                    />
                </div>
                {children}
            </div>
        </div>
    );
};

export default BottomSheet;
