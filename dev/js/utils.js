export function triggerLiquidExplosion(buttonId, overlayId, callback) {
    const overlay = document.getElementById(overlayId);
    const btn = document.getElementById(buttonId);
    if (!overlay || !btn) return;

    const rect = btn.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.innerHTML = '';

    const blob = document.createElement('div');
    blob.className = 'liquid-blob';
    blob.style.left = (rect.left + rect.width / 2) + 'px';
    blob.style.top = (rect.top + rect.height / 2) + 'px';
    
    // Scale to cover screen
    const size = Math.max(window.innerWidth, window.innerHeight) * 1.5;
    blob.style.width = size + 'px';
    blob.style.height = size + 'px';
    
    overlay.appendChild(blob);

    setTimeout(() => {
        if (callback) callback();
        blob.style.opacity = '0';
        blob.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        }, 1000);
    }, 600);
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
