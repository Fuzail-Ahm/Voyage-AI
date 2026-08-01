from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.planner import router as planner_router

app = FastAPI(title="VoyageAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(
    planner_router,
    prefix="/planner",
    tags=["Planner"]
)

@app.get("/")
def home():
    return {"message": "Welcome to VoyageAI API 🚀"}

@app.get("/health")
def health():
    return {"status": "healthy"}