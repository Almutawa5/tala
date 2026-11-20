import React from 'react';
import { Language, translations } from '../utils/translations';

interface LayoutProps {
    children: React.ReactNode;
    language?: Language;
}

const Layout: React.FC<LayoutProps> = ({ children, language = 'en' }) => {
    const t = translations[language];
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-start p-3 sm:p-6 lg:p-10 pb-36 sm:pb-12 font-sans transition-colors duration-500 relative overflow-x-hidden"
            style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}
        >
            {/* Ambient background blobs — fintech gold atmosphere */}
            <div
                className="fixed top-[-20%] left-[-8%] w-[40%] h-[50%] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.10) 0%, transparent 70%)', filter: 'blur(60px)' }}
            />
            <div
                className="fixed bottom-[-15%] right-[-8%] w-[35%] h-[45%] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
            />
            <div
                className="fixed top-[40%] right-[10%] w-[20%] h-[30%] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.05) 0%, transparent 70%)', filter: 'blur(80px)' }}
            />

            <div className="w-full max-w-7xl relative z-10">
                {children}
                <div className="mt-8 text-center text-xs opacity-50 hover:opacity-80 transition-opacity duration-300 pb-4" style={{ color: 'var(--text-secondary)' }}>
                    <p>{t.allRightsReserved || '© 2025 Tala Gold Calculator. All rights reserved.'}</p>
                </div>
            </div>
        </div>
    );
};

export default Layout;
