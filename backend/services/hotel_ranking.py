def rank_hotels(
    hotels: list,
    max_price_per_night: int,
    limit: int = 3,
):
    within_budget = []
    alternatives = []

    for hotel in hotels:

        price = hotel.get("price_per_night")
        rating = hotel.get("rating", 0)

        if price is None:
            continue

        if price <= max_price_per_night:
            within_budget.append(hotel)
        else:
            # Allow alternatives up to 25% above target
            if price <= max_price_per_night * 1.25:
                alternatives.append(hotel)

    # Best rating first, then lower price
    within_budget.sort(
        key=lambda hotel: (
            hotel.get("rating", 0),
            -(hotel.get("price_per_night") or 0),
        ),
        reverse=True,
    )

    alternatives.sort(
        key=lambda hotel: (
            hotel.get("rating", 0),
            -(hotel.get("price_per_night") or 0),
        ),
        reverse=True,
    )

    return (
        within_budget[:limit],
        alternatives[:limit],
    )