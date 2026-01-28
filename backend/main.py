from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
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

from ai.explainer import explain_flag
from ai.qa import answer_from_contract

app = FastAPI(
    title="Vidhi Setu",
    description="Intelligent contract analysis system grounded in Indian Law",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        raw_flags = legal_adapter.perform_checks(segmented_clauses)
        
        print(f"DEBUG: Found {len(raw_flags)} raw flags")
        
        curated_flags, jurisdiction_notes = check_jurisdiction_compliance(raw_flags)
        print(f"DEBUG: Found {len(curated_flags)} curated flags after compliance check")

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
        ai_limit = 5 # Increased for local analysis
        ai_usage_count = 0

        for flag in curated_flags:
            if flag["risk_level"] == "High" and ai_usage_count < ai_limit:
                # Use local explainer for high-risk flags
                flag["explanation"] = explain_flag(flag)
                ai_usage_count += 1
            else:
                flag["explanation"] = flag.get("reason", "Potential legal risk detected.")

            final_flags.append(flag)

        detected_deviations = check_deviations(segmented_clauses, final_flags)

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
            "token_count": len(token_session_map)
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during analysis: {str(e)}"
        )

@app.post("/ask-contract")
def search_contract(query: str):
    if not active_clauses:
        raise HTTPException(
            status_code=400,
            detail="No contract has been uploaded for analysis yet."
        )

    response_text = answer_from_contract(active_clauses, query)
    return {"answer": response_text}
