from typing import List, Dict

from services.serpapi import serpapi_client


def search_restaurants(
    destination: str,
    min_rating: float = 4.3,
    query: str = "restaurants",
) -> List[Dict]:

    data = serpapi_client.search_places(
        query=f"{query} in {destination}"
    )

    places = data.get("local_results", [])

    restaurants = []

    for place in places:

        rating = place.get("rating", 0)

        if rating < min_rating:
            continue

        restaurants.append({
            "name": place.get("title"),
            "rating": rating,
            "reviews": place.get("reviews", 0),
            "address": place.get("address"),
            "type": place.get("type"),
            "description": place.get("description"),
            "phone": place.get("phone"),
            "website": place.get("website"),
            "maps_link": place.get("links", {}).get("directions"),
            "thumbnail": place.get("thumbnail"),
        })

    restaurants.sort(
        key=lambda restaurant: (
            restaurant.get("rating", 0),
            restaurant.get("reviews", 0),
        ),
        reverse=True,
    )

    return restaurants[:10]