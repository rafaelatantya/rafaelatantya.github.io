export const CONFIG = {
    YEAR: "2026",
    SEMESTER: "genap",
    TOTAL_FILES: 15,
    FILE_PREFIX: (year, semester) => `../data/${year}/${semester}/course-island/db_matkul_`,
    SEARCH_LIMIT: 20,
    API_STATISTIK: (id) => `https://krs.ipb.ac.id/api/StatistikNilai?mataKuliahId=${id}`
};
