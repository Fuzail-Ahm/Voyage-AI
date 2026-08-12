import requests


def get_weather(
    latitude: float,
    longitude: float,
    start_date: str,
    end_date: str,
):

    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": (
            "temperature_2m_max,"
            "temperature_2m_min,"
            "precipitation_probability_max,"
            "weather_code"
        ),
        "timezone": "auto",
        "start_date": start_date,
        "end_date": end_date,
    }

    response = requests.get(
        url,
        params=params,
        timeout=20,
    )

    # Don't crash the entire LangGraph if weather
    # isn't available for the requested dates.
    if response.status_code != 200:
        return {
            "available": False,
            "error": response.text,
        }

    data = response.json()

    return {
        "available": True,
        "data": data,
    }