import React from 'react';

interface LoadingSkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height,
    lines = 1
}) => {
    const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700';

    const getVariantClasses = () => {
        switch (variant) {
            case 'circular':
                return 'rounded-full';
            case 'rectangular':
                return 'rounded-lg';
            case 'text':
            default:
                return 'rounded h-4';
        }
    };

    const style: React.CSSProperties = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'circular' ? width : undefined),
    };

    if (lines > 1 && variant === 'text') {
        return (
            <div className={`space-y-2 ${className}`}>
                {Array.from({ length: lines }).map((_, index) => (
                    <div
                        key={index}
                        className={`${baseClasses} ${getVariantClasses()}`}
                        style={{
                            ...style,
                            width: index === lines - 1 ? '75%' : '100%'
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={`${baseClasses} ${getVariantClasses()} ${className}`}
            style={style}
        />
    );
};

// Specific skeleton for the Header price display
export const PriceLoadingSkeleton: React.FC = () => (
    <div className="inline-flex items-center gap-2 bg-slate-900 text-gold-400 px-4 py-2 rounded-full">
        <span className="animate-pulse">●</span>
        <LoadingSkeleton variant="text" width={120} height={16} />
    </div>
);

// Skeleton for result rows
export const ResultRowSkeleton: React.FC = () => (
    <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
        <LoadingSkeleton variant="text" width={100} height={14} />
        <LoadingSkeleton variant="text" width={80} height={20} />
    </div>
);

export default LoadingSkeleton;
