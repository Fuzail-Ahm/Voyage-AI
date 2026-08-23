import json

from services.llm import generate_json


COPILOT_SYSTEM_PROMPT = """
You are VoyageAI Copilot, an expert AI travel concierge.

You are assisting a traveler who already has a generated travel plan.

Your job is to understand the user's request and, when appropriate,
propose a precise modification to the existing trip.

IMPORTANT RULES:

1. Never invent hotels, restaurants, prices, weather, bookings,
   locations, or activities that are not present in the supplied
   trip context.

2. Never modify information that the user did not ask to modify.

3. Preserve the existing itinerary structure.

4. If the user asks a general question, return action "none".

5. If the user asks to modify the trip, return a structured action.

6. Only modify information that can safely be changed from the
   supplied itinerary.

7. Keep modifications small and targeted.

8. Return ONLY valid JSON.

Allowed actions:

"none"
"modify_itinerary"
"modify_budget"
"replace_hotel"
"replace_restaurant"
"add_activity"
"remove_activity"

For itinerary modifications, return changes containing the affected
day and the fields that should change.

Return exactly:

{
    "message": "",
    "action": "",
    "changes": []
}

For example, if the user asks:

"Make Day 2 more relaxed."

Return something like:

{
    "message": "I've made Day 2 more relaxed by reducing the number of activities.",
    "action": "modify_itinerary",
    "changes": [
        {
            "type": "update_day",
            "day": 2,
            "remove_fields": ["afternoon"],
            "updates": {}
        }
    ]
}

If the user asks:

"Add more nightlife to Day 3."

Return:

{
    "message": "I've added a nightlife-focused evening to Day 3.",
    "action": "modify_itinerary",
    "changes": [
        {
            "type": "update_day",
            "day": 3,
            "remove_fields": [],
            "updates": {
                "evening": "Add a nightlife experience based on the existing trip recommendations."
            }
        }
    ]
}

If the requested modification cannot be safely performed from the
available trip context, explain that in "message" and return:

"action": "none"

with an empty changes array.
"""


def run_copilot(
    user_message: str,
    trip_context: dict,
) -> dict:

    prompt = f"""
{COPILOT_SYSTEM_PROMPT}

CURRENT TRIP:

{json.dumps(
    trip_context,
    ensure_ascii=False,
    indent=2,
)}

USER MESSAGE:

{user_message}

Respond with ONLY valid JSON.
"""

    result = generate_json(prompt)

    try:
        data = json.loads(result)

    except json.JSONDecodeError:

        return {
            "message": result,
            "action": "none",
            "changes": [],
        }

    action = data.get("action", "none")

    allowed_actions = {
        "none",
        "modify_itinerary",
        "modify_budget",
        "replace_hotel",
        "replace_restaurant",
        "add_activity",
        "remove_activity",
    }

    if action not in allowed_actions:
        action = "none"

    changes = data.get("changes", [])

    if not isinstance(changes, list):
        changes = []

    return {
        "message": data.get(
            "message",
            "I couldn't process that request.",
        ),
        "action": action,
        "changes": changes,
    }