export const CONFIG = {
    YEAR: "2026",
    SEMESTER: "genap",
    
    // Internal helper to resolve data path relative to this config file
    _resolveData: (year, semester, projectPath) => {
        return new URL(`../../data/${year}/${semester}/${projectPath}`, import.meta.url).pathname;
    },

    // Course Island
    TOTAL_FILES: 15,
    FILE_PREFIX: (year, semester) => CONFIG._resolveData(year, semester, 'course-island/db_matkul_'),
    SEARCH_LIMIT: 20,
    API_STATISTIK: (id) => `https://krs.ipb.ac.id/api/StatistikNilai?mataKuliahId=${id}`,

    // Living Jungle
    LIVING_JUNGLE_BASE: (year, semester) => CONFIG._resolveData(year, semester, 'living-jungle'),

    // Uni Galaxy
    GALAXY_BASE: (year, semester) => CONFIG._resolveData(year, semester, 'uni-galaxy')
};
