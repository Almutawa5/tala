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
            isAr ? `💎 *حاسبة الذهب — تحليل سعر القطعة*` : `💎 *Gold Calculator — Price Breakdown*`,
            isAr
                ? `✨ العيار: ${karat} | سعر الذهب: ${curr} ${fmtSmall(goldPrice)}/${unit}`
                : `✨ Karat: ${karat} | Gold Spot: ${curr} ${fmtSmall(goldPrice)}/${unit}`,
            stoneWeight && stoneWeight > 0
                ? (isAr
                    ? `⚖️ صافي وزن الذهب: ${fmtSmall(weight)} ${unit} (بعد خصم ${fmtSmall(stoneWeight)} ${unit} فصوص)`
                    : `⚖️ Net Gold Weight: ${fmtSmall(weight)} ${unit} (${fmtSmall(stoneWeight)} ${unit} stones deducted)`)
                : (isAr
                    ? `⚖️ الوزن: ${fmtSmall(weight)} ${unit}`
                    : `⚖️ Weight: ${fmtSmall(weight)} ${unit}`),
            isAr
                ? `🏷️ سعر البائع (شامل ${vatPercentage}% ضريبة): ${curr} ${fmt(data.itemPrice ?? 0)}`
                : `🏷️ Seller Price (incl. ${vatPercentage}% VAT): ${curr} ${fmt(data.itemPrice ?? 0)}`,
            `─────────────`,
            isAr
                ? `🔨 *مصنعية الجرام:* ${curr} ${fmt(data.makingPerGram ?? 0)}/${unit}`
                : `🔨 *Making Charge / g:* ${curr} ${fmt(data.makingPerGram ?? 0)}/${unit}`,
        ];

        if (data.dealLabel) {
            lines.push(isAr ? `✅ التقييم: ${data.dealLabel}` : `✅ Verdict: ${data.dealLabel}`);
        }
        lines.push(
            isAr ? `🧾 السعر قبل الضريبة: ${curr} ${fmt(data.priceNoVat ?? 0)}` : `🧾 Price ex-VAT: ${curr} ${fmt(data.priceNoVat ?? 0)}`,
            isAr ? `🪙 قيمة الذهب الخام: ${curr} ${fmt(data.rawGoldCost ?? 0)}` : `🪙 Raw Gold Value: ${curr} ${fmt(data.rawGoldCost ?? 0)}`,
            isAr ? `🛠️ إجمالي المصنعية: ${curr} ${fmt(data.totalMaking ?? 0)}` : `🛠️ Total Making: ${curr} ${fmt(data.totalMaking ?? 0)}`,
            isAr ? `🏛️ الضريبة (${vatPercentage}%): ${curr} ${fmt(data.vatAmount ?? 0)}` : `🏛️ VAT (${vatPercentage}%): ${curr} ${fmt(data.vatAmount ?? 0)}`
        );

        return lines.join('\n');
    }

    const lines = [
        isAr ? `💎 *حاسبة الذهب — تقدير السعر العادل*` : `💎 *Gold Calculator — Price Estimator*`,
        isAr
            ? `✨ العيار: ${karat} | سعر الذهب: ${curr} ${fmtSmall(goldPrice)}/${unit}`
            : `✨ Karat: ${karat} | Gold Spot: ${curr} ${fmtSmall(goldPrice)}/${unit}`,
        stoneWeight && stoneWeight > 0
            ? (isAr
                ? `⚖️ صافي الوزن: ${fmtSmall(weight)} ${unit} (فصوص: ${fmtSmall(stoneWeight)} ${unit}) | 🛠️ المصنعية: ${curr} ${fmtSmall(data.makingPerGram ?? 0)}/${unit}`
                : `⚖️ Net Weight: ${fmtSmall(weight)} ${unit} (${fmtSmall(stoneWeight)} ${unit} stones) | 🛠️ Making: ${curr} ${fmtSmall(data.makingPerGram ?? 0)}/${unit}`)
            : (isAr
                ? `⚖️ الوزن: ${fmtSmall(weight)} ${unit} | 🛠️ المصنعية: ${curr} ${fmtSmall(data.makingPerGram ?? 0)}/${unit}`
                : `⚖️ Weight: ${fmtSmall(weight)} ${unit} | 🛠️ Making: ${curr} ${fmtSmall(data.makingPerGram ?? 0)}/${unit}`),
        `─────────────`,
        isAr
            ? `💰 *الإجمالي التقديري (شامل ${vatPercentage}% ضريبة):* ${curr} ${fmt(data.totalPrice ?? 0)}`
            : `💰 *Estimated Total (incl. ${vatPercentage}% VAT):* ${curr} ${fmt(data.totalPrice ?? 0)}`,
    ];

    if (data.dealLabel) {
        lines.push(isAr ? `✅ التقييم: ${data.dealLabel}` : `✅ Verdict: ${data.dealLabel}`);
    }
    lines.push(
        isAr ? `🪙 قيمة الذهب الخام: ${curr} ${fmt(data.rawGoldCost ?? 0)}` : `🪙 Raw Gold Value: ${curr} ${fmt(data.rawGoldCost ?? 0)}`,
        isAr ? `🔨 إجمالي المصنعية: ${curr} ${fmt(data.totalMaking ?? 0)}` : `🔨 Total Making: ${curr} ${fmt(data.totalMaking ?? 0)}`,
        isAr ? `🏛️ الضريبة (${vatPercentage}%): ${curr} ${fmt(data.vatAmount ?? 0)}` : `🏛️ VAT (${vatPercentage}%): ${curr} ${fmt(data.vatAmount ?? 0)}`
    );

    if (data.sellerPrice && data.sellerPrice > 0 && data.discountPct !== undefined && data.discountStatusText) {
        const diffEmoji = (data.priceDiff ?? 0) < -0.005 ? '🎉' : (data.priceDiff ?? 0) > 0.005 ? '📉' : '🎯';
        lines.push(
            `─────────────`,
            isAr ? `🏷️ *سعر البائع:* ${curr} ${fmt(data.sellerPrice)}` : `🏷️ *Seller's Price:* ${curr} ${fmt(data.sellerPrice)}`,
            `${diffEmoji} ${data.discountStatusText}: ${data.discountPct.toFixed(1)}% (${curr} ${fmt(Math.abs(data.priceDiff ?? 0))})`
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
    const unit = isAr ? 'جم' : 'g';

    // Wait for web fonts to finish loading before rasterizing
    if (document.fonts && document.fonts.ready) {
        try {
            await document.fonts.ready;
        } catch {
            // Proceed even if font readiness rejects
        }
    }

    // ── colours (Obsidian, Satin Bullion Gold, Emerald-Teal) ──────────────────
    const canvasBg  = '#0A0C10';
    const cardBg    = '#12151E';
    const surface   = '#171B26';
    const gold      = '#E5A93B';
    const craft     = '#2DD4BF';
    const muted     = '#9B988F';
    const textLight = '#F6F5F1';
    const divider   = 'rgba(255,255,255,0.08)';

    const mainFont = isAr
        ? "'IBM Plex Sans Arabic', 'Plus Jakarta Sans', Tahoma, Arial, sans-serif"
        : "'Plus Jakarta Sans', 'IBM Plex Sans Arabic', Arial, sans-serif";
    const monoFont = "'IBM Plex Mono', monospace";
    const marginEnd = isAr ? 'margin-left' : 'margin-right';

    // ── helpers (avoid CSS flex `gap` & `inline-flex` due to html2canvas bugs) ─
    const row = (labelText: string, valueText: string, valueColor = textLight, isLast = false) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;${isLast ? '' : `border-bottom:1px solid ${divider};`}">
            <span style="color:${muted};font-size:12.5px;line-height:1.5;">${labelText}</span>
            <span dir="ltr" style="color:${valueColor};font-size:13px;font-weight:700;font-family:${monoFont};line-height:1.4;white-space:nowrap;">${valueText}</span>
        </div>`;

    const chip = (label: string, val: string, valColor = textLight) => `
        <div style="display:inline-block;background:${surface};border:1px solid ${divider};border-radius:10px;padding:6px 11px;font-size:11.5px;line-height:1.4;color:${muted};${marginEnd}:7px;margin-bottom:7px;">
            <span>${label} </span><strong dir="ltr" style="color:${valColor};font-family:${monoFont};font-weight:700;">${val}</strong>
        </div>`;

    const heroValue = isBreakdown
        ? fmt(data.makingPerGram ?? 0)
        : fmt(data.totalPrice ?? 0);
    const heroLabel = isBreakdown
        ? (isAr ? 'مصنعية الجرام الواحد' : 'Making Charge per Gram')
        : (isAr ? `الإجمالي التقديري (شامل ${vatPercentage}% ضريبة)` : `Estimated Total (incl. ${vatPercentage}% VAT)`);
    const heroSuffix = isBreakdown ? `/${unit}` : '';

    const dealBadge = data.dealLabel ? `
        <div style="margin-top:12px;">
            <span style="display:inline-block;padding:5px 12px;border-radius:10px;border:1px solid ${data.dealColor ?? gold}44;background:${data.dealColor ?? gold}1A;color:${data.dealColor ?? gold};font-size:11.5px;font-weight:700;line-height:1.45;">
                <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${data.dealColor ?? gold};vertical-align:middle;${marginEnd}:6px;"></span><span style="vertical-align:middle;">${data.dealLabel}</span>
            </span>
        </div>` : '';

    const hasSellerBlock = !isBreakdown && data.sellerPrice && data.sellerPrice > 0 && data.discountPct !== undefined && data.discountStatusText;

    const detailRows = isBreakdown ? `
        ${row(isAr ? 'سعر البائع (شامل الضريبة)' : 'Seller Price (incl. VAT)', `${curr} ${fmt(data.itemPrice ?? 0)}`)}
        ${row(isAr ? 'السعر قبل الضريبة' : 'Price ex-VAT', `${curr} ${fmt(data.priceNoVat ?? 0)}`)}
        ${row(isAr ? `الضريبة (${vatPercentage}%)` : `VAT (${vatPercentage}%)`, `${curr} ${fmt(data.vatAmount ?? 0)}`, muted)}
        ${row(isAr ? 'قيمة الذهب الخام' : 'Raw Gold Value', `${curr} ${fmt(data.rawGoldCost ?? 0)}`, gold)}
        ${row(isAr ? 'إجمالي المصنعية' : 'Total Making Charge', `${curr} ${fmt(data.totalMaking ?? 0)}`, craft, true)}
    ` : `
        ${row(isAr ? 'قيمة الذهب الخام' : 'Raw Gold Value', `${curr} ${fmt(data.rawGoldCost ?? 0)}`, gold)}
        ${row(isAr ? 'إجمالي المصنعية' : 'Total Making Charge', `${curr} ${fmt(data.totalMaking ?? 0)}`, craft)}
        ${row(isAr ? `الضريبة (${vatPercentage}%)` : `VAT (${vatPercentage}%)`, `${curr} ${fmt(data.vatAmount ?? 0)}`, muted, !hasSellerBlock)}
        ${hasSellerBlock
            ? row(isAr ? 'سعر البائع' : "Seller's Price", `${curr} ${fmt(data.sellerPrice!)}`)
              + row(data.discountStatusText!, `${data.discountPct!.toFixed(1)}% (${curr} ${fmt(Math.abs(data.priceDiff ?? 0))})`, '#34D399', true)
            : ''}
    `;

    const formattedDate = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const html = `
    <div style="
        width:440px;
        background:${canvasBg};
        padding:16px;
        box-sizing:border-box;
        font-family:${mainFont};
        direction:${isAr ? 'rtl' : 'ltr'};
        text-align:${isAr ? 'right' : 'left'};
    ">
        <div style="
            background:${cardBg};
            border:1px solid rgba(229,169,59,0.28);
            border-radius:20px;
            overflow:hidden;
        ">
            <div style="height:4px;background:linear-gradient(90deg,${gold},${craft});"></div>

            <div style="padding:22px 22px 14px;">
                <!-- Header -->
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                    <div>
                        <div style="font-size:15px;font-weight:800;color:${textLight};line-height:1.3;${isAr ? '' : 'letter-spacing:0.2px;'}">
                            ${isAr ? 'حاسبة الذهب' : 'Gold Calculator'}
                        </div>
                        <div style="font-size:11px;color:${muted};margin-top:2px;line-height:1.4;">
                            ${isBreakdown
                                ? (isAr ? 'تحليل سعر القطعة' : 'Price Breakdown')
                                : (isAr ? 'تقدير السعر العادل' : 'Price Estimator')
                            } · ${formattedDate}
                        </div>
                    </div>
                    <div style="background:rgba(229,169,59,0.14);border:1px solid rgba(229,169,59,0.35);border-radius:10px;padding:5px 12px;line-height:1.3;">
                        <span dir="ltr" style="color:${gold};font-size:12px;font-weight:800;font-family:${monoFont};">${karat}</span>
                    </div>
                </div>

                <!-- Summary Pills -->
                <div style="margin-bottom:10px;">
                    ${chip(isAr ? 'سعر الذهب:' : 'Gold:', `${curr} ${fmtSmall(goldPrice)}/${unit}`, gold)}
                    ${chip(isAr ? (stoneWeight && stoneWeight > 0 ? 'صافي الوزن:' : 'الوزن:') : (stoneWeight && stoneWeight > 0 ? 'Net Weight:' : 'Weight:'), `${fmtSmall(weight)} ${unit}`, textLight)}
                    ${stoneWeight && stoneWeight > 0 ? chip(isAr ? 'الفصوص:' : 'Stones:', `-${fmtSmall(stoneWeight)} ${unit}`, textLight) : ''}
                    ${!isBreakdown && data.makingPerGram ? chip(isAr ? 'المصنعية:' : 'Making:', `${curr} ${fmtSmall(data.makingPerGram)}/${unit}`, craft) : ''}
                </div>

                <!-- Hero Verdict Box -->
                <div style="background:${surface};border:1px solid ${divider};border-radius:16px;padding:18px;">
                    <div style="font-size:11.5px;font-weight:600;color:${muted};margin-bottom:8px;line-height:1.4;">${heroLabel}</div>
                    <div style="line-height:1.15;">
                        <span style="font-size:15px;font-weight:700;color:${gold};vertical-align:baseline;${marginEnd}:7px;">${curr}</span><span dir="ltr" style="font-size:40px;font-weight:800;color:${textLight};font-family:${monoFont};vertical-align:baseline;">${heroValue}</span>${heroSuffix ? `<span style="font-size:13px;color:${muted};font-weight:600;vertical-align:baseline;${isAr ? 'margin-right:6px;' : 'margin-left:6px;'}">${heroSuffix}</span>` : ''}
                    </div>
                    ${dealBadge}
                </div>
            </div>

            <div style="height:1px;background:${divider};margin:0 22px;"></div>

            <!-- Breakdown Details -->
            <div style="padding:6px 22px 14px;">
                ${detailRows}
            </div>

            <!-- Footer -->
            <div style="background:${surface};padding:11px 22px;border-top:1px solid ${divider};display:flex;align-items:center;justify-content:space-between;">
                <span style="font-size:11px;font-weight:600;color:${muted};line-height:1.4;">${isAr ? 'حاسبة الذهب' : 'Gold Calculator'}</span>
                <div style="line-height:1;">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${gold};${marginEnd}:5px;"></span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${craft};opacity:0.8;"></span>
                </div>
            </div>
        </div>
    </div>`;

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;left:0;width:440px;pointer-events:none;z-index:-1;';
    container.innerHTML = html;
    document.body.appendChild(container);

    const cardEl = container.firstElementChild as HTMLElement;
    const canvas = await html2canvas(cardEl, {
        backgroundColor: canvasBg,
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
        if (!shareData) return;
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
                disabled={isSharing || !shareData}
                className="flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[38px] px-2.5 sm:px-3.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 whitespace-nowrap"
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
