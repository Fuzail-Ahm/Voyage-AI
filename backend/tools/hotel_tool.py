from typing import List, Dict


def search_hotels(destination: str) -> List[Dict]:
    """
    Search for hotels in a destination.

    This function will later call a real hotel/search API.
    """

    return [
        {
            "name": f"Luxury Hotel in {destination}",
            "rating": 4.8,
            "address": destination,
            "price_per_night": 35000,
            "currency": "INR",
            "amenities": [
                "Spa",
                "Breakfast",
                "Swimming Pool"
            ]
        },
        {
            "name": f"Premium Resort in {destination}",
            "rating": 4.7,
            "address": destination,
            "price_per_night": 28000,
            "currency": "INR",
            "amenities": [
                "Spa",
                "Restaurant",
                "Airport Transfer"
            ]
        }
    ]