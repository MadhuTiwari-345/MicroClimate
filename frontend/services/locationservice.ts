// frontend/services/locationService.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // your FastAPI backend
});

// Search suggestions
export async function getLocationSuggestions(query: string) {
  const res = await api.get("/api/suggestions", {
    params: { q: query },
  });
  return res.data; // array of strings
}
// locationservice.ts
const API_BASE = "http://127.0.0.1:8000";

export async function getCoordinates(location: string): Promise<{ lat: number; lon: number; }> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/weather/forecast?city=${encodeURIComponent(location)}`);
    if (!res.ok) throw new Error("Failed to fetch forecast");

    const data = await res.json();
    return { lat: data.lat ?? 0, lon: data.lon ?? 0 };
  } catch (err) {
    console.error("getCoordinates failed:", err);
    throw err;
  }
}

// Also export a reverse geocode helper:
export async function getCityFromCoordinates(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/city?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("Failed reverse geocode");
    const data = await res.text(); // your backend returns a string like "New Delhi"
    return String(data);
  } catch (err) {
    console.warn("Reverse geocode failed", err);
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}


// (Optional) Microclimate summary
export async function getMicroclimateSnapshot(query: string) {
  const res = await api.get("/api/snapshot", {
    params: { query },
  });
  return res.data;
}
export async function getGlobalWeatherEvents() {
  return (await api.get("/api/events")).data;
}

export async function getClimateUpdates() {
  return (await api.get("/api/climate-updates")).data;
}

export async function getArticleDetails() {
  return (await api.get("/api/article")).data;
}

export async function generateClimateReport() {
  return (await api.get("/api/report")).data;
}
export async function getClimate(lat: number, lon: number) {
  const res = await api.get("/api/climate", { params: { lat, lon } });
  return res.data;
}
