import { CONFIG } from './config.js';

export async function fetchCourseDatabase(onProgress) {
    const allData = [];
    const startTime = Date.now();
    let totalBytes = 0;
    const prefix = CONFIG.FILE_PREFIX(CONFIG.YEAR, CONFIG.SEMESTER);

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
