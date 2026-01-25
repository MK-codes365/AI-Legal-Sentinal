# AI Legal Sentinel 🇮🇳  
*A Privacy-First AI Contract Risk Analyzer for Freelancers & Startups*

---

## 📌 Problem Statement
Freelancers and early-stage startups in India often sign contracts written in complex legal language without fully understanding the risks.  
Access to legal counsel is expensive, and most existing AI contract tools are built around US or EU law, making them unreliable for Indian users.

---

## 💡 Solution
AI Legal Sentinel is a jurisdiction-aware LegalTech system that analyzes contracts under **Indian law**, detects legally risky or unfair clauses, and explains them in **simple language**.

The system acts as a **first line of defense**, not a replacement for lawyers.

---

## ⚙️ Key Features

### 🔍 Contract Analysis
- Upload PDF or DOCX contracts
- Automatic text extraction and clause segmentation

### ⚖️ Indian Law–Specific Risk Detection
- Flags clauses under relevant Indian statutes
  - Example: Section 27 (Restraint of Trade)
  - Example: Section 23 (Unlawful Object)
- Uses deterministic rule engines for legal correctness

### 🧠 Explainable AI (ELI5)
- Translates complex legal clauses into plain English
- AI used **only for explanation**, not legal judgment

### 📊 Risk Dashboard
- Overall risk score (0–100)
- Clear summary of:
  - Fees
  - Contract duration
  - IP ownership
  - Termination terms
- Highlighted risky clauses with legal references

### ❓ Contract Q&A
- Ask questions like:
  - “Is there a non-compete clause?”
  - “Who owns the intellectual property?”
- Answers are strictly grounded in the uploaded contract

### 🔐 Privacy-First Design
- No contract data stored permanently
- In-memory processing for MVP/demo

---

## 🏗️ System Architecture (High Level)

Frontend:
- React-based dashboard
- Non-blocking upload
- Skeleton loading UI
- AI-assisted 3D-style visual interface

Backend:
- FastAPI
- Rule-based legal engine
- Optional AI explainability layer
- Performance-optimized pipeline

---

## 🚀 Performance Optimizations
- Non-blocking frontend navigation
- Clause limits to avoid unnecessary processing
- AI calls capped and optional
- Deterministic fallbacks for reliability
- Skeleton loaders for better UX

---

## ⚠️ Disclaimer
This system does **not** provide legal advice.  
It is an assistive analysis tool intended to improve awareness and understanding.  
Users should consult a qualified legal professional before making decisions.

---

## 🧪 Demo Instructions
1. Start backend server
2. Start frontend
3. Upload a sample contract
4. View risk dashboard
5. Ask contract-related questions via Q&A panel

---

## 👨‍💻 Built For
- Academic evaluation
- Hackathons
- LegalTech MVP demonstration
- Social-impact innovation