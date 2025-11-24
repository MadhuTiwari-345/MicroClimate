def calculate_risk_score(weather, temp, humidity, wind):
    # Ensure numeric conversion
    try:
        temp = float(temp)
        humidity = float(humidity)
        wind = float(wind)
    except:
        return 0  # fallback

    score = 0

    # Temperature risk
    if temp > 40:
        score += 40
    elif temp > 35:
        score += 20
    elif temp < 5:
        score += 30

    # Humidity risk
    if humidity > 85:
        score += 30
    elif humidity > 70:
        score += 15

    # Wind risk
    if wind > 15:
        score += 30
    elif wind > 8:
        score += 10

    # Weather conditions
    severe_weather = ["Thunderstorm", "Extreme", "Tornado", "Haze"]
    if weather in severe_weather:
        score += 40

    return min(score, 100)
