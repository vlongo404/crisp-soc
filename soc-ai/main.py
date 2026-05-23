import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import init_db, get_analyses, save_analysis
from analyzer import analyze_wazuh_batch, send_to_ollama, build_wazuh_prompt
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CRISP AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok", "model": os.getenv("MODEL", "llama3.1:8b")}


@app.get("/analyses")
def list_analyses(limit: int = 20):
    return {"analyses": get_analyses(limit)}


class AnalyzeRequest(BaseModel):
    events: list
    source: str = "dashboard"


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Endpoint consumido pelo dashboard via fetch()"""
    prompt = build_wazuh_prompt(req.events)
    result = send_to_ollama(prompt)
    save_analysis(
        source=req.source,
        count=len(req.events),
        priority=result.get("priority", "?"),
        summary=result.get("summary", ""),
        findings=result.get("findings", []),
        action=result.get("recommended_action", ""),
        events=req.events,
    )
    return result
