

import pandas as pd
from prophet import Prophet
from datetime import datetime, timedelta
from typing import List, Dict
from .risk_engine import calculate_risk_score


def _series_df(forecast_list: List[Dict], key: str):
    #Convert forecast entries to Prophet-friendly DataFrame.
    rows = []
    for e in forecast_list:
        ts = e.get("dt_txt") or datetime.utcfromtimestamp(e.get("dt")).isoformat()
        rows.append({
            "ds": pd.to_datetime(ts),
            "y": float(e["main"].get(key, 0))
        })
    return pd.DataFrame(rows)


def _forecast_variable(forecast_list: List[Dict], key: str, periods=3, freq='3H'):
    df = _series_df(forecast_list, key)

    if df.shape[0] < 2:
        return []

    model = Prophet()
    model.fit(df)

    future = model.make_future_dataframe(periods=periods, freq=freq)
    forecast = model.predict(future)

    return forecast[['ds', 'yhat']].tail(periods).to_dict('records')


def predict_short_term(forecast_list: List[Dict], steps: int = 3):


    # convert wind
    for e in forecast_list:
        e["main"]["wind_speed"] = e.get("wind", {}).get("speed", 0)

    temps = _forecast_variable(forecast_list, 'temp', periods=steps)
    hums = _forecast_variable(forecast_list, 'humidity', periods=steps)
    press = _forecast_variable(forecast_list, 'pressure', periods=steps)
    winds = _forecast_variable(forecast_list, 'wind_speed', periods=steps)

    predictions = []

    for i in range(steps):
        t = temps[i]['yhat'] if temps else 0
        h = hums[i]['yhat'] if hums else 0
        p = press[i]['yhat'] if press else 0
        w = winds[i]['yhat'] if winds else 0

        # risk prediction
        risk_val = calculate_risk_score("Clear", t, h, w)
        status = "SAFE" if risk_val < 30 else "WARNING" if risk_val < 60 else "DANGER"

        predictions.append({
            "time": str(temps[i]['ds']) if temps else "",
            "temp": round(float(t), 2),
            "humidity": round(float(h), 2),
            "pressure": round(float(p), 2),
            "wind": round(float(w), 2),
            "predicted_risk": int(risk_val),
            "status": status
        })

    return {
        "method": "prophet",
        "predictions": predictions
    }

