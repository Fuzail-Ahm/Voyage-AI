from graph.state import TripState
from tools.hotel_tool import search_hotels
from services.hotel_ranking import rank_hotels


def hotel_node(state: TripState) -> TripState:

    destination = state.get("destination", "")
    days = state.get("days", 1)
    travelers = state.get("travelers", 2)

    check_in = state.get("check_in", "")
    check_out = state.get("check_out", "")

    budget_breakdown = state.get("budget_breakdown", {})

    hotel_budget = budget_breakdown.get("hotels", 0)

    if not hotel_budget:
        hotel_budget = state.get("budget", 0)

    if not days:
        days = 1

    max_price_per_night = int(
        hotel_budget / days
    ) if hotel_budget else None

    print("\n========== HOTEL AGENT ==========")
    print("DESTINATION:", destination)
    print("CHECK IN:", check_in)
    print("CHECK OUT:", check_out)
    print("TRAVELERS:", travelers)
    print("HOTEL BUDGET:", hotel_budget)
    print("TARGET NIGHTLY PRICE:", max_price_per_night)

    # ---------------------------------------------------------
    # FIRST SEARCH
    # ---------------------------------------------------------

    try:

        hotels = search_hotels(
            destination=destination,
            check_in=check_in,
            check_out=check_out,
            adults=travelers,
            max_price_per_night=None,
            min_rating=0.0,
        )

    except Exception as exc:

        print("HOTEL SEARCH ERROR:", repr(exc))

        hotels = []

    print("RAW HOTELS:", len(hotels))

    # ---------------------------------------------------------
    # FALLBACK
    # ---------------------------------------------------------

    # Do NOT destroy valid SerpAPI results just because
    # the budget/rating filter is strict.

    if not hotels:

        state["hotels"] = []
        state["hotel_recommendations"] = []
        state["hotel_alternatives"] = []

        state["hotel_message"] = (
            "No hotel recommendations were available for "
            "this destination."
        )

        print("FINAL HOTEL COUNT: 0")

        return state

    # ---------------------------------------------------------
    # RANK ALL VALID RESULTS
    # ---------------------------------------------------------

    if max_price_per_night:

        recommendations, alternatives = rank_hotels(
            hotels=hotels,
            max_price_per_night=max_price_per_night,
        )

    else:

        recommendations = hotels[:3]
        alternatives = hotels[3:6]

    # ---------------------------------------------------------
    # IMPORTANT FALLBACK
    # ---------------------------------------------------------

    # If budget filtering removed everything, still show
    # the highest-rated hotels returned by SerpAPI.

    if not recommendations and not alternatives:

        recommendations = sorted(
            hotels,
            key=lambda hotel: (
                hotel.get("rating", 0),
                hotel.get("reviews", 0),
            ),
            reverse=True,
        )[:3]

    state["hotels"] = hotels

    state["hotel_recommendations"] = recommendations

    state["hotel_alternatives"] = alternatives

    if recommendations:

        state["hotel_message"] = (
            "I found highly rated hotels matching "
            "your destination and trip preferences."
        )

    elif alternatives:

        state["hotel_message"] = (
            "I found highly rated hotel alternatives "
            "for your trip."
        )

    else:

        state["hotel_message"] = (
            "No suitable hotels were found."
        )

    print(
        "FINAL HOTEL COUNT:",
        len(state["hotel_recommendations"])
    )

    print(
        "HOTEL ALTERNATIVE COUNT:",
        len(state["hotel_alternatives"])
    )

    print("=================================\n")

    return state