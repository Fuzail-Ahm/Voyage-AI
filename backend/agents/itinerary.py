import json

from graph.state import TripState
from services.llm import generate_review


ITINERARY_PROMPT = """
You are VoyageAI, an expert luxury travel concierge.

Create a realistic, premium day-by-day travel itinerary using
the structured trip information and recommendations provided below.

IMPORTANT RULES:

1. Do not invent hotels or restaurants that are not provided.
2. Use the selected hotel as the accommodation base.
3. Consider travel time and geographic practicality.
4. Do not schedule too many activities in one day.
5. Include relaxation time for luxury travelers.
6. Use weather information when available.
7. If weather data is unavailable, do not invent a forecast.
8. Respect food preferences and special requests.
9. Stay within the user's budget.
10. Make the itinerary feel premium and personalized.
11. Return ONLY valid JSON.

The itinerary should contain exactly one object per trip day.

Each day should contain:

{
    "day": 1,
    "date": "YYYY-MM-DD",
    "title": "",
    "morning": "",
    "afternoon": "",
    "evening": "",
    "dining": "",
    "notes": ""
}

Return:

{
    "summary": "",
    "days": [
        {
            "day": 1,
            "date": "",
            "title": "",
            "morning": "",
            "afternoon": "",
            "evening": "",
            "dining": "",
            "notes": ""
        }
    ]
}

TRIP INFORMATION:
"""

def itinerary_node(state: TripState) -> TripState:

    prompt = ITINERARY_PROMPT + f"""

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

    response = generate_review(prompt)

    text = response.strip()

    # Handle accidental markdown code fences.
    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

    try:
        data = json.loads(text)

    except json.JSONDecodeError:

        state["itinerary"] = []
        state["itinerary_summary"] = (
            "The itinerary could not be generated."
        )

        return state

    state["itinerary"] = data.get("days", [])

    state["itinerary_summary"] = data.get(
        "summary",
        "Your personalized itinerary is ready."
    )

    return state