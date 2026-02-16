// export.js – выделение участка и экспорт объектов в JSON (работает на 2D и 3D)

let areaSelectionActive = false;
let drawControl = null;
let drawnRectangle = null;

// Переменные для 3D-режима
let firstClick = null;
let tempMarker = null;

function loadLeafletDraw() {
  return new Promise((resolve, reject) => {
    if (window.L && L.Draw) return resolve();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

async function enableAreaSelection() {
  if (!window.map) {
    alert('2D карта не загружена');
    return;
  }
  // Проверяем, что map3d определена (даже если не активна)
  if (typeof map3d === 'undefined') {
    alert('3D карта не инициализирована');
    return;
  }

  if (areaSelectionActive) {
    disableAreaSelection();
    return;
  }

  if (window.is3DActive) {
    enable3DAreaSelection();
  } else {
    await enable2DAreaSelection();
  }
}

function disableAreaSelection() {
  if (window.is3DActive) {
    disable3DAreaSelection();
  } else {
    disable2DAreaSelection();
  }
  areaSelectionActive = false;
  const btn = document.getElementById('exportAreaBtn');
  if (btn) btn.classList.remove('active');
}

// -------------------- 2D режим --------------------
async function enable2DAreaSelection() {
  try {
    await loadLeafletDraw();
  } catch (e) {
    alert('Не удалось загрузить инструмент рисования');
    return;
  }
  if (!drawControl) {
    drawControl = new L.Control.Draw({
      draw: {
        polyline: false,
        polygon: false,
        circle: false,
        marker: false,
        circlemarker: false,
        rectangle: true
      },
      edit: false
    });
    map.addControl(drawControl);
  }
  map.on(L.Draw.Event.CREATED, onAreaCreated2D);
  areaSelectionActive = true;
  document.getElementById('exportAreaBtn')?.classList.add('active');
  alert('Нарисуйте прямоугольник на карте, чтобы выделить участок');
}

function disable2DAreaSelection() {
  map.off(L.Draw.Event.CREATED, onAreaCreated2D);
  if (drawControl) {
    map.removeControl(drawControl);
    drawControl = null;
  }
  if (drawnRectangle) {
    map.removeLayer(drawnRectangle);
    drawnRectangle = null;
  }
}

function onAreaCreated2D(e) {
  const layer = e.layer;
  drawnRectangle = layer;
  map.addLayer(layer);
  const bounds = layer.getBounds();
  const exportedData = collectObjectsInBounds2D(bounds);
  exportedData.bounds = {
    southWest: [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
    northEast: [bounds.getNorthEast().lat, bounds.getNorthEast().lng]
  };
  exportToJSON(exportedData);
  disableAreaSelection();
}

// -------------------- 3D режим --------------------
function enable3DAreaSelection() {
  console.log('3D режим выделения активирован');
  console.log('map3d существует?', map3d);
  firstClick = null;
  tempMarker = null;

  // Убедимся, что источник и слои существуют
  if (!map3d.getSource('selection-rectangle')) {
    map3d.addSource('selection-rectangle', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] } }
    });
    map3d.addLayer({
      id: 'selection-rectangle-fill',
      type: 'fill',
      source: 'selection-rectangle',
      paint: { 'fill-color': '#00ff9d', 'fill-opacity': 0.2 }
    });
    map3d.addLayer({
      id: 'selection-rectangle-outline',
      type: 'line',
      source: 'selection-rectangle',
      paint: { 'line-color': '#00ff9d', 'line-width': 3 }
    });
  }

  // Убираем старый обработчик и вешаем новый
  map3d.off('click', on3DMapClick);
  map3d.on('click', on3DMapClick);
  map3d.getCanvas().style.cursor = 'crosshair';
  areaSelectionActive = true;
  document.getElementById('exportAreaBtn')?.classList.add('active');
  alert('Кликните дважды: первый угол прямоугольника, затем противоположный');
}

function disable3DAreaSelection() {
  console.log('3D режим выделения деактивирован');
  map3d.off('click', on3DMapClick);
  map3d.getCanvas().style.cursor = '';

  if (tempMarker) {
    tempMarker.remove();
    tempMarker = null;
  }

  if (map3d.getSource('selection-rectangle')) {
    map3d.getSource('selection-rectangle').setData({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [] }
    });
  }

  firstClick = null;
}

function on3DMapClick(e) {
  console.log('Клик по 3D карте', e.lngLat);
  const lngLat = e.lngLat;
  const coords = [lngLat.lng, lngLat.lat];

  if (!firstClick) {
    firstClick = coords;
    console.log('Первый угол:', coords);
    const el = document.createElement('div');
    el.style.width = '10px';
    el.style.height = '10px';
    el.style.background = '#00ff9d';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    tempMarker = new maplibregl.Marker({ element: el })
      .setLngLat(firstClick)
      .addTo(map3d);
  } else {
    const secondClick = coords;
    console.log('Второй угол:', coords);
    const minLng = Math.min(firstClick[0], secondClick[0]);
    const maxLng = Math.max(firstClick[0], secondClick[0]);
    const minLat = Math.min(firstClick[1], secondClick[1]);
    const maxLat = Math.max(firstClick[1], secondClick[1]);

    const polygon = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat]
        ]]
      }
    };

    map3d.getSource('selection-rectangle').setData(polygon);

    const bounds = { minLng, maxLng, minLat, maxLat };
    const exportedData = collectObjectsInBounds3D(bounds);
    exportedData.bounds = {
      southWest: [minLat, minLng],
      northEast: [maxLat, maxLng]
    };

    exportToJSON(exportedData);
    disableAreaSelection();

    setTimeout(() => {
      if (map3d.getSource('selection-rectangle')) {
        map3d.getSource('selection-rectangle').setData({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [] }
        });
      }
    }, 500);
  }
}

function collectObjectsInBounds3D(bounds) {
  const result = { places: [], userObjects2D: [], userObjects3D: [] };

  if (window.places) {
    window.places.forEach(p => {
      const lat = p.coords[0], lng = p.coords[1];
      if (lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng)
        result.places.push(p);
    });
  }
  if (window.placedObjects) {
    window.placedObjects.forEach(obj => {
      const lat = obj.latlng.lat, lng = obj.latlng.lng;
      if (lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng)
        result.userObjects2D.push(obj);
    });
  }
  if (window.placedObjects3D) {
    window.placedObjects3D.forEach(obj => {
      const lat = obj.coords.lat, lng = obj.coords.lng;
      if (lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng)
        result.userObjects3D.push(obj);
    });
  }
  return result;
}

function collectObjectsInBounds2D(bounds) {
  const result = { places: [], userObjects2D: [], userObjects3D: [] };
  if (window.places) {
    window.places.forEach(p => {
      if (bounds.contains([p.coords[0], p.coords[1]])) result.places.push(p);
    });
  }
  if (window.placedObjects) {
    window.placedObjects.forEach(obj => {
      if (bounds.contains([obj.latlng.lat, obj.latlng.lng])) result.userObjects2D.push(obj);
    });
  }
  if (window.placedObjects3D) {
    window.placedObjects3D.forEach(obj => {
      if (bounds.contains([obj.coords.lat, obj.coords.lng])) result.userObjects3D.push(obj);
    });
  }
  return result;
}

function exportToJSON(data) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `city-segment-${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  alert('✅ Участок экспортирован! Файл сохранён.');
}

window.enableAreaSelection = enableAreaSelection;