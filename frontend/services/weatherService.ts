

export interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    uvIndex: number;
    visibility: number;
    weatherCode: number;
    isDay: number;
  };
  aqi: number;
  daily: Array<{
    date: string;
    code: number;
    maxTemp: number;
    minTemp: number;
    precipProb: number;
    precipSum: number;
  }>;
  hourly: Array<{
    time: string;
    temp: number;
    windSpeed: number;
  }>;
}

export const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    // Fetch Weather Data
    // Uses Open-Meteo which provides global coverage
    // Changed forecast_days to 8 to ensure we have a full 7-day forecast available
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,visibility,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=8`;
    
    // Fetch AQI Data
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(aqiUrl)
    ]);

    if (!weatherRes.ok) throw new Error('Failed to fetch weather data');

    const weatherJson = await weatherRes.json();
    
    // Handle AQI gracefully as it may not exist for oceans/remote areas
    let aqiValue = 0;
    if (aqiRes.ok) {
        try {
            const aqiJson = await aqiRes.json();
            aqiValue = aqiJson.current?.us_aqi ?? 0;
        } catch (e) {
            console.warn("AQI data unavailable for this location", e);
        }
    }

    const current = weatherJson.current;
    const daily = weatherJson.daily;
    const hourly = weatherJson.hourly;

    if (!current || !daily || !hourly) return null;

    // Process Daily Forecast with safety checks
    // Slice 7 days for the new forecast UI
    const processedDaily = daily.time ? daily.time.slice(0, 7).map((time: string, index: number) => ({
      date: time,
      code: daily.weather_code?.[index] ?? 0,
      maxTemp: daily.temperature_2m_max?.[index] ?? 0,
      minTemp: daily.temperature_2m_min?.[index] ?? 0,
      precipProb: daily.precipitation_probability_max?.[index] ?? 0,
      precipSum: daily.precipitation_sum?.[index] ?? 0,
    })) : [];

    // Process Hourly (Next 24 hours for graph)
    // Robust index finding for global timezones
    let currentHourIndex = 0;
    if (hourly.time && current.time) {
        currentHourIndex = hourly.time.findIndex((t: string) => t === current.time);
        
        // If exact match fail (sometimes ISO formats diff), try matching YYYY-MM-DDTHH
        if (currentHourIndex === -1) {
            const currentHourStr = current.time.substring(0, 13);
            currentHourIndex = hourly.time.findIndex((t: string) => t.substring(0, 13) === currentHourStr);
        }
        
        // Final fallback
        if (currentHourIndex === -1) currentHourIndex = 0;
    }

    const processedHourly = hourly.time ? hourly.time.slice(currentHourIndex, currentHourIndex + 24).map((time: string, index: number) => ({
      time: time,
      temp: hourly.temperature_2m?.[currentHourIndex + index] ?? 0,
      windSpeed: hourly.wind_speed_10m?.[currentHourIndex + index] ?? 0
    })) : [];

    return {
      current: {
        temperature: current.temperature_2m ?? 0,
        humidity: current.relative_humidity_2m ?? 0,
        windSpeed: current.wind_speed_10m ?? 0,
        windDirection: current.wind_direction_10m ?? 0,
        pressure: current.pressure_msl ?? 1013,
        uvIndex: daily.uv_index_max?.[0] ?? 0,
        visibility: hourly.visibility?.[currentHourIndex] ?? 10000,
        weatherCode: current.weather_code ?? 0,
        isDay: current.is_day ?? 1,
      },
      aqi: aqiValue,
      daily: processedDaily,
      hourly: processedHourly
    };

  } catch (error) {
    console.error("Weather API Error:", error);
    return null;
  }
};

export const getWeatherIconType = (code: number): 'sun' | 'cloud' | 'rain' | 'snow' | 'storm' => {
  if (code === 0 || code === 1) return 'sun';
  if (code === 2 || code === 3) return 'cloud';
  if ([45, 48].includes(code)) return 'cloud'; 
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ([95, 96, 99].includes(code)) return 'storm';
  return 'sun';
};

export const getWeatherLabel = (code: number): string => {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if ([51, 53, 55].includes(code)) return 'Drizzle';
  if ([56, 57].includes(code)) return 'Freezing Drizzle';
  if ([61, 63, 65].includes(code)) return 'Rain';
  if ([66, 67].includes(code)) return 'Freezing Rain';
  if ([71, 73, 75].includes(code)) return 'Snow Fall';
  if (code === 77) return 'Snow Grains';
  if ([80, 81, 82].includes(code)) return 'Rain Showers';
  if ([85, 86].includes(code)) return 'Snow Showers';
  if (code === 95) return 'Thunderstorm';
  if ([96, 99].includes(code)) return 'Thunderstorm with Hail';
  return 'Unknown';
};
