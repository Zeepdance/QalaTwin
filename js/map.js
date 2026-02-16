// map.js - Управление картой, геолокация, перетаскивание маркера, привязка к дороге, 3D-режим MapTiler с маркерами

let heatmapLayer = null;
let isHeatmapVisible = true;
let userMarker = null;
let userAccuracyCircle = null;
let isUserLocationSet = false;

// Переменные для 3D-режима
let map3d = null;
let is3DActive = false;
let currentView = { center: [49.9485, 82.6287], zoom: 11 };

// Маркер пользователя на 3D-карте
let userMarker3D = null;

// Твой ключ MapTiler
const MAPTILER_API_KEY = 'wI8E3es6CLloq93xtfxw';

// Массив для хранения маркеров 3D
let map3dMarkers = [];

// Вспомогательная функция для экранирования HTML
function escapeHtml(unsafe) {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==================== 2D КАРТА (LEAFLET) ====================

function initializeMap() {
    window.map = L.map('map', {
        zoomControl: false
    }).setView(currentView.center, currentView.zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    initHeatmap();
    
    map.on('contextmenu', function(e) {
        setStartLocation([e.latlng.lat, e.latlng.lng], true);
    });
    
    map.on('moveend', function() {
        currentView.center = [map.getCenter().lat, map.getCenter().lng];
        currentView.zoom = map.getZoom();
    });
}

function goToMyLocation() {
    if (!navigator.geolocation) {
        alert('❌ Геолокация не поддерживается браузером');
        return;
    }
    
    const btn = document.getElementById('locationBtn');
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const coords = [position.coords.latitude, position.coords.longitude];
            const accuracy = position.coords.accuracy;
            
            console.log('📍 Браузерная геолокация:', coords, '±' + accuracy.toFixed(0) + 'м');
            
            if (accuracy > 500) {
                alert('⚠️ Точность геолокации низкая (±' + accuracy.toFixed(0) + ' м).\nВы можете перетащить маркер в нужное место.');
            }
            
            const snappedCoords = await snapToRoad(coords);
            setStartLocation(snappedCoords, true, accuracy);
            
            if (btn) btn.innerHTML = '<i class="fas fa-location-arrow"></i>';
        },
        (error) => {
            console.warn('❌ Ошибка геолокации:', error.message);
            if (btn) btn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            
            let message = 'Не удалось определить местоположение: ';
            switch (error.code) {
                case error.PERMISSION_DENIED: message += 'доступ запрещён.'; break;
                case error.POSITION_UNAVAILABLE: message += 'сигнал недоступен.'; break;
                case error.TIMEOUT: message += 'таймаут.'; break;
                default: message += 'неизвестная ошибка.';
            }
            alert(message + '\nУстановите точку вручную: правый клик на карте.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

async function snapToRoad(coords) {
    try {
        const url = `https://router.project-osrm.org/nearest/v1/driving/${coords[1]},${coords[0]}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.waypoints && data.waypoints.length > 0) {
            const snapped = data.waypoints[0].location;
            console.log('🛣️ Привязано к дороге:', [snapped[1], snapped[0]]);
            return [snapped[1], snapped[0]];
        }
    } catch (e) {
        console.warn('⚠️ Ошибка привязки к дороге, используется исходная точка', e);
    }
    return coords;
}

function setStartLocation(coords, draggable = true, accuracy = 50) {
    console.log('📍 Установка стартовой точки:', coords, 'draggable:', draggable);
    
    window.userLocation = coords;
    isUserLocationSet = true;
    
    // Удаляем старые 2D-маркеры
    if (userMarker) map.removeLayer(userMarker);
    if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);
    
    // Создаём 2D-маркер
    userMarker = L.marker(coords, {
        draggable: draggable,
        icon: L.divIcon({
            className: draggable ? 'user-marker-draggable' : 'user-marker-fixed',
            html: `<div style="
                background: ${draggable ? '#3b82f6' : '#10b981'};
                width: 22px;
                height: 22px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 15px ${draggable ? 'rgba(59,130,246,0.8)' : 'rgba(16,185,129,0.8)'};
                cursor: ${draggable ? 'grab' : 'default'};
            "></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        })
    }).addTo(map);
    
    userMarker.on('dragstart', function() {
        this.getElement().style.cursor = 'grabbing';
    });
    
    userMarker.on('dragend', async function(e) {
        const newCoords = [e.target.getLatLng().lat, e.target.getLatLng().lng];
        const snapped = await snapToRoad(newCoords);
        userMarker.setLatLng(snapped);
        window.userLocation = snapped;
        if (userAccuracyCircle) userAccuracyCircle.setLatLng(snapped);
        map.setView(snapped, 15);
        L.popup().setLatLng(snapped).setContent('📍 Стартовая точка обновлена').openOn(map);
        
        // Обновляем маркер на 3D-карте, если она активна
        if (is3DActive && map3d) {
            updateUserMarker3D(snapped);
        }
    });
    
    userMarker.bindPopup(draggable ? '📍 Стартовая точка (перетащите для уточнения)' : `📍 Вы здесь (точность ±${accuracy.toFixed(0)} м)`).openPopup();
    
    userAccuracyCircle = L.circle(coords, {
        radius: draggable ? 50 : accuracy,
        color: draggable ? '#3b82f6' : '#10b981',
        weight: 1.5,
        opacity: 0.5,
        fillColor: draggable ? '#3b82f6' : '#10b981',
        fillOpacity: 0.1,
        interactive: false
    }).addTo(map);
    
    map.setView(coords, 15);
    
    // Обновляем маркер на 3D-карте, если она активна
    if (is3DActive && map3d) {
        updateUserMarker3D(coords);
    }
}

/**
 * Обновление или создание маркера пользователя на 3D-карте
 */
function updateUserMarker3D(coords) {
    if (!map3d) return;
    
    // Удаляем старый 3D-маркер
    if (userMarker3D) {
        userMarker3D.remove();
        userMarker3D = null;
    }
    
    // Создаём новый
    const markerElement = document.createElement('div');
    markerElement.style.cssText = `
        background: #3b82f6;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 15px rgba(59,130,246,0.8);
        cursor: grab;
    `;
    
    userMarker3D = new maplibregl.Marker({ element: markerElement })
        .setLngLat([coords[1], coords[0]])
        .addTo(map3d);
}

function getStartCoords() {
    return (window.userLocation && isUserLocationSet) ? window.userLocation : [49.9500, 82.6200];
}

function resetStartLocation() {
    if (userMarker) map.removeLayer(userMarker);
    if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);
    window.userLocation = null;
    isUserLocationSet = false;
    console.log('🔄 Стартовая точка сброшена, используется центр по умолчанию');
    
    // Удаляем маркер пользователя с 3D-карты
    if (userMarker3D) {
        userMarker3D.remove();
        userMarker3D = null;
    }
}

// --- HEATMAP ---
function generatePollutionData() {
    const data = [];
    const zones = [
        { center: [49.9485, 82.6287], intensity: 0.7, radius: 0.04 },
        { center: [49.9356, 82.5987], intensity: 0.4, radius: 0.03 },
        { center: [49.9612, 82.6512], intensity: 0.85, radius: 0.035 },
        { center: [49.9234, 82.7123], intensity: 1.0, radius: 0.025 },
        { center: [49.9701, 82.6089], intensity: 0.5, radius: 0.03 },
        { center: [49.9389, 82.6456], intensity: 0.75, radius: 0.032 },
        { center: [49.9278, 82.6178], intensity: 0.55, radius: 0.028 },
        { center: [49.9534, 82.6523], intensity: 0.65, radius: 0.031 },
    ];
    
    zones.forEach(zone => {
        for (let i = 0; i < 150; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * zone.radius;
            const lat = zone.center[0] + dist * Math.cos(angle);
            const lng = zone.center[1] + dist * Math.sin(angle);
            const intensity = zone.intensity * (1 - dist / zone.radius) * (0.7 + Math.random() * 0.3);
            data.push([lat, lng, intensity]);
        }
    });
    
    for (let i = 0; i < 300; i++) {
        data.push([49.92 + Math.random() * 0.06, 82.59 + Math.random() * 0.14, Math.random() * 0.3]);
    }
    return data;
}

function initHeatmap() {
    heatmapLayer = L.heatLayer(generatePollutionData(), {
        radius: 25,
        blur: 35,
        maxZoom: 17,
        max: 1.0,
        gradient: {
            0.0: 'rgba(16,185,129,0)',
            0.2: 'rgba(16,185,129,0.5)',
            0.4: 'rgba(251,191,36,0.6)',
            0.6: 'rgba(245,158,11,0.7)',
            0.8: 'rgba(239,68,68,0.8)',
            1.0: 'rgba(220,38,38,0.9)'
        }
    }).addTo(map);
}

function toggleHeatmap() {
    isHeatmapVisible = !isHeatmapVisible;
    const btn = document.getElementById('heatmapBtn');
    const legend = document.getElementById('heatmapLegend');
    
    if (isHeatmapVisible) {
        btn?.classList.add('active');
        legend?.classList.add('show');
        if (heatmapLayer) map.addLayer(heatmapLayer);
    } else {
        btn?.classList.remove('active');
        legend?.classList.remove('show');
        if (heatmapLayer) map.removeLayer(heatmapLayer);
    }
}

// ==================== 3D РЕЖИМ (MAPLIBRE) ====================

/**
 * Создание DOM-элемента маркера (круглый, как на 2D карте)
 */
function createMarkerElement(place) {
    const color = (typeof window.getCategoryColor === 'function')
        ? window.getCategoryColor(place.category)
        : '#10b981';

    const markerDiv = document.createElement('div');
    markerDiv.style.cssText = `
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        cursor: pointer;
    `;
    markerDiv.innerHTML = `<i class="fas fa-${escapeHtml(place.icon)}"></i>`;
    
    return markerDiv;
}

/**
 * Создание маркера для 3D-карты
 */
function create3DMarker(place) {
    try {
        if (!place || !place.coords || !place.category || !place.icon) {
            console.warn('⚠️ Пропущен маркер: неполные данные', place);
            return null;
        }

        const markerElement = createMarkerElement(place);
        if (!markerElement) {
            console.warn('⚠️ Не удалось создать элемент маркера для', place.name);
            return null;
        }

        const marker = new maplibregl.Marker({ 
            element: markerElement,
            rotationAlignment: 'viewport',
            pitchAlignment: 'viewport'
        }).setLngLat([place.coords[1], place.coords[0]]);

        // Данные для попапа
        const safeName = escapeHtml(place.name);
        const safeCategory = escapeHtml(
            (typeof window.getCategoryName === 'function')
                ? window.getCategoryName(place.category)
                : place.category
        );
        const safeAddress = escapeHtml(place.address || '');
        const safeDescription = escapeHtml(place.description || '');
        const rating = place.rating || 0;
        const starsFull = '★'.repeat(Math.floor(rating));
        const starsEmpty = '☆'.repeat(5 - Math.floor(rating));

        let galleryHtml = '';
        if (place.imageGallery && place.imageGallery.length > 0 && typeof window.createGalleryHTML === 'function') {
            galleryHtml = window.createGalleryHTML(place.imageGallery, '3d-' + safeName.substring(0,10));
        }

        // Кнопка вызывает buildEcoRouteFrom3D (переключение на 2D + построение маршрута)
        const popupContent = `
            <div class="custom-popup">
                <div class="popup-title">${safeName}</div>
                <div class="popup-category">${safeCategory}</div>
                <div class="popup-address"><i class="fas fa-map-pin"></i> ${safeAddress}</div>
                <div class="popup-description">${safeDescription}</div>
                ${galleryHtml}
                <div class="popup-rating">
                    <span class="stars">${starsFull}${starsEmpty}</span>
                    <span class="rating-value">${rating}</span>
                </div>
                <button onclick="buildEcoRouteFrom3D([${place.coords}], '${escapeHtml(place.name).replace(/'/g, "\\'")}', 'standard')" 
                    class="btn btn-primary">🌿 Эко-маршрут</button>
            </div>
        `;

        const popup = new maplibregl.Popup({ offset: [0, 15] }).setHTML(popupContent);
        marker.setPopup(popup);

        return marker;
    } catch (e) {
        console.error('❌ Ошибка в create3DMarker для', place?.name, e);
        return null;
    }
}

/**
 * Функция для построения маршрута из 3D-режима (переключает на 2D и вызывает buildEcoRoute)
 */
function buildEcoRouteFrom3D(destCoords, destName, routeType) {
    if (is3DActive) {
        toggle3D(); // переключаем на 2D-карту
        // Небольшая задержка, чтобы карта гарантированно стала видимой
        setTimeout(() => {
            if (typeof window.buildEcoRoute === 'function') {
                window.buildEcoRoute(destCoords, destName, routeType);
            } else {
                console.error('buildEcoRoute не найдена');
                alert('Ошибка: функция построения маршрута не загружена');
            }
        }, 100);
    } else {
        if (typeof window.buildEcoRoute === 'function') {
            window.buildEcoRoute(destCoords, destName, routeType);
        }
    }
}

/**
 * Инициализация 3D-карты
 */
function init3DMap() {
    if (map3d) return;

    try {
        map3d = new maplibregl.Map({
            container: 'map-3d',
            style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`,
            center: currentView.center,
            zoom: currentView.zoom,
            pitch: 55,
            bearing: 0,
            antialias: true,
            attributionControl: false
        });

        map3d.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));

        map3d.on('load', function() {
            console.log('✅ 3D карта (MapTiler) загружена');

            // 3D-террейн
            map3d.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_API_KEY}`,
                tileSize: 512,
                maxzoom: 14
            });
            map3d.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 });

            // ========== ОСНОВНЫЕ МАРКЕРЫ ==========
            setTimeout(() => {
                if (window.places && Array.isArray(window.places)) {
                    console.log(`📌 Найдено мест для добавления: ${window.places.length}`);
                    window.places.forEach((place, index) => {
                        try {
                            const marker = create3DMarker(place);
                            if (marker) {
                                marker.addTo(map3d);
                                map3dMarkers.push(marker);
                                console.log(`   ✅ Маркер ${index + 1}: ${place.name}`);
                            } else {
                                console.warn(`   ❌ Маркер ${index + 1} не создан (${place.name})`);
                            }
                        } catch (err) {
                            console.error(`   ❌ Ошибка при добавлении маркера ${index + 1}:`, err);
                        }
                    });
                    console.log(`✅ Итого маркеров на 3D-карте: ${map3dMarkers.length}`);
                } else {
                    console.warn('⚠️ window.places не найден или пуст');
                }
            }, 1000);

            // Если местоположение пользователя уже установлено, добавляем маркер
            if (window.userLocation && isUserLocationSet) {
                updateUserMarker3D(window.userLocation);
            }
        });

        map3d.on('error', function(e) {
            console.error('❌ Ошибка 3D карты:', e.error);
            alert('Не удалось загрузить 3D-карту. Проверь интернет и API-ключ.');
        });

    } catch (e) {
        console.error('❌ Ошибка инициализации 3D:', e);
        alert('Ошибка при создании 3D-карты');
    }
}

/**
 * Переключение между 2D и 3D
 */
function toggle3D() {
    const mapContainer = document.getElementById('map');
    const map3dContainer = document.getElementById('map-3d');
    const btn = document.getElementById('threeDBtn');
    
    if (!is3DActive) {
        mapContainer.style.display = 'none';
        map3dContainer.style.display = 'block';
        
        if (!map3d) {
            init3DMap();
        } else {
            map3d.setCenter(currentView.center);
            map3d.setZoom(currentView.zoom);
        }
        
        if (btn) btn.classList.add('active');
        
        setTimeout(() => {
            alert('🎮 3D-режим: вращайте с Ctrl+перетаскивание, наклоняйте Shift+колесо');
        }, 300);
        
        is3DActive = true;
    } else {
        mapContainer.style.display = 'block';
        map3dContainer.style.display = 'none';
        
        if (map3d) {
            const center = map3d.getCenter();
            currentView.center = [center.lat, center.lng];
            currentView.zoom = map3d.getZoom();
            map.setView(currentView.center, currentView.zoom);
        }
        
        if (btn) btn.classList.remove('active');
        is3DActive = false;
    }
}

// Экспорт в глобальную область
window.initializeMap = initializeMap;
window.goToMyLocation = goToMyLocation;
window.toggleHeatmap = toggleHeatmap;
window.setStartLocation = setStartLocation;
window.getStartCoords = getStartCoords;
window.resetStartLocation = resetStartLocation;
window.toggle3D = toggle3D;
window.buildEcoRouteFrom3D = buildEcoRouteFrom3D;