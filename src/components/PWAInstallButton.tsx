import React, { useState } from 'react';
import { Download, Share, PlusSquare, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../utils/translations';
import BottomSheet from './BottomSheet';

interface PWAInstallButtonProps {
    language: Language;
    variant?: 'header' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ language, variant = 'header' }) => {
    const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    const isAr = language === 'ar';

    if (isInstalled) {
        return null;
    }

    if (!isInstallable && !isIOS) {
        return null;
    }

    const handleClick = () => {
        if (isInstallable) {
            install();
        } else if (isIOS) {
            setShowIOSGuide(true);
        }
    };

    return (
        <>
            {variant === 'header' ? (
                <button
                    type="button"
                    onClick={handleClick}
                    className="hidden sm:flex min-h-[38px] px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 items-center gap-1.5 whitespace-nowrap"
                    style={{
                        background: 'var(--primary-soft)',
                        color: 'var(--primary)',
                        border: '1px solid rgba(198, 138, 30, 0.3)'
                    }}
                    aria-label={isAr ? 'تثبيت التطبيق' : 'Install App'}
                    title={isAr ? 'تثبيت التطبيق على الشاشة الرئيسية' : 'Install Gold Calculator on your home screen'}
                >
                    <Download size={15} />
                    <span className="hidden md:inline">
                        {isAr ? 'تثبيت' : 'Install'}
                    </span>
                </button>
            ) : (
                <button
                    type="button"
                    onClick={handleClick}
                    className="w-full min-h-[54px] flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all active:scale-[0.98]"
                    style={{
                        background: 'var(--primary-soft)',
                        borderColor: 'rgba(198, 138, 30, 0.3)',
                        color: 'var(--text-primary)'
                    }}
                >
                    <div className="flex items-center gap-3 min-w-0 text-start">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(229, 169, 59, 0.2)', color: 'var(--primary)' }}
                        >
                            <Smartphone size={18} />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs font-bold block">
                                {isAr ? 'تثبيت التطبيق على الجوال' : 'Install App on Device'}
                            </span>
                            <span className="text-[11px] opacity-70 block truncate" style={{ color: 'var(--text-secondary)' }}>
                                {isAr ? 'يعمل بدون إنترنت وبسرعة فائقة' : 'Works offline with cached gold prices'}
                            </span>
                        </div>
                    </div>
                    <span
                        className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
                        style={{ background: 'var(--primary-vivid)', color: 'var(--primary-ink)' }}
                    >
                        {isAr ? 'تثبيت' : 'Install'}
                    </span>
                </button>
            )}

            <BottomSheet
                isOpen={showIOSGuide}
                onClose={() => setShowIOSGuide(false)}
                maxWidthClass="sm:max-w-sm"
                ariaLabel={isAr ? 'تثبيت على آيفون' : 'Install on iPhone / iPad'}
            >
                <div className="flex justify-between items-center px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        {isAr ? 'تثبيت حاسبة الذهب على الشاشة الرئيسية' : 'Install Gold Calculator on iPhone / iPad'}
                    </h3>
                    <button
                        type="button"
                        onClick={() => setShowIOSGuide(false)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                        <Share size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                        <p>
                            {isAr
                                ? '١. اضغط على زر المشاركة (Share) في شريط متصفح سفاري.'
                                : '1. Tap the Share icon in the Safari toolbar.'}
                        </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                        <PlusSquare size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                        <p>
                            {isAr
                                ? '٢. اختر «إضافة إلى الصفحة الرئيسية» (Add to Home Screen).'
                                : '2. Scroll down and tap "Add to Home Screen".'}
                        </p>
                    </div>
                </div>

                <div className="p-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))]">
                    <button
                        type="button"
                        onClick={() => setShowIOSGuide(false)}
                        className="w-full min-h-[46px] rounded-2xl text-sm font-bold"
                        style={{ background: 'var(--primary-vivid)', color: 'var(--primary-ink)' }}
                    >
                        {isAr ? 'حسناً' : 'Got it'}
                    </button>
                </div>
            </BottomSheet>
        </>
    );
};

export default PWAInstallButton;
