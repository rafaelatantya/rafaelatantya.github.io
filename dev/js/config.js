// Parse URL parameters for initial state
const urlParams = new URLSearchParams(window.location.search);
const initialYear = urlParams.get('y') || "2026";
const initialSemester = urlParams.get('s') || "genap";

export const CONFIG = {
    // Current Active State
    STATE: {
        YEAR: initialYear,
        SEMESTER: initialSemester
    },
    
    // Internal helper to resolve data path relative to this config file
    _resolveData: (year, semester, projectPath) => {
        return new URL(`../../data/${year}/${semester}/${projectPath}`, import.meta.url).pathname;
    },

    // Course Island
    TOTAL_FILES: 15,
    FILE_PREFIX: (year = CONFIG.STATE.YEAR, semester = CONFIG.STATE.SEMESTER) => new URL('../data/course-island/db_matkul_', import.meta.url).pathname,
    SEARCH_LIMIT: 20,
    API_STATISTIK: (id) => `https://krs.ipb.ac.id/api/StatistikNilai?mataKuliahId=${id}`,

    // Living Jungle
    LIVING_JUNGLE_BASE: (year = CONFIG.STATE.YEAR, semester = CONFIG.STATE.SEMESTER) => CONFIG._resolveData(year, semester, 'living-jungle'),

    // Uni Galaxy
    GALAXY_BASE: (year = CONFIG.STATE.YEAR, semester = CONFIG.STATE.SEMESTER) => CONFIG._resolveData(year, semester, 'uni-galaxy'),

    // MANIFEST API
    MANIFEST_URL: new URL(`../../data/manifest.json`, import.meta.url).pathname,

    // Reactivity
    updateState: (newYear, newSemester) => {
        CONFIG.STATE.YEAR = newYear;
        CONFIG.STATE.SEMESTER = newSemester;
        
        // Update URL to persist history without reloading page if possible
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('y', newYear);
        newUrl.searchParams.set('s', newSemester);
        window.history.pushState({}, '', newUrl);

        // Dispatch a custom event so applications can listen and re-render
        window.dispatchEvent(new CustomEvent('timeMachineUpdated', { 
            detail: { year: newYear, semester: newSemester } 
        }));
    }
};
