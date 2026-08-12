from graph.state import TripState
from services.weather import get_weather


def weather_node(state: TripState) -> TripState:

    check_in = state["check_in"]
    check_out = state["check_out"]

    hotels = state.get("hotel_recommendations", [])

    if not hotels:
        state["weather"] = {
            "available": False,
            "reason": "No hotel location available.",
        }

        state["weather_summary"] = (
            "Weather data unavailable because no hotel "
            "location was found."
        )

        return state

    hotel = hotels[0]

    latitude = hotel.get("latitude")
    longitude = hotel.get("longitude")

    if latitude is None or longitude is None:

        state["weather"] = {
            "available": False,
            "reason": "Hotel coordinates unavailable.",
        }

        state["weather_summary"] = (
            "Weather data unavailable for this destination."
        )

        return state

    weather = get_weather(
        latitude=latitude,
        longitude=longitude,
        start_date=check_in,
        end_date=check_out,
    )

    state["weather"] = weather

    if weather.get("available"):

        state["weather_summary"] = (
            "Weather forecast retrieved for the trip dates."
        )

    else:

        state["weather_summary"] = (
            "A forecast is not currently available for "
            "the selected travel dates."
        )

    return state