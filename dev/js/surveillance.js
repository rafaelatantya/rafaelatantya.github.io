import { fetchLivingJungleStats, fetchLivingJungleGlobalIndex, fetchLivingJungleBatch, fetchLivingJungleMatkul } from './api.js';
import { renderChart, updateChartTheme, setChartType } from './analytics.js';

// --- THEME & UTILS ---
const themeIcon = document.getElementById('themeIcon');
let currentTheme = localStorage.getItem('theme') || 'dark';

window.toggleTheme = function() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    if(themeIcon) {
        themeIcon.innerText = currentTheme === 'dark' ? '🌙' : '☀️';
        themeIcon.style.transform = 'rotate(360deg)'; 
        setTimeout(() => themeIcon.style.transform = 'rotate(0deg)', 500);
    }
    localStorage.setItem('theme', currentTheme);
    updateChartTheme(); 
}

// Initial Theme Setup
document.documentElement.setAttribute('data-theme', currentTheme);
if(themeIcon) themeIcon.innerText = currentTheme === 'dark' ? '🌙' : '☀️';

window.copyNIM = function(nim, btnId) {
    navigator.clipboard.writeText(nim).then(() => {
        const btn = document.getElementById(btnId);
        if(!btn) return;
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="ph-bold ph-check text-[var(--accent-primary)]"></i> OK!';
        setTimeout(() => { btn.innerHTML = original; }, 2000);
    });
}

// --- TRAFFIC SYSTEM (SMART TIME LOGIC) ---
let globalStatsData = null;

async function loadLiveTraffic() {
    try {
        if (!globalStatsData) {
            globalStatsData = await fetchLivingJungleStats();
        }
        
        // Get Time
        const now = new Date();
        const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
        let currentDayIndex = now.getDay();
        let currentHour = now.getHours();

        // LOGIC: If late night (e.g. 23:00), show next day 07:00
        if (currentHour > 21) {
            currentDayIndex = (currentDayIndex + 1) % 7;
            currentHour = 7; 
        } else if (currentHour < 7) {
            currentHour = 7;
        }

        const displayDay = days[currentDayIndex];
        updateWidgetUI(displayDay, currentHour);

    } catch (e) { console.log("Traffic data unavailable", e); }
}

function updateWidgetUI(day, hour) {
    if (!globalStatsData) return;
    let percentage = 0;
    if (globalStatsData.heatmap[day] && globalStatsData.heatmap[day][hour]) {
        percentage = globalStatsData.heatmap[day][hour];
    }
    const widget = document.getElementById('trafficWidget');
    const text = document.getElementById('trafficText');
    const dot = document.getElementById('trafficDot');
    
    if(widget) { widget.classList.remove('hidden'); widget.classList.add('flex'); }
    if(text) {
        text.innerHTML = `LIVE: ${percentage}% KELAS`;
        if(dot) dot.className = 'dot-indicator';
        if (percentage < 30) { if(dot) dot.classList.add('dot-green'); text.innerHTML += " (SEPI)"; } 
        else if (percentage < 70) { if(dot) dot.classList.add('dot-orange'); text.innerHTML += " (NORMAL)"; } 
        else { if(dot) dot.classList.add('dot-red'); text.innerHTML += " (PADAT)"; }
    }
}

// --- MODAL & CHARTS ---
window.openTrafficModal = function() {
    const modal = document.getElementById('trafficModal');
    const inner = document.getElementById('trafficModalInner');
    if(!modal || !inner) return;
    window.resetToLive(); // Init with current/next time
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); inner.classList.remove('scale-95'); inner.classList.add('scale-100'); }, 10);
    setTimeout(() => { renderChart(globalStatsData, currentTheme); }, 200);
}

window.closeTrafficModal = function() {
    const modal = document.getElementById('trafficModal');
    const inner = document.getElementById('trafficModalInner');
    if(!modal || !inner) return;
    modal.classList.add('opacity-0'); inner.classList.remove('scale-100'); inner.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

window.updateModalStats = function() {
    if (!globalStatsData) return;
    const day = document.getElementById('modalDay').value;
    const hour = parseInt(document.getElementById('modalHour').value);
    document.getElementById('modalHourDisplay').innerText = `${hour.toString().padStart(2, '0')}:00`;

    let percentage = 0;
    if (globalStatsData.heatmap[day] && globalStatsData.heatmap[day][hour]) percentage = globalStatsData.heatmap[day][hour];

    document.getElementById('modalPercent').innerText = `${percentage}%`;
    const statusEl = document.getElementById('modalStatus');
    if (percentage < 30) { statusEl.innerText = "HUTAN SEPI 🍃"; statusEl.style.color = "#4ade80"; statusEl.style.borderColor = "#4ade80"; } 
    else if (percentage < 70) { statusEl.innerText = "NORMAL 🚶"; statusEl.style.color = "#fb923c"; statusEl.style.borderColor = "#fb923c"; } 
    else { statusEl.innerText = "SANGAT PADAT 🔥"; statusEl.style.color = "#f87171"; statusEl.style.borderColor = "#f87171"; }
}

window.resetToLive = function() {
    const now = new Date();
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    let currentDayIndex = now.getDay();
    let currentHour = now.getHours();

    if (currentHour > 21) { currentDayIndex = (currentDayIndex + 1) % 7; currentHour = 7; }
    else if (currentHour < 7) { currentHour = 7; }

    const modalDay = document.getElementById('modalDay');
    const modalHour = document.getElementById('modalHour');
    if(modalDay) modalDay.value = days[currentDayIndex];
    if(modalHour) modalHour.value = currentHour;
    window.updateModalStats();
}

window.setChartType = function(type) {
    setChartType(type);
    ['heatmap', 'line', 'bar'].forEach(t => {
        const btn = document.getElementById(`btn-${t}`);
        if(!btn) return;
        if(t === type) { btn.classList.remove('text-[var(--text-muted)]'); btn.classList.add('bg-[var(--accent-primary)]', 'text-black'); }
        else { btn.classList.add('text-[var(--text-muted)]'); btn.classList.remove('bg-[var(--accent-primary)]', 'text-black'); }
    });
    renderChart(globalStatsData, currentTheme);
}

// --- SEARCH & DB ---
function triggerLiquidExplosion(callback) {
    const btn = document.getElementById('searchBtn'); 
    if(!btn) return callback();
    const rect = btn.getBoundingClientRect();
    const overlay = document.getElementById('liquidLayer'); 
    if(!overlay) return callback();
    overlay.style.display = 'block'; overlay.innerHTML = ''; 
    const blob = document.createElement('div'); blob.className = 'liquid-blob animate-liquid-fill';
    blob.style.left = (rect.left + rect.width/2) + 'px'; blob.style.top = (rect.top + rect.height/2) + 'px';
    blob.style.width = Math.max(window.innerWidth, window.innerHeight) + 'px'; blob.style.height = blob.style.width;
    overlay.appendChild(blob);
    setTimeout(() => {
        for(let i=0; i<20; i++) {
            const bubble = document.createElement('div'); bubble.className = 'bubble animate-bubble-rise';
            const size = Math.random() * 60 + 20; bubble.style.width = size + 'px'; bubble.style.height = size + 'px';
            bubble.style.left = Math.random() * 100 + 'vw'; bubble.style.animationDelay = (Math.random() * 0.5) + 's';
            overlay.appendChild(bubble);
        }
        blob.style.opacity = '0'; blob.style.transition = 'opacity 0.3s';
        callback();
        setTimeout(() => { overlay.style.display = 'none'; overlay.innerHTML = ''; }, 1600);
    }, 700); 
}

const trees = document.getElementById('trees');
const searchContainer = document.getElementById('searchContainer');
document.addEventListener('mousemove', (e) => {
    const x = (window.innerWidth - e.pageX) / 100; const y = (window.innerHeight - e.pageY) / 100;
    if(trees) trees.style.transform = `translateX(${x}px)`;
    if(window.innerWidth > 768 && searchContainer) {
        const rotX = (window.innerHeight / 2 - e.pageY) / 50; const rotY = (window.innerWidth / 2 - e.pageX) / 50;
        searchContainer.style.transform = `perspective(1000px) rotateX(${rotX * 0.2}deg) rotateY(${rotY * 0.2}deg)`;
    }
});

let DB = [], CURRENT_SEARCH = [], PAGE_SIZE = 10, CURRENT_PAGE = 0, isCooldown = false;

function formatScheduleString(raw) {
    const dayRegex = /(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)/i;
    const timeRegex = /(\d{1,2}:\d{2})\s?-\s?(\d{1,2}:\d{2})/;
    const dayMatch = raw.match(dayRegex); const timeMatch = raw.match(timeRegex);
    const day = dayMatch ? dayMatch[0] : ''; const time = timeMatch ? `${timeMatch[1]} - ${timeMatch[2]}` : '';
    let detail = raw.replace(dayRegex, '').replace(timeRegex, '').replace(/\bdi\s+/gi, '').trim().replace(/^\W+|\W+$/g, '');
    if (!day && !time) return `<span class="opacity-50 text-xs">${raw}</span>`;
    return `<div class="flex items-start gap-3 py-3 border-b border-[var(--glass-border)] last:border-0 group/schedule">
        <div class="min-w-[50px] pt-1"><div class="text-[10px] font-black uppercase bg-[var(--accent-primary)] text-black shadow-lg text-center rounded-md py-1 font-tech tracking-wider">${day}</div></div>
        <div class="flex-1"><div class="flex items-center gap-2 mb-1"><i class="ph-fill ph-clock text-[var(--accent-primary)] text-sm"></i><span class="text-sm font-bold text-[var(--text-main)] tracking-wide font-tech">${time}</span></div>
        <div class="flex items-center gap-1.5 mt-1"><span class="text-[10px] text-[var(--text-main)] bg-black/20 px-2 py-1 rounded border border-[var(--glass-border)] flex items-center gap-1 font-mono"><i class="ph-fill ph-map-pin text-[var(--accent-primary)]"></i> ${detail}</span></div></div></div>`;
}

function startCooldown(seconds) {
    const btn = document.getElementById('searchBtn'); const originalHTML = `<span class="relative z-10">SCAN DATA</span> <i class="ph-bold ph-magnifying-glass relative z-10"></i>`;
    isCooldown = true; if(btn) btn.disabled = true; let timeLeft = seconds;
    if(btn) btn.innerHTML = `<i class="ph-bold ph-hourglass-high animate-spin text-xl"></i> <span class="font-mono ml-2">${timeLeft}s</span>`;
    const timer = setInterval(() => { timeLeft--; if (timeLeft <= 0) { clearInterval(timer); isCooldown = false; if(btn){btn.disabled = false; btn.innerHTML = originalHTML;} } else { if(btn) btn.innerHTML = `<i class="ph-bold ph-hourglass-high animate-spin text-xl"></i> <span class="font-mono ml-2">${timeLeft}s</span>`; } }, 1000);
}

window.handleSearch = function() {
    if (isCooldown) return;
    const inputEl = document.getElementById('searchInput'); const keyword = inputEl.value.toLowerCase().trim();
    if (keyword.length < 3) { alert("Sinyal lemah. Masukkan minimal 3 karakter."); inputEl.focus(); return; }
    startCooldown(5); 
    triggerLiquidExplosion(() => {
        CURRENT_SEARCH = [];
        for (let i = 0; i < DB.length; i++) { if (DB[i].toLowerCase().includes(keyword)) { const [name, nim] = DB[i].split('|'); CURRENT_SEARCH.push({ n: name, i: nim }); } }
        CURRENT_PAGE = 1; renderPaginated();
    });
}

// Bind enter key
document.getElementById('searchInput')?.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') window.handleSearch();
});

const dayWeights = { 'senin': 1, 'selasa': 2, 'rabu': 3, 'kamis': 4, 'jumat': 5, 'sabtu': 6, 'minggu': 7 };
function getScheduleWeight(scheduleArray) {
    if (!scheduleArray || scheduleArray.length === 0) return 999999; 
    const raw = scheduleArray[0].toLowerCase(); let dayScore = 8; 
    for (const [day, score] of Object.entries(dayWeights)) { if (raw.includes(day)) { dayScore = score; break; } }
    let timeScore = 0; const timeMatch = raw.match(/(\d{1,2}):(\d{2})/); if (timeMatch) timeScore = parseInt(timeMatch[1] + timeMatch[2]);
    return (dayScore * 10000) + timeScore;
}

// --- INIT APP & LOADER ---
(async () => {
    const loader = document.getElementById('initLoader');
    const app = document.getElementById('mainApp');
    const bar = document.getElementById('initProgressBar');
    const txt = document.getElementById('initProgressText');
    const spd = document.getElementById('initSpeed');

    // FAKE LOADER
    let progress = 0;
    const fakeLoader = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 95) progress = 95;
        if(bar) bar.style.width = `${progress}%`;
        if(txt) txt.innerText = `${Math.floor(progress)}%`;
    }, 100);

    try {
        DB = await fetchLivingJungleGlobalIndex();
        
        clearInterval(fakeLoader);
        if(bar) bar.style.width = '100%';
        if(txt) txt.innerText = '100%';
        if(spd) spd.innerText = 'READY';

        loadLiveTraffic(); setInterval(loadLiveTraffic, 300000); 

        setTimeout(() => {
            if(loader) loader.style.opacity = '0';
            setTimeout(() => { if(loader) loader.remove(); if(app) app.classList.remove('hidden'); setTimeout(() => {if(app) app.style.opacity = '1'}, 50); }, 500);
        }, 500);

    } catch (e) { 
        clearInterval(fakeLoader);
        if(txt) txt.innerText = "ERROR";
        console.error(e);
        alert("Koneksi Hutan Terputus. Cek Server."); 
    }
})();

// --- INIT FIREFLIES ---
function createFireflies() {
    const container = document.getElementById('fireflyContainer');
    if(!container) return;
    for(let i=0; i<15; i++) {
        const fly = document.createElement('div'); fly.className = 'firefly';
        const size = Math.random() * 3 + 2; fly.style.width = `${size}px`; fly.style.height = `${size}px`;
        fly.style.left = `${Math.random() * 100}vw`; fly.style.top = `${Math.random() * 100}vh`;
        fly.style.setProperty('--mx1', `${(Math.random() - 0.5) * 200}px`); fly.style.setProperty('--my1', `${(Math.random() - 0.5) * 200}px`);
        fly.style.setProperty('--mx2', `${(Math.random() - 0.5) * 200}px`); fly.style.setProperty('--my2', `${(Math.random() - 0.5) * 200}px`);
        fly.style.setProperty('--mx3', `${(Math.random() - 0.5) * 200}px`); fly.style.setProperty('--my3', `${(Math.random() - 0.5) * 200}px`);
        fly.style.animationDuration = `${Math.random() * 10 + 5}s`; fly.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(fly);
    }
} createFireflies();

window.triggerShortcutSearch = function(keyword) { const inputEl = document.getElementById('searchInput'); inputEl.value = keyword; inputEl.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); window.handleSearch(); }

function renderPaginated() {
    const container = document.getElementById('resultsContainer'); const btn = document.getElementById('loadMoreBtn');
    if(!container) return;
    if (CURRENT_SEARCH.length === 0) { container.innerHTML = `<div class="col-span-full text-center py-12 text-[var(--text-muted)] text-sm glass-panel rounded-3xl border-dashed border-2 border-[var(--glass-border)] font-mono">JEJAK TIDAK DITEMUKAN</div>`; if(btn) btn.classList.add('hidden'); return; }
    if(CURRENT_PAGE === 1) container.innerHTML = '';
    const start = (CURRENT_PAGE - 1) * PAGE_SIZE; const end = CURRENT_PAGE * PAGE_SIZE; const dataToShow = CURRENT_SEARCH.slice(start, end);
    const html = dataToShow.map((p, index) => `
        <div class="glass-card rounded-3xl overflow-hidden animate-enter relative group" style="animation-delay: ${index * 0.05}s">
            <div class="px-5 py-4 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--bg-secondary)] relative z-10">
                <div class="flex items-center gap-4"><div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)] text-[var(--accent-primary)] flex items-center justify-center font-black text-xl shadow-inner border border-[var(--glass-border)] font-tech">${p.n.charAt(0)}</div>
                <div><div class="font-bold text-[var(--text-main)] text-lg leading-none font-tech tracking-wide">${p.n}</div>
                <div class="flex items-center gap-2 mt-1"><div class="text-xs font-mono text-[var(--accent-primary)] select-all opacity-80 flex items-center gap-1"><i class="ph-bold ph-fingerprint"></i> ${p.i}</div>
                <button id="copy-${p.i}" onclick="window.copyNIM('${p.i}', 'copy-${p.i}')" class="copy-btn flex items-center gap-1" title="Copy NIM"><i class="ph-bold ph-copy"></i> COPY</button></div></div></div>
            </div><div id="schedule-${p.i}" class="min-h-[100px] bg-[var(--card-bg)]"><div class="p-6 flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono"><i class="ph-bold ph-spinner animate-spin text-[var(--accent-primary)] text-xl"></i> MENDOWNLOAD DATA JADWAL...</div></div>
        </div>`).join('');
    if(CURRENT_PAGE === 1) container.innerHTML = html; else container.insertAdjacentHTML('beforeend', html);
    if (end < CURRENT_SEARCH.length) { if(btn) { btn.classList.remove('hidden'); btn.innerText = `LOAD MORE (${CURRENT_SEARCH.length - end})`; } } else { if(btn) btn.classList.add('hidden'); }
    dataToShow.forEach(p => window.fetchSchedule(p.i));
}
window.loadMore = function() { CURRENT_PAGE++; renderPaginated(); }

const batchCache = {}; 
window.fetchSchedule = async function(nim) {
    const div = document.getElementById(`schedule-${nim}`); if(!div) return;
    try {
        const match = nim.match(/^([A-Z]+\d+?)(\d{2})\d+$/); const batchKey = match ? `${match[1]}_${match[2]}` : nim.substring(0, 5);
        if (!batchCache[batchKey]) { batchCache[batchKey] = await fetchLivingJungleBatch(batchKey); }
        const rawString = batchCache[batchKey].find(s => s.startsWith(nim + '|'));
        if (!rawString) { div.innerHTML = `<div class="p-6 text-center text-sm text-[var(--text-muted)] italic font-mono">DATA KOSONG</div>`; return; }
        const parts = rawString.split('|'); const jadwalBlob = parts[2];
        if(!jadwalBlob) { div.innerHTML = `<div class="p-6 text-center text-sm text-[var(--text-muted)] italic font-mono">DATA KOSONG</div>`; return; }
        const jadwalList = jadwalBlob.split(';').map(mStr => { const mParts = mStr.split('^'); return { id: mParts[0], k: mParts[1], n: mParts[2], s: mParts[3], t: mParts[4], pl: mParts[5], w: mParts[6] ? mParts[6].split('~') : [] }; });
        const sortedJadwal = jadwalList.sort((a, b) => getScheduleWeight(a.w) - getScheduleWeight(b.w));
        div.innerHTML = `<div class="divide-y divide-[var(--glass-border)]">` + sortedJadwal.map(m => {
            const isKuliah = m.t === 'K'; const badgeClass = isKuliah ? 'text-blue-400 border-blue-500/30 bg-blue-900/20' : 'text-orange-400 border-orange-500/30 bg-orange-900/20'; const typeLabel = isKuliah ? 'KUL' : (m.t === 'P' ? 'PRAK' : 'RESP'); const paralelLabel = m.pl ? `${typeLabel} ${m.pl}` : `${typeLabel}`;
            return `<div class="p-5 hover:bg-[var(--glass-border)] transition-colors group relative"><div class="flex justify-between items-start mb-4 relative z-10"><div><div class="font-bold text-[var(--text-main)] text-sm leading-snug group-hover:text-[var(--accent-primary)] transition font-tech tracking-wide">${m.n}</div><div class="flex flex-wrap gap-2 mt-2"><span class="text-[9px] font-bold px-2 py-1 rounded-md border ${badgeClass} font-mono uppercase tracking-wider">${m.k} • ${paralelLabel}</span><span class="text-[9px] text-[var(--text-muted)] border border-[var(--glass-border)] px-2 py-1 rounded-md font-bold font-mono flex items-center gap-1"><i class="ph-bold ph-coins"></i> ${m.s} SKS</span></div></div><button onclick="window.togglePeers('${m.id}', '${m.k}')" class="shrink-0 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] px-3 py-2 rounded-xl transition-all flex items-center gap-2 backdrop-blur-md shadow-sm uppercase font-tech tracking-widest"><i class="ph-bold ph-users-three"></i> TEAM</button></div><div class="bg-[var(--bg-primary)] rounded-xl px-4 border border-[var(--glass-border)] shadow-inner">${m.w.map(raw => formatScheduleString(raw)).join('') || '<div class="py-3 text-[10px] text-opacity-50 italic font-mono">TBA</div>'}</div><div id="peers-${m.id}" class="hidden mt-4 relative z-10"></div></div>`;
        }).join('') + `</div>`;
    } catch (e) { if(div) div.innerHTML = `<div class="p-5 text-sm text-red-400 text-center font-mono border-2 border-red-500/30 rounded-xl bg-red-900/20">CORRUPT</div>`; }
}

const matkulCache = {};
window.togglePeers = async (id, kode) => {
    const box = document.getElementById(`peers-${id}`); if (!box.classList.contains('hidden')) { box.classList.add('hidden'); return; } box.classList.remove('hidden');
    box.innerHTML = `<div class="glass-input p-4 rounded-2xl border-[var(--glass-border)]"><div class="text-[10px] text-[var(--text-muted)] flex justify-between font-mono mb-2"><span>ACCESSING MAINFRAME...</span> <span id="spd-${id}" class="text-[var(--accent-primary)] font-bold">0 Kbps</span></div><div class="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--glass-border)]"><div id="bar-${id}" class="h-full bg-[var(--accent-primary)] w-0 progress-fill shadow-[0_0_15px_var(--accent-glow)]"></div></div></div>`;
    const prefix = (kode.match(/^[A-Z]+/) || ['MISC'])[0];
    try {
        if (!matkulCache[prefix]) { 
            matkulCache[prefix] = await fetchLivingJungleMatkul(prefix, (pct, spd) => { const bar = document.getElementById(`bar-${id}`), spdEl = document.getElementById(`spd-${id}`); if(bar) bar.style.width = `${pct}%`; if(spdEl) spdEl.innerText = spd; }); 
        }
        const rawStr = matkulCache[prefix].find(s => s.startsWith(id + '|'));
        if (rawStr) {
            const parts = rawStr.split('|'); const detailStr = parts[1]; const pesertaBlob = parts[2];
            if(pesertaBlob) {
                const pList = pesertaBlob.split(';').map(p => { const [n,m] = p.split(','); return { i: n, n: m }; }); const sorted = pList.sort((a,b) => a.n.localeCompare(b.n)); const paralelInfo = detailStr.split('^')[4];
                box.innerHTML = `<div class="bg-[var(--bg-primary)] border-2 border-[var(--glass-border)] text-[var(--text-main)] p-4 rounded-3xl shadow-2xl mt-2 animate-enter backdrop-blur-xl relative overflow-hidden"><div class="flex justify-between items-end mb-4 border-b-2 border-[var(--glass-border)] pb-3 relative z-10"><div><span class="text-[10px] font-mono text-[var(--text-muted)] block mb-1">PARALEL UNIT</span><span class="text-lg font-black text-[var(--accent-primary)] font-tech tracking-wide drop-shadow-sm">KELAS ${paralelInfo}</span></div><span class="text-[11px] bg-[var(--bg-secondary)] px-3 py-1 rounded-lg text-[var(--text-main)] border border-[var(--glass-border)] font-bold font-mono flex items-center gap-2 shadow-inner"><i class="ph-fill ph-android-logo text-[var(--accent-primary)]"></i> ${pList.length} TRACKERS</span></div><div class="max-h-60 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar relative z-10">${sorted.map((p, i) => `<div class="flex items-center justify-between text-[11px] p-2.5 rounded-xl hover:bg-[var(--glass-border)] cursor-pointer transition-all group/item border border-transparent hover:border-[var(--glass-border)]" onclick="window.triggerShortcutSearch('${p.i}')"><div class="flex items-center gap-3 overflow-hidden"><span class="text-[var(--text-muted)] w-5 text-right shrink-0 font-mono font-bold group-hover/item:text-[var(--accent-primary)] transition">${i+1}.</span><span class="truncate text-[var(--text-main)] font-medium font-tech tracking-wide">${p.n}</span></div><span class="font-mono text-[var(--text-muted)] group-hover/item:text-[var(--accent-primary)] transition text-[9px] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--glass-border)]">${p.i}</span></div>`).join('')}</div></div>`;
            } else { box.innerHTML = `<div class="p-3 text-[10px] text-opacity-50 italic text-center font-mono border border-[var(--glass-border)] rounded-xl">KOSONG</div>`; }
        } else { box.innerHTML = `<div class="p-3 text-[10px] text-red-500/60 italic text-center font-mono border border-red-500/10 rounded-xl">ERROR</div>`; }
    } catch (e) { box.innerHTML = `<div class="text-red-400 text-[10px] p-3 text-center font-mono bg-red-900/20 rounded-xl border border-red-500/30">DISCONNECTED</div>`; }
};
