from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.copilot import run_copilot


router = APIRouter(
    prefix="/copilot",
    tags=["AI Trip Copilot"],
)


class CopilotRequest(BaseModel):
    message: str
    trip: dict


class CopilotResponse(BaseModel):
    message: str
    action: str
    changes: list


@router.post(
    "/chat",
    response_model=CopilotResponse,
)
def copilot_chat(
    request: CopilotRequest,
):

    try:

        if not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty.",
            )

        result = run_copilot(
            user_message=request.message,
            trip_context=request.trip,
        )

        return result

    except HTTPException:
        raise

    except Exception as exc:

        print(
            "COPILOT ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=f"Copilot failed: {exc}",
        )