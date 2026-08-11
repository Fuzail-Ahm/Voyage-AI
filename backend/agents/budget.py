from graph.state import TripState


def budget_node(state: TripState) -> TripState:

    total_budget = state["budget"]
    days = state["days"]

    # Initial allocation
    flights = total_budget * 0.30
    hotels = total_budget * 0.25
    food = total_budget * 0.10
    transport = total_budget * 0.08
    activities = total_budget * 0.12
    buffer = total_budget * 0.15

    state["budget_breakdown"] = {
        "total": total_budget,
        "flights": int(flights),
        "hotels": int(hotels),
        "food": int(food),
        "transport": int(transport),
        "activities": int(activities),
        "buffer": int(buffer),
    }

    return state