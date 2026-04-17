"""Location & Weather router."""
from fastapi import APIRouter, Depends, Query
from datetime import timedelta
import random
import httpx
from app.config import settings
from app.time_utils import utc_now

router = APIRouter()

INDIAN_CITIES = {
    "bangalore": {"lat": 12.9716, "lng": 77.5946, "state": "Karnataka", "district": "Bengaluru Urban"},
    "hyderabad": {"lat": 17.3850, "lng": 78.4867, "state": "Telangana", "district": "Hyderabad"},
    "pune": {"lat": 18.5204, "lng": 73.8567, "state": "Maharashtra", "district": "Pune"},
    "mysore": {"lat": 12.2958, "lng": 76.6394, "state": "Karnataka", "district": "Mysuru"},
    "nagpur": {"lat": 21.1458, "lng": 79.0882, "state": "Maharashtra", "district": "Nagpur"},
}

@router.get("/weather")
async def get_weather(lat: float = Query(12.9716), lng: float = Query(77.5946)):
    """Get hyperlocal weather data and 7-day forecast."""
    if settings.openweathermap_api_key and settings.openweathermap_api_key != "":
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(
                    "https://api.openweathermap.org/data/2.5/forecast",
                    params={"lat": lat, "lon": lng, "appid": settings.openweathermap_api_key,
                            "units": "metric", "cnt": 40},
                    timeout=5.0
                )
                if r.status_code == 200:
                    return _parse_owm_response(r.json())
        except Exception:
            pass

    # Demo weather data
    return _demo_weather(lat, lng)

@router.get("/alerts")
async def get_location_alerts(lat: float = Query(12.9716), lng: float = Query(77.5946)):
    """Get active weather and pest alerts for a location."""
    return {
        "alerts": [
            {
                "id": "alert_001",
                "type": "weather",
                "severity": "medium",
                "title": "Heavy Rainfall Expected",
                "message": "IMD forecasts 50-80mm rainfall in the next 48 hours. Protect crops from waterlogging.",
                "affected_crops": ["paddy", "vegetables"],
                "valid_from": utc_now().isoformat(),
                "valid_till": (utc_now() + timedelta(hours=48)).isoformat(),
            },
            {
                "id": "alert_002",
                "type": "pest",
                "severity": "high",
                "title": "Brown Plant Hopper Alert",
                "message": "High BPH population detected in neighboring districts. Monitor paddy fields closely.",
                "affected_crops": ["paddy", "rice"],
                "valid_from": utc_now().isoformat(),
                "valid_till": (utc_now() + timedelta(hours=72)).isoformat(),
            },
        ]
    }

@router.get("/reverse")
async def reverse_geocode(lat: float = Query(12.9716), lng: float = Query(77.5946)):
    """Reverse geocode lat/lng to state/district/taluk."""
    # Demo: approximate based on lat/lng
    if lat < 15 and lng < 78:
        return {"state": "Karnataka", "district": "Bengaluru Rural", "taluk": "Channapatna"}
    elif lat < 18:
        return {"state": "Telangana", "district": "Rangareddy", "taluk": "Shadnagar"}
    else:
        return {"state": "Maharashtra", "district": "Pune", "taluk": "Junnar"}

def _demo_weather(lat: float, lng: float) -> dict:
    base_temp = 28 + (lat - 15) * 0.5
    forecast = []
    for i in range(7):
        day_temp = base_temp + random.uniform(-3, 5)
        forecast.append({
            "date": (utc_now() + timedelta(days=i)).strftime("%Y-%m-%d"),
            "temp_max": round(day_temp + 3, 1),
            "temp_min": round(day_temp - 5, 1),
            "humidity": round(random.uniform(65, 90), 0),
            "rainfall_mm": round(random.uniform(0, 20) if random.random() > 0.4 else 0, 1),
            "wind_speed_kmh": round(random.uniform(8, 25), 1),
            "description": random.choice(["Partly Cloudy", "Mostly Sunny", "Light Rain", "Overcast"]),
            "icon": random.choice(["⛅", "☀️", "🌧️", "🌥️"]),
        })

    return {
        "current": {
            "temperature": round(base_temp + random.uniform(-2, 5), 1),
            "feels_like": round(base_temp + random.uniform(-1, 6), 1),
            "humidity": round(random.uniform(70, 88), 0),
            "wind_speed_kmh": round(random.uniform(10, 22), 1),
            "rainfall_mm": round(random.uniform(0, 10), 1),
            "uv_index": round(random.uniform(5, 11), 1),
            "visibility_km": round(random.uniform(6, 15), 1),
            "description": "Partly Cloudy with chance of rain",
            "lat": lat,
            "lng": lng,
            "recorded_at": utc_now().isoformat(),
        },
        "forecast": forecast,
        "source": "demo",
    }

def _parse_owm_response(data: dict) -> dict:
    forecast = []
    for item in data.get("list", [])[:7]:
        forecast.append({
            "date": item.get("dt_txt", "")[:10],
            "temp_max": item["main"]["temp_max"],
            "temp_min": item["main"]["temp_min"],
            "humidity": item["main"]["humidity"],
            "rainfall_mm": item.get("rain", {}).get("3h", 0),
            "wind_speed_kmh": round(item["wind"]["speed"] * 3.6, 1),
            "description": item["weather"][0]["description"].title(),
        })

    first = data["list"][0]
    return {
        "current": {
            "temperature": first["main"]["temp"],
            "humidity": first["main"]["humidity"],
            "wind_speed_kmh": round(first["wind"]["speed"] * 3.6, 1),
            "rainfall_mm": first.get("rain", {}).get("3h", 0),
            "description": first["weather"][0]["description"].title(),
            "recorded_at": utc_now().isoformat(),
        },
        "forecast": forecast,
        "source": "openweathermap",
    }
