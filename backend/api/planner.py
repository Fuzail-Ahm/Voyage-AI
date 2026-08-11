from fastapi import APIRouter

from graph.workflow import graph
from models.planner_models import TripRequest

router = APIRouter()


@router.post("/plan")
def plan_trip(request: TripRequest):

    initial_state = {
        "user_prompt": request.user_prompt,

        "destination": "",
        "days": 0,
        "travelers": 0,
        "budget": 0,

        "check_in": "",
        "check_out": "",

        "travel_style": "",
        "interests": [],
        "clarification_question": "",

        "food_preferences": "",
        "flight_class": "",
        "special_requests": "",

        "missing_information": [],

        "hotels": [],
        "hotel_recommendations": [],
        "hotel_alternatives": [],
        "hotel_message": "",
        
        "restaurants": [],
        "budget_breakdown": {},

        "weather": {},
        "itinerary": [],

        "pdf_path": ""
        
    }

    result = graph.invoke(initial_state)

    return result