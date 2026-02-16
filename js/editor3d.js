// editor3d.js - Редактор 3D-объектов для цифрового двойника

let isEditModeActive = false;
let currentEditorCoords = null; // координаты клика [lng, lat]

// Ссылки на элементы
const editorPanel = document.getElementById('editorPanel');
const objectTypeSelect = document.getElementById('objectTypeSelect');
const heightSlider = document.getElementById('heightSlider');
const sizeSlider = document.getElementById('sizeSlider');
const heightValue = document.getElementById('heightValue');
const sizeValue = document.getElementById('sizeValue');
const addObjectBtn = document.getElementById('addObjectBtn');

// Обновление отображаемых значений ползунков
heightSlider.addEventListener('input', () => {
    heightValue.textContent = heightSlider.value;
});
sizeSlider.addEventListener('input', () => {
    sizeValue.textContent = sizeSlider.value;
});

// Включение/выключение режима редактирования (вызывается кнопкой)
function toggleEditMode() {
    if (!map3d || !is3DActive) {
        alert('Сначала включите 3D-режим');
        return;
    }
    isEditModeActive = !isEditModeActive;
    const btn = document.getElementById('editModeBtn');
    if (isEditModeActive) {
        btn.classList.add('active');
        map3d.getCanvas().style.cursor = 'crosshair';
        // Добавляем обработчик клика по карте
        map3d.on('click', onMapClick);
    } else {
        btn.classList.remove('active');
        map3d.getCanvas().style.cursor = '';
        map3d.off('click', onMapClick);
        hideEditor();
    }
}

// Обработчик клика по 3D-карте в режиме редактирования
function onMapClick(e) {
    if (!isEditModeActive) return;
    // Сохраняем координаты
    currentEditorCoords = [e.lngLat.lng, e.lngLat.lat];
    // Показываем панель редактора
    showEditor();
}

function showEditor() {
    editorPanel.style.display = 'block';
}

function hideEditor() {
    editorPanel.style.display = 'none';
    currentEditorCoords = null;
}

// Добавление объекта на карту
function addObject() {
    if (!currentEditorCoords) {
        alert('Сначала выберите место на карте');
        return;
    }

    const type = objectTypeSelect.value;
    const height = parseInt(heightSlider.value); // этажи
    const size = parseInt(sizeSlider.value); // размер в метрах (приблизительная сторона квадрата)

    // Цвет в зависимости от типа
    const colors = {
        residential: '#3b82f6', // синий
        school: '#f59e0b',       // оранжевый
        park: '#10b981',         // зелёный
        hospital: '#ef4444',      // красный
        industrial: '#8b5cf6'     // фиолетовый
    };
    const color = colors[type] || '#64748b';

    // Создаём GeoJSON-полигон (квадрат вокруг точки)
    const half = size / 2 / 111000; // приблизительный пересчёт метров в градусы (грубо)
    const [lng, lat] = currentEditorCoords;
    const polygon = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [lng - half, lat - half],
                [lng + half, lat - half],
                [lng + half, lat + half],
                [lng - half, lat + half],
                [lng - half, lat - half]
            ]]
        },
        properties: {
            type: type,
            height: height * 3, // примерно 3 метра на этаж
            color: color,
            baseHeight: 0
        }
    };

    // Добавляем источник данных, если его нет
    if (!map3d.getSource('user-objects')) {
        map3d.addSource('user-objects', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });

        // Добавляем слой для отображения объектов
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

    // Получаем текущие объекты и добавляем новый
    const source = map3d.getSource('user-objects');
    const data = source._data || { type: 'FeatureCollection', features: [] };
    data.features.push(polygon);
    source.setData(data);

    // Обновляем метрики (используем существующую систему simulation.js)
    if (typeof addSimulationObject === 'function') {
        addSimulationObject(type, { lat, lng }, height, size);
    }

    // Скрываем панель
    hideEditor();

    // Сбрасываем курсор, но остаёмся в режиме редактирования для следующего объекта
    // (можно добавить опцию "разместить ещё")
}

// Событие кнопки
addObjectBtn.addEventListener('click', addObject);

// Экспортируем функции в глобальную область
window.toggleEditMode = toggleEditMode;
window.hideEditor = hideEditor;