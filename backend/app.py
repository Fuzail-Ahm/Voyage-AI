import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.planner import router as planner_router
from api.copilot import router as copilot_router


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="VoyageAI API"
)


# ============================================================
# CORS
# ============================================================

# Local development:
#   http://localhost:3000
#
# Production:
#   Set FRONTEND_URL in the hosting platform's
#   environment variables to the deployed frontend URL.

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "https://voyage-ai-ebon.vercel.app",
    "https://voyage-mc5108d56-aighpr.vercel.app",
]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTES
# ============================================================

# AI travel planner
app.include_router(
    planner_router
)


# AI Trip Copilot
app.include_router(
    copilot_router
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Welcome to VoyageAI API 🚀"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }