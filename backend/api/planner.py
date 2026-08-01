from fastapi import APIRouter

from agents.planner import generate_trip_plan
from models.planner_models import TripRequest

router = APIRouter()


@router.post("/plan")
def plan_trip(request: TripRequest):

    result = generate_trip_plan(request.user_prompt)

    return result