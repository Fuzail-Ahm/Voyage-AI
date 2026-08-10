import json

from graph.state import TripState
from services.llm import client

SYSTEM_PROMPT = """
You are an expert luxury travel planner.

Extract information from the user's request.

Return ONLY valid JSON.

{
 "destination":"",
 "days":0,
 "travelers":0,
 "budget":0,
 "travel_style":"",
 "interests":[],
 "food_preferences":"",
 "flight_class":"",
 "special_requests":""
}
"""


def planner_node(state: TripState):

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=[
            SYSTEM_PROMPT,
            state["user_prompt"]
        ]
    )

    text = (
        response.text.replace("```json", "")
        .replace("```", "")
        .strip()
    )

    data = json.loads(text)

    state.update(data)

    return state