from typing import List, Dict

from services.serpapi import serpapi_client


def search_hotels(
    destination: str,
    check_in: str,
    check_out: str,
    adults: int,
    max_price_per_night: int | None = None,
    min_rating: float = 0.0,
) -> List[Dict]:

    data = serpapi_client.search_hotels(
        destination=destination,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
    )

    properties = data.get("properties", [])

    hotels = []

    for hotel in properties:

        rating = hotel.get("overall_rating", 0)

        rate_data = hotel.get("rate_per_night", {})

        price = rate_data.get("extracted_lowest")

        # Rating filter
        if rating < min_rating:
            continue

        # Price filter
        if (
            max_price_per_night is not None
            and price is not None
            and price > max_price_per_night
        ):
            continue

        hotels.append(
            {
                "name": hotel.get("name"),
                "description": hotel.get("description"),
                "rating": rating,
                "reviews": hotel.get("reviews", 0),
                "price_per_night": price,
                "currency": "INR",
                "amenities": hotel.get("amenities", []),
                "latitude": hotel.get("gps_coordinates", {}).get("latitude"),
                "longitude": hotel.get("gps_coordinates", {}).get("longitude"),
                "hotel_link": hotel.get("link"),
                "thumbnail": hotel.get("thumbnail"),
                "property_token": hotel.get("property_token"),
            }
        )

    # Highest rated hotels first
    hotels.sort(
        key=lambda hotel: (
            hotel["rating"],
            hotel["reviews"],
        ),
        reverse=True,
    )

    return hotels[:5]