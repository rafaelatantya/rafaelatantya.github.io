import { CONFIG } from './config.js';
import { TRANSLATIONS } from './i18n.js';
import { fetchCourseDatabase, fetchGradeStats } from './api.js';
import { triggerLiquidExplosion } from './utils.js';

class CourseIslandApp {
    constructor() {
        this.allData = [];
        this.searchResults = [];
        this.currentPage = 1;
        this.currentLang = localStorage.getItem('lang') || 'id';
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.chartStore = {};

        this.init();
    }

    async init() {
        this.setupTheme();
        this.setupEventListeners();
        this.updateUIStrings();
        
        try {
            this.allData = await fetchCourseDatabase((progressData) => {
                this.updateLoader(progressData);
            });
            this.hideLoader();
            this.populateStrataFilter();
            document.getElementById('totalDataBadge').innerText = this.allData.length.toLocaleString();
        } catch (error) {
            console.error("Initialization failed:", error);
        }
    }

    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = this.currentTheme === 'dark' 
                ? 'fa-solid fa-sun text-[var(--accent-secondary)]' 
                : 'fa-solid fa-moon text-[var(--accent-secondary)]';
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.currentTheme);
        this.setupTheme();
        
        // Refresh visible charts for theme compatibility
        Object.keys(this.chartStore).forEach(id => {
            const wrapper = document.getElementById(`chart-wrapper-${id}`);
            if (wrapper && !wrapper.closest('.hidden')) {
                this.renderChart(id, this.chartStore[id].config.type);
            }
        });
    }

    setupEventListeners() {
        document.getElementById('themeToggleBtn')?.addEventListener('click', () => this.toggleTheme());
        document.getElementById('langToggle')?.addEventListener('change', (e) => {
            this.currentLang = e.target.checked ? 'en' : 'id';
            localStorage.setItem('lang', this.currentLang);
            this.updateUIStrings();
        });
        document.getElementById('searchBtn')?.addEventListener('click', () => this.handleSearch());
        document.getElementById('searchInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        document.getElementById('loadMoreBtn')?.addEventListener('click', () => this.loadMore());
        document.getElementById('searchMode')?.addEventListener('change', () => this.updateSearchPlaceholder());
    }

    updateUIStrings() {
        const t = TRANSLATIONS[this.currentLang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.innerHTML = t[key];
        });
        this.updateSearchPlaceholder();
        
        // Update language toggle state
        const langToggle = document.getElementById('langToggle');
        if (langToggle) langToggle.checked = (this.currentLang === 'en');
    }

    updateSearchPlaceholder() {
        const mode = document.getElementById('searchMode')?.value;
        const input = document.getElementById('searchInput');
        const t = TRANSLATIONS[this.currentLang];
        
        if (!input) return;
        
        if (mode === 'ID_MK') input.placeholder = "203...";
        else if (mode === 'CODE') input.placeholder = "KOM...";
        else input.placeholder = t.phAll;
    }

    updateLoader({ progress, speed, current, total }) {
        const bar = document.getElementById('initProgressBar');
        const percentText = document.getElementById('percentText');
        const filesCount = document.getElementById('filesCount');
        const speedText = document.getElementById('downloadSpeed');

        if (bar) bar.style.width = `${progress}%`;
        if (percentText) percentText.innerText = `${Math.round(progress)}%`;
        if (filesCount) filesCount.innerText = `File: ${current}/${total}`;
        if (speedText) speedText.innerText = `${speed} KB/s`;
    }

    hideLoader() {
        const loader = document.getElementById('initLoader');
        const mainApp = document.getElementById('mainApp');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                if (mainApp) {
                    mainApp.classList.remove('hidden');
                    setTimeout(() => mainApp.style.opacity = '1', 100);
                }
            }, 700);
        }
    }

    populateStrataFilter() {
        const strataSet = new Set(this.allData.map(c => c.Strata).filter(Boolean));
        const select = document.getElementById('strataSelect');
        if (!select) return;
        
        [...strataSet].sort().forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.innerText = s;
            select.appendChild(opt);
        });
    }

    handleSearch() {
        triggerLiquidExplosion('searchBtn', 'liquidLayer', () => {
            this.doSearchLogic();
        });
    }

    doSearchLogic() {
        const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
        const mode = document.getElementById('searchMode').value;
        const strata = document.getElementById('strataSelect').value;
        
        this.currentPage = 1;
        const container = document.getElementById('resultsContainer');
        if (container) container.innerHTML = '';

        this.searchResults = this.allData.filter(item => {
            if (strata !== 'ALL' && item.Strata !== strata) return false;
            if (!keyword) return true;
            
            switch (mode) {
                case 'NAME': return item.Nama?.toLowerCase().includes(keyword);
                case 'CODE': return item.Kode?.toLowerCase().includes(keyword);
                case 'DESC': return item.Deskripsi?.toLowerCase().includes(keyword);
                case 'ID_MK': return String(item.MataKuliahId).includes(keyword);
                default: return (
                    item.Nama?.toLowerCase().includes(keyword) ||
                    item.Kode?.toLowerCase().includes(keyword) ||
                    item.Deskripsi?.toLowerCase().includes(keyword) ||
                    String(item.MataKuliahId).includes(keyword)
                );
            }
        });

        if (this.searchResults.length === 0) {
            this.renderEmptyState();
        } else {
            this.renderPage();
        }
    }

    renderEmptyState() {
        const container = document.getElementById('resultsContainer');
        const t = TRANSLATIONS[this.currentLang];
        if (container) {
            container.innerHTML = `
                <div class="text-center py-20 bg-[#0f172a]/50 rounded-3xl border border-dashed border-[var(--glass-border)]">
                    <i class="fa-solid fa-fish text-6xl text-[var(--accent-primary)] mb-4 animate-bounce"></i>
                    <p class="font-bold text-gray-400">${t.notFound}</p>
                </div>`;
        }
        document.getElementById('loadMoreBtn')?.classList.add('hidden');
    }

    renderPage() {
        const container = document.getElementById('resultsContainer');
        if (!container) return;

        const start = (this.currentPage - 1) * CONFIG.SEARCH_LIMIT;
        const end = start + CONFIG.SEARCH_LIMIT;
        const slice = this.searchResults.slice(start, end);
        const t = TRANSLATIONS[this.currentLang];

        slice.forEach((item, index) => {
            const card = this.createCourseCard(item, index * 0.05);
            container.appendChild(card);
        });

        const btn = document.getElementById('loadMoreBtn');
        if (btn) {
            if (end >= this.searchResults.length) {
                btn.classList.add('hidden');
            } else {
                btn.classList.remove('hidden');
                btn.querySelector('span').innerText = `${t.btnMore} (${this.searchResults.length - end})`;
            }
        }
    }

    createCourseCard(item, delay) {
        const t = TRANSLATIONS[this.currentLang];
        let strataClass = 'bg-gray-800 text-gray-300';
        if (item.Strata === 'S1') strataClass = 'bg-cyan-900/50 text-cyan-200 border-cyan-800';
        if (item.Strata === 'S2') strataClass = 'bg-rose-900/50 text-rose-200 border-rose-800';
        if (item.Strata === 'D3') strataClass = 'bg-orange-900/50 text-orange-200 border-orange-800';

        const card = document.createElement('div');
        card.className = 'island-card animate-enter';
        card.style.animationDelay = `${delay}s`;
        
        card.innerHTML = `
            <div class="falling-sand"></div>
            <div class="sand-pile"></div>
            <div class="p-6 md:p-8 relative z-20 content-layer">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <div class="flex gap-2 mb-2">
                            <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${strataClass}">${item.Strata || '-'}</span>
                            <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/20">ID: ${item.MataKuliahId}</span>
                        </div>
                        <h3 class="text-2xl font-black font-tech leading-tight mb-1">${item.Nama}</h3>
                        <div class="flex items-center gap-2 font-mono text-sm font-bold opacity-80">
                            <i class="fa-solid fa-tag"></i> ${item.Kode} 
                            <span class="opacity-50">|</span> 
                            <span>${item.SksNama}</span>
                        </div>
                    </div>
                    <div class="flex flex-col gap-2 shrink-0">
                        <button class="detail-trigger px-4 py-2 rounded-xl border border-white/30 hover:bg-white hover:text-black transition flex items-center gap-2 shadow-sm text-xs font-bold uppercase tracking-wider">
                            <i class="fa-solid fa-circle-info text-lg"></i> ${t.cardDetail}
                        </button>
                        <button class="schedule-trigger px-4 py-2 rounded-xl border border-white/30 hover:bg-white hover:text-black transition flex items-center gap-2 shadow-sm text-xs font-bold uppercase tracking-wider">
                            <i class="fa-solid fa-calendar-days text-lg"></i> ${t.cardSch}
                        </button>
                    </div>
                </div>

                <div class="detail-section hidden mt-4 bg-black/20 rounded-2xl p-4 border border-white/10 text-sm">
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-bold text-xs uppercase mb-2 opacity-60">${t.desc}</h4>
                            <div class="max-h-48 overflow-y-auto opacity-90 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                                ${item.Deskripsi || `<i class="opacity-50">${t.noDesc}</i>`}
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <div class="flex justify-between items-center mb-2">
                                <h4 class="font-bold text-xs uppercase opacity-60">${t.statsNilai}</h4>
                                <div class="chart-controls flex gap-1">
                                    <button class="chart-opt-btn active" data-type="bar">BAR</button>
                                    <button class="chart-opt-btn" data-type="doughnut">DONUT</button>
                                    <button class="chart-opt-btn" data-type="horizontal">100%</button>
                                </div>
                            </div>
                            <div class="relative flex-1 bg-black/20 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden min-h-[200px]">
                                <div id="chart-wrapper-${item.MataKuliahId}" class="chart-wrapper w-full h-full p-2 flex items-center justify-center">
                                    <span class="text-xs opacity-50 animate-pulse">Menghubungkan ke Satelit...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="schedule-section hidden mt-4 space-y-2">
                    ${(item.ListJadwal && item.ListJadwal.length > 0) ? item.ListJadwal.map(j => `
                        <div class="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/10 hover:border-white/40 transition group">
                            <div class="w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center font-bold border border-white/10 text-xs shrink-0 shadow-sm">
                                ${j.KelasParalel}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-[10px] font-bold opacity-60 uppercase tracking-wide flex items-center gap-2">
                                    <span class="bg-white/10 px-1.5 rounded">${j.JenisKelas}</span> #${j.JadwalKuliahId}
                                </div>
                                <div class="text-sm font-bold truncate mt-0.5">${j.Jadwal.join(', ')}</div>
                            </div>
                        </div>
                    `).join('') : `<div class="p-3 text-center text-xs italic opacity-50 bg-black/20 rounded-xl">Jadwal Kosong</div>`}
                </div>
            </div>
        `;

        // Attach listeners
        card.querySelector('.detail-trigger').onclick = () => this.toggleDetail(item.MataKuliahId, card);
        card.querySelector('.schedule-trigger').onclick = () => this.toggleSchedule(card);
        card.querySelectorAll('.chart-opt-btn').forEach(btn => {
            btn.onclick = () => this.renderChart(item.MataKuliahId, btn.dataset.type, btn);
        });

        return card;
    }

    toggleDetail(id, cardEl) {
        const section = cardEl.querySelector('.detail-section');
        section.classList.toggle('hidden');
        if (!section.classList.contains('hidden') && !this.chartStore[id]) {
            this.renderChart(id, 'bar');
        }
    }

    toggleSchedule(cardEl) {
        cardEl.querySelector('.schedule-section').classList.toggle('hidden');
    }

    async renderChart(id, type, btnEl) {
        const wrapper = document.getElementById(`chart-wrapper-${id}`);
        if (!wrapper) return;

        if (btnEl) {
            btnEl.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btnEl.classList.add('active');
        }

        try {
            if (this.chartStore[id]) this.chartStore[id].destroy();

            const data = await fetchGradeStats(id);
            const labels = data.map(d => d.HurufMutu);
            const values = data.map(d => d.Jumlah);

            wrapper.innerHTML = `<canvas id="canvas-${id}"></canvas>`;
            const ctx = document.getElementById(`canvas-${id}`).getContext('2d');
            
            const sandColors = ['#e6c288', '#d4b483', '#cba366', '#a88854', '#ef4444', '#991b1b', '#7f1d1d', '#57534e'];

            const config = {
                type: type === 'horizontal' ? 'bar' : type,
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Mahasiswa',
                        data: values,
                        backgroundColor: type === 'doughnut' ? sandColors : labels.map(l => (l === 'A' || l === 'AB') ? '#e6c288' : '#64748b'),
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            display: type === 'doughnut',
                            position: 'right',
                            labels: { color: '#fff', font: { size: 10 } }
                        },
                        datalabels: { display: type === 'doughnut', color: '#000' }
                    },
                    indexAxis: type === 'horizontal' ? 'y' : 'x',
                    scales: {
                        x: { display: type !== 'doughnut', grid: { display: false }, ticks: { color: '#fff' } },
                        y: { display: type !== 'doughnut', grid: { display: false }, ticks: { color: '#fff' } }
                    }
                }
            };

            this.chartStore[id] = new Chart(ctx, config);
        } catch (e) {
            wrapper.innerHTML = `<div class="text-xs text-center text-rose-400 font-bold p-4">Gagal memuat statistik.</div>`;
        }
    }

    loadMore() {
        this.currentPage++;
        this.renderPage();
    }
}

// Initialize the app
window.addEventListener('DOMContentLoaded', () => {
    window.App = new CourseIslandApp();
});
