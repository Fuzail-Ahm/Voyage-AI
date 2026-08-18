from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from graph.workflow import graph

router = APIRouter(
    prefix="/planner",
    tags=["Planner"],
)


@router.post("/plan")
def plan_trip(request: dict):
    """
    Generate the complete travel plan.

    The request is passed into the LangGraph workflow.
    The final graph state is returned to the frontend.
    """

    try:
        initial_state = dict(request)

        result = graph.invoke(initial_state)

        # Make absolutely sure the frontend receives
        # the fields it expects.
        result["hotels"] = result.get("hotels") or []
        result["hotel_recommendations"] = (
            result.get("hotel_recommendations") or []
        )
        result["hotel_alternatives"] = (
            result.get("hotel_alternatives") or []
        )

        result["restaurants"] = result.get("restaurants") or []
        result["restaurant_recommendations"] = (
            result.get("restaurant_recommendations") or []
        )
        result["restaurant_alternatives"] = (
            result.get("restaurant_alternatives") or []
        )

        result["weather"] = result.get("weather") or {}
        result["itinerary"] = result.get("itinerary") or []
        result["budget_breakdown"] = (
            result.get("budget_breakdown") or {}
        )

        print(
            "FINAL HOTEL COUNT:",
            len(result["hotels"])
        )

        print(
            "FINAL RESTAURANT COUNT:",
            len(result["restaurants"])
        )

        return result

    except Exception as exc:
        print("PLANNER ERROR:", repr(exc))

        raise HTTPException(
            status_code=500,
            detail=f"Travel planning failed: {str(exc)}",
        )


@router.get("/pdf/{filename}")
def download_pdf(filename: str):
    """
    Download a generated travel-plan PDF.
    """

    backend_dir = Path(__file__).resolve().parent.parent

    pdf_path = backend_dir / "output" / filename

    if not pdf_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"PDF not found: {filename}",
        )

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=filename,
    )


@router.post("/voice-confirmation")
def voice_confirmation(data: dict):
    """
    Generate a natural-language confirmation message.
    """

    destination = data.get(
        "destination",
        "your destination",
    )

    days = data.get("days", 0)

    travelers = data.get("travelers", 0)

    travel_style = data.get(
        "travel_style",
        "personalized",
    )

    message = (
        f"Your VoyageAI {travel_style.lower()} journey "
        f"to {destination} is ready. "
        f"We've prepared a {days}-day itinerary "
        f"for {travelers} travelers, including your "
        f"recommended stay, dining experiences, "
        f"activities, and travel schedule. "
        f"Your personalized travel book is ready to view."
    )

    return {
        "message": message,
    }