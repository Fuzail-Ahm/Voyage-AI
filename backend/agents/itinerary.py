import json

from graph.state import TripState
from services.llm import generate_json


ITINERARY_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string"
        },
        "days": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "day": {
                        "type": "integer"
                    },
                    "date": {
                        "type": "string"
                    },
                    "title": {
                        "type": "string"
                    },
                    "morning": {
                        "type": "string"
                    },
                    "afternoon": {
                        "type": "string"
                    },
                    "evening": {
                        "type": "string"
                    },
                    "dining": {
                        "type": "string"
                    },
                    "notes": {
                        "type": "string"
                    }
                },
                "required": [
                    "day",
                    "date",
                    "title",
                    "morning",
                    "afternoon",
                    "evening",
                    "dining",
                    "notes"
                ]
            }
        }
    },
    "required": [
        "summary",
        "days"
    ]
}


ITINERARY_PROMPT = """
You are VoyageAI, an expert luxury travel concierge.

Create a realistic, premium day-by-day travel itinerary using
the structured trip information and recommendations provided below.

IMPORTANT RULES:

1. Do not invent hotels or restaurants that are not provided.
2. Use the selected hotel as the accommodation base.
3. Consider geographic practicality.
4. Do not schedule too many activities in one day.
5. Include relaxation time for luxury travelers.
6. Use weather information when available.
7. If weather data is unavailable, do not invent a forecast.
8. Respect food preferences and special requests.
9. Stay within the user's budget.
10. Make the itinerary feel premium and personalized.

Return exactly one itinerary object for each trip day.
"""


def itinerary_node(state: TripState) -> TripState:

    prompt = ITINERARY_PROMPT + f"""

TRIP INFORMATION

Destination:
{state["destination"]}

Trip duration:
{state["days"]} days

Travelers:
{state["travelers"]}

Travel dates:
{state["check_in"]} to {state["check_out"]}

Total budget:
₹{state["budget"]}

Travel style:
{state["travel_style"]}

Interests:
{state["interests"]}

Food preferences:
{state["food_preferences"]}

Special requests:
{state["special_requests"]}

Budget breakdown:
{state["budget_breakdown"]}

Hotel recommendations:
{state["hotel_recommendations"]}

Restaurant recommendations:
{state["restaurant_recommendations"]}

Weather:
{state["weather"]}

Weather summary:
{state["weather_summary"]}
"""

    response = generate_json(
        prompt,
        ITINERARY_SCHEMA
    )

    data = json.loads(response)

    state["itinerary"] = data.get("days", [])

    state["itinerary_summary"] = data.get(
        "summary",
        "Your personalized itinerary is ready."
    )

    return state