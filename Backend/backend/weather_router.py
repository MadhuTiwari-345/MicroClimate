from fastapi import APIRouter, HTTPException
import requests
from .risk_engine import calculate_risk_score
from .anomaly_engine import detect_microclimate_anomalies
from .prediction_module import predict_short_term as prophet_predict
from typing import Optional

router = APIRouter()

API_KEY = "2a240b3886ad6eebbb647e7f3c1cd858"
WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"

#  Reverse Geocoding Function
def reverse_geocode(lat, lon):
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
    response = requests.get(url, headers={"User-Agent": "microclimate-project"})
    data = response.json()

    address = data.get("address", {})

    city = (
        address.get("suburb")
        or address.get("city")
        or address.get("town")
        or address.get("village")
        or "Unknown"
    )
    return city


# Helper function to build forecast response
def build_forecast_response(lat, lon, city_name=None):
    """
    Builds forecast response for given lat/lon coordinates.
    Returns weather in the frontend-friendly format.
    """
    if city_name is None:
        city_name = reverse_geocode(lat, lon)
    
    # Call Open-Meteo forecast (current, hourly temperature & wind, daily)
    weather_url = (
      f"https://api.open-meteo.com/v1/forecast?"
      f"latitude={lat}&longitude={lon}"
      f"&current_weather=true"
      f"&hourly=temperature_2m,wind_speed_10m,visibility,relativehumidity_2m"
      f"&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum,precipitation_probability_max"
      f"&timezone=auto&forecast_days=8"
    )
    w = requests.get(weather_url)
    if w.status_code != 200:
        raise HTTPException(status_code=502, detail="Open-Meteo fetch failed")
    wjson = w.json()

    # Call Open-Meteo Air Quality (returns us_aqi)
    aqi = 0
    try:
        aqi_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=us_aqi"
        aqi_res = requests.get(aqi_url)
        if aqi_res.ok:
            aqi_json = aqi_res.json()
            aqi = int(aqi_json.get("current", {}).get("us_aqi", 0) or 0)
    except Exception:
        aqi = 0

    # Build `current` object
    current_weather = wjson.get("current_weather", {})
    hourly = wjson.get("hourly", {})
    daily = wjson.get("daily", {})

    # try to find the index of current time in hourly times
    current_index = 0
    try:
        times = hourly.get("time", [])
        if current_weather and "time" in current_weather and times:
            if current_weather.get("time") in times:
                current_index = times.index(current_weather.get("time"))
            else:
                current_index = 0
    except Exception:
        current_index = 0

    # Build current fields with fallbacks
    cur_temp = current_weather.get("temperature") if current_weather.get("temperature") is not None else (hourly.get("temperature_2m", [0])[current_index] if hourly.get("temperature_2m") else 0)
    cur_wind = current_weather.get("windspeed") if current_weather.get("windspeed") is not None else (hourly.get("wind_speed_10m", [0])[current_index] if hourly.get("wind_speed_10m") else 0)
    cur_wind_dir = current_weather.get("winddirection") if current_weather.get("winddirection") is not None else 0
    cur_pressure = daily.get("pressure_msl", [None])[0] if daily.get("pressure_msl") else None
    cur_pressure = cur_pressure if cur_pressure is not None else 1013
    cur_humidity = None
    try:
        cur_humidity = hourly.get("relativehumidity_2m", [None])[current_index]
    except Exception:
        cur_humidity = None
    cur_visibility = None
    try:
        cur_visibility = hourly.get("visibility", [None])[current_index]
    except Exception:
        cur_visibility = None
    cur_uv = daily.get("uv_index_max", [0])[0] if daily.get("uv_index_max") else 0
    cur_code = daily.get("weather_code", [0])[0] if daily.get("weather_code") else (current_weather.get("weathercode") or 0)
    cur_is_day = current_weather.get("is_day", 1)

    current_obj = {
        "temperature": float(cur_temp or 0),
        "humidity": int(cur_humidity) if cur_humidity is not None else 0,
        "windSpeed": float(cur_wind or 0),
        "windDirection": float(cur_wind_dir or 0),
        "pressure": float(cur_pressure),
        "uvIndex": float(cur_uv or 0),
        "visibility": float(cur_visibility or 0),
        "weatherCode": int(cur_code or 0),
        "isDay": int(cur_is_day or 1),
    }

    # Build daily list
    processed_daily = []
    daily_time = daily.get("time", [])
    daily_max = daily.get("temperature_2m_max", [])
    daily_min = daily.get("temperature_2m_min", [])
    daily_code = daily.get("weather_code", [])

    for i in range(len(daily_time)):
        processed_daily.append({
            "date": daily_time[i],
            "code": int(daily_code[i]) if i < len(daily_code) else 0,
            "maxTemp": float(daily_max[i]) if i < len(daily_max) else 0.0,
            "minTemp": float(daily_min[i]) if i < len(daily_min) else 0.0
        })

    # Build hourly list
    processed_hourly = []
    hourly_time = hourly.get("time", [])
    hourly_temp = hourly.get("temperature_2m", [])
    hourly_wind = hourly.get("wind_speed_10m", [])

    max_hours = min(len(hourly_time), len(hourly_temp))
    for i in range(max_hours):
        processed_hourly.append({
            "time": hourly_time[i],
            "temperature": float(hourly_temp[i]) if i < len(hourly_temp) else 0.0,
            "windSpeed": float(hourly_wind[i]) if i < len(hourly_wind) else float(cur_wind or 0)
        })

    # Final response
    response = {
        "city": city_name,
        "lat": lat,
        "lon": lon,
        "current": current_obj,
        "aqi": int(aqi or 0),
        "daily": processed_daily,
        "hourly": processed_hourly
    }

    return response


# RISK SCORE
@router.get("/risk_score")
def get_risk(lat: float, lon: float):
    params = {"lat": lat, "lon": lon, "appid": API_KEY, "units": "metric"}
    response = requests.get(WEATHER_URL, params=params)

    if response.status_code != 200:
        return {"error": "Invalid coordinates or API error"}

    data = response.json()

    weather = data.get("weather", [{"main": "Unknown"}])[0].get("main")
    temp = float(data.get("main", {}).get("temp", 0))
    humidity = float(data.get("main", {}).get("humidity", 0))
    wind = float(data.get("wind", {}).get("speed", 0))

    score = calculate_risk_score(weather, temp, humidity, wind)
    city = reverse_geocode(lat, lon)

    return {
        "city": city,
        "lat": lat,
        "lon": lon,
        "temperature": temp,
        "humidity": humidity,
        "wind_speed": wind,
        "weather": weather,
        "risk_score": score
    }


# CURRENT MICROCLIMATE ANOMALY
@router.get("/anomaly")
def anomaly(lat: float, lon: float):
    url = f"{FORECAST_URL}?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    r = requests.get(url)

    if r.status_code != 200:
        return {"error": "Invalid coordinates or API error"}

    data = r.json()
    forecast_list = data.get("list", [])

    anomaly_report = detect_microclimate_anomalies(forecast_list)
    city = reverse_geocode(lat, lon)

    return {
        "lat": lat,
        "lon": lon,
        "city": city,
        "anomaly_report": anomaly_report
    }


# SHORT-TERM PROPHET PREDICTION
@router.get("/predict")
def predict(lat: float, lon: float, steps: int = 3):
    url = f"{FORECAST_URL}?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    r = requests.get(url)

    if r.status_code != 200:
        return {"error": "Invalid coordinates or API error"}

    data = r.json()
    forecast_list = data.get("list", [])

    out = prophet_predict(forecast_list, steps=steps)
    city = reverse_geocode(lat, lon)

    return {
        "lat": lat,
        "lon": lon,
        "city": city,
        "predictions": out
    }


# FUTURE ANOMALY DETECTION (Predicted + Real Synthetic)
@router.get("/future_anomaly")
def future_anomaly(lat: float, lon: float, steps: int = 3):
    url = f"{FORECAST_URL}?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    r = requests.get(url)

    if r.status_code != 200:
        return {"error": "Invalid coordinates or API error"}

    data = r.json()
    forecast_list = data.get("list", [])

    preds = prophet_predict(forecast_list, steps=steps).get("predictions", [])

    synthetic = forecast_list[-6:].copy() if len(forecast_list) >= 6 else forecast_list.copy()

    for p in preds:
        synthetic.append({
            "dt_txt": p["time"],
            "main": {"temp": p.get("temp"), "humidity": p.get("humidity"), "pressure": p.get("pressure")},
            "wind": {"speed": p.get("wind", 0)},
            "weather": [{"main": "Predicted"}]
        })

    anomaly = detect_microclimate_anomalies(synthetic)
    city = reverse_geocode(lat, lon)

    return {
        "lat": lat,
        "lon": lon,
        "city": city,
        "future_anomaly": anomaly,
        "predictions": preds
    }


# GEOCODE ENDPOINT
@router.get("/geocode")
def geocode(pincode: str, country: str = "IN"):
    url = f"http://api.openweathermap.org/geo/1.0/zip?zip={pincode},{country}&appid={API_KEY}"
    r = requests.get(url)

    if r.status_code != 200:
        return {"error": "Invalid pincode or API error"}

    data = r.json()

    return {
        "pincode": pincode,
        "city": data.get("name", "Unknown"),
        "lat": data.get("lat"),
        "lon": data.get("lon")
    }
@router.get("/forecast")
def forecast(city: str):
    """
    Returns weather in the frontend-friendly format by city name.
    """
    # Resolve city -> lat,lon using OpenWeather geocoding
    geocode_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={API_KEY}"
    g = requests.get(geocode_url)
    if g.status_code != 200:
        raise HTTPException(status_code=502, detail="Geocoding failed")
    geodata = g.json()
    if not geodata or len(geodata) == 0:
        raise HTTPException(status_code=404, detail="City not found by geocoding")

    lat = geodata[0].get("lat")
    lon = geodata[0].get("lon")
    resolved_name = geodata[0].get("name") or city

    return build_forecast_response(lat, lon, resolved_name)


@router.get("/forecast_by_coords")
def forecast_by_coords(lat: float, lon: float):
    """
    Returns weather in the frontend-friendly format by latitude and longitude.
    """
    return build_forecast_response(lat, lon)
