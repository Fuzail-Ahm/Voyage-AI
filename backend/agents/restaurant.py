from graph.state import TripState
from tools.restaurant_tool import search_restaurants


def restaurant_node(state: TripState):

    destination = state["destination"]
    food_preferences = state["food_preferences"]
    interests = state["interests"]
    travel_style = state["travel_style"]

    # Build a search query based on the user's preferences.
    query_parts = []

    if food_preferences:
        query_parts.append(food_preferences)

    if "Michelin" in interests:
        query_parts.append("Michelin")

    if travel_style == "Luxury":
        query_parts.append("fine dining")

    query_parts.append("restaurants")

    query = " ".join(query_parts)

    restaurants = search_restaurants(
        destination=destination,
        query=query,
        min_rating=4.3,
    )

    state["restaurants"] = restaurants
    state["restaurant_recommendations"] = restaurants[:3]

    if restaurants:
        state["restaurant_message"] = (
            "I found highly rated restaurants matching your trip preferences."
        )
    else:
        state["restaurant_message"] = (
            "I couldn't find suitable restaurants for the current criteria."
        )

    return state