const API_BASE = "http://127.0.0.1:8000";

export async function getLocationSuggestions(query: string) {
  try {
    const res = await fetch(`${API_BASE}/api/suggestions?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getCoordinates(location: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // Check if location is in "lat, lon" format (from geolocation)
    const coordMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }

    // Otherwise, treat as city name
    const res = await fetch(`${API_BASE}/weather/forecast?city=${encodeURIComponent(location)}`);
    if (!res.ok) throw new Error("Failed to fetch forecast");

    const data = await res.json();
    return { lat: data.lat ?? 0, lon: data.lon ?? 0 };
  } catch (err) {
    console.error("getCoordinates failed:", err);
    return null;
  }
}

export async function getCityFromCoordinates(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/city?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("Failed reverse geocode");
    const data = await res.text();
    return String(data) || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  } catch (err) {
    console.warn("Reverse geocode failed", err);
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}

export async function getMicroclimateSnapshot(query: string) {
  try {
    const res = await fetch(`${API_BASE}/api/snapshot?query=${encodeURIComponent(query)}`);
    if (!res.ok) return "Data unavailable";
    return await res.text();
  } catch {
    return "Microclimate data pending update";
  }
}

export async function getGlobalWeatherEvents() {
  try {
    const res = await fetch(`${API_BASE}/api/events`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getClimateUpdates() {
  try {
    const res = await fetch(`${API_BASE}/api/climate-updates`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getArticleDetails() {
  try {
    const res = await fetch(`${API_BASE}/api/article`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateClimateReport() {
  try {
    const res = await fetch(`${API_BASE}/api/report`);
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "Report generation pending";
  }
}

export async function getClimate(lat: number, lon: number) {
  try {
    const res = await fetch(`${API_BASE}/api/climate?lat=${lat}&lon=${lon}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getRiskScore(lat: number, lon: number) {
  try {
    const res = await fetch(`${API_BASE}/weather/risk_score?lat=${lat}&lon=${lon}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getAnomaly(lat: number, lon: number) {
  try {
    const res = await fetch(`${API_BASE}/weather/anomaly?lat=${lat}&lon=${lon}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getClimateAnalysis(lat: number, lon: number) {
  try {
    // Fetch both anomaly report and predictions in parallel
    const [anomalyRes, predictionRes] = await Promise.all([
      fetch(`${API_BASE}/weather/anomaly?lat=${lat}&lon=${lon}`),
      fetch(`${API_BASE}/weather/predict?lat=${lat}&lon=${lon}`)
    ]);

    let anomalyReport = "No anomalies detected";
    let predictionData = null;

    if (anomalyRes.ok) {
      const anomalyData = await anomalyRes.json();
      anomalyReport = anomalyData.anomaly_report || "No anomalies detected";
    }

    if (predictionRes.ok) {
      const predData = await predictionRes.json();
      predictionData = predData.predictions || null;
    }

    return {
      anomaly: anomalyReport,
      prediction: predictionData ? JSON.stringify(predictionData, null, 2) : "Prediction model processing...",
      rawPredictions: predictionData
    };
  } catch (error) {
    console.error("Error fetching climate analysis:", error);
    return {
      anomaly: "Unable to fetch anomaly data",
      prediction: "Unable to fetch prediction data",
      rawPredictions: null
    };
  }
}
