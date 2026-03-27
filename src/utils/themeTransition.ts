export const triggerEclipseTransition = (
    x: number,
    y: number,
    color: string,
    onThemeChange: () => void
) => {
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'eclipse-overlay';
    document.body.appendChild(overlay);

    // Set position and color
    overlay.style.setProperty('--eclipse-x', `${x}px`);
    overlay.style.setProperty('--eclipse-y', `${y}px`);
    overlay.style.setProperty('--eclipse-color', color);

    // Initial state (hidden)
    overlay.style.clipPath = `circle(0% at ${x}px ${y}px)`;

    // Force reflow
    overlay.offsetHeight;

    // Start expansion
    overlay.classList.add('active');

    // Perform theme change halfway through the animation (0.4s of the 0.8s transition)
    setTimeout(() => {
        onThemeChange();
    }, 400);

    // Fade out and cleanup
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 800);
    }, 1000);
};
