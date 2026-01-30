import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Language } from '../utils/translations';
import { trackEvent } from '../utils/analytics';

interface ShareButtonProps {
    elementId: string;
    language: Language;
    calculationType: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ elementId, language, calculationType }) => {
    const [isSharing, setIsSharing] = useState(false);

    const shareToWhatsApp = async () => {
        setIsSharing(true);
        trackEvent('share_clicked', { type: 'whatsapp', calculationType });
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                console.error('Element not found');
                setIsSharing(false);
                return;
            }

            // Capture the element as canvas
            const isDarkMode = document.body.classList.contains('dark-mode');
            const canvas = await html2canvas(element, {
                backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                scale: 2, // Higher quality
                logging: false,
                useCORS: true,
                onclone: (clonedDoc) => {
                    // Ensure cloned element has proper dimensions for capture
                    const clonedElement = clonedDoc.getElementById(elementId);
                    if (clonedElement) {
                        clonedElement.style.padding = '30px';
                        clonedElement.style.borderRadius = '24px';
                        clonedElement.style.width = '500px'; // Fixed width for consistent screenshots

                        // Add branding
                        const branding = clonedDoc.createElement('div');
                        branding.style.marginTop = '20px';
                        branding.style.textAlign = 'center';
                        branding.style.fontSize = '12px';
                        branding.style.color = isDarkMode ? '#cbd5e1' : '#64748b';
                        branding.style.borderTop = `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`;
                        branding.style.paddingTop = '15px';

                        const title = language === 'en' ? 'Gold Calculator' : 'حاسبة الذهب';
                        const date = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'ar-SA');
                        branding.innerHTML = `<strong>${title}</strong><br/>${date}`;

                        clonedElement.appendChild(branding);
                    }
                }
            });

            // Convert to blob
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setIsSharing(false);
                    return;
                }

                const file = new File([blob], 'gold-calculation.png', { type: 'image/png' });

                // Check if Web Share API is available
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: language === 'en' ? 'Gold Price Calculation' : 'حساب سعر الذهب',
                            text: language === 'en'
                                ? `${calculationType} calculation from Gold Calculator`
                                : `حساب ${calculationType} من حاسبة الذهب`
                        });
                    } catch (err) {
                        if ((err as Error).name !== 'AbortError') {
                            console.error('Share failed:', err);
                            fallbackShare(canvas);
                        }
                    }
                } else {
                    // Fallback: download or copy to clipboard
                    fallbackShare(canvas);
                }

                setIsSharing(false);
            }, 'image/png');

        } catch (error) {
            console.error('Screenshot failed:', error);
            setIsSharing(false);
        }
    };

    const fallbackShare = (canvas: HTMLCanvasElement) => {
        // Try to open WhatsApp Web with a message
        const text = language === 'en'
            ? 'Check out my gold price calculation!'
            : 'شاهد حساب سعر الذهب الخاص بي!';

        // Download the image
        const link = document.createElement('a');
        link.download = 'gold-calculation.png';
        link.href = canvas.toDataURL();
        link.click();

        // Open WhatsApp Web
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <button
            onClick={shareToWhatsApp}
            disabled={isSharing}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            title={language === 'en' ? 'Share via WhatsApp' : 'مشاركة عبر واتساب'}
        >
            <Share2 size={16} />
            {isSharing
                ? (language === 'en' ? 'Preparing...' : 'جاري التحضير...')
                : (language === 'en' ? 'Share' : 'مشاركة')
            }
        </button>
    );
};

export default ShareButton;
