from pydantic import BaseModel
from typing import List


class TripRequest(BaseModel):
    user_prompt: str


class TripPlan(BaseModel):
    destination: str
    days: int
    travelers: int
    budget: int
    travel_style: str
    interests: List[str]
    food_preferences: str
    flight_class: str
    special_requests: str