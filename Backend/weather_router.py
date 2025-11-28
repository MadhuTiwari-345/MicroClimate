from fastapi import APIRouter, HTTPException
import requests
from risk_engine import calculate_risk_score
from anomaly_engine import detect_microclimate_anomalies
from prediction_module import predict_short_term as prophet_predict

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
