from fastapi import FastAPI
import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("OPENWEATHER_API")

app = FastAPI()

THRESH_TEMP = 40
THRESH_HUMIDITY = 85
UNSAFE_WEATHER = ["Rain", "Thunderstorm", "Extreme"]

@app.get("/forecast")
def get_forecast(city: str):
    url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric"
    response = requests.get(url)

    if response.status_code != 200:
        return {"error": "Invalid city name or API key"}

    data = response.json()
    records = []

    for item in data["list"]:
        temp = item["main"]["temp"]
        humidity = item["main"]["humidity"]
        pressure = item["main"]["pressure"]
        weather = item["weather"][0]["main"]

        if temp > THRESH_TEMP or humidity > THRESH_HUMIDITY or weather in UNSAFE_WEATHER:
            status = "UNSAFE"
        else:
            status = "SAFE"

        records.append({
            "datetime": item["dt_txt"],
            "temperature": temp,
            "humidity": humidity,
            "pressure": pressure,
            "weather": weather,
            "status": status
        })

    return {
        "city": city,
        "total_safe": sum(1 for r in records if r["status"] == "SAFE"),
        "total_unsafe": sum(1 for r in records if r["status"] == "UNSAFE"),
        "forecast": records
    }
