from typing import TypedDict


class TripState(TypedDict):

    user_prompt: str

    destination: str

    days: int

    travelers: int

    budget: int

    travel_style: str

    interests: list[str]

    food_preferences: str

    flight_class: str

    special_requests: str

    hotels: list

    restaurants: list

    weather: dict

    itinerary: list

    pdf_path: str