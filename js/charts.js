// charts.js - Графики на реальных данных API-Ninjas + OpenWeatherMap
// ИСТОРИЯ БЕРЁТСЯ ИЗ НАКОПЛЕННЫХ ЗАМЕРОВ

let airQualityChart = null;
let trafficChart = null;

// ------------------ ГРАФИК КАЧЕСТВА ВОЗДУХА (УЛУЧШЕННЫЙ) ------------------
async function initAirQualityChart() {
    const canvas = document.getElementById('airQualityChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Получаем историю из WeatherAPI
    const historyData = window.WeatherAPI.getAQIHistory();
    let hours = historyData?.hours || [];
    let aqiData = historyData?.aqiData || [];

    // Если данных нет, показываем заглушку
    if (hours.length === 0) {
        hours = ['00:00', '06:00', '12:00', '18:00'];
        aqiData = [50, 50, 50, 50];
    }

    // Определяем цвет линии в зависимости от последнего значения AQI
    const lastAQI = aqiData[aqiData.length - 1] || 65;
    let lineColor = '#10b981'; // хороший
    if (lastAQI > 100) lineColor = '#ef4444'; // опасный
    else if (lastAQI > 50) lineColor = '#f59e0b'; // умеренный

    // Уничтожаем старый график, если есть
    if (airQualityChart) airQualityChart.destroy();

    airQualityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Индекс качества воздуха (AQI)',
                data: aqiData,
                borderColor: lineColor,
                backgroundColor: function(context) {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
                    gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
                    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
                    return gradient;
                },
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: function(context) {
                    const value = context.dataset.data[context.dataIndex];
                    if (value <= 50) return '#10b981';
                    if (value <= 100) return '#f59e0b';
                    return '#ef4444';
                },
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            label += context.raw + ' AQI';
                            return label;
                        },
                        afterLabel: (context) => {
                            const value = context.raw;
                            if (value <= 50) return '👍 Хорошее качество';
                            if (value <= 100) return '👌 Умеренное';
                            if (value <= 150) return '⚠️ Нездоровое для чувствительных групп';
                            return '🔥 Опасное';
                        }
                    }
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 50,
                            yMax: 50,
                            borderColor: '#10b981',
                            borderWidth: 1,
                            borderDash: [6, 6],
                            label: {
                                content: 'Хороший',
                                enabled: true,
                                position: 'right'
                            }
                        },
                        line2: {
                            type: 'line',
                            yMin: 100,
                            yMax: 100,
                            borderColor: '#f59e0b',
                            borderWidth: 1,
                            borderDash: [6, 6],
                            label: {
                                content: 'Умеренный',
                                enabled: true,
                                position: 'right'
                            }
                        },
                        line3: {
                            type: 'line',
                            yMin: 150,
                            yMax: 150,
                            borderColor: '#ef4444',
                            borderWidth: 1,
                            borderDash: [6, 6],
                            label: {
                                content: 'Нездоровый',
                                enabled: true,
                                position: 'right'
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 200,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    title: {
                        display: true,
                        text: 'AQI (Индекс качества воздуха)',
                        color: '#4b5563',
                        font: { weight: '500', size: 11 }
                    },
                    ticks: {
                        stepSize: 50,
                        callback: function(value, index, values) {
                            return value + ' AQI';
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 45, maxTicksLimit: 8 }
                }
            }
        }
    });
    
    console.log('✅ Улучшенный график AQI инициализирован, точек:', aqiData.length);
}

// ------------------ ГРАФИК ПРОБОК (ОСТАЁТСЯ БЕЗ ИЗМЕНЕНИЙ) ------------------
function initTrafficChart() {
    const canvas = document.getElementById('trafficChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const hours = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];
    const trafficData = [20, 15, 10, 25, 85, 70, 55, 60, 80, 90, 65, 35];
    
    if (trafficChart) trafficChart.destroy();
    
    trafficChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [{
                label: 'Уровень пробок',
                data: trafficData,
                backgroundColor: (context) => {
                    const value = context.dataset.data[context.dataIndex];
                    if (value < 30) return 'rgba(16, 185, 129, 0.7)';
                    if (value < 60) return 'rgba(251, 191, 36, 0.7)';
                    if (value < 80) return 'rgba(245, 158, 11, 0.7)';
                    return 'rgba(239, 68, 68, 0.7)';
                },
                borderColor: (context) => {
                    const value = context.dataset.data[context.dataIndex];
                    if (value < 30) return '#10b981';
                    if (value < 60) return '#fbbf24';
                    if (value < 80) return '#f59e0b';
                    return '#ef4444';
                },
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            let label = 'Пробки: ';
                            if (value < 30) label += 'Свободно';
                            else if (value < 60) label += 'Средние';
                            else if (value < 80) label += 'Загружено';
                            else label += 'Пробки';
                            return `${label} (${value}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    title: {
                        display: true,
                        text: 'Загруженность %',
                        color: '#4b5563',
                        font: { weight: '500', size: 11 }
                    },
                    ticks: { stepSize: 20 }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// ------------------ ОБНОВЛЕНИЕ ГРАФИКА ------------------
async function updateAirQualityChart() {
    if (!airQualityChart) return;
    
    const historyData = window.WeatherAPI.getAQIHistory();
    const hours = historyData?.hours || [];
    const aqiData = historyData?.aqiData || [];
    
    if (hours.length && aqiData.length) {
        airQualityChart.data.labels = hours;
        airQualityChart.data.datasets[0].data = aqiData;
        
        // Обновляем цвет линии в зависимости от последнего значения
        const lastAQI = aqiData[aqiData.length - 1];
        let lineColor = '#10b981';
        if (lastAQI > 100) lineColor = '#ef4444';
        else if (lastAQI > 50) lineColor = '#f59e0b';
        airQualityChart.data.datasets[0].borderColor = lineColor;
        
        airQualityChart.update();
    }
}

// ------------------ ЭКО-РЕЙТИНГ ------------------
async function updateEcoRating(routeData) {
    const ecoRatingEl = document.getElementById('ecoRating');
    if (!ecoRatingEl) return;
    
    let realAQI = 65;
    try {
        const aqiData = await window.WeatherAPI.fetchCurrentAQI();
        if (aqiData?.aqi) realAQI = aqiData.aqi;
    } catch (e) {
        console.warn('Не удалось получить AQI для эко-рейтинга', e);
    }
    
    let ecoScore = 10;
    if (realAQI > 100) ecoScore -= 2;
    else if (realAQI > 70) ecoScore -= 1;
    else if (realAQI > 50) ecoScore -= 0.5;
    
    if (routeData.greenZones > 60) ecoScore += 1.5;
    else if (routeData.greenZones > 40) ecoScore += 0.8;
    
    if (routeData.co2 > 300) ecoScore -= 1.5;
    else if (routeData.co2 > 200) ecoScore -= 0.8;
    
    if (routeData.traffic === 'Высокий') ecoScore -= 1.5;
    else if (routeData.traffic === 'Средний') ecoScore -= 0.7;
    
    ecoScore = Math.max(1, Math.min(10, ecoScore)).toFixed(1);
    ecoRatingEl.innerHTML = `★ ${ecoScore}/10`;
    
    const badge = ecoRatingEl;
    badge.className = 'eco-badge';
    if (ecoScore >= 8) badge.classList.add('eco-score-excellent');
    else if (ecoScore >= 6) badge.classList.add('eco-score-good');
    else if (ecoScore >= 4) badge.classList.add('eco-score-moderate');
    else badge.classList.add('eco-score-poor');
}

// ------------------ ЗАПУСК ПРИ ЗАГРУЗКЕ ------------------
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart !== 'undefined' && window.WeatherAPI) {
        // Даём время на первый запрос AQI
        setTimeout(() => {
            initAirQualityChart();
            initTrafficChart();
        }, 300);
    }
});

// Экспорт
window.updateAirQualityChart = updateAirQualityChart;
window.updateEcoRating = updateEcoRating;