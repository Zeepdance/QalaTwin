// export3d.js – выделение участка на 3D-карте через maplibre-gl-draw

let drawControl = null;
let drawActive = false;

function enable3DAreaDraw() {
  if (!map3d) {
    alert('3D карта не загружена');
    return;
  }

  if (drawActive) {
    // Если уже активен – выключаем
    disable3DAreaDraw();
    return;
  }

  // Создаём контрол рисования, если ещё не создан
  if (!drawControl) {
    const Draw = new MaplibreDraw({
      displayControlsDefault: false,
      controls: {
        polygon: false,
        line_string: false,
        point: false,
        trash: true,
        combine_features: false,
        uncombine_features: false
      },
      // Разрешаем только прямоугольник (через создание полигона, но можно ограничить)
      // В MaplibreDraw нет прямого "rectangle", но можно создать полигон и затем обработать
    });
    map3d.addControl(Draw, 'top-left');
    drawControl = Draw;

    // Слушаем событие создания фичи
    map3d.on('draw.create', onDrawCreate);
    map3d.on('draw.delete', onDrawDelete);
    map3d.on('draw.update', onDrawUpdate);
  }

  // Переключаем режим рисования полигона
  // По умолчанию Draw.changeMode('draw_polygon') позволяет рисовать полигон
  // Пользователь нарисует прямоугольник (четыре точки)
  drawControl.changeMode('draw_polygon');
  drawActive = true;
  document.getElementById('exportArea3DBtn')?.classList.add('active');
  alert('Нарисуйте прямоугольник на карте (кликните для углов, дважды для завершения)');
}

function disable3DAreaDraw() {
  if (drawControl) {
    // Сбрасываем режим
    drawControl.changeMode('simple_select');
    // Удаляем все нарисованные фичи (очищаем)
    const features = drawControl.getAll();
    if (features.features.length > 0) {
      drawControl.delete(features.features[0].id);
    }
  }
  drawActive = false;
  document.getElementById('exportArea3DBtn')?.classList.remove('active');
}

function onDrawCreate(e) {
  // e.features – массив созданных фич
  const feature = e.features[0];
  if (feature.geometry.type === 'Polygon') {
    const coordinates = feature.geometry.coordinates[0]; // массив [lng, lat]
    // Вычисляем bounding box
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    coordinates.forEach(coord => {
      minLng = Math.min(minLng, coord[0]);
      maxLng = Math.max(maxLng, coord[0]);
      minLat = Math.min(minLat, coord[1]);
      maxLat = Math.max(maxLat, coord[1]);
    });

    const bounds = { minLng, maxLng, minLat, maxLat };
    const exportedData = collectObjectsInBounds3D(bounds);
    exportedData.bounds = {
      southWest: [minLat, minLng],
      northEast: [maxLat, maxLng]
    };
    exportToJSON(exportedData);

    // Очищаем и выключаем режим
    disable3DAreaDraw();
  }
}

function onDrawDelete(e) {
  // Можно ничего не делать, просто выключаем активность, если нужно
  drawActive = false;
  document.getElementById('exportArea3DBtn')?.classList.remove('active');
}

function onDrawUpdate(e) {
  // Аналогично, если нужно
}

// Функция сбора объектов внутри bounds (копируем из предыдущего export.js)
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

function exportToJSON(data) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `city-segment-3d-${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  alert('✅ Участок экспортирован! Файл сохранён.');
}

// Делаем функцию глобальной
window.enable3DAreaDraw = enable3DAreaDraw;