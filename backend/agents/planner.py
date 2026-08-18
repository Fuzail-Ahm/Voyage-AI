import json

from graph.state import TripState
from services.llm import client


SYSTEM_PROMPT = """
You are an expert luxury travel concierge.

Extract structured travel information from the user's request.

IMPORTANT:

- Never invent missing information.
- If travel dates are not provided, return empty strings for check_in and check_out.
- If only a duration is provided but no dates, leave check_in and check_out empty.
- Keep travel_style separate from special_requests.
- Return ONLY valid JSON.

Rules:

destination:
The requested city, region, or country.

days:
Trip duration as an integer.

travelers:
Number of travelers.

budget:
Total trip budget as an integer in the user's currency.
Do not include currency symbols or commas.

check_in:
Travel start date in YYYY-MM-DD format.
Return "" if not explicitly provided.

check_out:
Travel end date in YYYY-MM-DD format.
Return "" if not explicitly provided.

travel_style:
Use one primary style such as:
Luxury, Budget, Adventure, Family, Romantic,
Business, Backpacking, Solo.

interests:
Activities or experiences the user explicitly requests.

food_preferences:
Dietary preferences explicitly mentioned by the user.

flight_class:
Economy, Premium Economy, Business, or First.
Return "" if not specified.

special_requests:
Occasions or special requirements such as:
Honeymoon, Anniversary, Birthday, children,
wheelchair assistance, senior citizens, etc.

Return ONLY this JSON:

{
    "destination": "",
    "days": 0,
    "travelers": 0,
    "budget": 0,
    "check_in": "",
    "check_out": "",
    "travel_style": "",
    "interests": [],
    "food_preferences": "",
    "flight_class": "",
    "special_requests": ""
}
"""


def planner_node(state: TripState):

    # --------------------------------------------------------
    # Preserve values explicitly supplied by the frontend
    # --------------------------------------------------------

    original = dict(state)

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=[
            SYSTEM_PROMPT,
            state.get("user_prompt", ""),
        ],
    )

    text = (
        response.text
        .replace("```json", "")
        .replace("```", "")
        .strip()
    )

    data = json.loads(text)

    # --------------------------------------------------------
    # Update the state with LLM-extracted information
    # --------------------------------------------------------

    state.update(data)

    # --------------------------------------------------------
    # IMPORTANT:
    # Explicit frontend values always take priority over
    # values extracted by the LLM.
    # --------------------------------------------------------

    protected_fields = [
        "destination",
        "days",
        "travelers",
        "budget",
        "check_in",
        "check_out",
        "travel_style",
        "interests",
        "food_preferences",
        "flight_class",
        "special_requests",
    ]

    for field in protected_fields:

        original_value = original.get(field)

        # Don't overwrite a real value supplied by the user
        # with an empty/default LLM value.
        if original_value not in (
            None,
            "",
            0,
            [],
        ):
            state[field] = original_value

    # --------------------------------------------------------
    # Ensure required fields exist
    # --------------------------------------------------------

    state.setdefault("destination", "")
    state.setdefault("days", 0)
    state.setdefault("travelers", 0)
    state.setdefault("budget", 0)

    state.setdefault("check_in", "")
    state.setdefault("check_out", "")

    state.setdefault("travel_style", "")
    state.setdefault("interests", [])

    state.setdefault("food_preferences", "")
    state.setdefault("flight_class", "")
    state.setdefault("special_requests", "")

    return state