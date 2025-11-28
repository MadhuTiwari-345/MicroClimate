param(
  [string]$OpenWeatherApiKey = $env:OPENWEATHER_API
)

if (-not $OpenWeatherApiKey) {
  Write-Warning "OPENWEATHER_API not set. Some endpoints may fail without an API key."
} else {
  $env:OPENWEATHER_API = $OpenWeatherApiKey
}

Write-Host "Starting backend (uvicorn) with python..."
python .\start_uvicorn.py
