import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Language } from '../utils/translations';
import { trackEvent } from '../utils/analytics';

interface ShareButtonProps {
    elementId: string;
    language: Language;
    calculationType: string;
    /** Pass the structured data for a clean share card & WhatsApp text summary */
    shareData?: ShareCardData;
}

export interface ShareCardData {
    type: 'breakdown' | 'estimator';
    currency: string;
    karat: string;
    goldPrice: number;
    weight: number;
    stoneWeight?: number;
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
    sellerPrice?: number;
    discountPct?: number;
    priceDiff?: number;
    discountStatusText?: string;
    dealLabel?: string;
    dealColor?: string;
}

const fmt = (n: number) => n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtSmall = (n: number) => n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function buildWhatsAppSummary(data: ShareCardData, language: Language): string {
    const isAr = language === 'ar';
    const { currency: curr, karat, goldPrice, weight, stoneWeight, vatPercentage } = data;
    const unit = isAr ? 'جم' : 'g';

    if (data.type === 'breakdown') {
        const lines = [
            isAr ? `*حاسبة الذهب — تحليل سعر القطعة*` : `*Gold Calculator — Price Breakdown*`,
            isAr
                ? `• العيار: ${karat} | سعر الذهب: ${curr} ${fmtSmall(goldPrice)}/${unit}`
                : `• Karat: ${karat} | Gold Spot: ${curr} ${fmtSmall(goldPrice)}/${unit}`,
            stoneWeight && stoneWeight > 0
                ? (isAr
                    ? `• صافي وزن الذهب: ${fmtSmall(weight)} ${unit} (بعد خصم ${fmtSmall(stoneWeight)} ${unit} فصوص)`
                    : `• Net Gold Weight: ${fmtSmall(weight)} ${unit} (${fmtSmall(stoneWeight)} ${unit} stones deducted)`)
                : (isAr
                    ? `• الوزن: ${fmtSmall(weight)} ${unit}`
                    : `• Weight: ${fmtSmall(weight)} ${unit}`),
            isAr
                ? `• سعر البائع (شامل ${vatPercentage}% ضريبة): ${curr} ${fmt(data.itemPrice ?? 0)}`
                : `• Seller Price (incl. ${vatPercentage}% VAT): ${curr} ${fmt(data.itemPrice ?? 0)}`,
            `─────────────`,
            isAr
                ? `*مصنعية الجرام:* ${curr} ${fmt(data.makingPerGram ?? 0)}/${unit}`
                : `*Making Charge / g:* ${curr} ${fmt(data.makingPerGram ?? 0)}/${unit}`,
        ];

        if (data.dealLabel) {
            lines.push(isAr ? `• التقييم: ${data.dealLabel}` : `• Verdict: ${data.dealLabel}`);
        }
        lines.push(
            isAr ? `• السعر قبل الضريبة: ${curr} ${fmt(data.priceNoVat ?? 0)}` : `• Price ex-VAT: ${curr} ${fmt(data.priceNoVat ?? 0)}`,
            isAr ? `• قيمة الذهب الخام: ${curr} ${fmt(data.rawGoldCost ?? 0)}` : `• Raw Gold Value: ${curr} ${fmt(data.rawGoldCost ?? 0)}`,
            isAr ? `• إجمالي المصنعية: ${curr} ${fmt(data.totalMaking ?? 0)}` : `• Total Making: ${curr} ${fmt(data.totalMaking ?? 0)}`,
            isAr ? `• الضريبة (${vatPercentage}%): ${curr} ${fmt(data.vatAmount ?? 0)}` : `• VAT (${vatPercentage}%): ${curr} ${fmt(data.vatAmount ?? 0)}`
        );

        return lines.join('\n');
    }

    const lines = [
        isAr ? `*حاسبة الذهب — تقدير السعر العادل*` : `*Gold Calculator — Price Estimator*`,
        isAr
            ? `• العيار: ${karat} | سعر الذهب: ${curr} ${fmtSmall(goldPrice)}/${unit}`
            : `• Karat: ${karat} | Gold Spot: ${curr} ${fmtSmall(goldPrice)}/${unit}`,
        stoneWeight && stoneWeight > 0
            ? (isAr
                ? `• صافي الوزن: ${fmtSmall(weight)} ${unit} (فصوص: ${fmtSmall(stoneWeight)} ${unit}) | المصنعية: ${curr} ${fmtSmall(data.makingPerGram ?? 0)}/${unit}`
                : `• Net Weight: ${fmtSmall(weight)} ${unit} (${fmtSmall(stoneWeight)} ${unit} stones) | Making: ${curr} ${fmtSmall(data.makingPerGram ?? 0)}/${unit}`)
            : (isAr
                ? `• الوزن: ${fmtSmall(weight)} ${unit} | المصنعية: ${curr} ${fmtSmall(data.makingPerGram ?? 0)}/${unit}`
                : `• Weight: ${fmtSmall(weight)} ${unit} | Making: ${curr} ${fmtSmall(data.makingPerGram ?? 0)}/${unit}`),
        `─────────────`,
        isAr
            ? `*الإجمالي التقديري (شامل ${vatPercentage}% ضريبة):* ${curr} ${fmt(data.totalPrice ?? 0)}`
            : `*Estimated Total (incl. ${vatPercentage}% VAT):* ${curr} ${fmt(data.totalPrice ?? 0)}`,
    ];

    if (data.dealLabel) {
        lines.push(isAr ? `• التقييم: ${data.dealLabel}` : `• Verdict: ${data.dealLabel}`);
    }
    lines.push(
        isAr ? `• قيمة الذهب الخام: ${curr} ${fmt(data.rawGoldCost ?? 0)}` : `• Raw Gold Value: ${curr} ${fmt(data.rawGoldCost ?? 0)}`,
        isAr ? `• إجمالي المصنعية: ${curr} ${fmt(data.totalMaking ?? 0)}` : `• Total Making: ${curr} ${fmt(data.totalMaking ?? 0)}`,
        isAr ? `• الضريبة (${vatPercentage}%): ${curr} ${fmt(data.vatAmount ?? 0)}` : `• VAT (${vatPercentage}%): ${curr} ${fmt(data.vatAmount ?? 0)}`
    );

    if (data.sellerPrice && data.sellerPrice > 0 && data.discountPct !== undefined && data.discountStatusText) {
        lines.push(
            `─────────────`,
            isAr ? `*سعر البائع:* ${curr} ${fmt(data.sellerPrice)}` : `*Seller's Price:* ${curr} ${fmt(data.sellerPrice)}`,
            `• ${data.discountStatusText}: ${data.discountPct.toFixed(1)}% (${curr} ${fmt(Math.abs(data.priceDiff ?? 0))})`
        );
    }

    return lines.join('\n');
}

async function copyTextToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fall through to execCommand fallback
        }
    }
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
    } catch {
        return false;
    }
}

/** Build an off-screen card div, capture it, then remove it */
async function buildShareCard(data: ShareCardData, language: Language): Promise<HTMLCanvasElement> {
    const isAr = language === 'ar';
    const { currency: curr, karat, goldPrice, weight, stoneWeight, vatPercentage } = data;
    const isBreakdown = data.type === 'breakdown';

    // ── colours ────────────────────────────────────────────────────────────────
    const bg        = '#0A0C10';
    const surface   = '#141824';
    const gold      = '#E5A93B';
    const craft     = '#2DD4BF';
    const muted     = '#9B988F';
    const textLight = '#F6F5F1';
    const divider   = 'rgba(255,255,255,0.09)';

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
        ? (isAr ? 'مصنعية الجرام' : 'Making Charge / g')
        : (isAr ? 'السعر التقديري' : 'Estimated Price');
    const heroSuffix = isBreakdown ? `${curr}/g` : '';

    const dealBadge = data.dealLabel ? `
        <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:12px;border:1px solid ${data.dealColor ?? gold}44;background:${data.dealColor ?? gold}18;margin-top:10px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${data.dealColor ?? gold};display:inline-block;"></span>
            <span style="color:${data.dealColor ?? gold};font-size:12px;font-weight:700;">${data.dealLabel}</span>
        </div>` : '';

    const detailRows = isBreakdown ? `
        ${row(isAr ? 'سعر البائع (شامل الضريبة)' : 'Seller Price (incl. VAT)', `${curr} ${fmt(data.itemPrice ?? 0)}`)}
        ${row(isAr ? 'السعر قبل الضريبة' : 'Price ex-VAT', `${curr} ${fmt(data.priceNoVat ?? 0)}`)}
        ${row(isAr ? `الضريبة (${vatPercentage}%)` : `VAT (${vatPercentage}%)`, `${curr} ${fmt(data.vatAmount ?? 0)}`, muted)}
        ${row(isAr ? 'قيمة الذهب الخام' : 'Raw Gold Value', `${curr} ${fmt(data.rawGoldCost ?? 0)}`, gold)}
        ${row(isAr ? 'إجمالي المصنعية' : 'Total Making', `${curr} ${fmt(data.totalMaking ?? 0)}`, craft)}
        ${row(isAr ? 'مصنعية الجرام' : 'Making / gram', `${curr} ${fmtSmall(data.makingPerGram ?? 0)}`, gold)}
    ` : `
        ${row(isAr ? 'قيمة الذهب الخام' : 'Raw Gold Value', `${curr} ${fmt(data.rawGoldCost ?? 0)}`, gold)}
        ${row(isAr ? 'إجمالي المصنعية' : 'Total Making', `${curr} ${fmt(data.totalMaking ?? 0)}`, craft)}
        ${row(isAr ? `الضريبة (${vatPercentage}%)` : `VAT (${vatPercentage}%)`, `${curr} ${fmt(data.vatAmount ?? 0)}`, muted)}
        ${row(isAr ? 'الإجمالي شامل الضريبة' : 'Total incl. VAT', `${curr} ${fmt(data.totalPrice ?? 0)}`, textLight)}
        ${data.sellerPrice && data.sellerPrice > 0 && data.discountPct !== undefined && data.discountStatusText
            ? row(isAr ? 'سعر البائع' : "Seller's Price", `${curr} ${fmt(data.sellerPrice)}`)
              + row(data.discountStatusText, `${data.discountPct.toFixed(1)}% (${curr} ${fmt(Math.abs(data.priceDiff ?? 0))})`, '#34D399')
            : ''}
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
        <div style="height:4px;background:linear-gradient(90deg,${gold},${craft});"></div>

        <div style="padding:28px 28px 20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                <div>
                    <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:${muted};text-transform:uppercase;">
                        ${isAr ? 'حاسبة الذهب' : 'Gold Calculator'}
                    </div>
                    <div style="font-size:11px;color:${muted};opacity:0.6;margin-top:2px;">
                        ${new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year:'numeric', month:'long', day:'numeric' })}
                    </div>
                </div>
                <div style="background:${gold}22;border:1px solid ${gold}44;border-radius:10px;padding:5px 12px;">
                    <span style="color:${gold};font-size:12px;font-weight:700;">${karat}</span>
                </div>
            </div>

            <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${muted};text-transform:uppercase;margin-bottom:14px;">
                ${isBreakdown
                    ? (isAr ? 'تحليل سعر القطعة' : 'Price Breakdown')
                    : (isAr ? 'تقدير السعر' : 'Price Estimator')
                }
            </div>

            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px;">
                <div style="background:${surface};border:1px solid ${divider};border-radius:10px;padding:5px 12px;font-size:12px;color:${textLight};">
                    ${isAr ? 'سعر الذهب:' : 'Gold:'} <strong style="color:${gold};font-family:monospace;">${curr} ${fmtSmall(goldPrice)}/g</strong>
                </div>
                <div style="background:${surface};border:1px solid ${divider};border-radius:10px;padding:5px 12px;font-size:12px;color:${textLight};">
                    ${isAr ? 'صافي الوزن:' : 'Net Weight:'} <strong style="font-family:monospace;">${fmtSmall(weight)} g</strong>
                </div>
                ${stoneWeight && stoneWeight > 0 ? `
                <div style="background:${surface};border:1px solid ${divider};border-radius:10px;padding:5px 12px;font-size:12px;color:${textLight};">
                    ${isAr ? 'الفصوص:' : 'Stones:'} <strong style="font-family:monospace;">-${fmtSmall(stoneWeight)} g</strong>
                </div>` : ''}
                ${isBreakdown && data.itemPrice ? `
                <div style="background:${surface};border:1px solid ${divider};border-radius:10px;padding:5px 12px;font-size:12px;color:${textLight};">
                    ${isAr ? 'سعر البائع:' : 'Price:'} <strong style="font-family:monospace;">${curr} ${fmt(data.itemPrice)}</strong>
                </div>` : ''}
            </div>

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

        <div style="height:1px;background:${divider};margin:0 28px;"></div>

        <div style="padding:8px 28px 20px;">
            ${detailRows}
        </div>

        <div style="background:${surface};padding:12px 28px;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:10px;color:${muted};opacity:0.6;">${isAr ? 'حاسبة الذهب' : 'Gold Calculator'}</span>
            <div style="display:flex;gap:4px;">
                <div style="width:6px;height:6px;border-radius:50%;background:${gold};"></div>
                <div style="width:6px;height:6px;border-radius:50%;background:${craft};opacity:0.7;"></div>
                <div style="width:6px;height:6px;border-radius:50%;background:${muted};opacity:0.3;"></div>
            </div>
        </div>
    </div>`;

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
    const [copied, setCopied] = useState(false);
    const isAr = language === 'ar';

    const handleCopyText = async () => {
        if (!shareData) return;
        const text = buildWhatsAppSummary(shareData, language);
        const ok = await copyTextToClipboard(text);
        if (ok) {
            trackEvent('copy_summary_clicked', { type: shareData.type });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        setIsSharing(true);
        trackEvent('share_clicked', { type: 'whatsapp', calculationType });

        try {
            let canvas: HTMLCanvasElement;

            if (shareData) {
                canvas = await buildShareCard(shareData, language);
            } else {
                const element = document.getElementById(elementId);
                if (!element) { setIsSharing(false); return; }
                const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-mode');
                canvas = await html2canvas(element, {
                    backgroundColor: isDark ? '#0A0C10' : '#F7F6F2',
                    scale: 2,
                    logging: false,
                    useCORS: true,
                });
            }

            canvas.toBlob(async (blob) => {
                if (!blob) { setIsSharing(false); return; }

                const file = new File([blob], 'gold-calculator.png', { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: isAr ? 'حساب سعر الذهب' : 'Gold Price Calculation',
                            text: isAr
                                ? `حساب ${calculationType} – حاسبة الذهب`
                                : `${calculationType} calculation – Gold Calculator`,
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
        link.download = 'gold-calculator.png';
        link.href = canvas.toDataURL();
        link.click();
        const text = isAr ? 'شاهد حساب سعر الذهب!' : 'Check out my gold price calculation!';
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="flex items-center gap-1.5 shrink-0">
            <button
                type="button"
                onClick={handleCopyText}
                disabled={!shareData}
                className="flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[38px] px-2.5 sm:px-3 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 whitespace-nowrap"
                style={{
                    background: copied ? 'rgba(52, 211, 153, 0.16)' : 'rgba(229, 169, 59, 0.14)',
                    color: copied ? '#34D399' : '#E5A93B',
                    border: copied ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(229, 169, 59, 0.3)'
                }}
                title={isAr ? 'نسخ ملخص نصي للواتساب' : 'Copy formatted WhatsApp text summary'}
            >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>
                    {copied
                        ? (isAr ? 'تم ✓' : 'Copied')
                        : (isAr ? 'نسخ' : 'Copy')
                    }
                </span>
            </button>

            <button
                type="button"
                onClick={handleShare}
                disabled={isSharing}
                className="flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[38px] px-2.5 sm:px-3.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                style={{ background: 'rgba(45, 212, 191, 0.14)', color: '#2DD4BF', border: '1px solid rgba(45, 212, 191, 0.3)' }}
                title={isAr ? 'مشاركة صورة عبر واتساب' : 'Share image via WhatsApp'}
            >
                <Share2 size={14} />
                <span>
                    {isSharing
                        ? (isAr ? 'جاري...' : 'Preparing...')
                        : (isAr ? 'مشاركة' : 'Share')
                    }
                </span>
            </button>
        </div>
    );
};

export default ShareButton;
