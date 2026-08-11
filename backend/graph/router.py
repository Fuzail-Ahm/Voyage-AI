from graph.state import TripState


def route_after_validation(state: TripState):

    if state["missing_information"]:
        return "clarification"

    return "hotel"