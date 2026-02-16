// simulation.js - Цифровой двойник: добавление объектов (2D и 3D) и расчёт метрик

let selectedObjectType = null;
let placedObjects = [];       // объекты на 2D-карте
let objectMarkers = [];
let ghostMarker = null;

// 3D-объекты (храним отдельно)
let placedObjects3D = [];

// Коэффициенты влияния (расширенные)
const impactFactors = {
    park: { aqi: -0.15, traffic: -0.05, density: 0.0, time: -0.02 },
    school: { aqi: 0.02, traffic: 0.15, density: 0.1, time: 0.08 },
    residential: { aqi: 0.05, traffic: 0.2, density: 0.25, time: 0.12 },
    bridge: { aqi: 0.03, traffic: -0.1, density: 0.0, time: -0.2 },
    sports: { aqi: 0.01, traffic: 0.1, density: 0.05, time: 0.05 },
    industrial: { aqi: 0.3, traffic: 0.25, density: 0.02, time: 0.15 },
    hospital: { aqi: 0.02, traffic: 0.1, density: 0.08, time: 0.03 } // добавлено
};

const baselineMetrics = { aqi: 65, traffic: 45, density: 50, travelTime: 30 };
let currentMetrics = { ...baselineMetrics };

function initSimulation() {
    document.querySelectorAll('.object-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.object-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            selectedObjectType = this.dataset.type;
            document.getElementById('simStatus').innerHTML = `<i class="fas fa-mouse-pointer"></i> Кликните на карту, чтобы разместить ${this.innerText.trim()}`;
            enablePlacementMode();
        });
    });
    
    document.getElementById('resetSimBtn')?.addEventListener('click', resetSimulation);
}

function enablePlacementMode() {
    if (!window.map) return;
    window.map.off('click', handleMapClick);
    window.map.off('mousemove', handleMapMouseMove);
    window.map.on('click', handleMapClick);
    window.map.on('mousemove', handleMapMouseMove);
    document.getElementById('map').style.cursor = 'crosshair';
}

function disablePlacementMode() {
    window.map.off('click', handleMapClick);
    window.map.off('mousemove', handleMapMouseMove);
    document.getElementById('map').style.cursor = '';
    if (ghostMarker) {
        map.removeLayer(ghostMarker);
        ghostMarker = null;
    }
}

function handleMapMouseMove(e) {
    if (!selectedObjectType) return;
    const latlng = e.latlng;
    if (ghostMarker) {
        ghostMarker.setLatLng(latlng);
    } else {
        ghostMarker = L.marker(latlng, {
            icon: createGhostIcon(selectedObjectType),
            interactive: false,
            zIndexOffset: 1000
        }).addTo(map);
    }
}

function handleMapClick(e) {
    if (!selectedObjectType) return;
    const latlng = e.latlng;
    const tooClose = placedObjects.some(obj => {
        const dist = latlng.distanceTo(obj.latlng);
        return dist < 200;
    });
    if (tooClose) {
        alert('Это место слишком близко к другому объекту. Выберите другое.');
        return;
    }
    placeObject2D(selectedObjectType, latlng);
    disablePlacementMode();
    document.querySelectorAll('.object-chip').forEach(c => c.classList.remove('active'));
    selectedObjectType = null;
    document.getElementById('simStatus').innerHTML = '<i class="fas fa-info-circle"></i> Объект размещён. Выберите другой или сбросьте.';
}

function createGhostIcon(type) {
    const color = getColorForType(type);
    const iconHtml = getIconForType(type, true);
    return L.divIcon({
        className: 'ghost-marker',
        html: `<div style="background:${color}80; width:40px; height:40px; border-radius:12px; border:3px dashed white; box-shadow:0 4px 15px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:white; font-size:20px; backdrop-filter:blur(2px); transform:scale(0.9);">${iconHtml}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
}

function createObjectIcon(type) {
    const color = getColorForType(type);
    const iconHtml = getIconForType(type, false);
    return L.divIcon({
        className: 'object-marker',
        html: `<div style="background:${color}; width:40px; height:40px; border-radius:12px; border:3px solid white; box-shadow:0 4px 15px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:white; font-size:20px; animation:popIn 0.3s;">${iconHtml}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
}

function getColorForType(type) {
    const colors = {
        park: '#10b981',
        school: '#f59e0b',
        residential: '#3b82f6',
        bridge: '#6b7280',
        sports: '#ef4444',
        industrial: '#8b5cf6',
        hospital: '#ec4899' // розовый
    };
    return colors[type] || '#64748b';
}

function getIconForType(type, ghost = false) {
    const icons = {
        park: '<i class="fas fa-tree"></i>',
        school: '<i class="fas fa-school"></i>',
        residential: '<i class="fas fa-building"></i>',
        bridge: '<i class="fas fa-bridge"></i>',
        sports: '<i class="fas fa-futbol"></i>',
        industrial: '<i class="fas fa-industry"></i>',
        hospital: '<i class="fas fa-hospital"></i>'
    };
    return icons[type] || '<i class="fas fa-map-marker-alt"></i>';
}

function placeObject2D(type, latlng) {
    const id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    placedObjects.push({ type, latlng, id });
    
    const marker = L.marker(latlng, {
        icon: createObjectIcon(type)
    }).addTo(map);
    
    marker.on('add', function() {
        const el = this.getElement();
        if (el) el.style.animation = 'popIn 0.3s';
    });
    
    objectMarkers.push(marker);
    
    recalcMetrics();
    document.getElementById('impactSection').style.display = 'block';
    
    // Обновляем дороги на 3D-карте, если они есть
    if (window.updateRoadColors) window.updateRoadColors();
}

// Функция для добавления 3D-объекта из редактора
function addSimulationObject(type, coords, height, size) {
    placedObjects3D.push({
        type,
        coords,
        height,
        size,
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    });
    recalcMetrics();
    document.getElementById('impactSection').style.display = 'block';
    
    // Обновляем дороги на 3D-карте
    if (window.updateRoadColors) window.updateRoadColors();
}

// Пересчёт всех метрик (2D + 3D)
function recalcMetrics() {
    let aqi = baselineMetrics.aqi;
    let traffic = baselineMetrics.traffic;
    let density = baselineMetrics.density;
    let travelTime = baselineMetrics.travelTime;

    // Учитываем 2D-объекты
    placedObjects.forEach(obj => {
        const factor = impactFactors[obj.type];
        if (factor) {
            aqi += baselineMetrics.aqi * factor.aqi;
            traffic += baselineMetrics.traffic * factor.traffic;
            density += baselineMetrics.density * factor.density;
            travelTime += baselineMetrics.travelTime * factor.time;
        }
    });

    // Учитываем 3D-объекты (аналогично, но с масштабированием по высоте/размеру)
    placedObjects3D.forEach(obj => {
        const factor = impactFactors[obj.type];
        if (factor) {
            // Усиление влияния в зависимости от высоты и размера
            const scale = (obj.height / 5) * (obj.size / 30); // относительно базовых
            aqi += baselineMetrics.aqi * factor.aqi * scale;
            traffic += baselineMetrics.traffic * factor.traffic * scale;
            density += baselineMetrics.density * factor.density * scale;
            travelTime += baselineMetrics.travelTime * factor.time * scale;
        }
    });

    aqi = Math.max(20, Math.min(200, Math.round(aqi)));
    traffic = Math.max(0, Math.min(100, Math.round(traffic)));
    density = Math.max(0, Math.min(100, Math.round(density)));
    travelTime = Math.max(5, Math.round(travelTime));

    currentMetrics = { aqi, traffic, density, travelTime };

    const deltaAQI = ((aqi - baselineMetrics.aqi) / baselineMetrics.aqi * 100).toFixed(1);
    const deltaTraffic = ((traffic - baselineMetrics.traffic) / baselineMetrics.traffic * 100).toFixed(1);
    const deltaDensity = ((density - baselineMetrics.density) / baselineMetrics.density * 100).toFixed(1);
    const deltaTime = ((travelTime - baselineMetrics.travelTime) / baselineMetrics.travelTime * 100).toFixed(1);

    document.getElementById('impactAQI').textContent = (deltaAQI > 0 ? '+' : '') + deltaAQI;
    document.getElementById('impactTraffic').textContent = (deltaTraffic > 0 ? '+' : '') + deltaTraffic;
    document.getElementById('impactDensity').textContent = (deltaDensity > 0 ? '+' : '') + deltaDensity;
    document.getElementById('impactTime').textContent = (deltaTime > 0 ? '+' : '') + deltaTime;

    // Обновляем AQI в легенде
    const aqiValueEl = document.getElementById('currentAQI');
    if (aqiValueEl) aqiValueEl.textContent = currentMetrics.aqi;
    
    const status = window.WeatherAPI.getAQIStatus(currentMetrics.aqi);
    const aqiStatusEl = document.getElementById('aqiStatus');
    if (aqiStatusEl) aqiStatusEl.textContent = status.text + ' качество';
    
    const badge = document.getElementById('currentAQIBadge');
    if (badge) {
        badge.textContent = status.text;
        badge.className = 'aqi-badge ' + status.badge;
    }
}

function resetSimulation() {
    objectMarkers.forEach(marker => map.removeLayer(marker));
    objectMarkers = [];
    placedObjects = [];
    placedObjects3D = [];

    // Удаляем 3D-объекты с карты
    if (map3d && map3d.getSource('user-objects')) {
        map3d.getSource('user-objects').setData({
            type: 'FeatureCollection',
            features: []
        });
    }

    currentMetrics = { ...baselineMetrics };
    document.getElementById('impactSection').style.display = 'none';
    document.getElementById('simStatus').innerHTML = '<i class="fas fa-info-circle"></i> Выберите тип объекта, затем кликните на карту.';
    
    disablePlacementMode();
    
    // Обновляем дороги (очистка)
    if (window.updateRoadColors) window.updateRoadColors();
}

// Добавляем CSS-анимацию
(function addAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            80% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
        }
        .ghost-marker {
            transition: transform 0.2s;
        }
        .ghost-marker:hover {
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);
})();

window.initSimulation = initSimulation;
window.resetSimulation = resetSimulation;
window.addSimulationObject = addSimulationObject; // экспортируем для editor3d