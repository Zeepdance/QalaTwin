// ui.js - Управление UI (обновление AQI, sidebar)

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function initializeUIHandlers() {
    // Запускаем обновление качества воздуха
    updateAirQuality();
    setInterval(updateAirQuality, 10 * 60 * 1000);
}

async function updateAirQuality() {
    try {
        const data = await window.WeatherAPI.fetchCurrentAQI();
        if (data && data.aqi) {
            const aqiValueEl = document.getElementById('aqiValue');
            if (aqiValueEl) aqiValueEl.textContent = data.aqi;
            
            const currentAQIEl = document.getElementById('currentAQI');
            if (currentAQIEl) currentAQIEl.textContent = data.aqi;
            
            const status = window.WeatherAPI.getAQIStatus(data.aqi);
            
            const aqiStatusEl = document.getElementById('aqiStatus');
            if (aqiStatusEl) aqiStatusEl.textContent = status.text + ' качество';
            
            const currentAQIBadge = document.getElementById('currentAQIBadge');
            if (currentAQIBadge) {
                currentAQIBadge.textContent = status.text;
                currentAQIBadge.className = 'aqi-badge ' + status.badge;
            }
            
            const dominantEl = document.getElementById('dominantPollutant');
            if (dominantEl && data.dominant) {
                dominantEl.textContent = data.dominant;
            }
            
            console.log('✅ AQI обновлён:', data.aqi, data.dominant);
        }
    } catch (error) {
        console.error('❌ Ошибка обновления AQI:', error);
    }
}

function ensureDominantPollutantElement() {
    const legend = document.getElementById('heatmapLegend');
    if (legend && !document.getElementById('dominantPollutant')) {
        const currentAQIDiv = legend.querySelector('.current-aqi');
        if (currentAQIDiv) {
            const dominantHTML = `
                <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.8rem;">
                    <span>Основной загрязнитель:</span>
                    <span id="dominantPollutant" style="font-weight: 600; color: #10b981;">PM2.5</span>
                </div>
            `;
            currentAQIDiv.insertAdjacentHTML('afterend', dominantHTML);
        }
    }
}

document.addEventListener('DOMContentLoaded', ensureDominantPollutantElement);

window.toggleSidebar = toggleSidebar;
window.initializeUIHandlers = initializeUIHandlers;
window.updateAirQuality = updateAirQuality;