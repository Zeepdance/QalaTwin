// places.js - ТОП-20 ВКО с фотографиями
// Только ваши ссылки, без fallback. Одно фото на место.

let markers = [];
let activeCategory = 'all';

const places = [
    // 1. Гора Белуха (восточная)
    {
        name: "🏔️ Гора Белуха (восточная вершина)",
        coords: [49.806944, 86.589722],
        category: "nature",
        rating: 5.0,
        description: "Высшая точка Алтая и Сибири (4509 м). Объект Всемирного наследия ЮНЕСКО. Священная гора.",
        icon: "mountain",
        address: "Катон-Карагайский район, граница с РФ",
        imageGallery: [
            "https://avatars.mds.yandex.net/get-altay/1881734/2a000001761cf353f601f7448197575f2c9e/orig"
        ]
    },
    // 2. Катон-Карагайский национальный парк
    {
        name: "🏞️ Катон-Карагайский национальный парк (центр)",
        coords: [49.166667, 85.600000],
        category: "nature",
        rating: 5.0,
        description: "Крупнейший нацпарк Казахстана (643 тыс. га). Горы, кедровые леса, снежный барс, объект ЮНЕСКО.",
        icon: "tree",
        address: "с. Катон-Карагай, ул. Кайсенова, 53",
        imageGallery: [
            "https://kz24.news/wp-content/uploads/2024/12/priroda-katon-karagayskogo-parka.jpg"
        ]
    },
    // 3. Рахмановские Ключи
    {
        name: "💧 Рахмановские Ключи",
        coords: [49.532965, 86.513615],
        category: "nature",
        rating: 4.9,
        description: "Термальные радоновые источники (+40°C). Курорт на высоте 1760 м. Работают с 1769 года.",
        icon: "hot-tub",
        address: "Катон-Карагайский район, Рахмановское озеро",
        imageGallery: [
            "https://static.yk-news.kz/20180802rah.jpg"
        ]
    },
    // 4. Водопад Коккольский
    {
        name: "💦 Водопад Коккольский",
        coords: [49.719167, 86.662222],
        category: "nature",
        rating: 4.8,
        description: "Самый большой водопад ВКО. Высота 60-80 м. 23 км от Рахмановских Ключей.",
        icon: "water",
        address: "Катон-Карагайский район, р. Большая Кокколь",
        imageGallery: [
            "https://greenway.kz/upload/medialibrary/ec9/ec94327c8751025f733585a574a7dbf9.jpg"
        ]
    },
    // 5. Берельские курганы
    {
        name: "👑 Берельские курганы",
        coords: [49.373333, 86.438056],
        category: "attraction",
        rating: 4.8,
        description: "«Казахстанская долина царей». Скифские курганы V-IV вв. до н.э. Золото, мумии, вечная мерзлота.",
        icon: "monument",
        address: "Катон-Карагайский район, 7 км от с. Берель",
        imageGallery: [
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWU9nIMIe4DsvHfCXZ4cQV8E6gPgCffz4YGA&s"
        ]
    },
    // 6. Озеро Маркаколь
    {
        name: "🌊 Озеро Маркаколь",
        coords: [48.750000, 85.750000],
        category: "nature",
        rating: 5.0,
        description: "Жемчужина Алтая. Заповедное озеро на высоте 1447 м. Ультрапресная вода, уникальная природа.",
        icon: "water",
        address: "Курчумский район, Маркакольский заповедник",
        imageGallery: [
            "https://kz24.news/wp-content/uploads/2025/01/markakolskiy-zapovednik.jpg"
        ]
    },
    // 7. Бухтарминское водохранилище
    {
        name: "🌅 Бухтарминское водохранилище",
        coords: [49.572479, 83.563289],
        category: "nature",
        rating: 4.6,
        description: "«Казахстанское море». Крупнейшее водохранилище РК (5490 км²). Длина 425 км.",
        icon: "water",
        address: "Алтайский район, Бухтарма",
        imageGallery: [
            "https://primeminister.kz/assets/media/img-9262.jpeg"
        ]
    },
    // 8. Озеро Зайсан
    {
        name: "🌅 Озеро Зайсан",
        coords: [48.000000, 84.000000],
        category: "nature",
        rating: 4.7,
        description: "Огромное озеро (1810 км²). Рыбалка, живописные закаты, вид на горы.",
        icon: "water",
        address: "Зайсанский район, г. Зайсан",
        imageGallery: [
            "https://kz24.news/wp-content/uploads/2024/03/zaysan-kazahstan.jpg"
        ]
    },
    // 9. Киин-Кериш
    {
        name: "🪨 Киин-Кериш (Глиняный каньон)",
        coords: [48.133256, 84.491823],
        category: "nature",
        rating: 4.9,
        description: "«Марсианский пейзаж» Казахстана. Уникальный глиняный каньон возрастом 15-30 млн лет.",
        icon: "mountain",
        address: "Курчумский район, урочище Киин-Кериш",
        imageGallery: [
            "https://kz24.news/wp-content/uploads/2024/03/kiin-kirish.jpg"
        ]
    },
    // 10. Акбаур
    {
        name: "🪦 Акбаур (Сакральный комплекс)",
        coords: [49.675455, 82.687537],
        category: "attraction",
        rating: 4.7,
        description: "Древняя обсерватория эпохи неолита. Петроглифы, менгиры, каменные чаши.",
        icon: "monument",
        address: "Уланский район, 38 км от Усть-Каменогорска",
        imageGallery: [
            "https://kazpravda.kz/media/uploads/publication2/168/99/168998-image.jpg"
        ]
    },
    // 11. Этнодеревня
    {
        name: "🏡 Этнодеревня (Левобережный комплекс)",
        coords: [49.938000, 82.617092],
        category: "attraction",
        rating: 4.8,
        description: "Уникальный этнопарк под открытым небом. Усадьбы 13 национальностей.",
        icon: "home",
        address: "Левый берег, экопарк, Усть-Каменогорск",
        imageGallery: [
            "https://www.vkoem.kz/images/stories/content/LBK/vostochnyiy_massiv/svadebnyj-kompleks_Kozy-korpesh-i-bayan-sulu/1.jpg"
        ]
    },
    // 12. Музей-заповедник ВКО
    {
        name: "🏛️ Музей-заповедник ВКО (ул. Горького, 59)",
        coords: [49.947215, 82.619074],
        category: "museum",
        rating: 4.7,
        description: "Памятник архитектуры (бывший магазин купца Кожевникова, 1914 г.).",
        icon: "university",
        address: "ул. Горького, 59, Усть-Каменогорск",
        imageGallery: [
            "https://oskemen.info/uploads/posts/2011-07/1310551260_muz-zapovednik-2.jpg"
        ]
    },
    // 13. Плотина Усть-Каменогорской ГЭС
    {
        name: "🌊 Плотина Усть-Каменогорской ГЭС",
        coords: [49.901547, 82.717963],
        category: "attraction",
        rating: 4.6,
        description: "Уникальное гидротехническое сооружение на Иртыше. Живописная смотровая.",
        icon: "water",
        address: "пос. Меновное, Усть-Каменогорск",
        imageGallery: [
            "https://flashpress.kz/sites/default/files/VIT1805.jpg"
        ]
    },
    // 14. Сибинские озёра
    {
        name: "💎 Сибинские озёра (Большое Сибинское)",
        coords: [49.433791, 82.657021],
        category: "nature",
        rating: 4.7,
        description: "Бирюзовые озёра в 50 км от города. Уникальный цвет воды.",
        icon: "water",
        address: "Уланский район, Сибинские озёра",
        imageGallery: [
            "https://image.noks.kz/uploads/static/news/images/normal/3290/2928fec6fc1d74f5bd972854c94e2989.jpeg"
        ]
    },
    // 15. Горнолыжный курорт «Нуртау»
    {
        name: "🎿 Горнолыжный курорт «Нуртау»",
        coords: [50.212007, 82.697349],
        category: "nature",
        rating: 4.7,
        description: "Лучший горнолыжный курорт ВКО. Трассы 1800 и 2000 м, перепад 350 м.",
        icon: "skiing",
        address: "с. Бобровка, 35 км от Усть-Каменогорска",
        imageGallery: [
            "https://visiteast.kz/assets/files/gallery/202/f9f54bf8d402f02181ddf2b7cd781b4278d3bf50.jpg"
        ]
    },
    // 16. Гора Белуха (западная)
    {
        name: "🏔️ Гора Белуха (западная вершина)",
        coords: [49.805278, 86.575000],
        category: "nature",
        rating: 5.0,
        description: "Вторая вершина Белухи (4440 м). Маршрут сложнее восточной.",
        icon: "mountain",
        address: "Катон-Карагайский район, массив Белухи",
        imageGallery: [
            "https://resize.tripster.ru/luym4NjAz6kElIMF2gpmvvOVKt4=/fit-in/1220x600/filters:no_upscale()/https://cdn.tripster.ru/photos/cbbfe5c5-35f6-458a-af32-92263f3d6513.jpg"
        ]
    },
    // 17. Ледник Берельский
    {
        name: "❄️ Ледник Берельский",
        coords: [49.866667, 86.550000],
        category: "nature",
        rating: 4.8,
        description: "Один из крупнейших ледников Алтая. Отсюда начинается путь на Белуху.",
        icon: "mountain",
        address: "Катон-Карагайский район, массив Белухи",
        imageGallery: [
            "https://www.vtourisme.com/images/a_big003/image100.jpg"
        ]
    },
    // 18. Ботанический сад ВКО
    {
        name: "🌿 Ботанический сад ВКО",
        coords: [49.933998, 82.61295],
        category: "nature",
        rating: 4.6,
        description: "Уникальная коллекция растений. Дендрарий, альпийские горки, оранжерея.",
        icon: "tree",
        address: "ул. Бажова, 24/1, Усть-Каменогорск",
        imageGallery: [
            "https://otdyh-vko.kz//storage/1756/img-4329jpg.jpeg"
        ]
    },
    // 19. Ущелье Карагайлы
    {
        name: "🏞️ Ущелье Карагайлы",
        coords: [49.516667, 86.450000],
        category: "nature",
        rating: 4.7,
        description: "Живописное ущелье рядом с Рахмановскими Ключами. Кедровый лес, горная река.",
        icon: "mountain",
        address: "Катон-Карагайский район, близ Рахмановских Ключей",
        imageGallery: [
            "https://travel.orb.ru/upload/iblock/097/6fxvfinyzw56lb7vyyd14olsxowzh5xs.jpg"
        ]
    },
    // 20. Горнолыжный курорт «Алтайские Альпы»
    {
        name: "⛷️ Горнолыжный курорт «Алтайские Альпы»",
        coords: [49.940694, 83.008292],
        category: "nature",
        rating: 4.5,
        description: "Курорт в 24 км от УКГ. 5 подъёмников, 12+ трасс, альпийские домики.",
        icon: "skiing",
        address: "Горная Ульбинка, 24 км от Усть-Каменогорска",
        imageGallery: [
            "https://skigu.ru/upload/iblock/f17/f179494808f186cfaea5141cfe2c24b0.jpg"
        ]
    }
];

// ========== ФУНКЦИИ ГАЛЕРЕИ (ОДНО ФОТО) ==========
function createGalleryHTML(gallery, placeIndex) {
    if (!gallery || gallery.length === 0) return '';
    
    const uniqueId = 'gallery-' + placeIndex + '-' + Math.random().toString(36).substring(2, 8);
    
    // Если только одно фото — показываем без миниатюр
    if (gallery.length === 1) {
        return `
            <div class="place-gallery" data-gallery-id="${uniqueId}">
                <div class="gallery-main">
                    <img src="${gallery[0]}" 
                         id="${uniqueId}-main" 
                         alt="Фото места"
                         loading="lazy"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/320x180?text=Изображение+не+доступно'">
                </div>
            </div>
        `;
    }
    
    // Если несколько фото — полная галерея с миниатюрами (но сейчас не используется)
    let thumbnailsHTML = '';
    gallery.forEach((url, idx) => {
        thumbnailsHTML += `
            <img 
                src="${url}" 
                class="thumbnail ${idx === 0 ? 'active' : ''}" 
                onclick="event.stopPropagation(); switchGalleryImage('${uniqueId}', '${url}', this)"
                alt="Фото ${idx + 1}"
                loading="lazy"
                onerror="this.onerror=null; this.src='https://via.placeholder.com/60x60?text=Фото'"
            >
        `;
    });
    
    return `
        <div class="place-gallery" data-gallery-id="${uniqueId}">
            <div class="gallery-main">
                <img src="${gallery[0]}" 
                     id="${uniqueId}-main" 
                     alt="Главное фото"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/320x180?text=Изображение+не+доступно'">
            </div>
            <div class="gallery-thumbnails">
                ${thumbnailsHTML}
            </div>
        </div>
    `;
}

window.switchGalleryImage = function(galleryId, url, thumbnail) {
    const mainImg = document.getElementById(galleryId + '-main');
    if (mainImg) mainImg.src = url;
    
    const galleryDiv = document.querySelector(`[data-gallery-id="${galleryId}"]`);
    if (galleryDiv) {
        galleryDiv.querySelectorAll('.thumbnail').forEach(el => {
            el.classList.remove('active');
        });
    }
    thumbnail.classList.add('active');
};

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function getCategoryColor(category) {
    const colors = {
        attraction: '#ef4444',
        nature: '#10b981',
        museum: '#8b5cf6',
        restaurant: '#f59e0b',
        park: '#06b6d4',
        default: '#667eea'
    };
    return colors[category] || colors.default;
}

function getCategoryName(category) {
    const names = {
        attraction: 'Достопримечательность',
        nature: 'Природа',
        museum: 'Музей',
        restaurant: 'Ресторан',
        park: 'Парк'
    };
    return names[category] || 'Место';
}

function getCategoryIcon(icon) {
    return `<i class="fas fa-${icon}"></i>`;
}

function createCustomMarker(place) {
    const color = getCategoryColor(place.category);
    const iconHtml = `
        <div style="
            background: ${color};
            width: 40px;
            height: 40px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
        ">
            <div style="transform: rotate(45deg);">
                ${getCategoryIcon(place.icon)}
            </div>
        </div>
    `;
    
    return L.divIcon({
        className: 'custom-marker',
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
}

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========
function addMarkers(filterCategory = 'all') {
    if (!window.map) {
        console.error('❌ Карта не инициализирована');
        return;
    }

    if (markers.length > 0) {
        markers.forEach(marker => {
            try { window.map.removeLayer(marker); } catch(e) {}
        });
        markers = [];
    }

    const filteredPlaces = filterCategory === 'all' 
        ? places 
        : places.filter(p => p.category === filterCategory);

    filteredPlaces.forEach((place, idx) => {
        try {
            const marker = L.marker(place.coords, {
                icon: createCustomMarker(place)
            }).addTo(window.map);

            const popupContent = `
                <div class="custom-popup">
                    <div class="popup-title">${place.name}</div>
                    <div class="popup-category">${getCategoryName(place.category)}</div>
                    <div class="popup-address" style="font-size: 0.75rem; color: #6b7280; margin-bottom: 6px;">
                        <i class="fas fa-map-pin"></i> ${place.address}
                    </div>
                    <div class="popup-description">${place.description}</div>
                    ${place.imageGallery ? createGalleryHTML(place.imageGallery, 'popup-' + idx + '-' + place.name.substring(0,5)) : ''}
                    <div class="popup-rating">
                        <span class="stars">${'★'.repeat(Math.floor(place.rating))}${'☆'.repeat(5 - Math.floor(place.rating))}</span>
                        <span style="margin-left: 5px; font-weight: 600;">${place.rating}</span>
                    </div>
                    <button onclick="buildEcoRoute([${place.coords}], '${place.name.replace(/'/g, "\\'")}', 'standard')" 
                        class="btn btn-primary" style="width: 100%; margin-top: 10px;">
                        <i class="fas fa-leaf"></i> Эко-маршрут
                    </button>
                </div>
            `;

            marker.bindPopup(popupContent, { maxWidth: 320 });
            markers.push(marker);
        } catch(e) {
            console.error('❌ Ошибка маркера:', place.name, e);
        }
    });

    const totalEl = document.getElementById('totalPlaces');
    if (totalEl) totalEl.textContent = `${filteredPlaces.length} мест`;
}

function renderPlacesList(filterCategory = 'all', searchQuery = '') {
    const placesList = document.getElementById('placesList');
    if (!placesList) return;

    let filteredPlaces = filterCategory === 'all' 
        ? places 
        : places.filter(p => p.category === filterCategory);

    if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        filteredPlaces = filteredPlaces.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.address.toLowerCase().includes(query)
        );
    }

    if (filteredPlaces.length === 0) {
        placesList.innerHTML = `<div style="text-align: center; padding: 30px; color: #6b7280;">Места не найдены</div>`;
        return;
    }

    placesList.innerHTML = filteredPlaces.map((place, idx) => `
        <div class="place-card" onclick="focusOnPlace([${place.coords}], '${place.name.replace(/'/g, "\\'")}')">
            <div class="place-header">
                <div class="place-name">${place.name}</div>
                <div class="place-rating"><i class="fas fa-star"></i> ${place.rating}</div>
            </div>
            <div class="place-category">${getCategoryName(place.category)}</div>
            <div class="place-address" style="font-size: 0.75rem; color: #6b7280;">
                <i class="fas fa-map-marker-alt"></i> ${place.address}
            </div>
            <div class="place-description">${place.description.substring(0, 80)}...</div>
            ${place.imageGallery ? createGalleryHTML(place.imageGallery, 'list-' + idx + '-' + place.name.substring(0,5)) : ''}
            <div class="place-actions">
                <button onclick="event.stopPropagation(); buildEcoRoute([${place.coords}], '${place.name.replace(/'/g, "\\'")}', 'standard')" class="btn btn-primary">
                    <i class="fas fa-leaf"></i> Маршрут
                </button>
                <button onclick="event.stopPropagation(); focusOnPlace([${place.coords}], '${place.name.replace(/'/g, "\\'")}')" class="btn btn-secondary">
                    <i class="fas fa-map-marker-alt"></i> Показать
                </button>
            </div>
        </div>
    `).join('');
}

function focusOnPlace(coords, name) {
    if (!window.map) return;
    window.map.setView(coords, 13);
    markers.forEach(marker => {
        try {
            const mc = marker.getLatLng();
            if (Math.abs(mc.lat - coords[0]) < 0.001 && Math.abs(mc.lng - coords[1]) < 0.001) {
                marker.openPopup();
            }
        } catch(e) {}
    });
}

// Экспорт в глобальную область
window.places = places;
window.addMarkers = addMarkers;
window.renderPlacesList = renderPlacesList;
window.focusOnPlace = focusOnPlace;
window.getCategoryColor = getCategoryColor;
window.getCategoryName = getCategoryName;
window.getCategoryIcon = getCategoryIcon;
window.createGalleryHTML = createGalleryHTML; // <-- ЭТО НОВАЯ СТРОКА