import { useState, useEffect } from 'react';

const EDITABLE_INPUT_TYPES = new Set([
    'text',
    'number',
    'decimal',
    'tel',
    'search',
    'email',
    'url',
    'password',
]);

function isEditableElement(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement)) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') {
        const type = (el as HTMLInputElement).type?.toLowerCase() || 'text';
        return EDITABLE_INPUT_TYPES.has(type);
    }
    return el.isContentEditable;
}

export const useMobileKeyboard = () => {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let blurTimer: ReturnType<typeof setTimeout> | null = null;
        let baselineHeight = window.innerHeight;

        const handleFocusIn = (e: FocusEvent) => {
            if (window.innerWidth >= 640) return;
            if (isEditableElement(e.target)) {
                if (blurTimer) {
                    clearTimeout(blurTimer);
                    blurTimer = null;
                }
                setIsKeyboardOpen(true);
            }
        };

        const handleFocusOut = () => {
            if (blurTimer) clearTimeout(blurTimer);
            blurTimer = setTimeout(() => {
                const activeIsEditable = isEditableElement(document.activeElement);
                const vv = window.visualViewport;
                const viewportShrunk = vv ? baselineHeight - vv.height > 140 : false;
                if (!activeIsEditable && !viewportShrunk) {
                    setIsKeyboardOpen(false);
                }
            }, 120);
        };

        const handleViewportResize = () => {
            if (window.innerWidth >= 640) {
                setIsKeyboardOpen(false);
                return;
            }
            const vv = window.visualViewport;
            if (!vv) return;

            if (vv.height > baselineHeight) {
                baselineHeight = vv.height;
            }
            const delta = baselineHeight - vv.height;
            if (delta > 140) {
                setIsKeyboardOpen(true);
            } else if (!isEditableElement(document.activeElement)) {
                setIsKeyboardOpen(false);
            }
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);
        window.visualViewport?.addEventListener('resize', handleViewportResize);

        return () => {
            if (blurTimer) clearTimeout(blurTimer);
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
            window.visualViewport?.removeEventListener('resize', handleViewportResize);
        };
    }, []);

    return isKeyboardOpen;
};
