from langgraph.graph import END, START, StateGraph

from agents.planner import planner_node
from agents.validator import validate_trip
from agents.clarification import clarification_node
from agents.budget import budget_node
from agents.hotel import hotel_node

from graph.router import route_after_validation
from graph.state import TripState


builder = StateGraph(TripState)

# Nodes
builder.add_node("planner", planner_node)
builder.add_node("validator", validate_trip)
builder.add_node("clarification", clarification_node)
builder.add_node("budget", budget_node)
builder.add_node("hotel", hotel_node)


# START → Planner
builder.add_edge(START, "planner")

# Planner → Validator
builder.add_edge("planner", "validator")


# Validator → Clarification OR Budget
builder.add_conditional_edges(
    "validator",
    route_after_validation,
    {
        "clarification": "clarification",
        "hotel": "budget",
    },
)


# Budget → Hotel
builder.add_edge("budget", "hotel")

# Hotel → END
builder.add_edge("hotel", END)

# Clarification → END
builder.add_edge("clarification", END)


# Compile the graph
graph = builder.compile()