import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-start p-3 sm:p-6 lg:p-10 pb-24 sm:pb-12 font-sans transition-colors duration-300 relative overflow-x-hidden"
            style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}
        >
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
