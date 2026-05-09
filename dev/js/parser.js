import { CONFIG } from './config.js';

export async function fetchWithProgress(url, onProgress, totalEstimatedSize = 8 * 1024 * 1024) {
    try {
        const start = Date.now(); 
        const response = await fetch(url);
        if (!response.ok) throw new Error("404");
        
        // We use totalEstimatedSize / 4 as a fallback because we fetch 4 files
        let loaded = 0; 
        const reader = response.body.getReader(); 
        const chunks = [];
        
        while(true) { 
            const {done, value} = await reader.read(); 
            if (done) break; 
            chunks.push(value); 
            loaded += value.length; 
            
            if (onProgress) {
                onProgress(value.length, start);
            }
        }
        let chunksAll = new Uint8Array(loaded); 
        let position = 0;
        for(let chunk of chunks) { 
            chunksAll.set(chunk, position); 
            position += chunk.length; 
        }
        return new TextDecoder("utf-8").decode(chunksAll);
    } catch (e) { 
        console.error(e); 
        return ""; 
    }
}

export async function loadGalaxyData(onProgress) {
    const base = CONFIG.GALAXY_BASE(CONFIG.YEAR, CONFIG.SEMESTER);
    const paths = {
        students: `${base}/meta_students.dsv`,
        courses: `${base}/meta_courses.dsv`,
        graphSC: `${base}/graph_s_c.dsv`,
        graphCS: `${base}/graph_c_s.dsv`
    };

    const [sT, cT, scT, csT] = await Promise.all([
        fetchWithProgress(paths.students, onProgress),
        fetchWithProgress(paths.courses, onProgress),
        fetchWithProgress(paths.graphSC, onProgress),
        fetchWithProgress(paths.graphCS, onProgress)
    ]);

    if (!sT || !cT) throw new Error("Data Missing");
    
    return {
        students: sT.split('\n'),
        courses: cT.split('\n'),
        sc: scT.split('\n'),
        cs: csT.split('\n')
    };
}
