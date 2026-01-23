from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import List

# -------- Document Intelligence --------
from document_intelligence.uploader import validate_file
from document_intelligence.parser import extract_text
from document_intelligence.normalizer import normalize_text
from document_intelligence.language import detect_language

# -------- Extraction --------
from extraction.clause_splitter import split_into_clauses
from extraction.key_info import extract_key_info

# -------- Legal Engine --------
from core.country_adapter import CountryAdapter

# -------- AI / Q&A --------
from ai.explainer import explain_flag
from ai.qa import answer_from_contract

app = FastAPI(
    title="AI Legal Sentinel",
    description="Privacy-first contract analysis system",
    version="1.0.0"
)

# =====================================================
# TEMP GLOBAL STORAGE (MVP / DEMO ONLY)
# =====================================================
LAST_CLAUSES: List[dict] = []

# =====================================================
# HEALTH CHECK
# =====================================================
@app.get("/health")
def health_check():
    return {"status": "ok"}

# =====================================================
# UPLOAD & ANALYZE CONTRACT
# =====================================================
@app.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    country: str = "india"
):
    global LAST_CLAUSES

    try:
        # 1. Validate file
        validate_file(file)

        # 2. Read file
        file_bytes = await file.read()

        # 3. Extract text
        raw_text = extract_text(file_bytes, file.content_type)
        clean_text = normalize_text(raw_text)

        if not clean_text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract readable text"
            )

        # 4. Language detection
        language = detect_language(clean_text)

        # 5. Clause segmentation
        clauses = split_into_clauses(clean_text)

        # 🔴 STORE CLAUSES FOR Q&A
        LAST_CLAUSES = clauses

        # 6. Key info extraction
        summary = extract_key_info(clean_text)

        # 7. Legal rule engine
        adapter = CountryAdapter(country=country)
        legal_flags = adapter.analyze(clauses)

        # 8. Risk score (fast & deterministic)
        risk_score = 0
        for flag in legal_flags:
            if flag["risk_level"] == "High":
                risk_score += 25
            elif flag["risk_level"] == "Medium":
                risk_score += 10
            else:
                risk_score += 3
        risk_score = min(100, risk_score)

        # 9. FAST explainability (AI limited)
        explained_flags = []
        MAX_AI_EXPLANATIONS = 2
        count = 0

        for flag in legal_flags:
            if flag["risk_level"] == "High" and count < MAX_AI_EXPLANATIONS:
                flag["explanation"] = explain_flag(flag)
                count += 1
            else:
                flag["explanation"] = flag["reason"]

            explained_flags.append(flag)

        # 10. Final response
        return {
            "country": country,
            "language": language,
            "risk_score": risk_score,
            "summary": summary,
            "total_flags": len(explained_flags),
            "risk_flags": explained_flags
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal error: {str(e)}"
        )

# =====================================================
# CONTRACT Q&A ENDPOINT
# =====================================================
@app.post("/ask-contract")
def ask_contract(question: str):
    if not LAST_CLAUSES:
        raise HTTPException(
            status_code=400,
            detail="No contract uploaded yet."
        )

    answer = answer_from_contract(LAST_CLAUSES, question)
    return {"answer": answer}
