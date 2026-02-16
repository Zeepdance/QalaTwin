// editor-bridge.js - связь с отдельным окном редактора

let pendingPlacementCoords = null; // координаты для нового объекта
let lastObjectId = null; // для возможности удаления последнего

// Вызывается при клике на кнопку "Добавить объект" (обычный редактор)
function enableObjectPlacement() {
    if (!map3d || !is3DActive) {
        alert('Сначала включите 3D-режим');
        return;
    }
    alert('Кликните на карте, чтобы выбрать место для объекта');
    map3d.getCanvas().style.cursor = 'crosshair';
    map3d.once('click', onPlacementClick);
}

function onPlacementClick(e) {
    map3d.getCanvas().style.cursor = '';
    const coords = [e.lngLat.lng, e.lngLat.lat];
    pendingPlacementCoords = coords;

    const editorWindow = window.open('editor.html', 'objectEditor', 'width=900,height=700,resizable=yes');
    
    window.addEventListener('message', function onMessage(event) {
        if (event.data.type === 'OBJECT_CREATED') {
            const obj = event.data.object;
            addCustomObjectToMap(obj, pendingPlacementCoords);
            window.removeEventListener('message', onMessage);
            pendingPlacementCoords = null;
        }
    });
}

// Добавление обычного объекта на 3D-карту
function addCustomObjectToMap(obj, coords) {
    const [lng, lat] = coords;

    const halfLng = obj.width / 2 / 111000; // грубо
    const halfLat = obj.depth / 2 / 111000;

    const objectId = 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const polygon = {
        type: 'Feature',
        id: objectId,
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [lng - halfLng, lat - halfLat],
                [lng + halfLng, lat - halfLat],
                [lng + halfLng, lat + halfLat],
                [lng - halfLng, lat + halfLat],
                [lng - halfLng, lat - halfLat]
            ]]
        },
        properties: {
            type: obj.type,
            height: obj.height,
            color: obj.color,
            baseHeight: 0,
            form: obj.form || 'house',
            id: objectId
        }
    };

    if (!map3d.getSource('user-objects')) {
        map3d.addSource('user-objects', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });
        map3d.addLayer({
            id: 'user-objects-fill',
            type: 'fill-extrusion',
            source: 'user-objects',
            paint: {
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'baseHeight'],
                'fill-extrusion-opacity': 0.8
            }
        });
    }

    const source = map3d.getSource('user-objects');
    let data;
    try {
        data = source.serialize().data || { type: 'FeatureCollection', features: [] };
    } catch (e) {
        data = { type: 'FeatureCollection', features: [] };
    }
    data.features.push(polygon);
    source.setData(data);

    lastObjectId = objectId;

    if (typeof addSimulationObject === 'function') {
        addSimulationObject(obj.type, { lat, lng }, obj.height / 3, (obj.width + obj.depth) / 2, objectId);
    }
}

// ========== ПРЕМИУМ-ФУНКЦИИ ==========

function openAirTurbineEditor() {
    if (!map3d || !is3DActive) {
        alert('Сначала включите 3D-режим');
        return;
    }
    alert('Кликните на карте, чтобы выбрать место для ветряной турбины');
    map3d.getCanvas().style.cursor = 'crosshair';
    map3d.once('click', (e) => openPremiumEditor(e, 'airturbine.html'));
}

function openWaterTurbineEditor() {
    if (!map3d || !is3DActive) {
        alert('Сначала включите 3D-режим');
        return;
    }
    alert('Кликните на карте, чтобы выбрать место для гидротурбины');
    map3d.getCanvas().style.cursor = 'crosshair';
    map3d.once('click', (e) => openPremiumEditor(e, 'waterturbine.html'));
}

function openPremiumEditor(e, editorFile) {
    map3d.getCanvas().style.cursor = '';
    const coords = [e.lngLat.lng, e.lngLat.lat];
    pendingPlacementCoords = coords;

    const editorWindow = window.open(editorFile, 'premiumEditor', 'width=900,height=700,resizable=yes');
    
    window.addEventListener('message', function onMessage(event) {
        if (event.data.type === 'OBJECT_CREATED') {
            const obj = event.data.object;
            addPremiumObjectToMap(obj, pendingPlacementCoords);
            window.removeEventListener('message', onMessage);
            pendingPlacementCoords = null;
        }
    });
}

function addPremiumObjectToMap(obj, coords) {
    const [lng, lat] = coords;
    const objectId = 'premium_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Используем тот же слой user-objects для простоты
    const halfLng = (obj.width || 50) / 2 / 111000;
    const halfLat = (obj.depth || 50) / 2 / 111000;

    const polygon = {
        type: 'Feature',
        id: objectId,
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [lng - halfLng, lat - halfLat],
                [lng + halfLng, lat - halfLat],
                [lng + halfLng, lat + halfLat],
                [lng - halfLng, lat + halfLat],
                [lng - halfLng, lat - halfLat]
            ]]
        },
        properties: {
            type: obj.type, // 'wind' или 'hydro'
            height: obj.height || 50,
            color: obj.color || '#fbbf24',
            baseHeight: 0,
            form: obj.form || 'turbine',
            id: objectId
        }
    };

    if (!map3d.getSource('user-objects')) {
        map3d.addSource('user-objects', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });
        map3d.addLayer({
            id: 'user-objects-fill',
            type: 'fill-extrusion',
            source: 'user-objects',
            paint: {
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'baseHeight'],
                'fill-extrusion-opacity': 0.8
            }
        });
    }

    const source = map3d.getSource('user-objects');
    let data;
    try {
        data = source.serialize().data || { type: 'FeatureCollection', features: [] };
    } catch (e) {
        data = { type: 'FeatureCollection', features: [] };
    }
    data.features.push(polygon);
    source.setData(data);

    lastObjectId = objectId;

    if (typeof addSimulationObject === 'function') {
        addSimulationObject(obj.type, { lat, lng }, obj.height || 50, (obj.width || 50 + obj.depth || 50) / 2, objectId);
    }
}

// Функция удаления последнего добавленного объекта
function deleteLastObject() {
    if (!map3d || !map3d.getSource('user-objects')) {
        alert('Нет объектов для удаления');
        return;
    }
    if (!lastObjectId) {
        alert('Нечего удалять');
        return;
    }

    const source = map3d.getSource('user-objects');
    let data;
    try {
        data = source.serialize().data || { type: 'FeatureCollection', features: [] };
    } catch (e) {
        data = { type: 'FeatureCollection', features: [] };
    }

    const newFeatures = data.features.filter(f => f.id !== lastObjectId);
    if (newFeatures.length === data.features.length) {
        alert('Объект не найден');
        return;
    }

    source.setData({ type: 'FeatureCollection', features: newFeatures });

    if (typeof removeSimulationObject === 'function') {
        removeSimulationObject(lastObjectId);
    }

    lastObjectId = null;
    alert('Последний объект удалён');
}

// Экспорт
window.enableObjectPlacement = enableObjectPlacement;
window.deleteLastObject = deleteLastObject;
window.openAirTurbineEditor = openAirTurbineEditor;
window.openWaterTurbineEditor = openWaterTurbineEditor;