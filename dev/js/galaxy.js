import { CONFIG } from './config.js';
import { loadGalaxyData } from './parser.js';
import { injectTimeMachine } from './utils.js';

// SAFE DOM HELPER (PREVENTS CRASHES)
window.safeSetText = function(id, text) { const el = document.getElementById(id); if(el) el.innerText = text; }
window.safeSetHTML = function(id, html) { const el = document.getElementById(id); if(el) el.innerHTML = html; }
window.toggleUI = function(forceCollapse = false) { const ui = document.getElementById('ui-layer'); if (forceCollapse) ui.classList.add('collapsed'); else ui.classList.toggle('collapsed'); }
window.toggleBlock = function(id) { const el = document.getElementById(id); if(el) el.style.display = (el.style.display === 'none') ? 'block' : 'none'; }

// --- STARS ---
function createStars() { const c = document.getElementById('starsContainer'); for(let i=0; i<80; i++) { const s = document.createElement('div'); s.className = 'star'; const sz = Math.random()*2+1; s.style.width=sz+'px'; s.style.height=sz+'px'; s.style.left=Math.random()*100+'vw'; s.style.top=Math.random()*100+'vh'; s.style.animationDuration=(Math.random()*3+2)+'s'; s.style.animationDelay=Math.random()*5+'s'; c.appendChild(s); } } createStars();

// --- CORE ---
const GALAXY_CONFIG = { COLORS: { TARGET: '#FFD700', FRIEND_LOW: '#38bdf8', FRIEND_MID: '#c084fc', FRIEND_HIGH: '#f472b6', EDGE: '#334155' }, LIMITS: { MAX_NODES: 3000, TOP_FRIENDS_LIST: 50, TOP_HEATMAP: 100 } };
let DB = { students: [], courses: [], sc: [], cs: [] };
let renderer, graph, explorerChart, comparatorChart;
let currentMode = 'EXPLORER', currentTargetId = -1;
let activeCourses = [], compareIds = [], compExcludedCourses = new Set(), pathExcludedCourses = new Set();
let showLabels = true; 
let isMobile = window.innerWidth < 768;
let compSettings = isMobile ? { left: 0, bottom: 50, distance: 200 } : { left: 450, bottom: 50, distance: 300 };

// --- LOADER ---
let totalBytesLoaded = 0; const totalEstimatedSize = 8 * 1024 * 1024;
function updateGlobalProgress(chunkSize, startTime) {
    totalBytesLoaded += chunkSize; const pct = Math.min(99, Math.round((totalBytesLoaded / totalEstimatedSize) * 100));
    document.getElementById('progress-fill').style.width = pct + "%"; safeSetText('loader-pct', pct + "%");
    const duration = (Date.now() - startTime) / 1000; const speed = (totalBytesLoaded / 1024 / 1024) / (duration || 1); 
    safeSetText('loader-speed', speed.toFixed(1) + " MB/s");
}

async function init() {
    try {
        DB = await loadGalaxyData(updateGlobalProgress);
        document.getElementById('progress-fill').style.width = "100%"; safeSetText('loader-pct', "100%");
        setTimeout(() => { 
            document.getElementById('loader').style.display = 'none'; document.getElementById('search').disabled = false;
            if(isMobile) document.getElementById('mobile-warning').style.display = 'flex';
            injectTimeMachine();
        }, 500);
    } catch (e) { alert("Data Load Failed."); }
}

function resetUI() {
    if(renderer) { try { renderer.kill(); } catch(e){} renderer = null; }
    if(comparatorChart) { try{ comparatorChart.dispose(); } catch(e){} comparatorChart = null; }
    const container = document.getElementById('container'); if(container) container.innerHTML = '';
    document.getElementById('details-panel').style.display = 'none';
}

// --- EXPLORER ---
window.runSearch = function() {
    const query = document.getElementById('search').value; if(!query) return;
    const tId = DB.students.findIndex(l => l && l.toLowerCase().includes(query.toLowerCase()));
    if (tId === -1) { alert("Student Not Found"); return; }
    activeCourses = [];
    const rawCourses = DB.sc[tId] ? DB.sc[tId].split(',') : [];
    const filterContainer = document.getElementById('filter-list');
    if (filterContainer) {
        filterContainer.innerHTML = ''; 
        rawCourses.forEach(cEnc => {
            if(!cEnc) return; const cIdx = parseInt(cEnc, 36);
            if(DB.courses[cIdx]) { const [cName] = DB.courses[cIdx].split('|'); activeCourses.push(cIdx); filterContainer.innerHTML += `<div class="course-check"><input type="checkbox" id="chk-${cIdx}" checked onchange="updateActiveCourses()"><label style="flex-grow:1; cursor:pointer; margin-left:8px; font-size:11px;">${cName}</label></div>`; }
        });
        safeSetText('filter-header-txt', `FILTERS (${activeCourses.length})`);
    }
    resetUI(); currentTargetId = tId; currentMode = 'EXPLORER';
    window.toggleUI(true); window.renderGraph();
}
window.updateActiveCourses = function() { activeCourses = []; document.querySelectorAll('#filter-list input[type=checkbox]').forEach(chk => { if(chk.checked) activeCourses.push(parseInt(chk.id.split('-')[1])); }); }
window.toggleLabels = function() { showLabels = document.getElementById('show-labels-chk').checked; window.renderGraph(); }

window.renderGraph = function() {
    if(currentMode !== 'EXPLORER') return;
    if(currentTargetId === -1) { const inputVal = document.getElementById('search').value; if(inputVal) { window.runSearch(); return; } return; }
    safeSetText('ui-status', "RENDERING...");
    setTimeout(() => {
        resetUI(); 
        if(!DB.students[currentTargetId]) return;
        // @ts-ignore
        graph = new graphology.Graph();
        const [tName] = DB.students[currentTargetId].split('|');
        safeSetText('stat-target', "TARGET: " + tName);
        graph.addNode('CENTER', { label: tName, size: 25, color: GALAXY_CONFIG.COLORS.TARGET, x: 0, y: 0, zIndex: 100 });
        const friendCounts = new Map();
        activeCourses.forEach(cIdx => { if (DB.cs[cIdx]) { DB.cs[cIdx].split(',').forEach(sEnc => { const fid = parseInt(sEnc, 36); if (fid !== currentTargetId) friendCounts.set(fid, (friendCounts.get(fid) || 0) + 1); }); } });
        const minShared = parseInt(document.getElementById('shared-slider').value);
        const layoutMode = document.getElementById('layout-mode').value;
        const sortedFriends = Array.from(friendCounts.entries()).sort((a,b) => b[1] - a[1]);
        renderExplorerMatrix(sortedFriends);
        const lbContainer = document.getElementById('leaderboard-list'); if(lbContainer) lbContainer.innerHTML = ''; 
        let nodeCount = 0;
        sortedFriends.forEach(([fid, count], idx) => {
            if (!DB.students[fid]) return;
            if (idx < GALAXY_CONFIG.LIMITS.TOP_FRIENDS_LIST && lbContainer) {
                const [fName] = DB.students[fid].split('|');
                lbContainer.innerHTML += `<div class="friend-rank" onclick="showDetails(${fid})"><span>#${idx+1} ${fName}</span> <span class="badge">${count}</span></div>`;
            }
            if (count >= minShared && nodeCount < GALAXY_CONFIG.LIMITS.MAX_NODES) {
                const [fName] = DB.students[fid].split('|');
                let color = GALAXY_CONFIG.COLORS.FRIEND_LOW; let size = 5;
                if(count >= 3) { color = GALAXY_CONFIG.COLORS.FRIEND_MID; size = 8; } if(count >= 5) { color = GALAXY_CONFIG.COLORS.FRIEND_HIGH; size = 12; }
                let x = 0, y = 0;
                if (layoutMode === 'GALAXY') { const angle = idx * 2.399; const r = 10 * Math.sqrt(idx + 1) + 40; x = Math.cos(angle) * r; y = Math.sin(angle) * r; }
                else if (layoutMode === 'SPIRAL') { const angle = idx * 0.5; const r = 40 + (5 * Math.sqrt(idx * 10)); x = Math.cos(angle) * r; y = Math.sin(angle) * r; }
                else { const angle = (idx / Math.min(sortedFriends.length, 3000)) * Math.PI * 2; x = Math.cos(angle) * 300; y = Math.sin(angle) * 300; }
                graph.addNode(`f${fid}`, { label: fName, size: size, color: color, x: x, y: y });
                graph.addEdge('CENTER', `f${fid}`, { size: count * 0.5, color: '#334155' });
                nodeCount++;
            }
        });
        safeSetText('stat-nodes', "NODES: " + (nodeCount + 1)); safeSetText('ui-status', "ONLINE");
        startSigma();
    }, 10);
}

function renderExplorerMatrix(sortedFriends) {
    const topN = sortedFriends.slice(0, GALAXY_CONFIG.LIMITS.TOP_HEATMAP).map(x => x[0]); 
    const dom = document.getElementById('explorer-chart'); if(explorerChart) try { explorerChart.dispose(); } catch(e){}
    const data = []; let maxVal = 0;
    const names = topN.map(fid => DB.students[fid] ? DB.students[fid].split('|')[0].split(' ')[0] : '?');
    const activeSet = new Set(activeCourses);
    topN.forEach((rid, i) => { topN.forEach((cid, j) => { if (i === j) return; const setA = new Set(DB.sc[rid].split(',')); const setB = new Set(DB.sc[cid].split(',')); const count = [...setA].filter(x => { const id = parseInt(x, 36); return setB.has(x) && activeSet.has(id); }).length; if (count > 0) { data.push([i, j, count]); if(count > maxVal) maxVal = count; } }); });
    explorerChart = echarts.init(dom, 'dark');
    explorerChart.setOption({ backgroundColor: '#00000000', tooltip: { formatter: (p) => `${names[p.value[0]]} & ${names[p.value[1]]}: ${p.value[2]}` }, visualMap: { max: Math.max(maxVal, 5), inRange: { color: ['#0f172a', '#38bdf8', '#c084fc', '#f472b6'] }, show: false }, xAxis3D: { type: 'category', data: names, show: false }, yAxis3D: { type: 'category', data: names, show: false }, zAxis3D: { type: 'value', axisLine:{lineStyle:{color:'#555'}} }, grid3D: { boxWidth: 200, boxDepth: 200, viewControl: { autoRotate: true, distance: 280 } }, series: [{ type: 'bar3D', data: data, shading: 'lambert', itemStyle: { opacity: 0.9 } }] });
    window.addEventListener('resize', explorerChart.resize);
}

// --- COMPARATOR ---
window.addCompare = function() { 
    const val = document.getElementById('comp-input').value; const fid = DB.students.findIndex(l => l && l.toLowerCase().includes(val.toLowerCase()));
    if(fid !== -1 && !compareIds.includes(fid)) { compareIds.push(fid); const name = DB.students[fid].split('|')[0]; document.getElementById('compare-list').innerHTML += `<div class="course-check" style="justify-content:space-between"><span>${name}</span> <span onclick="removeCompare(${fid}, this)" style="cursor:pointer;color:var(--accent-pink);font-weight:bold">×</span></div>`; document.getElementById('comp-input').value = ''; } else { alert("User not found / already added"); }
}
window.removeCompare = function(fid, el) { compareIds = compareIds.filter(id => id !== fid); el.parentNode.remove(); }
window.runSmartComparator = function() {
    if(compareIds.length < 2) { alert("Min 2 people required"); return; }
    resetUI(); currentMode = 'COMPARATOR'; window.toggleUI(true);
    const filterCont = document.getElementById('comp-filter-list');
    if(filterCont && (filterCont.innerHTML === '' || compExcludedCourses.size > 0)) {
        const allCourses = new Set(); compareIds.forEach(fid => DB.sc[fid].split(',').forEach(c => { if(c) allCourses.add(parseInt(c, 36)); }));
        filterCont.innerHTML = ''; document.getElementById('comp-filter-area').classList.remove('hidden'); compExcludedCourses.clear();
        allCourses.forEach(cIdx => { if(DB.courses[cIdx]) { const [cName] = DB.courses[cIdx].split('|'); filterCont.innerHTML += `<div class="course-check"><input type="checkbox" checked onchange="toggleCompCourse(${cIdx}, this.checked)"><label style="flex-grow:1">${cName}</label></div>`; } });
    }
    renderComparatorVisuals();
}
window.toggleCompCourse = function(cIdx, isChecked) { if(isChecked) compExcludedCourses.delete(cIdx); else compExcludedCourses.add(cIdx); renderComparatorVisuals(); }
window.updateCompViewMode = function() {
    const mode = document.getElementById('comp-view-mode').value;
    const c2d = document.getElementById('comp-2d-controls'); const c3d = document.getElementById('comp-3d-controls');
    if(mode === 'HEATMAP_2D') { c2d.classList.remove('hidden'); c3d.classList.add('hidden'); } else if(mode === 'HEATMAP_3D') { c2d.classList.add('hidden'); c3d.classList.remove('hidden'); } else { c2d.classList.add('hidden'); c3d.classList.add('hidden'); }
}
window.updateCompLayout = function(prop, val) { compSettings[prop] = parseInt(val); if(comparatorChart) { const mode = document.getElementById('comp-view-mode').value; if(mode === 'HEATMAP_2D') comparatorChart.setOption({ grid: { left: compSettings.left, bottom: compSettings.bottom } }); else if(mode === 'HEATMAP_3D') comparatorChart.setOption({ grid3D: { viewControl: { distance: compSettings.distance } } }); } }
function renderComparatorVisuals() {
    const viewType = document.getElementById('comp-view-mode').value; const container = document.getElementById('container'); container.innerHTML = ''; window.updateCompViewMode();
    if(comparatorChart) try{ comparatorChart.dispose(); }catch(e){}
    const names = compareIds.map(fid => DB.students[fid].split('|')[0].split(' ')[0]);
    if(isMobile && compSettings.left === 450) compSettings.left = 0;
    if (viewType === 'HEATMAP_2D') {
        safeSetText('stat-target', "MODE: 2D HEATMAP"); comparatorChart = echarts.init(container, 'dark');
        const data = []; let max = 0; compareIds.forEach((rid, i) => compareIds.forEach((cid, j) => { if(i === j) { data.push([i, j, 0]); return; } const setA = new Set(DB.sc[rid].split(',')), setB = new Set(DB.sc[cid].split(',')); const count = [...setA].filter(x => { const id=parseInt(x,36); return setB.has(x) && !compExcludedCourses.has(id); }).length; if(count > max) max = count; data.push([i, j, count]); }));
        comparatorChart.setOption({ backgroundColor: '#0B0E14', tooltip: { position: 'top' }, grid: { height: '75%', top: '10%', right: '5%', left: compSettings.left, bottom: compSettings.bottom }, xAxis: { type: 'category', data: names, splitArea: { show: true }, axisLabel: {rotate:45, fontSize:10} }, yAxis: { type: 'category', data: names, splitArea: { show: true }, axisLabel: {fontSize:10} }, visualMap: { min: 0, max: max, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', inRange: { color: ['#0f172a', '#f472b6'] } }, series: [{ type: 'heatmap', data: data, label: { show: true, fontSize: 10 } }] });
    } else if (viewType === 'HEATMAP_3D') {
        safeSetText('stat-target', "MODE: 3D ORBIT"); comparatorChart = echarts.init(container, 'dark');
        const data = []; compareIds.forEach((rid, i) => compareIds.forEach((cid, j) => { if(i === j) return; const setA = new Set(DB.sc[rid].split(',')), setB = new Set(DB.sc[cid].split(',')); const count = [...setA].filter(x => setB.has(x) && !compExcludedCourses.has(parseInt(x, 36))).length; if(count > 0) data.push([i, j, count]); }));
        comparatorChart.setOption({ backgroundColor: '#0B0E14', tooltip: {}, visualMap: { max: 10, inRange: { color: [GALAXY_CONFIG.COLORS.FRIEND_LOW, GALAXY_CONFIG.COLORS.FRIEND_HIGH] } }, xAxis3D: { type: 'category', data: names, axisLabel: {rotate:45, fontSize:10} }, yAxis3D: { type: 'category', data: names, axisLabel: {rotate: -45, fontSize:10} }, zAxis3D: { type: 'value' }, grid3D: { boxWidth: 200, boxDepth: 200, left: '55%', width: '40%', viewControl: { autoRotate: true, distance: compSettings.distance } }, series: [{ type: 'bar3D', data: data, shading: 'lambert', itemStyle: { opacity: 0.9 } }] });
    } else {
        safeSetText('stat-target', "MODE: NETWORK");
        // @ts-ignore
        graph = new graphology.Graph();
        compareIds.forEach((fid, i) => { const angle = (i/compareIds.length)*Math.PI*2; graph.addNode(`c${fid}`, {label:DB.students[fid].split('|')[0], size:15, color:GALAXY_CONFIG.COLORS.FRIEND_MID, x:Math.cos(angle)*150, y:Math.sin(angle)*150}); });
        for(let i=0; i<compareIds.length; i++) { for(let j=i+1; j<compareIds.length; j++) { const setA = new Set(DB.sc[compareIds[i]].split(',')), setB = new Set(DB.sc[compareIds[j]].split(',')); const count = [...setA].filter(x => { const id = parseInt(x, 36); return setB.has(x) && !compExcludedCourses.has(id); }).length; if(count > 0) graph.addEdge(`c${compareIds[i]}`, `c${compareIds[j]}`, {color:'#555', size:count}); } }
        startSigma();
    }
}

// --- PATHFINDER ---
window.resetPathBtn = function() { const btn = document.getElementById('btn-path-action'); btn.innerHTML = '<i class="ph-bold ph-magnifying-glass"></i> FIND CONNECTION'; btn.style.background = "var(--accent-cyan)"; pathExcludedCourses.clear(); document.getElementById('path-filter-container').classList.add('hidden'); }
window.runPathfinder = async function() {
    const startName = document.getElementById('path-start').value; const endName = document.getElementById('path-end').value; if(!startName || !endName) return;
    const startId = DB.students.findIndex(l => l && l.toLowerCase().includes(startName.toLowerCase())); const endId = DB.students.findIndex(l => l && l.toLowerCase().includes(endName.toLowerCase()));
    if(startId === -1 || endId === -1) { alert("Student not found."); return; } if(startId === endId) { alert("Same person."); return; }
    resetUI(); currentMode = 'PATHFINDER'; safeSetHTML('path-results', '<div style="text-align:center; color:#EAB308; font-family:var(--font-tech)">TRACING NETWORK SIGNALS...</div>'); safeSetText('ui-status', "TRACING...");
    setTimeout(() => {
        const path = findPathBFS(startId, endId);
        if (!path) { safeSetHTML('path-results', '<div style="text-align:center; color:#E91E63; font-family:var(--font-tech)">NO CONNECTION WITHIN 6 HOPS</div>'); safeSetText('ui-status', "NOT FOUND"); if(document.getElementById('btn-path-action').innerText.includes("UPDATE")) document.getElementById('path-filter-container').classList.remove('hidden'); return; }
        const btn = document.getElementById('btn-path-action'); btn.innerHTML = '<i class="ph-bold ph-arrows-clockwise"></i> UPDATE PATH'; btn.style.background = "var(--accent-pink)";
        window.toggleUI(true); renderPathFilterUI(path); renderPathVisuals(path);
    }, 50);
}
function findPathBFS(start, end) {
    if(start === end) return [start]; let queue = [start]; let visited = new Map(); visited.set(start, 0); let predecessors = new Map(); let head = 0;
    while(head < queue.length) { if(queue.length > 50000) return null; const curr = queue[head++]; const depth = visited.get(curr); if (depth >= 6) continue; if (curr === end) { let path = [end]; let temp = end; while(temp !== start) { temp = predecessors.get(temp); path.unshift(temp); } return path; } const myCourses = DB.sc[curr].split(','); for (let cEnc of myCourses) { if (!cEnc) continue; const cIdx = parseInt(cEnc, 36); if (pathExcludedCourses.has(cIdx)) continue; if (DB.cs[cIdx]) { const peers = DB.cs[cIdx].split(','); for (let pEnc of peers) { const pId = parseInt(pEnc, 36); if (!visited.has(pId)) { visited.set(pId, depth + 1); predecessors.set(pId, curr); queue.push(pId); if(pId === end) { let path = [end]; let temp = end; while(temp !== start) { temp = predecessors.get(temp); path.unshift(temp); } return path; } } } } } } return null;
}
function renderPathFilterUI(path) { const container = document.getElementById('path-filter-container'); const list = document.getElementById('path-filter-list'); container.classList.remove('hidden'); list.innerHTML = ''; const usedCourses = new Set(); for(let i=0; i<path.length-1; i++) { const u = path[i]; const v = path[i+1]; const shared = getSharedCoursesIdx(u, v); shared.forEach(c => usedCourses.add(c)); } usedCourses.forEach(cIdx => { const [cName] = DB.courses[cIdx].split('|'); const isChecked = !pathExcludedCourses.has(cIdx); list.innerHTML += `<div class="course-check"><input type="checkbox" id="pathchk-${cIdx}" ${isChecked ? 'checked' : ''} onchange="togglePathCourse(${cIdx}, this.checked)"><label for="pathchk-${cIdx}" style="flex-grow:1; cursor:pointer;">${cName}</label></div>`; }); }
window.togglePathCourse = function(cIdx, isChecked) { if(isChecked) pathExcludedCourses.delete(cIdx); else pathExcludedCourses.add(cIdx); }
function getSharedCoursesIdx(idA, idB) { const setA = new Set(DB.sc[idA].split(',')); const setB = new Set(DB.sc[idB].split(',')); const shared = []; setA.forEach(c => { if(setB.has(c)) shared.push(parseInt(c, 36)); }); return shared; }
function getSharedCoursesNames(idA, idB) { const idxs = getSharedCoursesIdx(idA, idB); const valid = idxs.filter(c => !pathExcludedCourses.has(c)); return valid.map(c => DB.courses[c].split('|')[0]); }
function renderPathVisuals(path) {
    const resultsDiv = document.getElementById('path-results'); resultsDiv.innerHTML = '';
    path.forEach((nodeId, idx) => { const name = DB.students[nodeId].split('|')[0]; let className = 'path-step'; if(idx === 0) className += ' start'; else if(idx === path.length - 1) className += ' end'; else className += ' mid'; let connectionInfo = ''; if(idx > 0) { const prevId = path[idx-1]; const sharedNames = getSharedCoursesNames(prevId, nodeId); connectionInfo = `<div class="path-arrow">↓ Connected via ${sharedNames.length} courses</div><div class="path-courses">${sharedNames.slice(0, 3).join(', ')} ${sharedNames.length > 3 ? `+${sharedNames.length-3} more` : ''}</div>`; } resultsDiv.innerHTML += `<div class="${className}" style="animation-delay: ${idx * 0.1}s"><div style="font-weight:bold; font-size:12px; color:#fff">${name}</div>${connectionInfo}</div>`; });
    if(renderer) try { renderer.kill(); } catch(e){} document.getElementById('container').innerHTML = '';
    // @ts-ignore
    graph = new graphology.Graph();
    safeSetText('stat-target', `PATH LENGTH: ${path.length - 1}`); safeSetText('stat-nodes', `NODES: ${path.length}`); safeSetText('ui-status', "PATH SECURED");
    path.forEach((nodeId, idx) => { const name = DB.students[nodeId].split('|')[0]; let color = GALAXY_CONFIG.COLORS.FRIEND_MID; let size = 20; if(idx === 0) { color = GALAXY_CONFIG.COLORS.FRIEND_LOW; size = 25; } else if(idx === path.length - 1) { color = GALAXY_CONFIG.COLORS.FRIEND_HIGH; size = 25; } const x = (idx * 200) - ((path.length * 200) / 2); graph.addNode(`p${nodeId}`, { label: name, size: size, color: color, x: x, y: 0 }); if(idx > 0) graph.addEdge(`p${path[idx-1]}`, `p${nodeId}`, { size: 4, color: '#475569' }); });
    // @ts-ignore
    renderer = new Sigma(graph, document.getElementById('container'), { renderEdgeLabels: false, labelColor: { color: "#fff" }, labelFont: "Inter, sans-serif", hoverRenderer: (context, data, settings) => { const size = settings.labelSize; const font = settings.labelFont; const weight = settings.labelWeight; context.font = `${weight} ${size}px ${font}`; const width = context.measureText(data.label).width + 10; context.beginPath(); context.arc(data.x, data.y, data.size + 8, 0, Math.PI * 2); context.fillStyle = 'rgba(255, 255, 255, 0.1)'; context.fill(); context.fillStyle = data.color; context.beginPath(); context.arc(data.x, data.y, data.size, 0, Math.PI * 2); context.fill(); context.fillStyle = '#000'; context.fillRect(data.x + data.size + 3, data.y - size/1.5, width, size + 5); context.fillStyle = '#fff'; context.fillText(data.label, data.x + data.size + 8, data.y + size/3); } });
    renderer.getCamera().animate({ x: 0, y: 0, ratio: 1.2 }, { duration: 500 });
    renderer.on('clickNode', ({ node }) => { if(currentMode!=='COMPARATOR') window.showDetails(parseInt(node.substring(1))); });
}

// --- COMMON ---
function startSigma() {
    // @ts-ignore
    renderer = new Sigma(graph, document.getElementById('container'), { renderEdgeLabels: false, labelDensity: 0.05, labelColor: { color: "#fff" }, labelFont: "Inter, sans-serif", renderLabels: showLabels, hoverRenderer: (context, data, settings) => { const size = settings.labelSize; const font = settings.labelFont; const weight = settings.labelWeight; context.font = `${weight} ${size}px ${font}`; const width = context.measureText(data.label).width + 10; context.fillStyle = '#fff'; context.beginPath(); context.arc(data.x, data.y, data.size + 5, 0, Math.PI * 2); context.fill(); context.fillRect(data.x + data.size + 3, data.y - size/1.5, width, size + 5); context.fillStyle = '#000'; context.fillText(data.label, data.x + data.size + 8, data.y + size/3); } });
    renderer.on('clickNode', ({ node }) => { if(currentMode!=='COMPARATOR' && node!=='CENTER') window.showDetails(parseInt(node.substring(1))); });
}
window.showDetails = function(fid) {
    const container = document.getElementById('detail-content'); container.innerHTML = '';
    safeSetText('detail-title', DB.students[fid].split('|')[0]); document.getElementById('details-panel').style.display = 'flex';
    if(currentMode === 'EXPLORER' && currentTargetId !== -1) {
        const targetSet = new Set(DB.sc[currentTargetId].split(',')); const activeSet = new Set(activeCourses); const friendCourses = DB.sc[fid].split(','); const mActive=[], mHidden=[], mUnique=[];
        friendCourses.forEach(cEnc => { if(!cEnc) return; const cIdx = parseInt(cEnc, 36); if(DB.courses[cIdx]) { const cData = DB.courses[cIdx].split('|'); const obj = {name:cData[0], sks:cData[2]}; if(targetSet.has(cEnc)) { if(activeSet.has(cIdx)) mActive.push(obj); else mHidden.push(obj); } else mUnique.push(obj); } });
        if(mActive.length) { container.innerHTML += `<div class="section-title">SHARED COURSES (${mActive.length})</div>`; mActive.forEach(c=>container.innerHTML+=`<div class="course-card card-active"><div>${c.name}</div><div style="font-size:9px; color:var(--text-muted)">${c.sks}</div><span class="tag-match">MATCH</span></div>`); }
        if(mHidden.length) { container.innerHTML += `<div class="section-title">SHARED (HIDDEN)</div>`; mHidden.forEach(c=>container.innerHTML+=`<div class="course-card"><div>${c.name}</div><div style="font-size:9px; color:var(--text-muted)">${c.sks}</div></div>`); }
        if(mUnique.length) { container.innerHTML += `<div class="section-title">OTHER COURSES</div>`; mUnique.forEach(c=>container.innerHTML+=`<div class="course-card card-unique"><div>${c.name}</div><div style="font-size:9px; color:var(--text-muted)">${c.sks}</div></div>`); }
    } else { container.innerHTML += `<div class="section-title">ENROLLED COURSES</div>`; const courses = DB.sc[fid].split(','); courses.forEach(cEnc => { if(!cEnc) return; const cIdx = parseInt(cEnc, 36); if(DB.courses[cIdx]) { const cData = DB.courses[cIdx].split('|'); container.innerHTML += `<div class="course-card"><div>${cData[0]}</div><div style="font-size:9px; color:var(--text-muted)">${cData[2]}</div></div>`; } }); }
}
window.switchTab = function(tab) { resetUI(); if(explorerChart) try{ explorerChart.dispose(); explorerChart=null; }catch(e){} document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); event.target.classList.add('active'); document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active')); document.getElementById(`view-${tab}`).classList.add('active'); }
window.toggleAllFilters = function(s) { document.querySelectorAll('#filter-list input').forEach(c => c.checked = s); window.updateActiveCourses(); }

document.getElementById('search').addEventListener('keypress', (e) => { if(e.key==='Enter') window.runSearch() });
document.getElementById('comp-input').addEventListener('keypress', (e) => { if(e.key==='Enter') window.addCompare() });
document.getElementById('path-end').addEventListener('keypress', (e) => { if(e.key==='Enter') window.runPathfinder() });

init();
