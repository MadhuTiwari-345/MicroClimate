const API_BASE_URL = "http://127.0.0.1:8000";

export async function getRiskScore(lat: number, lon: number) {
  const url = `${API_BASE_URL}/weather/risk_score?lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to get risk score");
  return res.json();
}

export async function getAnomaly(lat: number, lon: number) {
  const url = `${API_BASE_URL}/weather/anomaly?lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to get anomaly");
  return res.json();
}

export async function getPrediction(lat: number, lon: number, steps = 3) {
  const url = `${API_BASE_URL}/weather/predict?lat=${lat}&lon=${lon}&steps=${steps}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to get prediction");
  return res.json();
}

export async function getFutureAnomaly(lat: number, lon: number, steps = 3) {
  const url = `${API_BASE_URL}/weather/future_anomaly?lat=${lat}&lon=${lon}&steps=${steps}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to get future anomaly");
  return res.json();
}

export async function geocodePincode(pincode: string, country = "IN") {
  const url = `${API_BASE_URL}/weather/geocode?pincode=${pincode}&country=${country}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to geocode");
  return res.json();
}
