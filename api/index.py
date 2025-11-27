from fastapi import FastAPI
from fastapi import APIRouter
import requests
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# For Vercel deployment, we'll use a simpler setup without database dependencies
# that might not work in serverless environment

# INIT FASTAPI APP
app = FastAPI(
    title="Earth MicroClimate AI",
    description="AI system for microclimate forecasting & risk scoring",
    version="1.0.0"
)

load_dotenv()
API_KEY = os.getenv("OPENWEATHER_API")

# ENABLE CORS FOR FRONTEND
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REGISTER ROUTERS
# Note: Auth and weather routers removed for Vercel deployment simplicity
# Add them back if needed after fixing database dependencies

router = APIRouter()

THRESH_TEMP = 40
THRESH_HUMIDITY = 85
UNSAFE_WEATHER = ["Rain", "Thunderstorm", "Extreme"]

# ROOT ROUTE
@router.get("/forecast")
def get_forecast(city: str):
    ow_url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric"
    print("Received city:", city)

    ow_res = requests.get(ow_url)
    if ow_res.status_code != 200:
        return {"error": "Invalid city name or API key"}

    ow = ow_res.json()
    # 2. Extract current-like data (from first forecast block)
    first = ow["list"][0]
    current = {
        "temperature": first["main"]["temp"],
        "humidity": first["main"]["humidity"],
        "windSpeed": first["wind"]["speed"],
        "windDirection": first["wind"]["deg"],
        "pressure": first["main"]["pressure"],
        "uvIndex": 5,                   # OpenWeather free API doesn't give UV. Dummy value.
        "visibility": first.get("visibility", 10000),
        "weatherCode": first["weather"][0]["id"],
        "isDay": 1 if 6 <= int(first["dt_txt"][11:13]) <= 18 else 0
    }

    # ----------------------------------------
    # 3. Build "daily" forecast (max/min temp)
    # ----------------------------------------
    daily_map = {}

    for item in ow["list"]:
        date = item["dt_txt"].split(" ")[0]
        temp = item["main"]["temp"]
        code = item["weather"][0]["id"]

        if date not in daily_map:
            daily_map[date] = {
                "date": date,
                "code": code,
                "maxTemp": temp,
                "minTemp": temp
            }
        else:
            daily_map[date]["maxTemp"] = max(daily_map[date]["maxTemp"], temp)
            daily_map[date]["minTemp"] = min(daily_map[date]["minTemp"], temp)

    daily = list(daily_map.values())[:7]  # frontend expects 7 days

    # ----------------------------------------
    # 4. Build "hourly" forecast (every 3 hours)
    # ----------------------------------------
    hourly = []
    for item in ow["list"][:24]:  # next 24 hours = 8 blocks
        hourly.append({
            "time": item["dt_txt"],
            "temperature": item["main"]["temp"],
        })

    # ----------------------------------------
    # 5. Build final unified response
    # ----------------------------------------
    result = {
        "current": current,
        "aqi": 50,          # OpenWeather free API doesn't include AQI. Set dummy or integrate AQI API.
        "daily": daily,
        "hourly": hourly
    }

    return result

app.include_router(router, prefix="/weather", tags=["Forecast"])

@app.get("/")
def root():
    return {"message": "MicroClimate AI Backend Running Successfully"}

@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI 👋"}

# For autocomplete search bar
@app.get("/api/suggestions")
def suggestions(q: str):
    # Return list of string suggestions
    dummy = ["Delhi", "Noida", "Gurugram", "Faridabad"]
    return [s for s in dummy if q.lower() in s.lower()]

# Convert location → coordinates
@app.get("/api/coordinates")
def coords(location: str):
    # example only — replace with real data
    return {"lat": 28.6139, "lon": 77.2090}

# Reverse lookup coordinates → city name
@app.get("/api/city")
def city(lat: float, lon: float):
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        response = requests.get(url, headers={"User-Agent": "microclimate-project"})
        data = response.json()
        address = data.get("address", {})
        city_name = (
            address.get("suburb")
            or address.get("city")
            or address.get("town")
            or address.get("village")
            or "Unknown"
        )
        return city_name
    except Exception:
        return "Unknown"

# Optional microclimate summary
@app.get("/api/snapshot")
def snapshot(query: str):
    return f"Microclimate summary for {query} (dummy backend response)"

@app.get("/api/events")
def events():
    return [
        {"title": "Heatwave Alert", "severity": "high"},
        {"title": "Rainfall Expected", "severity": "medium"}
    ]

@app.get("/api/climate-updates")
def updates():
    return ["Update #1", "Update #2"]

@app.get("/api/article")
def article(id: int = 1):
    return {"title": "Climate Article", "content": "Sample article"}

@app.get("/api/report")
def report():
    return "Generated climate report..."

@app.get("/api/climate")
def climate(lat: float, lon: float):
    return {
        "temperature": 22,
        "humidity": 61,
        "wind": 3,
        "aqi": 112,
        "summary": "Clear sky"
    }

# Vercel serverless function export
# This is required for Vercel to recognize the FastAPI app
from fastapi.middleware.wsgi import WSGIMiddleware

# Export the app for Vercel
app = app
