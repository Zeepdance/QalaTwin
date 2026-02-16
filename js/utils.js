// Вспомогательные функции и константы

// Константы категорий
const CATEGORIES = {
    ATTRACTION: 'attraction',
    NATURE: 'nature',
    MUSEUM: 'museum',
    RESTAURANT: 'restaurant',
    PARK: 'park',
    ALL: 'all'
};

// Цвета по категориям
const CATEGORY_COLORS = {
    attraction: '#ef4444',
    nature: '#10b981',
    museum: '#8b5cf6',
    restaurant: '#f59e0b',
    park: '#06b6d4',
    default: '#667eea'
};

// Названия категорий
const CATEGORY_NAMES = {
    attraction: 'Достопримечательность',
    nature: 'Природа',
    museum: 'Музей',
    restaurant: 'Ресторан',
    park: 'Парк'
};

// Иконки FontAwesome по типам
const CATEGORY_ICONS = {
    attraction: 'landmark',
    nature: 'tree',
    museum: 'museum',
    restaurant: 'utensils',
    park: 'leaf'
};

/**
 * Получить цвет для категории
 */
function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
}

/**
 * Получить название категории
 */
function getCategoryName(category) {
    return CATEGORY_NAMES[category] || 'Место';
}

/**
 * Получить иконку FontAwesome
 */
function getCategoryIcon(icon) {
    return `<i class="fas fa-${icon}"></i>`;
}

/**
 * Форматировать расстояние
 */
function formatDistance(meters) {
    if (meters >= 1000) {
        return (meters / 1000).toFixed(1) + ' км';
    }
    return Math.round(meters) + ' м';
}

/**
 * Форматировать время
 */
function formatTime(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
        return minutes + ' мин';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}мин`;
}

/**
 * Получить эко-значок для оценки
 */
function getEcoScoreBadge(score) {
    if (score >= 9) {
        return '<span class="eco-score-badge eco-score-excellent"><i class="fas fa-leaf"></i> Отлично</span>';
    }
    if (score >= 7.5) {
        return '<span class="eco-score-badge eco-score-good"><i class="fas fa-leaf"></i> Хорошо</span>';
    }
    if (score >= 6) {
        return '<span class="eco-score-badge eco-score-moderate"><i class="fas fa-leaf"></i> Средне</span>';
    }
    return '<span class="eco-score-badge eco-score-poor"><i class="fas fa-smog"></i> Плохо</span>';
}

/**
 * Вычислить расстояние между двумя точками (формула Хаверсина)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Радиус Земли в км
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}