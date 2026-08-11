from graph.state import TripState


def validate_trip(state: TripState) -> TripState:

    missing = []

    if not state["destination"]:
        missing.append("destination")

    if not state["days"]:
        missing.append("trip duration")

    if not state["travelers"]:
        missing.append("number of travelers")

    if not state["budget"]:
        missing.append("budget")

    if not state["check_in"] or not state["check_out"]:
        missing.append("travel dates")

    state["missing_information"] = missing

    return state