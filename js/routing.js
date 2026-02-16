// routing.js - ФИНАЛЬНАЯ ВЕРСИЯ С РЕАЛЬНЫМИ ДАННЫМИ AQI
// Реальное время OSRM + реалистичная скорость + реальный индекс качества воздуха

let currentRoutingControl = null;

/**
 * Построить эко-маршрут с реальными метриками
 * @param {Array} destCoords - координаты назначения [lat, lng]
 * @param {string} destName - название места
 * @param {string} routeType - тип маршрута ('standard', 'green', 'park')
 */
function buildEcoRoute(destCoords, destName, routeType = 'standard') {
    console.log('🚀 Строим эко-маршрут к:', destName, 'тип:', routeType);
    
    if (currentRoutingControl) {
        try { map.removeControl(currentRoutingControl); } catch(e) {}
        currentRoutingControl = null;
    }
    
    if (!window.map) {
        console.error('❌ Карта не инициализирована!');
        return;
    }
    
    // === СТАРТОВАЯ ТОЧКА: геолокация / ручная / центр ===
    const startCoords = typeof window.getStartCoords === 'function'
        ? window.getStartCoords()
        : (window.userLocation || [49.9500, 82.6200]);
    
    const colors = {
        standard: '#10b981',
        green: '#84cc16',
        park: '#06b6d4'
    };
    
    let profile = 'driving';
    if (routeType === 'green' || routeType === 'park') profile = 'walking';
    
    currentRoutingControl = L.Routing.control({
        waypoints: [
            L.latLng(startCoords[0], startCoords[1]),
            L.latLng(destCoords[0], destCoords[1])
        ],
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: profile,
            timeout: 30000,
            alternatives: true,
            steps: true,
            geometries: 'polyline6'
        }),
        lineOptions: {
            styles: [{ color: colors[routeType], weight: 7, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }],
            extendToWaypoints: true,
            missingRouteTolerance: 10
        },
        showAlternatives: true,
        altLineOptions: {
            styles: [
                { color: colors.green, weight: 5, opacity: 0.7, dashArray: '7, 7' },
                { color: colors.park, weight: 5, opacity: 0.7, dashArray: '10, 10' }
            ]
        },
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        show: false,
        addWaypoints: false,
        draggableWaypoints: false
    }).addTo(map);
    
    currentRoutingControl.on('routesfound', async function(e) {
        const routes = e.routes;
        const mainRoute = routes[0];
        
        const routeCoords = mainRoute.coordinates;
        const distance = mainRoute.summary.totalDistance / 1000;
        const totalTimeSeconds = mainRoute.summary?.totalTime;
        
        const ecoMetrics = await calculateRouteEcoMetrics(
            routeCoords,
            distance,
            routeType,
            totalTimeSeconds
        );
        
        updateEcoPanel(ecoMetrics);
        
        // Обновляем эко-рейтинг с использованием реального AQI
        if (typeof window.updateEcoRating === 'function') {
            window.updateEcoRating(ecoMetrics);
        }
        
        const panel = document.getElementById('ecoRoutePanel');
        if (panel) {
            panel.classList.add('show');
            const destEl = document.getElementById('routeDestination');
            if (destEl) {
                const destSpan = destEl.querySelector('.destination-text');
                if (destSpan) destSpan.textContent = destName;
            }
        }
        
        generateAlternativeRoutes(routes, routeType);
        
        console.log('✅ Маршрут построен:', 
                    distance.toFixed(1), 'км,', 
                    ecoMetrics.time, 'мин,',
                    'AQI:', ecoMetrics.aqi,
                    'эко-рейтинг:', ecoMetrics.ecoScore);
    });
    
    currentRoutingControl.on('routingerror', function(e) {
        console.error('❌ Ошибка маршрута:', e.error);
        alert('Не удалось построить маршрут. Попробуйте другое место.');
    });
}

/**
 * Рассчитать эко-метрики (РЕАЛИСТИЧНОЕ ВРЕМЯ + РЕАЛЬНЫЙ AQI)
 */
async function calculateRouteEcoMetrics(routeCoords, distanceKm, routeType, totalTimeSeconds = null) {
    let metrics = {
        distance: distanceKm.toFixed(1),
        time: null,
        aqi: 65,
        co2: Math.round(distanceKm * 120),
        greenZones: 35,
        traffic: 'Средний',
        ecoScore: 7.5
    };
    
    // --- РЕАЛИСТИЧНАЯ СКОРОСТЬ (км/ч) ---
    let speedKmh;
    if (routeType === 'standard' || routeType === 'driving') {
        if (distanceKm < 10) speedKmh = 30;
        else if (distanceKm < 30) speedKmh = 45;
        else if (distanceKm < 80) speedKmh = 60;
        else speedKmh = 80;
    } else {
        speedKmh = 5;
    }
    
    const calculatedTimeMin = Math.round((distanceKm / speedKmh) * 60);
    
    if (totalTimeSeconds && totalTimeSeconds > 0) {
        const osrmTimeMin = Math.round(totalTimeSeconds / 60);
        metrics.time = Math.max(osrmTimeMin, calculatedTimeMin);
    } else {
        metrics.time = calculatedTimeMin;
    }
    
    // --- РЕАЛЬНЫЙ ИНДЕКС КАЧЕСТВА ВОЗДУХА (OpenWeatherMap) ---
    try {
        // Берём AQI для середины маршрута (более репрезентативно)
        const midIndex = Math.floor(routeCoords.length / 2);
        const midCoords = routeCoords[midIndex] || routeCoords[0];
        
        if (window.WeatherAPI && typeof window.WeatherAPI.fetchCurrentAQI === 'function') {
            const aqiData = await window.WeatherAPI.fetchCurrentAQI(midCoords.lat, midCoords.lng);
            metrics.aqi = aqiData.aqi || 65;
        } else {
            // Fallback, если API недоступен
            metrics.aqi = simulateRouteAQI(routeCoords, routeType);
        }
    } catch (e) {
        console.warn('⚠️ Не удалось получить реальный AQI, используется симуляция', e);
        metrics.aqi = simulateRouteAQI(routeCoords, routeType);
    }
    
    // --- ОСТАЛЬНЫЕ МЕТРИКИ (симуляция, но теперь AQI реальный) ---
    metrics.greenZones = simulateGreenZones(routeCoords, routeType);
    metrics.traffic = simulateTraffic(routeCoords, routeType);
    
    let co2Base = distanceKm * 120;
    if (metrics.traffic === 'Высокий') co2Base *= 1.3;
    else if (metrics.traffic === 'Низкий') co2Base *= 0.8;
    if (routeType === 'green') co2Base *= 0.75;
    else if (routeType === 'park') co2Base *= 0.7;
    metrics.co2 = Math.round(co2Base);
    
    metrics.ecoScore = calculateEcoScore(metrics);
    
    return metrics;
}

/**
 * Симуляция качества воздуха (резервный вариант)
 */
function simulateRouteAQI(routeCoords, routeType) {
    const hour = new Date().getHours();
    let baseAQI = 65;
    if (hour >= 7 && hour <= 10) baseAQI = 85;
    else if (hour >= 17 && hour <= 20) baseAQI = 95;
    else if (hour >= 0 && hour <= 5) baseAQI = 45;
    
    if (routeType === 'green') baseAQI *= 0.9;
    if (routeType === 'park') baseAQI *= 0.85;
    
    const variation = Math.floor(Math.random() * 11 - 5);
    return Math.max(20, Math.min(150, Math.round(baseAQI + variation)));
}

/**
 * Симуляция процента зеленых зон
 */
function simulateGreenZones(routeCoords, routeType) {
    switch (routeType) {
        case 'park': return 75 + Math.floor(Math.random() * 15);
        case 'green': return 55 + Math.floor(Math.random() * 20);
        default: return 25 + Math.floor(Math.random() * 25);
    }
}

/**
 * Симуляция уровня трафика
 */
function simulateTraffic(routeCoords, routeType) {
    const hour = new Date().getHours();
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
        return routeType === 'standard' ? 'Высокий' : 'Средний';
    }
    if (hour >= 22 || hour <= 5) return 'Низкий';
    return routeType === 'standard' ? 'Средний' : 'Низкий';
}

/**
 * Рассчитать эко-рейтинг (0–10)
 */
function calculateEcoScore(metrics) {
    let score = 10;
    
    if (metrics.aqi > 100) score -= 2;
    else if (metrics.aqi > 70) score -= 1;
    else if (metrics.aqi > 50) score -= 0.5;
    else if (metrics.aqi <= 30) score += 0.5;
    
    if (metrics.greenZones > 60) score += 1.5;
    else if (metrics.greenZones > 40) score += 0.8;
    else if (metrics.greenZones < 20) score -= 0.5;
    
    const co2PerKm = metrics.co2 / metrics.distance;
    if (co2PerKm > 150) score -= 1.5;
    else if (co2PerKm > 100) score -= 0.8;
    else if (co2PerKm < 70) score += 0.8;
    
    if (metrics.traffic === 'Высокий') score -= 1.5;
    else if (metrics.traffic === 'Низкий') score += 0.5;
    
    return Math.max(1, Math.min(10, parseFloat(score.toFixed(1))));
}

/**
 * Генерация альтернативных маршрутов (используем реальное время OSRM)
 */
function generateAlternativeRoutes(routes, activeType = 'standard') {
    const container = document.getElementById('alternativeRoutes');
    if (!container || !routes || routes.length === 0) return;
    
    const routeTypes = [
        { type: 'standard', icon: 'route', name: 'Быстрый', color: '#10b981', desc: 'Оптимальный по времени' },
        { type: 'green', icon: 'leaf', name: 'Зелёный', color: '#84cc16', desc: 'Меньше выбросов CO₂' },
        { type: 'park', icon: 'tree', name: 'Эко', color: '#06b6d4', desc: 'Через парки и скверы' }
    ];
    
    container.innerHTML = routes.map((route, index) => {
        const rt = routeTypes[index] || routeTypes[0];
        const distance = (route.summary.totalDistance / 1000).toFixed(1);
        const timeMin = Math.round(route.summary.totalTime / 60);
        
        // Для альтернатив используем симулированный AQI (чтобы не делать 3 запроса подряд)
        const aqi = simulateRouteAQI(route.coordinates, rt.type);
        const greenZones = simulateGreenZones(route.coordinates, rt.type);
        const traffic = simulateTraffic(route.coordinates, rt.type);
        
        let co2 = parseFloat(distance) * 120;
        if (traffic === 'Высокий') co2 *= 1.3;
        else if (traffic === 'Низкий') co2 *= 0.8;
        if (rt.type === 'green') co2 *= 0.75;
        else if (rt.type === 'park') co2 *= 0.7;
        
        const ecoScore = calculateEcoScore({
            distance: parseFloat(distance),
            aqi,
            greenZones,
            co2,
            traffic
        });
        
        return `
            <div class="alternative-route" onclick="switchToRoute(${index})">
                <div class="route-main-info">
                    <div class="route-type">
                        <i class="fas fa-${rt.icon}" style="color: ${rt.color}"></i>
                        <span style="font-weight: 700; color: #1f2937;">${rt.name}</span>
                    </div>
                    <div class="route-desc">${rt.desc}</div>
                    <div class="route-stats-compact">
                        <span><i class="fas fa-road"></i> ${distance} км</span>
                        <span><i class="fas fa-clock"></i> ${timeMin} мин</span>
                        <span><i class="fas fa-smog"></i> AQI ${aqi}</span>
                        <span><i class="fas fa-leaf"></i> ${greenZones}%</span>
                    </div>
                </div>
                <div class="route-eco-score">
                    <div class="eco-score-circle" style="background: conic-gradient(${rt.color} ${ecoScore * 36}deg, #e5e7eb 0deg);">
                        <span>${ecoScore}</span>
                    </div>
                    <span style="font-size: 0.7rem; color: #6b7280;">эко</span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Обновить панель эко-маршрута
 */
function updateEcoPanel(metrics) {
    const distanceEl = document.getElementById('metricDistance');
    const timeEl = document.getElementById('metricTime');
    const aqiEl = document.getElementById('metricAQI');
    const co2El = document.getElementById('metricCO2');
    const greenEl = document.getElementById('metricGreen');
    const trafficEl = document.getElementById('metricTraffic');
    const aqiStatusEl = document.getElementById('aqiStatus');
    
    if (distanceEl) distanceEl.textContent = metrics.distance;
    if (timeEl) timeEl.textContent = metrics.time;
    if (aqiEl) aqiEl.textContent = metrics.aqi;
    if (co2El) co2El.textContent = metrics.co2;
    if (greenEl) greenEl.textContent = metrics.greenZones;
    if (trafficEl) trafficEl.textContent = metrics.traffic;
    
    if (aqiStatusEl) {
        if (metrics.aqi <= 50) aqiStatusEl.textContent = 'Хорошее';
        else if (metrics.aqi <= 100) aqiStatusEl.textContent = 'Умеренное';
        else if (metrics.aqi <= 150) aqiStatusEl.textContent = 'Нездоровое';
        else aqiStatusEl.textContent = 'Опасное';
    }
    
    const aqiMetric = document.querySelector('.eco-metric-card:first-child');
    if (aqiMetric) {
        if (metrics.aqi <= 50) aqiMetric.style.background = 'linear-gradient(135deg, #f0fdf4, #dcfce7)';
        else if (metrics.aqi <= 100) aqiMetric.style.background = 'linear-gradient(135deg, #fef3c7, #fde68a)';
        else aqiMetric.style.background = 'linear-gradient(135deg, #fee2e2, #fecaca)';
    }
}

function switchToRoute(index) {
    if (currentRoutingControl && currentRoutingControl._routes) {
        currentRoutingControl.showRoute(index);
    }
}

function closeRoutePanel() {
    document.getElementById('ecoRoutePanel')?.classList.remove('show');
}

function clearRoute() {
    if (currentRoutingControl) {
        map.removeControl(currentRoutingControl);
        currentRoutingControl = null;
    }
    closeRoutePanel();
}

// Глобальный экспорт
window.buildEcoRoute = buildEcoRoute;
window.switchToRoute = switchToRoute;
window.closeRoutePanel = closeRoutePanel;
window.clearRoute = clearRoute;
window.calculateRouteEcoMetrics = calculateRouteEcoMetrics;