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

import { fetchManifest } from './api.js';
import { CONFIG } from './config.js';

export async function injectTimeMachine() {
    try {
        const manifest = await fetchManifest();
        if (!manifest || !manifest.periods) return;

        // Build UI container
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'flex-end';
        container.style.gap = '8px';

        const selectBox = document.createElement('select');
        selectBox.style.padding = '8px 12px';
        selectBox.style.borderRadius = '8px';
        selectBox.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
        selectBox.style.color = '#38bdf8';
        selectBox.style.border = '1px solid rgba(56, 189, 248, 0.3)';
        selectBox.style.outline = 'none';
        selectBox.style.fontFamily = 'monospace';
        selectBox.style.fontWeight = 'bold';
        selectBox.style.cursor = 'pointer';

        manifest.periods.forEach(p => {
            const option = document.createElement('option');
            option.value = `${p.year}|${p.semester}`;
            option.textContent = `🕰️ ${p.label}`;
            
            if (p.year === CONFIG.STATE.YEAR && p.semester === CONFIG.STATE.SEMESTER) {
                option.selected = true;
            }
            selectBox.appendChild(option);
        });

        selectBox.addEventListener('change', (e) => {
            const [year, sem] = e.target.value.split('|');
            CONFIG.updateState(year, sem);
            // Reload to apply the new URL query parameters instantly
            window.location.reload(); 
        });

        const badge = document.createElement('div');
        badge.textContent = 'TIME MACHINE';
        badge.style.fontSize = '10px';
        badge.style.color = '#94a3b8';
        badge.style.letterSpacing = '1px';
        badge.style.fontWeight = 'bold';

        container.appendChild(badge);
        container.appendChild(selectBox);
        document.body.appendChild(container);
    } catch (e) {
        console.error('Time machine failed to load', e);
    }
}
