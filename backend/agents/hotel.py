from graph.state import TripState
from tools.hotel_tool import search_hotels


def hotel_node(state: TripState):

    destination = state["destination"]

    hotels = search_hotels(destination)

    state["hotels"] = hotels

    return state