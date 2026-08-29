from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.planner import router as planner_router
from api.copilot import router as copilot_router


app = FastAPI(title="VoyageAI API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://voyage-ai-ebon.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Existing planner routes
app.include_router(planner_router)

# AI Trip Copilot
app.include_router(copilot_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to VoyageAI API 🚀"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }