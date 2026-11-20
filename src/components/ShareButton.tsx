import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Language } from '../utils/translations';
import { trackEvent } from '../utils/analytics';

interface ShareButtonProps {
    elementId: string;
    language: Language;
    calculationType: string;
    /** Pass the structured data for a clean share card */
    shareData?: ShareCardData;
}

export interface ShareCardData {
    type: 'breakdown' | 'estimator';
    currency: string;
    karat: string;
    goldPrice: number;
    weight: number;
    vatPercentage: number;
    // breakdown
    itemPrice?: number;
    makingPerGram?: number;
    rawGoldCost?: number;
    totalMaking?: number;
    vatAmount?: number;
    priceNoVat?: number;
    // estimator
    totalPrice?: number;
    dealLabel?: string;
    dealColor?: string;
}

const fmt = (n: number) => n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtSmall = (n: number) => n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Build an off-screen card div, capture it, then remove it */
async function buildShareCard(data: ShareCardData, language: Language): Promise<HTMLCanvasElement> {
    const isAr = language === 'ar';
    const { currency: curr, karat, goldPrice, weight, vatPercentage } = data;
    const isBreakdown = data.type === 'breakdown';

    // ── colours ────────────────────────────────────────────────────────────────
    const bg        = '#0F172A';
    const surface   = '#1E293B';
    const gold      = '#F59E0B';
    const purple    = '#8B5CF6';
    const muted     = '#94A3B8';
    const textLight = '#F8FAFC';
    const divider   = '#1E3A5F';

    // ── helpers ────────────────────────────────────────────────────────────────
    const row = (labelText: string, valueText: string, valueColor = textLight) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid ${divider};">
            <span style="color:${muted};font-size:13px;">${labelText}</span>
            <span style="color:${valueColor};font-size:14px;font-weight:700;font-family:monospace;">${valueText}</span>
        </div>`;

    const heroValue = isBreakdown
        ? fmtSmall(data.makingPerGram ?? 0)
        : fmt(data.totalPrice ?? 0);
    const heroLabel = isBreakdown
        ? (isAr ? 'المصنعية / جرام' : 'Making Charge / g')
        : (isAr ? 'السعر التقديري' : 'Estimated Price');
    const heroSuffix = isBreakdown ? (isAr ? `${curr}/g` : `${curr}/g`) : '';

    const dealBadge = data.dealLabel ? `
        <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:12px;border:1px solid ${data.dealColor ?? gold}44;background:${data.dealColor ?? gold}18;margin-top:10px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${data.dealColor ?? gold};display:inline-block;"></span>
            <span style="color:${data.dealColor ?? gold};font-size:12px;font-weight:700;">${data.dealLabel}</span>
        </div>` : '';

    const detailRows = isBreakdown ? `
        ${row(isAr ? 'سعر القطعة (مع الضريبة)' : 'Tag Price (incl. VAT)', `${curr} ${fmt(data.itemPrice ?? 0)}`)}
        ${row(isAr ? 'سعر القطعة (بدون ضريبة)' : 'Price ex-VAT', `${curr} ${fmt(data.priceNoVat ?? 0)}`)}
        ${row(isAr ? 'الضريبة' : `VAT (${vatPercentage}%)`, `${curr} ${fmt(data.vatAmount ?? 0)}`, '#94A3B8')}
        ${row(isAr ? 'تكلفة الذهب الخام' : 'Raw Gold Cost', `${curr} ${fmt(data.rawGoldCost ?? 0)}`, gold)}
        ${row(isAr ? 'إجمالي المصنعية' : 'Total Making', `${curr} ${fmt(data.totalMaking ?? 0)}`, purple)}
        ${row(isAr ? 'المصنعية لكل جرام' : 'Making / gram', `${curr} ${fmtSmall(data.makingPerGram ?? 0)}`, gold)}
    ` : `
        ${row(isAr ? 'تكلفة الذهب الخام' : 'Raw Gold Cost', `${curr} ${fmt(data.rawGoldCost ?? 0)}`, gold)}
        ${row(isAr ? 'إجمالي المصنعية' : 'Total Making', `${curr} ${fmt(data.totalMaking ?? 0)}`, purple)}
        ${row(isAr ? `الضريبة (${vatPercentage}%)` : `VAT (${vatPercentage}%)`, `${curr} ${fmt(data.vatAmount ?? 0)}`, '#94A3B8')}
        ${row(isAr ? 'الإجمالي شامل الضريبة' : 'Total incl. VAT', `${curr} ${fmt(data.totalPrice ?? 0)}`, textLight)}
    `;

    const html = `
    <div style="
        width:420px;
        background:${bg};
        border-radius:24px;
        font-family:'Segoe UI',Tahoma,Arial,sans-serif;
        overflow:hidden;
        box-shadow:0 25px 60px rgba(0,0,0,0.6);
        direction:${isAr ? 'rtl' : 'ltr'};
    ">
        <!-- Header gradient bar -->
        <div style="height:4px;background:linear-gradient(90deg,${gold},${purple});"></div>

        <!-- Top section -->
        <div style="padding:28px 28px 20px;">
            <!-- App brand -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                <div>
                    <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:${muted};text-transform:uppercase;">
                        ${isAr ? 'حاسبة تالا للذهب' : 'Tala Gold Calculator'}
                    </div>
                    <div style="font-size:11px;color:${muted};opacity:0.6;margin-top:2px;">
                        ${new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year:'numeric', month:'long', day:'numeric' })}
                    </div>
                </div>
                <div style="background:${gold}22;border:1px solid ${gold}44;border-radius:10px;padding:5px 12px;">
                    <span style="color:${gold};font-size:12px;font-weight:700;">${karat}</span>
                </div>
            </div>

            <!-- Type badge -->
            <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${muted};text-transform:uppercase;margin-bottom:14px;">
                ${isBreakdown
                    ? (isAr ? 'تفاصيل السعر' : 'Price Breakdown')
                    : (isAr ? 'تقدير السعر' : 'Price Estimator')
                }
            </div>

            <!-- Input summary pills -->
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px;">
                <div style="background:${surface};border:1px solid ${divider};border-radius:10px;padding:5px 12px;font-size:12px;color:${textLight};">
                    ${isAr ? 'سعر الذهب:' : 'Gold:'} <strong style="color:${gold};font-family:monospace;">${curr} ${fmtSmall(goldPrice)}/g</strong>
                </div>
                <div style="background:${surface};border:1px solid ${divider};border-radius:10px;padding:5px 12px;font-size:12px;color:${textLight};">
                    ${isAr ? 'الوزن:' : 'Weight:'} <strong style="font-family:monospace;">${fmtSmall(weight)} g</strong>
                </div>
                ${isBreakdown && data.itemPrice ? `
                <div style="background:${surface};border:1px solid ${divider};border-radius:10px;padding:5px 12px;font-size:12px;color:${textLight};">
                    ${isAr ? 'سعر البطاقة:' : 'Tag:'} <strong style="font-family:monospace;">${curr} ${fmt(data.itemPrice)}</strong>
                </div>` : ''}
            </div>

            <!-- Hero number -->
            <div style="background:${surface};border-radius:18px;padding:20px;margin-bottom:4px;">
                <div style="font-size:11px;color:${muted};margin-bottom:6px;">${heroLabel}</div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-size:16px;font-weight:700;color:${gold};">${curr}</span>
                    <span style="font-size:52px;font-weight:900;color:${textLight};font-family:monospace;line-height:1;">${heroValue}</span>
                    ${heroSuffix ? `<span style="font-size:14px;color:${muted};font-weight:600;">${heroSuffix}</span>` : ''}
                </div>
                ${dealBadge}
            </div>
        </div>

        <!-- Divider -->
        <div style="height:1px;background:${divider};margin:0 28px;"></div>

        <!-- Detail rows -->
        <div style="padding:8px 28px 20px;">
            ${detailRows}
        </div>

        <!-- Footer -->
        <div style="background:${surface};padding:12px 28px;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:10px;color:${muted};opacity:0.6;">tala.app</span>
            <div style="display:flex;gap:4px;">
                <div style="width:6px;height:6px;border-radius:50%;background:${gold};"></div>
                <div style="width:6px;height:6px;border-radius:50%;background:${purple};opacity:0.6;"></div>
                <div style="width:6px;height:6px;border-radius:50%;background:${muted};opacity:0.3;"></div>
            </div>
        </div>
    </div>`;

    // Create off-screen container
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
    container.innerHTML = html;
    document.body.appendChild(container);

    const cardEl = container.firstElementChild as HTMLElement;
    const canvas = await html2canvas(cardEl, {
        backgroundColor: null,
        scale: 2.5,
        logging: false,
        useCORS: true,
    });

    document.body.removeChild(container);
    return canvas;
}

const ShareButton: React.FC<ShareButtonProps> = ({ elementId, language, calculationType, shareData }) => {
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        setIsSharing(true);
        trackEvent('share_clicked', { type: 'whatsapp', calculationType });

        try {
            let canvas: HTMLCanvasElement;

            if (shareData) {
                // Build a clean, purpose-built share card
                canvas = await buildShareCard(shareData, language);
            } else {
                // Fallback: capture the DOM element as before
                const element = document.getElementById(elementId);
                if (!element) { setIsSharing(false); return; }
                const isDark = document.body.classList.contains('dark-mode');
                canvas = await html2canvas(element, {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    scale: 2,
                    logging: false,
                    useCORS: true,
                });
            }

            canvas.toBlob(async (blob) => {
                if (!blob) { setIsSharing(false); return; }

                const file = new File([blob], 'tala-gold.png', { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: language === 'en' ? 'Gold Price Calculation' : 'حساب سعر الذهب',
                            text: language === 'en'
                                ? `${calculationType} calculation – Tala Gold Calculator`
                                : `حساب ${calculationType} – حاسبة تالا للذهب`,
                        });
                    } catch (err) {
                        if ((err as Error).name !== 'AbortError') fallbackDownload(canvas);
                    }
                } else {
                    fallbackDownload(canvas);
                }
                setIsSharing(false);
            }, 'image/png');

        } catch (err) {
            console.error('Share failed:', err);
            setIsSharing(false);
        }
    };

    const fallbackDownload = (canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = 'tala-gold.png';
        link.href = canvas.toDataURL();
        link.click();
        const text = language === 'en' ? 'Check out my gold price calculation!' : 'شاهد حساب سعر الذهب!';
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}
            title={language === 'en' ? 'Share via WhatsApp' : 'مشاركة عبر واتساب'}
        >
            <Share2 size={13} />
            {isSharing
                ? (language === 'en' ? 'Preparing...' : 'جاري...')
                : (language === 'en' ? 'Share' : 'مشاركة')
            }
        </button>
    );
};

export default ShareButton;
