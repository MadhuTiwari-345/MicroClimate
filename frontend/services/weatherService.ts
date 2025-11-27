import { fetchForecastByCity, ForecastResponse } from './api';
import { getCityFromCoordinates } from './locationservice';

const API_BASE_URL = import.meta.env.DEV ? "http://127.0.0.1:8000" : "";

export interface WeatherData {
  city: string;
  lat: number;
  lon: number;
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
  }>;
  hourly: Array<{
    time: string;
    temperature: number;
    windSpeed: number;
  }>;
}

export const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    // Fetch weather directly from backend using lat/lon endpoint
    const response = await fetch(`${API_BASE_URL}/weather/forecast_by_coords?lat=${lat}&lon=${lon}`);
    
    if (!response.ok) {
      console.error("Weather API failed:", response.statusText);
      return null;
    }

    const data: ForecastResponse = await response.json();
    
    return {
      city: data.city,
      lat: data.lat,
      lon: data.lon,
      current: data.current,
      aqi: data.aqi,
      daily: data.daily,
      hourly: data.hourly
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
