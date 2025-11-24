
from typing import List, Dict

def detect_microclimate_anomalies(forecast_list: List[Dict]):
    anomalies = []
    reasons = set()
    score = 0


    TEMP_SPIKE = 3            # sudden rise/fall in °C
    HUMIDITY_SPIKE = 15       # sudden humidity change
    PRESSURE_DROP = 5         # hPa drop indicates storm formation
    WIND_SPIKE = 8            # m/s wind jump
    EXTREME_WIND = 12
    DANGEROUS = ["Thunderstorm", "Extreme", "Tornado"]

    for i in range(1, len(forecast_list)):
        prev = forecast_list[i - 1]
        curr = forecast_list[i]

        t1 = prev["main"]["temp"]; t2 = curr["main"]["temp"]
        h1 = prev["main"]["humidity"]; h2 = curr["main"]["humidity"]
        p1 = prev["main"]["pressure"]; p2 = curr["main"]["pressure"]
        w1 = prev["wind"].get("speed", 0); w2 = curr["wind"].get("speed", 0)
        weather = curr["weather"][0]["main"]
        time = curr.get("dt_txt", "Unknown")

        #  CHECKS

        # Temperature spike
        if abs(t2 - t1) >= TEMP_SPIKE:
            score += 15
            reasons.add("Temperature Spike")
            anomalies.append({
                "time": time,
                "parameter": "temperature",
                "change": round(t2 - t1, 2),
                "value": t2
            })

        # Humidity spike
        if abs(h2 - h1) >= HUMIDITY_SPIKE:
            score += 20
            reasons.add("Humidity Spike")
            anomalies.append({
                "time": time,
                "parameter": "humidity",
                "change": round(h2 - h1, 2),
                "value": h2
            })

        # Pressure drop
        if (p1 - p2) >= PRESSURE_DROP:
            score += 25
            reasons.add("Pressure Drop")
            anomalies.append({
                "time": time,
                "parameter": "pressure",
                "change": round(p2 - p1, 2),
                "value": p2
            })

        # Sudden wind change
        if abs(w2 - w1) >= WIND_SPIKE:
            score += 20
            reasons.add("Sudden Wind Gust")
            anomalies.append({
                "time": time,
                "parameter": "wind",
                "change": round(w2 - w1, 2),
                "value": w2
            })

        # Extreme wind
        if w2 >= EXTREME_WIND:
            score += 25
            reasons.add("Extreme Wind Speed")

        # Dangerous weather
        if weather in DANGEROUS:
            score += 40
            reasons.add(f"Dangerous Weather: {weather}")

    score = min(100, score)

    level = (
        "SAFE" if score < 30 else
        "WARNING" if score < 60 else
        "DANGER"
    )

    return {
        "anomaly_score": score,
        "status": level,
        "reasons": list(reasons),
        "events": anomalies
    }
