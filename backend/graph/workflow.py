from langgraph.graph import END, START, StateGraph

from agents.planner import planner_node
from agents.validator import validate_trip
from agents.clarification import clarification_node
from agents.budget import budget_node
from agents.hotel import hotel_node
from agents.restaurant import restaurant_node
from agents.weather import weather_node
from agents.itinerary import itinerary_node

from graph.router import route_after_validation
from graph.state import TripState
from agents.pdf import pdf_node


builder = StateGraph(TripState)


builder.add_node("planner", planner_node)
builder.add_node("validator", validate_trip)
builder.add_node("clarification", clarification_node)
builder.add_node("budget", budget_node)
builder.add_node("hotel", hotel_node)
builder.add_node("restaurant", restaurant_node)
builder.add_node("weather", weather_node)
builder.add_node("itinerary", itinerary_node)
builder.add_node("pdf", pdf_node)


builder.add_edge(START, "planner")

builder.add_edge("planner", "validator")


builder.add_conditional_edges(
    "validator",
    route_after_validation,
    {
        "clarification": "clarification",
        "hotel": "budget",
    },
)


builder.add_edge("budget", "hotel")

builder.add_edge("hotel", "restaurant")

builder.add_edge("restaurant", "weather")

builder.add_edge("weather", "itinerary")
builder.add_edge("itinerary", "pdf")
builder.add_edge("pdf", END)

builder.add_edge("clarification", END)


graph = builder.compile()