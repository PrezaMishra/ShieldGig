"""
weather_service.py — Live external data integration for ShieldGig
Replaces all hardcoded disruption data with real API calls.

APIs used:
  - OpenWeatherMap (free tier): current weather + rainfall
  - Open-Meteo (free, no key needed): AQI / air quality
  - Fallback: sensible defaults if API is unavailable

Setup:
  pip install httpx python-dotenv
  Set OPENWEATHER_API_KEY in your .env file (free at openweathermap.org)
"""

import os
import time
import httpx
import asyncio
from datetime import datetime, timezone
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
CACHE_TTL_SECONDS = 300  # 5-minute cache to avoid hammering free tier

# ─── Simple in-memory cache ──────────────────────────────────────────────────
_cache: dict = {}


def _cache_get(key: str):
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < CACHE_TTL_SECONDS:
        return entry["val"]
    return None


def _cache_set(key: str, val):
    _cache[key] = {"val": val, "ts": time.time()}


# ─── Zone → coordinates map (Bengaluru zones) ────────────────────────────────
ZONE_COORDS = {
    "Whitefield":       {"lat": 12.9698, "lon": 77.7500},
    "Indiranagar":      {"lat": 12.9784, "lon": 77.6408},
    "Electronic City":  {"lat": 12.8399, "lon": 77.6770},
    "Koramangala":      {"lat": 12.9352, "lon": 77.6245},
    "HSR Layout":       {"lat": 12.9116, "lon": 77.6389},
    "Marathahalli":     {"lat": 12.9562, "lon": 77.6993},
    "Jayanagar":        {"lat": 12.9250, "lon": 77.5938},
}

# Disruption thresholds
RAIN_THRESHOLD_MM = 25.0    # mm/h heavy rain
HEAT_THRESHOLD_C  = 42.0    # °C heatwave
AQI_THRESHOLD     = 300     # WHO severe


# ─── Weather data fetch ───────────────────────────────────────────────────────
async def fetch_weather(lat: float, lon: float) -> dict:
    """
    Fetch current weather from OpenWeatherMap.
    Returns a dict with temperature, rainfall_1h, description.
    Falls back to a sensible default if the API key is missing or call fails.
    """
    cache_key = f"weather_{lat:.2f}_{lon:.2f}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    if not OPENWEATHER_API_KEY:
        # Graceful degradation: return no-disruption defaults
        result = {"temperature": 30.0, "rainfall_1h": 0.0, "description": "data unavailable", "source": "fallback"}
        _cache_set(cache_key, result)
        return result

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        rainfall = data.get("rain", {}).get("1h", 0.0)
        temp = data["main"]["temp"]
        desc = data["weather"][0]["description"] if data.get("weather") else "unknown"

        result = {
            "temperature": temp,
            "rainfall_1h": rainfall,
            "description": desc,
            "source": "openweathermap",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        _cache_set(cache_key, result)
        return result

    except Exception as exc:
        print(f"[WeatherService] API error: {exc}")
        result = {"temperature": 30.0, "rainfall_1h": 0.0, "description": "api_error", "source": "fallback"}
        _cache_set(cache_key, result)
        return result


# ─── AQI fetch (Open-Meteo — free, no key) ───────────────────────────────────
async def fetch_aqi(lat: float, lon: float) -> dict:
    """
    Fetch air quality index from Open-Meteo (no API key required).
    Returns pm10, pm2_5, european_aqi.
    """
    cache_key = f"aqi_{lat:.2f}_{lon:.2f}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": lat, "longitude": lon,
        "hourly": "pm10,pm2_5,european_aqi",
        "forecast_days": 1,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        # Get the most recent non-null hourly reading
        aqi_vals = data.get("hourly", {}).get("european_aqi", [])
        pm10_vals = data.get("hourly", {}).get("pm10", [])
        pm25_vals = data.get("hourly", {}).get("pm2_5", [])

        aqi  = next((v for v in reversed(aqi_vals) if v is not None), 50)
        pm10 = next((v for v in reversed(pm10_vals) if v is not None), 30)
        pm25 = next((v for v in reversed(pm25_vals) if v is not None), 15)

        result = {"european_aqi": aqi, "pm10": pm10, "pm2_5": pm25, "source": "open-meteo"}
        _cache_set(cache_key, result)
        return result

    except Exception as exc:
        print(f"[AQIService] API error: {exc}")
        result = {"european_aqi": 50, "pm10": 30, "pm2_5": 15, "source": "fallback"}
        _cache_set(cache_key, result)
        return result


# ─── Disruption evaluator ─────────────────────────────────────────────────────
async def evaluate_disruption(zone: str) -> dict:
    """
    Given a zone name, fetch live data and determine if a disruption is active.
    Returns a structured dict for the claims pipeline.
    """
    coords = ZONE_COORDS.get(zone, ZONE_COORDS["Indiranagar"])
    lat, lon = coords["lat"], coords["lon"]

    weather, aqi = await asyncio.gather(
        fetch_weather(lat, lon),
        fetch_aqi(lat, lon),
    )

    disruptions = []
    severity = "none"

    if weather["rainfall_1h"] >= RAIN_THRESHOLD_MM:
        disruptions.append({
            "type": "heavy_rain",
            "value": weather["rainfall_1h"],
            "threshold": RAIN_THRESHOLD_MM,
            "unit": "mm/h",
        })
        severity = "high"

    if weather["temperature"] >= HEAT_THRESHOLD_C:
        disruptions.append({
            "type": "heatwave",
            "value": weather["temperature"],
            "threshold": HEAT_THRESHOLD_C,
            "unit": "°C",
        })
        severity = max(severity, "medium", key=lambda s: ["none", "low", "medium", "high"].index(s))

    aqi_val = aqi.get("european_aqi", 0)
    if aqi_val >= AQI_THRESHOLD:
        disruptions.append({
            "type": "poor_air_quality",
            "value": aqi_val,
            "threshold": AQI_THRESHOLD,
            "unit": "AQI",
        })
        severity = max(severity, "medium", key=lambda s: ["none", "low", "medium", "high"].index(s))

    return {
        "zone": zone,
        "disruption_active": len(disruptions) > 0,
        "severity": severity,
        "disruptions": disruptions,
        "weather": weather,
        "aqi": aqi,
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
    }


# ─── Quick test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    async def main():
        result = await evaluate_disruption("Whitefield")
        import json
        print(json.dumps(result, indent=2))

    asyncio.run(main())
