import json

from services.llm import generate_json


COPILOT_SYSTEM_PROMPT = """
You are VoyageAI Copilot, an expert AI travel concierge.

You are assisting a traveler who already has a generated travel plan.

Your job is to answer questions and make targeted suggestions based ONLY
on the supplied trip context.

IMPORTANT RULES:

1. Never invent hotels, restaurants, prices, weather, bookings,
   coordinates, or other factual information that is not present
   in the trip context.

2. If the user asks for something that requires information not
   available in the trip context, clearly say that it is not available.

3. Do not regenerate the entire trip unless the user explicitly asks.

4. When the user asks to modify the itinerary, return a proposed
   modification rather than silently changing unrelated parts.

5. Preserve all existing trip information unless the user explicitly
   asks to change it.

6. Be concise, helpful, and conversational.

7. Return ONLY valid JSON.

Return this structure:

{
    "message": "",
    "action": "",
    "changes": []
}

Possible action values:

"none"
"modify_itinerary"
"modify_budget"
"replace_hotel"
"replace_restaurant"
"add_activity"
"remove_activity"

If no modification is requested:

"action": "none"

For changes, return short human-readable descriptions.

Example:

{
    "message": "I can make Day 2 more relaxed by removing one activity.",
    "action": "modify_itinerary",
    "changes": [
        "Make Day 2 less busy",
        "Keep the evening dining experience"
    ]
}
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

    return {
        "message": data.get(
            "message",
            "I couldn't process that request.",
        ),
        "action": data.get(
            "action",
            "none",
        ),
        "changes": data.get(
            "changes",
            [],
        ),
    }