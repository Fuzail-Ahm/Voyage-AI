from graph.state import TripState
from tools.restaurant_tool import search_restaurants


def restaurant_node(state: TripState) -> TripState:

    destination = state.get("destination", "")

    food_preferences = state.get(
        "food_preferences",
        ""
    )

    interests = state.get(
        "interests",
        []
    )

    travel_style = state.get(
        "travel_style",
        ""
    )

    print("\n======= RESTAURANT AGENT =======")
    print("DESTINATION:", destination)

    # ---------------------------------------------------------
    # BUILD QUERY
    # ---------------------------------------------------------

    query_parts = []

    if food_preferences:
        query_parts.append(
            str(food_preferences)
        )

    if isinstance(interests, list):

        for interest in interests:

            if "michelin" in str(interest).lower():

                query_parts.append(
                    "Michelin"
                )

    if travel_style.lower() == "luxury":

        query_parts.append(
            "fine dining"
        )

    query_parts.append(
        "restaurants"
    )

    query = " ".join(
        query_parts
    )

    print("RESTAURANT QUERY:", query)

    # ---------------------------------------------------------
    # SEARCH
    # ---------------------------------------------------------

    try:

        restaurants = search_restaurants(
            destination=destination,
            query=query,
            min_rating=0.0,
        )

    except Exception as exc:

        print(
            "RESTAURANT SEARCH ERROR:",
            repr(exc)
        )

        restaurants = []

    print(
        "RAW RESTAURANTS:",
        len(restaurants)
    )

    # ---------------------------------------------------------
    # FALLBACK SEARCH
    # ---------------------------------------------------------

    if not restaurants:

        try:

            restaurants = search_restaurants(
                destination=destination,
                query="restaurants",
                min_rating=0.0,
            )

        except Exception as exc:

            print(
                "RESTAURANT FALLBACK ERROR:",
                repr(exc)
            )

            restaurants = []

    # ---------------------------------------------------------
    # SORT
    # ---------------------------------------------------------

    restaurants = sorted(
        restaurants,
        key=lambda restaurant: (
            restaurant.get("rating", 0),
            restaurant.get("reviews", 0),
        ),
        reverse=True,
    )

    # ---------------------------------------------------------
    # SAVE STATE
    # ---------------------------------------------------------

    state["restaurants"] = restaurants

    state["restaurant_recommendations"] = (
        restaurants[:5]
    )

    state["restaurant_alternatives"] = (
        restaurants[5:10]
    )

    if restaurants:

        state["restaurant_message"] = (
            "I found highly rated restaurants "
            "matching your trip preferences."
        )

    else:

        state["restaurant_message"] = (
            "No restaurant recommendations were "
            "available for this destination."
        )

    print(
        "FINAL RESTAURANT COUNT:",
        len(
            state[
                "restaurant_recommendations"
            ]
        )
    )

    print("================================\n")

    return state