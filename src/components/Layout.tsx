import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-start pl-[max(0.75rem,env(safe-area-inset-left,0.75rem))] pr-[max(0.75rem,env(safe-area-inset-right,0.75rem))] sm:px-6 lg:px-10 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:pt-[calc(1.5rem+env(safe-area-inset-top,0px))] lg:pt-[calc(2.5rem+env(safe-area-inset-top,0px))] pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(3rem+env(safe-area-inset-bottom,0px))] font-sans transition-colors duration-300 relative overflow-x-hidden"
            style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}
        >
            {/* iOS PWA status-bar / notch backdrop guard */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top,0px)] backdrop-blur-md"
                style={{ backgroundColor: 'var(--bg-main)', opacity: 0.92 }}
            />

            {/* Subtle architectural top satin highlight */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-x-0 top-0 h-80"
                style={{
                    background: 'radial-gradient(ellipse 80% 50% at 50% -10%, var(--primary-soft), transparent 70%)'
                }}
            />

            <div className="w-full max-w-6xl relative z-10">
                {children}
            </div>
        </div>
    );
};

export default Layout;
