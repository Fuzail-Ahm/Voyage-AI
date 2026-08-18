from typing import TypedDict



class TripState(TypedDict):

    user_prompt: str

    destination: str
    days: int
    travelers: int
    budget: int

    check_in: str
    check_out: str

    travel_style: str
    interests: list[str]

    food_preferences: str
    flight_class: str
    special_requests: str

    missing_information: list[str]
    clarification_question: str

    budget_breakdown: dict

    hotels: list
    hotel_recommendations: list
    hotel_alternatives: list
    hotel_message: str

    restaurant_recommendations: list
    restaurant_alternatives: list
    restaurant_message: str

    restaurants: list
    weather: dict
    weather_summary: str
    itinerary: list
    itinerary_summary: str

    pdf_path: str
    destination_image: str
