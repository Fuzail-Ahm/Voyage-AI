from graph.state import TripState
from tools.hotel_tool import search_hotels
from services.hotel_ranking import rank_hotels


def hotel_node(state: TripState):

    destination = state["destination"]
    days = state["days"]
    travelers = state["travelers"]

    check_in = state["check_in"]
    check_out = state["check_out"]

    hotel_budget = state["budget_breakdown"]["hotels"]

    max_price_per_night = int(
        hotel_budget / days
    )

    # Search with a wider range.
    hotels = search_hotels(
        destination=destination,
        check_in=check_in,
        check_out=check_out,
        adults=travelers,
        max_price_per_night=int(
            max_price_per_night * 1.25
        ),
        min_rating=4.5,
    )

    recommendations, alternatives = rank_hotels(
        hotels=hotels,
        max_price_per_night=max_price_per_night,
    )

    state["hotels"] = hotels
    state["hotel_recommendations"] = recommendations
    state["hotel_alternatives"] = alternatives

    if recommendations:
        state["hotel_message"] = (
            "I found highly rated luxury hotels within your target budget."
        )

    elif alternatives:
        state["hotel_message"] = (
            "I couldn't find enough hotels within your target budget, "
            "but I found highly rated alternatives slightly above it."
        )

    else:
        state["hotel_message"] = (
            "I couldn't find suitable luxury hotels within the "
            "current budget range."
        )

    return state