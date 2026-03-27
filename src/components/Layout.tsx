import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-start p-4 md:p-8 lg:p-10 font-sans selection:bg-primary-light selection:text-slate-900 transition-colors duration-500 relative overflow-x-hidden"
            style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}
        >
            {/* Ambient background blobs */}
            <div className="fixed top-[-15%] left-[-5%] w-[35%] h-[45%] rounded-full bg-primary/8 blur-[140px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[30%] h-[40%] rounded-full bg-primary/8 blur-[140px] pointer-events-none" />

            <div className="w-full max-w-7xl relative z-10">
                {children}
                <div className="mt-8 text-center text-xs opacity-40 hover:opacity-70 transition-opacity duration-300 pb-4" style={{ color: 'var(--text-secondary)' }}>
                    <p>&copy; 2024 Tala Gold Calculator. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Layout;
