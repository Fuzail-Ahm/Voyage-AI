import os
from datetime import date, timedelta
from pathlib import Path

import requests
from dotenv import load_dotenv


# ============================================================
# ENVIRONMENT
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"

load_dotenv(ENV_PATH)


# ============================================================
# SERPAPI CLIENT
# ============================================================

class SerpApiClient:

    BASE_URL = "https://serpapi.com/search"

    def __init__(self):
        self.api_key = os.getenv("SERPAPI_API_KEY")

        if not self.api_key:
            raise RuntimeError(
                "SERPAPI_API_KEY is missing.\n"
                f"Add it to: {ENV_PATH}"
            )

    # ========================================================
    # COMMON REQUEST
    # ========================================================

    def _request(self, params: dict) -> dict:

        response = requests.get(
            self.BASE_URL,
            params=params,
            timeout=30,
        )

        response.raise_for_status()

        data = response.json()

        # SerpAPI may return HTTP 200 while reporting
        # an API-level error in the JSON.
        if data.get("error"):
            raise RuntimeError(
                f"SerpAPI error: {data['error']}"
            )

        return data

    # ========================================================
    # HOTEL SEARCH
    # ========================================================

    def search_hotels(
        self,
        destination: str,
        check_in: str = "",
        check_out: str = "",
        adults: int = 2,
    ) -> dict:

        # Google Hotels requires check-in and check-out dates.
        # If the user did not provide dates, use a temporary
        # one-night search window only for finding hotels.
        if not check_in or not check_out:

            temporary_check_in = (
                date.today() + timedelta(days=7)
            )

            temporary_check_out = (
                temporary_check_in + timedelta(days=1)
            )

            check_in = temporary_check_in.isoformat()
            check_out = temporary_check_out.isoformat()

        params = {
            "engine": "google_hotels",
            "q": destination,
            "check_in_date": check_in,
            "check_out_date": check_out,
            "adults": adults,
            "currency": "INR",
            "gl": "in",
            "hl": "en",
            "api_key": self.api_key,
        }

        data = self._request(params)

        properties = data.get(
            "properties",
            [],
        )

        print(
            f"SERPAPI HOTEL RESULTS: {len(properties)}"
        )

        return data

    # ========================================================
    # RESTAURANT / PLACES SEARCH
    # ========================================================

    def search_places(
        self,
        query: str,
    ) -> dict:

        params = {
            "engine": "google_maps",
            "q": query,
            "type": "search",
            "hl": "en",
            "gl": "in",
            "api_key": self.api_key,
        }

        data = self._request(params)

        places = data.get(
            "local_results",
            [],
        )

        print(
            f"SERPAPI PLACE RESULTS: {len(places)}"
        )

        return data


# ============================================================
# SHARED CLIENT
# ============================================================

serpapi_client = SerpApiClient()