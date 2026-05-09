export let chartInstance = null;
export let currentChartType = 'heatmap';

export function setChartType(type) {
    currentChartType = type;
}

export function getChartColors() {
    const style = getComputedStyle(document.body);
    return {
        text: style.getPropertyValue('--text-muted').trim(),
        accent: style.getPropertyValue('--accent-primary').trim(),
        grid: style.getPropertyValue('--glass-border').trim()
    };
}

export function updateChartTheme() {
    if(!chartInstance) return;
    const colors = getChartColors();
    chartInstance.updateOptions({
        chart: { foreColor: colors.text },
        colors: [colors.accent],
        grid: { borderColor: colors.grid },
        xaxis: { labels: { style: { colors: colors.text } } },
        yaxis: { labels: { style: { colors: colors.text } } }
    });
}

export function renderChart(globalStatsData, currentTheme) {
    if (!globalStatsData) return;
    if (chartInstance) chartInstance.destroy();

    const colors = getChartColors();
    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']; 
    const hours = Array.from({length: 15}, (_, i) => i + 7);

    let options = {
        chart: { type: 'heatmap', height: '100%', fontFamily: 'Space Grotesk, sans-serif', background: 'transparent', toolbar: { show: false }, animations: { enabled: true } },
        theme: { mode: currentTheme },
        colors: [colors.accent],
        grid: { borderColor: colors.grid, strokeDashArray: 4 },
        dataLabels: { enabled: false },
        stroke: { width: 0 },
        xaxis: { type: 'category', categories: hours.map(h => `${h}:00`), tooltip: { enabled: false }, axisBorder: { show: false }, axisTicks: { show: false } }
    };

    if (currentChartType === 'heatmap') {
        options.chart.type = 'heatmap';
        options.series = days.map(day => ({
            name: day.toUpperCase(),
            data: hours.map(h => ({ x: `${h}`, y: globalStatsData.heatmap[day] ? (globalStatsData.heatmap[day][h] || 0) : 0 }))
        })).reverse();
        options.plotOptions = { heatmap: { shadeIntensity: 0.5, radius: 4, colorScale: { ranges: [{ from: 0, to: 30, color: '#22c55e' }, { from: 31, to: 70, color: '#f97316' }, { from: 71, to: 100, color: '#ef4444' }] } } };
    } 
    else if (currentChartType === 'line') {
        options.chart.type = 'line';
        options.stroke = { curve: 'smooth', width: 2 };
        options.series = days.map(day => ({ name: day.toUpperCase(), data: hours.map(h => globalStatsData.heatmap[day] ? (globalStatsData.heatmap[day][h] || 0) : 0) }));
        options.colors = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ef4444', '#eab308'];
    }
    else if (currentChartType === 'bar') {
        options.chart.type = 'bar';
        const dayLoad = days.map(day => {
            let sum = 0, count = 0;
            hours.forEach(h => { if(globalStatsData.heatmap[day] && globalStatsData.heatmap[day][h]) { sum += globalStatsData.heatmap[day][h]; count++; } });
            return count > 0 ? Math.round(sum / count) : 0;
        });
        options.series = [{ name: 'Avg Load %', data: dayLoad }];
        options.xaxis.categories = days.map(d => d.toUpperCase());
        options.plotOptions = { bar: { borderRadius: 4, columnWidth: '50%' } };
    }
    options.chart.foreColor = colors.text;
    const chartEl = document.querySelector("#chartContainer");
    chartEl.innerHTML = "";
    // Note: ApexCharts is expected to be available globally
    chartInstance = new ApexCharts(chartEl, options);
    chartInstance.render();
}
