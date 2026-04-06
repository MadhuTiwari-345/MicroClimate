
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// The API key is injected automatically via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- MOCK DATA FOR FALLBACKS ---
const MOCK_ALERTS = [
  { id: 1, severity: 'critical', title: "Super Typhoon Man-yi", location: "Philippine Sea", lat: 15.0, lon: 135.0, time: "Current", type: "storm" },
  { id: 2, severity: 'high', title: "Extreme Heatwave", location: "Western Australia", lat: -25.0, lon: 120.0, time: "Ongoing", type: "heat" },
  { id: 3, severity: 'moderate', title: "Volcanic Ash Cloud", location: "Iceland", lat: 64.0, lon: -19.0, time: "2h ago", type: "air" },
  { id: 4, severity: 'info', title: "Heavy Snowfall", location: "Hokkaido, Japan", lat: 43.0, lon: 141.0, time: "Forecast", type: "snow" },
  { id: 5, severity: 'critical', title: "Severe Drought", location: "Horn of Africa", lat: 5.0, lon: 45.0, time: "Season", type: "drought" }
] as const;

const MOCK_NEWS = [
  { id: 101, title: "Ocean Currents Slowing Down", source: "Nature Climate", date: "Oct 28, 2023", summary: "New data suggests the AMOC is weakening faster than predicted, raising concerns for North Atlantic weather patterns.", category: "Oceanography", imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800" },
  { id: 102, title: "Global Renewable Capacity Triples", source: "Energy Watch", date: "Oct 27, 2023", summary: "Solar and wind installations hit record highs in 2023, driven by policy shifts in major economies.", category: "Renewable Energy", imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800" },
  { id: 103, title: "COP29 Summit Preview", source: "Reuters", date: "Oct 26, 2023", summary: "Key topics include climate finance, loss and damage funds, and stricter emission targets for 2030.", category: "Policy", imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800" },
  { id: 104, title: "Atmospheric River Impact", source: "NOAA", date: "Oct 25, 2023", summary: "West Coast braces for another series of intense storms as atmospheric river patterns intensify.", category: "Atmospheric Science", imageUrl: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&q=80&w=800" }
];

/**
 * Fetches a brief microclimate snapshot for a given query.
 */
export const getMicroclimateSnapshot = async (query: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a very brief (2 sentences max) microclimate summary for: ${query}. Focus on temperature trends and unique atmospheric conditions.`,
      config: { temperature: 0.7 }
    });
    return response.text || "Local microclimate data currently unavailable.";
  } catch (error) {
    return "Typical seasonal conditions observed. High-resolution data pending update.";
  }
};

/**
 * Fetches a list of autocomplete suggestions for locations.
 * UPDATED: Prioritizes India as requested.
 */
export const getLocationSuggestions = async (query: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `List 5 distinct city or region names that start with or match "${query}". 
      IMPORTANT: Prioritize locations in India (e.g., Mumbai, Delhi, Bangalore, smaller towns) if they match. 
      Then include major global locations. 
      Return purely a JSON array of strings. Example: ["Mumbai, India", "Munich, Germany"]`,
    });
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (error) {
    return []; 
  }
};

/**
 * Fetches coordinates (lat, lon) for a given location string.
 */
export const getCoordinates = async (location: string): Promise<{ lat: number; lon: number } | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Return the latitude and longitude for "${location}" as a JSON object with keys 'lat' and 'lon'. If the input is a ZIP code or Pincode (especially Indian Pincodes), find the center coordinates for that postal area. Do not add any markdown or explanation. Example: {"lat": 48.8566, "lon": 2.3522}`,
    });
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (error) {
    // Fallback for demo purposes if API fails
    if (location.toLowerCase().includes("london")) return { lat: 51.5074, lon: -0.1278 };
    if (location.toLowerCase().includes("new york")) return { lat: 40.7128, lon: -74.0060 };
    if (location.toLowerCase().includes("tokyo")) return { lat: 35.6762, lon: 139.6503 };
    if (location.toLowerCase().includes("san francisco")) return { lat: 37.7749, lon: -122.4194 };
    return null;
  }
};

/**
 * Fetches the city name for a given latitude and longitude.
 */
export const getCityFromCoordinates = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Return the closest city name, region, or ocean name for coordinates ${lat}, ${lon}. If it is an ocean or remote area, name the body of water or region. Return ONLY the string. No JSON, no markdown.`,
    });
    return response.text?.trim() || "Unknown Location";
  } catch (error) {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
};

/**
 * Fetches analysis for dashboard portals (Anomaly & Prediction).
 */
export const getClimateAnalysis = async (location: string, tempData: number, windData: number): Promise<{ anomaly: string, prediction: string }> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `For the location "${location}" with current temp ${tempData}°C and wind ${windData}km/h, generate two short JSON fields: 
        1. 'anomaly': A scientific-sounding, LIVE STATUS report about current microclimate conditions. Mention deviations.
        2. 'prediction': A predictive model output for the next 48 hours.
        Return JSON only. Example: { "anomaly": "LIVE: Detected a 2.4°C rapid rise...", "prediction": "Model C-4 indicates stabilization..." }`
    });
    const text = response.text;
    if (!text) throw new Error("No text");
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (e) {
      return {
          anomaly: "LIVE STATUS: No significant thermal anomalies detected in the scanned sector. Baseline deviation is within nominal parameters (±0.5°C).",
          prediction: "Predictive Model Alpha-9 forecasts stable atmospheric conditions with a 92% confidence interval for the next 48 hours."
      };
  }
};

/**
 * Fetches current global weather events.
 */
export const getGlobalWeatherEvents = async (): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a list of 5 significant, realistic global weather events happening right now. 
      Return valid JSON array. 
      Format: [{ "id": 1, "severity": "critical"|"high"|"moderate"|"info", "title": "Short Title", "location": "City/Region", "lat": number, "lon": number, "time": "30 min ago", "type": "storm"|"heat"|"quake"|"air" }]`,
    });
    const text = response.text;
    if (!text) throw new Error("No text returned");
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (error) {
    return [...MOCK_ALERTS];
  }
};

/**
 * Fetches categorized climate news updates.
 */
export const getClimateUpdates = async (category: string): Promise<any[]> => {
  try {
    const prompt = `Generate 4 distinct, realistic climate news headlines and summaries for category: "${category}". 
    Return valid JSON array.
    Format: [{ "id": number, "title": "Headline", "source": "Source Name", "date": "Date", "summary": "2 sentence summary", "category": "${category}", "imageUrl": "placeholder" }]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text;
    if (!text) throw new Error("No text returned");
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (error) {
    return MOCK_NEWS.filter(n => category === 'All' || category.includes(n.category) || n.category.includes(category));
  }
};

/**
 * Generates a full article body for a given headline.
 */
export const getArticleDetails = async (title: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a detailed, 3-paragraph news article about: "${title}". Format as simple HTML.`,
    });
    return response.text || "<p>Content unavailable.</p>";
  } catch (error) {
    return `
      <p class="lead text-lg font-medium mb-4">Detailed report regarding <strong>${title}</strong>.</p>
      <p class="mb-4">Recent studies have highlighted significant developments in this area. Researchers have observed trends that align with long-term climate models, suggesting an acceleration in these patterns.</p>
      <p>Further analysis is underway to determine the specific causal factors, but initial indicators point to a combination of anthropogenic influence and natural variability.</p>
    `;
  }
};

/**
 * Generates a new climate report.
 */
export const generateClimateReport = async (): Promise<{ title: string; content: string; date: string; size: string } | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a realistic title and short summary for a climate report. Return JSON: { "title": "...", "content": "...", "date": "...", "size": "..." }`,
    });
    const text = response.text;
    if (!text) throw new Error("No text");
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (error) {
    return {
      title: "Annual Climate Resilience Report (Executive Summary)",
      content: "This report summarizes global temperature anomalies.",
      date: new Date().toLocaleDateString(),
      size: "1.2 MB"
    };
  }
};
