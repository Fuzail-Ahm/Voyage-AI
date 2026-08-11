import os
import requests

from dotenv import load_dotenv

load_dotenv()


class SerpApiClient:

    BASE_URL = "https://serpapi.com/search"

    def __init__(self):
        self.api_key = os.getenv("SERPAPI_API_KEY")

        if not self.api_key:
            raise ValueError("SERPAPI_API_KEY is not configured")

    def search_hotels(
        self,
        destination: str,
        check_in: str,
        check_out: str,
        adults: int = 2,
    ):

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

        response = requests.get(
            self.BASE_URL,
            params=params,
            timeout=30,
        )

        response.raise_for_status()

        return response.json()


serpapi_client = SerpApiClient()