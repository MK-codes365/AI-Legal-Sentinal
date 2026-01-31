from fastapi import FastAPI, UploadFile, File, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from pydantic import BaseModel
import uvicorn
import os
import shutil
import asyncio
import json
from datetime import datetime
from logging_config import configure_logging

logger = configure_logging()

from document_intelligence.uploader import validate_file
from document_intelligence.parser import extract_text
from document_intelligence.normalizer import normalize_text
from document_intelligence.language import identify_language
from document_intelligence.tokenizer import tokenize_document

from extraction.clause_splitter import divide_into_clauses
from extraction.key_info import extract_key_details

from core.country_adapter import CountryAdapter
from legal_engine.deviation_checker import check_deviations
from legal_engine.jurisdiction_guardrail import check_jurisdiction_compliance

from ai.explainer import explain_flag, explain_raw_text, highlight_risky_words, generate_holistic_breakdown
from ai.qa import answer_from_contract, answer_from_contract_stream
from legal_engine.news_aggregator import fetch_legal_news
from legal_engine.india.contract_act import run_analysis
from legal_engine.structure_check import analyze_structure
from legal_engine.report_generator import generate_pdf_report
from legal_engine.india.statutory_mapper import get_statutory_mapper

app = FastAPI(
    title="Vidhi Setu",
    description="Intelligent contract analysis system grounded in Indian Law",
    version="1.0.0"
)

# Global Session Store (For Demo purposes, uses memory)
active_clauses = []
token_session_map = {}
live_faqs = [] # Memory store for community Q&A

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# Background task for live news polling
async def news_poll_loop():
    """Polls for new news and broadcasts via WebSocket every 5 minutes."""
    while True:
        try:
            # We fetch only NEW items (incremental)
            new_items = fetch_legal_news(incremental=True)
            if new_items:
                for item in new_items:
                    await manager.broadcast({
                        "type": "new_article",
                        "data": item
                    })
        except Exception as e:
            print(f"WS News Polling Error: {e}")
        
        await asyncio.sleep(10) # Wait 10 seconds (ultra high frequency)

@app.on_event("startup")
async def startup_event():
    # Start the news polling background task
    asyncio.create_task(news_poll_loop())
    
    # Existing stabilization code
    from ai.local_llm import get_local_ai
    from legal_engine.india.statutory_mapper import get_statutory_mapper
    print("🚀 Initializing AI Engines for near-zero lag...")
    get_local_ai()
    get_statutory_mapper()

@app.websocket("/ws/news")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def read_root():
    return {"message": "Vidhi Setu API is running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.delete("/session")
def reset_session():
    global active_clauses, token_session_map
    active_clauses = []
    token_session_map = {}
    return {"status": "deleted", "message": "All session data cleared"}

@app.post("/upload")
async def analyze_document(
    file: UploadFile = File(...),
    jurisdiction: str = "india"
):
    global active_clauses, token_session_map

    try:
        validate_file(file)
        
        content = await file.read()
        extracted_text = extract_text(content, file.content_type)
        normalized_content = normalize_text(extracted_text)

        if not normalized_content:
            raise HTTPException(
                status_code=400,
                detail="Could not extract readable text from the document"
            )

        protected_text, local_token_map = tokenize_document(normalized_content)
        token_session_map = local_token_map

        doc_language = identify_language(protected_text)
        segmented_clauses = divide_into_clauses(protected_text)
        active_clauses = segmented_clauses

        document_summary = extract_key_details(protected_text)

        legal_adapter = CountryAdapter(target_country=jurisdiction)
        
        # FIX: Generate raw_flags by analyzing each clause
        raw_flags = []
        for clause in segmented_clauses:
            flags = run_analysis(clause)
            raw_flags.extend(flags)
            
        curated_flags, jurisdiction_notes = check_jurisdiction_compliance(raw_flags)

        computed_risk = 0
        for item in curated_flags:
            if item["risk_level"] == "High":
                computed_risk += 25
            elif item["risk_level"] == "Medium":
                computed_risk += 10
            else:
                computed_risk += 3
        
        final_score = min(100, computed_risk)

        final_flags = []
        ai_limit = 5
        ai_usage_count = 0

        for flag in curated_flags:
            if flag["risk_level"] == "High" and ai_usage_count < ai_limit:
                flag["explanation"] = explain_flag(flag)
                ai_usage_count += 1
            else:
                flag["explanation"] = flag.get("reason", "Potential legal risk detected.")

            final_flags.append(flag)

        detected_deviations = check_deviations(segmented_clauses, final_flags)

        # 1. Structural Completeness Check
        structure_results = analyze_structure(normalized_content)
        
        # 2. Holistic Narrative Breakdown
        holistic_narrative = generate_holistic_breakdown(document_summary, final_flags, structure_results)
        
        return {
            "country": jurisdiction,
            "language": doc_language,
            "risk_score": final_score,
            "summary": document_summary,
            "holistic_narrative": holistic_narrative,
            "total_flags": len(final_flags),
            "risk_flags": final_flags,
            "deviations": detected_deviations,
            "deviation_count": len(detected_deviations),
            "jurisdiction_warnings": jurisdiction_notes,
            "pii_tokenized": len(token_session_map) > 0,
            "token_count": len(token_session_map),
            "structure_analysis": structure_results 
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during analysis: {str(e)}"
        )

class ChatRequest(BaseModel):
    query: str
    mode: str = "Professional"
    context_summary: str = ""

@app.get("/legal-news")
def get_legal_news():
    """Returns real-time legal news for the dashboard."""
    return fetch_legal_news()

@app.get("/live-faqs")
def get_live_faqs():
    """Returns the most recent captured community Q&As."""
    return live_faqs[::-1] # Newest first

@app.post("/ask-contract-stream")
async def search_contract_stream(request: ChatRequest):
    """Streaming version of the chat endpoint that also captures Q&A for the live FAQ."""
    from datetime import datetime
    import asyncio
    
    # Capture the main loop to use inside the sync thread
    loop = asyncio.get_running_loop()
    
    def capture_generator():
        full_response = ""
        for chunk in answer_from_contract_stream(active_clauses, request.query, request.mode, request.context_summary):
            full_response += chunk
            yield chunk
        
        # After stream completes, handle broadcasting
        if len(full_response) > 20: 
            faq_item = {
                "q": request.query,
                "a": full_response,
                "timestamp": datetime.now().strftime("%I:%M %p")
            }
            live_faqs.append(faq_item)
            if len(live_faqs) > 10: live_faqs.pop(0) 
            
            # Broadcast using the captured loop
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({"type": "new_faq", "data": faq_item}),
                loop
            )

    return StreamingResponse(capture_generator(), media_type="text/plain")

@app.post("/ask-contract")
async def search_contract(request: ChatRequest):
    # We no longer block if active_clauses is empty to allow for "Universal Assistant" mode
    response_text = answer_from_contract(active_clauses, request.query, request.mode, request.context_summary)
    
    # Capture for FAQ
    if len(response_text) > 20:
        faq_item = {
            "q": request.query,
            "a": response_text,
            "timestamp": datetime.now().strftime("%I:%M %p")
        }
        live_faqs.append(faq_item)
        if len(live_faqs) > 10: live_faqs.pop(0)
        await manager.broadcast({"type": "new_faq", "data": faq_item})
        
    return {"answer": response_text}


class ExplanationRequest(BaseModel):
    text: str
    reason: str = None

@app.post("/explain-clause")
def explain_clause_api(request: ExplanationRequest):
    explanation = explain_raw_text(request.text, request.reason)
    highlights_html = highlight_risky_words(request.text, request.reason)
    return {
        "explanation": explanation,
        "highlights_html": highlights_html
    }

@app.post("/download-report")
async def download_report(data: dict):
    try:
        pdf_buffer = generate_pdf_report(data)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=Analysis_Report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Generation Error: {str(e)}")

class MappingRequest(BaseModel):
    clause: str

@app.post("/map-statute")
def map_statute_api(request: MappingRequest):
    mapper = get_statutory_mapper()
    result = mapper.map_clause(request.clause)
    return result
