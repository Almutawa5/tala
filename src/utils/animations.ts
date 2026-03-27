export const triggerSaveAnimation = (startX: number, startY: number) => {
    const historyBtn = document.getElementById('history-button');
    if (!historyBtn) return;

    const rect = historyBtn.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    const particle = document.createElement('div');
    particle.className = 'saving-particle';
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;

    // Set custom properties for the animation
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;

    particle.style.setProperty('--target-x', `${deltaX}px`);
    particle.style.setProperty('--target-y', `${deltaY}px`);
    particle.style.animation = 'flyToHistory 1.2s cubic-bezier(0.19, 1, 0.22, 1) forwards';

    document.body.appendChild(particle);

    particle.addEventListener('animationend', () => {
        particle.remove();
        // Add a temporary pop effect to the history button
        historyBtn.classList.add('scale-125', 'text-[#D4AF37]');
        setTimeout(() => {
            historyBtn.classList.remove('scale-125', 'text-[#D4AF37]');
        }, 300);
    });
};
