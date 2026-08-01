import json

from services.llm import client

SYSTEM_PROMPT = """
You are an expert luxury travel concierge.

Extract structured trip information from the user's request.

Return ONLY valid JSON.

Rules:

1. destination
   - City, region, or country.

2. days
   - Integer.

3. travelers
   - Integer.

4. budget
   - Integer only (no commas or currency symbols).

5. travel_style
   - ONLY one of:
     Luxury
     Budget
     Adventure
     Family
     Business
     Backpacking
     Romantic
     Solo

6. interests
   - List of activities.
   Example:
   ["Wine tasting", "Museums", "Private tours"]

7. food_preferences
   - Vegetarian
   - Vegan
   - Halal
   - Jain
   - None

8. flight_class
   - Economy
   - Premium Economy
   - Business
   - First

9. special_requests
   Put things like:
   - Honeymoon
   - Anniversary
   - Birthday
   - Wheelchair assistance
   - Kids
   - Senior citizens
   - Pet friendly

Never include special requests inside travel_style.

Return ONLY JSON.

Schema:

{
  "destination": "",
  "days": 0,
  "travelers": 0,
  "budget": 0,
  "travel_style": "",
  "interests": [],
  "food_preferences": "",
  "flight_class": "",
  "special_requests": ""
}
"""


def generate_trip_plan(user_prompt: str):

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=[
            SYSTEM_PROMPT,
            user_prompt
        ]
    )

    text = response.text.strip()

    # Remove markdown if Gemini wraps JSON in ```json
    text = text.replace("```json", "").replace("```", "").strip()

    return json.loads(text)