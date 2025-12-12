import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans selection:bg-gold-200 selection:text-gold-900 transition-colors duration-300">
            <div className="w-full max-w-md">
                {children}
                <div className="mt-6 text-center text-xs text-slate-400">
                    <p>&copy; 2024 Gold Calculator. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Layout;
