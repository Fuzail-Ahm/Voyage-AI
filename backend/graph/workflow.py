from langgraph.graph import END, START, StateGraph

from agents.planner import planner_node
from agents.hotel import hotel_node
from graph.state import TripState


builder = StateGraph(TripState)

builder.add_node("planner", planner_node)
builder.add_node("hotel", hotel_node)

builder.add_edge(START, "planner")
builder.add_edge("planner", "hotel")
builder.add_edge("hotel", END)

graph = builder.compile()