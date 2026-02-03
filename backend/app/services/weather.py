from __future__ import annotations

import asyncio
import logging

import httpx

from app.core.config import settings
from app.core.constants import DEFAULT_FORECAST_DAYS, FORECAST_API_URL, GEOCODE_API_URL
from app.core.http import create_http_client
from app.utils.weather_utils import candidate_locations, units_params

logger = logging.getLogger(__name__)


class WeatherError(RuntimeError):
    pass


async def geocode_location(client: httpx.AsyncClient, location: str) -> dict:
    if not location or not location.strip():
        raise WeatherError("Location cannot be empty.")

    for name, country in candidate_locations(location):
        try:
            response = await client.get(
                GEOCODE_API_URL,
                params={
                    "name": name,
                    "count": 3,
                    "language": "en",
                    "format": "json",
                    "country": country,
                },
            timeout=settings.http_timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, dict):
                logger.warning(f"Invalid geocode response format for '{name}'")
                continue
            results = payload.get("results") or []
            if results and isinstance(results, list) and len(results) > 0:
                result = results[0]
                if not isinstance(result, dict) or "latitude" not in result or "longitude" not in result:
                    logger.warning(f"Invalid geocode result format for '{name}'")
                    continue
                return result
        except httpx.TimeoutException:
            logger.warning(f"Geocode timeout for '{name}'")
            continue
        except httpx.HTTPStatusError as e:
            logger.warning(f"Geocode HTTP error for '{name}': {e.response.status_code}")
            if e.response.status_code >= 500:
                raise WeatherError("Weather service is temporarily unavailable. Please try again later.")
            continue
        except httpx.RequestError as e:
            logger.error(f"Geocode request error for '{name}': {e}")
            raise WeatherError("Unable to connect to geocoding service. Please check your internet connection.")
        except Exception as e:
            logger.error(f"Unexpected geocode error for '{name}': {e}", exc_info=True)
            continue

    raise WeatherError(f"Could not find coordinates for '{location}'. Please check the spelling and try again.")


async def _fetch_weather_with_client(
    client: httpx.AsyncClient, location: str, units: str = "metric"
) -> dict:
    place = await geocode_location(client, location)

    if "latitude" not in place or "longitude" not in place:
        raise WeatherError(f"Invalid location data for '{location}'.")

    try:
        params = {
            "latitude": place["latitude"],
            "longitude": place["longitude"],
            "current": ",".join(
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "precipitation",
                    "weather_code",
                    "wind_speed_10m",
                    "wind_direction_10m",
                ]
            ),
            "hourly": ",".join(
                [
                    "temperature_2m",
                    "precipitation_probability",
                    "weather_code",
                    "wind_speed_10m",
                ]
            ),
            "daily": ",".join(
                [
                    "weather_code",
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "precipitation_sum",
                    "wind_speed_10m_max",
                    "sunrise",
                    "sunset",
                ]
            ),
            "forecast_days": settings.forecast_days or DEFAULT_FORECAST_DAYS,
            "timezone": "auto",
            **units_params(units),
        }
        response = await client.get(
            FORECAST_API_URL, params=params, timeout=settings.http_timeout_seconds
        )
        response.raise_for_status()
        data = response.json()

        if not isinstance(data, dict):
            raise WeatherError("Invalid response format from weather service.")

        if "error" in data:
            error_msg = data.get("reason", "Unknown error from weather service.")
            raise WeatherError(f"Weather service error: {error_msg}")

        return {
            "location": {
                "name": place.get("name"),
                "country": place.get("country"),
                "admin1": place.get("admin1"),
                "latitude": place.get("latitude"),
                "longitude": place.get("longitude"),
                "timezone": data.get("timezone"),
            },
            "current": data.get("current", {}),
            "daily": data.get("daily", {}),
            "hourly": data.get("hourly", {}),
            "units": {
                "temperature": data.get("current_units", {}).get("temperature_2m", "°C"),
                "wind_speed": data.get("current_units", {}).get("wind_speed_10m", "km/h"),
                "precipitation": data.get("current_units", {}).get("precipitation", "mm"),
            },
        }
    except httpx.TimeoutException:
        logger.error(f"Weather fetch timeout for '{location}'")
        raise WeatherError("Request timeout. The weather service is taking too long to respond.")
    except httpx.HTTPStatusError as e:
        logger.error(f"Weather HTTP error for '{location}': {e.response.status_code}")
        if e.response.status_code >= 500:
            raise WeatherError("Weather service is temporarily unavailable. Please try again later.")
        raise WeatherError(f"Failed to fetch weather data. Status: {e.response.status_code}")
    except httpx.RequestError as e:
        logger.error(f"Weather request error for '{location}': {e}")
        raise WeatherError("Unable to connect to weather service. Please check your internet connection.")
    except WeatherError:
        raise
    except Exception as e:
        logger.error(f"Unexpected weather fetch error for '{location}': {e}", exc_info=True)
        raise WeatherError("An unexpected error occurred while fetching weather data.")


async def fetch_weather(location: str, units: str = "metric") -> dict:
    async with create_http_client() as client:
        return await _fetch_weather_with_client(client, location, units)


async def fetch_weather_batch(locations: list[str], units: str = "metric") -> list[dict]:
    if not locations:
        raise WeatherError("No locations provided.")
    if len(locations) > settings.max_locations_per_request:
        raise WeatherError(
            f"Too many locations. Maximum {settings.max_locations_per_request} locations allowed per request."
        )

    async with create_http_client() as client:
        tasks = [_fetch_weather_with_client(client, location, units) for location in locations]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        processed = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error fetching weather for '{locations[i]}': {result}")
                if isinstance(result, WeatherError):
                    raise result
                raise WeatherError(f"Failed to fetch weather for '{locations[i]}': {str(result)}")
            processed.append(result)
        return processed

    