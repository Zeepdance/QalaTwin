// app.js - Точка входа
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Smart City ВКО (Цифровой двойник) запущен!');
    
    if (typeof initializeMap === 'function') {
        initializeMap();
    }
    
    if (typeof addMarkers === 'function') {
        addMarkers(); // маркеры достопримечательностей
    }
    
    if (typeof initializeUIHandlers === 'function') {
        initializeUIHandlers();
    }
    
    if (typeof updateAirQuality === 'function') {
        updateAirQuality();
    }
    
    if (typeof initSimulation === 'function') {
        initSimulation(); // инициализация панели моделирования
    }
});