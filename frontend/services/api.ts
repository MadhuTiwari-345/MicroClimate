const API_BASE_URL = "http://127.0.0.1:8000";

// Test API
export async function getHello() {
  const response = await fetch(`${API_BASE_URL}/api/hello`);
  if (!response.ok) {
    throw new Error("Failed to fetch from backend");
  }
  return await response.json();
}

// Fetch full forecast by city
export const fetchForecastByCity = async (city: string) => {
  const res = await fetch(`${API_BASE_URL}/weather/forecast?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error("Failed to fetch forecast");
  return await res.json();
};

// FULL CORRECT INTERFACE (Matches backend exactly)
export interface ForecastResponse {
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

  total_safe?: number;
  total_unsafe?: number;
}
