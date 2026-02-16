// weather.js - Реальные данные о погоде и качестве воздуха от API-Ninjas + OpenWeatherMap

const NINJAS_API_KEY = 'e44e6995dbmsh03246470cdb6e98p1d4a20jsnfad51bba3894';
const OPENWEATHER_API_KEY = '6bcae7bdca928b69c104d7d44e95b5ff'; // резерв
const DEFAULT_LAT = 49.9485;
const DEFAULT_LON = 82.6287;

// Кэш
let aqiCache = { value: null, dominant: null, timestamp: null };
let weatherCache = { data: null, timestamp: null };
let aqiHistory = [];

// ------------------ API-NINJAS: ТЕКУЩАЯ ПОГОДА ------------------
async function fetchNinjasWeather(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
    const url = `https://api.api-ninjas.com/v1/weather?lat=${lat}&lon=${lon}`;
    try {
        const response = await fetch(url, {
            headers: { 'X-Api-Key': NINJAS_API_KEY }
        });
        if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
        const data = await response.json();
        return {
            temp: data.temp,           // °C
            feels_like: data.feels_like,
            humidity: data.humidity,    // %
            wind_speed: data.wind_speed, // м/с
            wind_degrees: data.wind_degrees,
            cloud_pct: data.cloud_pct,
            pressure: data.pressure,
            min_temp: data.min_temp,
            max_temp: data.max_temp
        };
    } catch (error) {
        console.warn('❌ API-Ninjas weather error:', error);
        return null;
    }
}

// ------------------ API-NINJAS: КАЧЕСТВО ВОЗДУХА ------------------
async function fetchNinjasAQI(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
    const url = `https://api.api-ninjas.com/v1/airquality?lat=${lat}&lon=${lon}`;
    try {
        const response = await fetch(url, {
            headers: { 'X-Api-Key': NINJAS_API_KEY }
        });
        if (!response.ok) throw new Error(`AQI API error: ${response.status}`);
        const data = await response.json();
        const dominant = getDominantPollutant(data);
        return {
            aqi: data.overall_aqi,
            dominant,
            components: {
                pm2_5: data["PM2.5"]?.concentration,
                pm10: data["PM10"]?.concentration,
                o3: data["O3"]?.concentration,
                no2: data["NO2"]?.concentration,
                so2: data["SO2"]?.concentration,
                co: data["CO"]?.concentration
            }
        };
    } catch (error) {
        console.warn('❌ API-Ninjas AQI error:', error);
        return null;
    }
}

// ------------------ OpenWeatherMap (резерв) ------------------
async function fetchOpenWeatherAQI(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.list?.length > 0) {
            const item = data.list[0];
            const aqiLevel = item.main.aqi; // 1..5
            const components = item.components;
            let dominant = 'PM2.5';
            let max = components.pm2_5 || 0;
            if (components.pm10 > max) { dominant = 'PM10'; max = components.pm10; }
            if (components.no2 > max) { dominant = 'NO₂'; max = components.no2; }
            if (components.so2 > max) { dominant = 'SO₂'; max = components.so2; }
            if (components.o3 > max) { dominant = 'O₃'; max = components.o3; }
            const aqiValue = convertOpenWeatherAQI(aqiLevel);
            return { aqi: aqiValue, dominant };
        }
    } catch (error) {
        console.warn('❌ OpenWeather error:', error);
    }
    return null;
}

function convertOpenWeatherAQI(level) {
    const map = { 1: 25, 2: 65, 3: 95, 4: 145, 5: 195 };
    return map[level] || 65;
}

// Определение доминирующего загрязнителя
function getDominantPollutant(data) {
    const pollutants = ['PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO'];
    let max = 0, dominant = 'PM2.5';
    pollutants.forEach(p => {
        if (data[p] && data[p].aqi > max) {
            max = data[p].aqi;
            dominant = p;
        }
    });
    return dominant;
}

// ------------------ ОСНОВНЫЕ ФУНКЦИИ ------------------
async function fetchCurrentAQI(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
    // Проверка кэша (10 минут)
    if (aqiCache.timestamp && (Date.now() - aqiCache.timestamp < 10 * 60 * 1000)) {
        return { aqi: aqiCache.value, dominant: aqiCache.dominant };
    }

    const ninjasData = await fetchNinjasAQI(lat, lon);
    if (ninjasData) {
        aqiCache.value = ninjasData.aqi;
        aqiCache.dominant = ninjasData.dominant;
        aqiCache.timestamp = Date.now();
        addToHistory(ninjasData.aqi);
        return ninjasData;
    }

    const owmData = await fetchOpenWeatherAQI(lat, lon);
    if (owmData) {
        aqiCache.value = owmData.aqi;
        aqiCache.dominant = owmData.dominant;
        aqiCache.timestamp = Date.now();
        addToHistory(owmData.aqi);
        return owmData;
    }

    console.warn('⚠️ Используется симулированный AQI');
    return { aqi: 65, dominant: 'PM2.5', error: true };
}

async function fetchCurrentWeather(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
    if (weatherCache.timestamp && (Date.now() - weatherCache.timestamp < 10 * 60 * 1000)) {
        return weatherCache.data;
    }

    const ninjasWeather = await fetchNinjasWeather(lat, lon);
    if (ninjasWeather) {
        weatherCache.data = ninjasWeather;
        weatherCache.timestamp = Date.now();
        return ninjasWeather;
    }

    // Можно добавить резервный OpenWeatherMap для погоды, но пока обойдёмся симуляцией
    return {
        temp: 10,
        feels_like: 8,
        humidity: 70,
        wind_speed: 5,
        wind_degrees: 180,
        cloud_pct: 50,
        pressure: 1013,
        min_temp: 8,
        max_temp: 12
    };
}

// ------------------ ИСТОРИЯ AQI ------------------
function addToHistory(aqiValue) {
    const now = new Date();
    const hour = now.getHours().toString().padStart(2, '0') + ':00';
    aqiHistory.push({ hour, aqi: aqiValue, timestamp: now.getTime() });
    const grouped = new Map();
    aqiHistory.forEach(item => grouped.set(item.hour, item));
    aqiHistory = Array.from(grouped.values()).sort((a, b) => a.timestamp - b.timestamp).slice(-24);
}

function getAQIHistory() {
    if (aqiHistory.length === 0) return generateSimulatedHistory();
    return {
        hours: aqiHistory.map(item => item.hour),
        aqiData: aqiHistory.map(item => item.aqi)
    };
}

function generateSimulatedHistory() {
    const hours = [], aqiData = [];
    for (let i = 23; i >= 0; i--) {
        const date = new Date(Date.now() - i * 3600 * 1000);
        hours.push(date.getHours().toString().padStart(2, '0') + ':00');
        let base = 65;
        const h = date.getHours();
        if (h >= 7 && h <= 10) base = 85;
        else if (h >= 17 && h <= 20) base = 95;
        else if (h <= 5) base = 45;
        aqiData.push(base + Math.floor(Math.random() * 15 - 5));
    }
    return { hours, aqiData };
}

// ------------------ СТАТУС AQI ------------------
function getAQIStatus(aqi) {
    if (aqi <= 50) return { text: 'Хорошее', badge: 'good' };
    if (aqi <= 100) return { text: 'Умеренное', badge: 'moderate' };
    if (aqi <= 150) return { text: 'Нездоровое', badge: 'unhealthy' };
    return { text: 'Опасное', badge: 'unhealthy' };
}

// ------------------ ЭКСПОРТ ------------------
window.WeatherAPI = {
    fetchCurrentAQI,
    fetchCurrentWeather,
    getAQIHistory,
    getAQIStatus,
    refreshCurrentAQI: () => { aqiCache.timestamp = null; return fetchCurrentAQI(); }
};