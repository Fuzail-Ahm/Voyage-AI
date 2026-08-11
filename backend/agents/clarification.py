from graph.state import TripState


def clarification_node(state: TripState) -> TripState:

    missing = state["missing_information"]

    if "travel dates" in missing:
        state["clarification_question"] = (
            "What dates would you like to travel?"
        )

    elif "budget" in missing:
        state["clarification_question"] = (
            "What is your total travel budget?"
        )

    elif "number of travelers" in missing:
        state["clarification_question"] = (
            "How many people will be traveling?"
        )

    else:
        state["clarification_question"] = (
            "Could you provide a few more details about your trip?"
        )

    return state