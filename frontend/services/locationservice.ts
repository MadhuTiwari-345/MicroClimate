const API_BASE = "http://127.0.0.1:8000";
// Toggle fetching of anomaly/prediction analytics. Set to false to avoid crashes
const ENABLE_ANALYTICS = false;

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

    // Check if input looks like a postal code / pincode (3-6 digits)
    const pincodeMatch = location.match(/^\d{3,6}$/);
    if (pincodeMatch) {
      // Use backend geocode endpoint which resolves pincode -> lat/lon
      try {
        const geoRes = await fetch(`${API_BASE}/geocode?pincode=${encodeURIComponent(location)}`);
        if (geoRes.ok) {
          const g = await geoRes.json();
          if (g && g.lat != null && g.lon != null) {
            return { lat: parseFloat(g.lat), lon: parseFloat(g.lon) };
          }
        }
      } catch (e) {
        console.warn('Pincode geocode failed', e);
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
    // Prefer backend forecast_by_coords which includes a friendly city name
    const res = await fetch(`${API_BASE}/weather/forecast_by_coords?lat=${lat}&lon=${lon}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.city) return String(data.city);
    }
    // Fallback to risk_score which also includes a reversed city field
    try {
      const r = await fetch(`${API_BASE}/weather/risk_score?lat=${lat}&lon=${lon}`);
      if (r.ok) {
        const rr = await r.json();
        if (rr && rr.city) return String(rr.city);
      }
    } catch (e) {
      // ignore
    }
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  } catch (err) {
    console.warn("Reverse geocode failed", err);
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}

export async function getReverseLocation(lat: number, lon: number): Promise<string> {
  /**
   * Get the exact location name (address/place name) from coordinates.
   * This performs a reverse geocode lookup using the backend's Nominatim integration.
   */
  try {
    // First, try to get exact location from forecast endpoint (includes city from reverse geocode)
    const res = await fetch(`${API_BASE}/weather/forecast_by_coords?lat=${lat}&lon=${lon}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.city) {
        return String(data.city);
      }
    }
  } catch (err) {
    console.warn("Reverse location lookup failed", err);
  }
  
  // Fallback to formatted coords
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
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
  // Short-circuit if analytics disabled (to avoid crashes while debugging)
  if (!ENABLE_ANALYTICS) {
    return {
      anomaly: "Analytics disabled",
      prediction: "Analytics disabled",
      rawPredictions: null
    };
  }

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
