from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
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

from ai.explainer import explain_flag, explain_raw_text, highlight_risky_words
from ai.qa import answer_from_contract
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("🚀 Warming up Vidhi Setu Engines...")
    from ai.local_llm import get_local_ai
    from legal_engine.india.statutory_mapper import get_statutory_mapper
    
    # Pre-initialize singletons
    get_local_ai()
    get_statutory_mapper()
    print("✅ All systems go!")

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
        
        return {
            "country": jurisdiction,
            "language": doc_language,
            "risk_score": final_score,
            "summary": document_summary,
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

@app.post("/ask-contract")
def search_contract(request: ChatRequest):
    if not active_clauses:
        raise HTTPException(
            status_code=400,
            detail="No contract has been uploaded for analysis yet."
        )

    response_text = answer_from_contract(active_clauses, request.query)
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
