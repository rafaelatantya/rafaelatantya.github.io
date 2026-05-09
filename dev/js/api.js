import { CONFIG } from './config.js';

export async function fetchCourseDatabase(onProgress, year = CONFIG.STATE.YEAR, semester = CONFIG.STATE.SEMESTER) {
    const allData = [];
    const startTime = Date.now();
    let totalBytes = 0;
    const prefix = CONFIG.FILE_PREFIX(year, semester);

    for (let i = 1; i <= CONFIG.TOTAL_FILES; i++) {
        const fileName = `${prefix}${i}.json`;
        try {
            const response = await fetch(fileName);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            const blob = await response.blob();
            totalBytes += blob.size;
            
            const text = await blob.text();
            const json = JSON.parse(text);
            
            for (const item of json) {
                const finalItem = item.Details ? item.Details : item;
                if (finalItem) allData.push(finalItem);
            }

            const elapsed = (Date.now() - startTime) / 1000;
            const speed = (totalBytes / 1024) / (elapsed || 1);
            
            if (onProgress) {
                onProgress({
                    current: i,
                    total: CONFIG.TOTAL_FILES,
                    progress: (i / CONFIG.TOTAL_FILES) * 100,
                    speed: Math.round(speed)
                });
            }
        } catch (err) {
            console.error(`Failed to load ${fileName}:`, err);
        }
    }
    return allData;
}

export async function fetchGradeStats(mkId) {
    const response = await fetch(CONFIG.API_STATISTIK(mkId));
    if (!response.ok) throw new Error('Failed to fetch stats');
    const data = await response.json();
    
    const order = ['A', 'AB', 'B', 'BC', 'C', 'D', 'E', 'BL'];
    return data.sort((a, b) => order.indexOf(a.HurufMutu) - order.indexOf(b.HurufMutu));
}

// --- MANIFEST API ---
export async function fetchManifest() {
    const response = await fetch(CONFIG.MANIFEST_URL);
    if (!response.ok) throw new Error('Failed to fetch manifest');
    return response.json();
}

// --- LIVING JUNGLE API ---
export async function fetchLivingJungleStats(year = CONFIG.STATE.YEAR, semester = CONFIG.STATE.SEMESTER) {
    const url = `${CONFIG.LIVING_JUNGLE_BASE(year, semester)}/stats.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Stats fetch failed");
    return res.json();
}

export async function fetchLivingJungleGlobalIndex(year = CONFIG.STATE.YEAR, semester = CONFIG.STATE.SEMESTER) {
    const url = `${CONFIG.LIVING_JUNGLE_BASE(year, semester)}/global_index.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Global Index fetch failed");
    return res.json();
}

export async function fetchLivingJungleBatch(batchKey, year = CONFIG.STATE.YEAR, semester = CONFIG.STATE.SEMESTER) {
    const url = `${CONFIG.LIVING_JUNGLE_BASE(year, semester)}/batch/${batchKey}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Batch 404");
    return res.json();
}

export async function fetchLivingJungleMatkul(prefix, onProgress, year = CONFIG.STATE.YEAR, semester = CONFIG.STATE.SEMESTER) {
    const url = `${CONFIG.LIVING_JUNGLE_BASE(year, semester)}/matkul/${prefix}.json`;
    const startTime = Date.now(); 
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const contentLength = response.headers.get('content-length'); 
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let loaded = 0; 
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while(true) {
        const { done, value } = await reader.read();
        if (done) break;
        loaded += value.byteLength;
        result += decoder.decode(value, { stream: true });
        
        const elapsedTime = (Date.now() - startTime) / 1000; 
        const kbps = ((loaded / elapsedTime) / 1024).toFixed(0); 
        const percent = total ? Math.round((loaded / total) * 100) : 0; 
        if (onProgress) onProgress(percent, `${kbps} Kbps`);
    }
    return JSON.parse(result);
}
