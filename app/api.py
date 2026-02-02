import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.orchestrator import Orchestrator


class DesignRequest(BaseModel):
    prompt: str


app = FastAPI(title="Desgen API")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = Orchestrator()


@app.get("/")
def root():
    return {"status": "ok", "message": "Desgen API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/design")
def design(request: DesignRequest):
    return orchestrator.handle(request.prompt)