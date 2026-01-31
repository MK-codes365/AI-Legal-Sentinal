# Vidhi Setu: System Architecture & Data Flow

This document explains the technical implementation of **Vidhi Setu**, focusing on how the Frontend (user interface), Backend (logic engine), and AI (intelligence layer) interact to provide secure, offline-capable contract analysis.

---

## 🏗️ High-Level Architecture

Vidhi Setu follows a **Modular Monolith** architecture with a clear separation of concerns, orchestrated via REST APIs.

### The 3 Core Pillars:

1.  **Frontend (React + Tailwind + Framer Motion):** The "Face"
    - Handles file uploads, displays results, and manages animations.
    - Does _not_ process any data; it simply visualizes the API response.
2.  **Backend (FastAPI + Python):** The "Brain"
    - Orchestrates the entire pipeline: Text Extraction -> Tokenization -> Clause Splitting -> Legal Mapping -> Risk Scoring.
    - Acts as the bridge between raw files and legal insights.
3.  **Local AI (Ollama + Llama3/Qwen):** The "Expert"
    - A locally running Large Language Model (LLM) that provides deep semantic understanding.
    - Used _selectively_ for complex tasks (summaries, explanations) to keep performance high.

---

## 🔄 The Data Journey: How It Works

Here is the step-by-step lifecycle of a contract upload:

### Step 1: Secure Upload (Frontend -> Backend)

- **User Action:** Drags & Drops a PDF/Word file into the UI.
- **Technical Flow:**
  - The file is sent via `POST /api/upload` as `multipart/form-data`.
  - No data is saved to disk; the file is processed entirely in RAM (Memory).

### Step 2: Ingestion & Privacy (Backend)

- **Text Extraction:** The backend uses specialized libraries (`pypdf`, `python-docx`) to convert the binary file into plain text.
- **PII Scrubbing:** Before _any_ AI sees the text, a Regex-based filter removes names, emails, and phone numbers, replacing them with tokens (e.g., `{[PARTY_A]}`).
  - _Why?_ To ensure user privacy, even if the model were cloud-based (ours is local, but we follow best practices).

### Step 3: Structural Analysis (Backend)

- **Clause Splitting:** The text is not analyzed as one giant blob. It is split into logical "clauses" (paragraphs/sections).
- **Legal Mapping (Deterministic):**
  - The system uses **Regular Expressions (Regex)** to instantly catch known bad clauses (e.g., "Non-Compete").
  - _Speed:_ < 0.1s.
  - _Accuracy:_ 100% for standard boilerplate risks.

### Step 4: Intelligent Analysis (Backend <-> Local AI)

- This is where the magic happens. The backend talks to **Ollama** (running on port 11434).
- **Key Extraction:**
  - Backend sends header text prompt: _"Extract parties and governing law as JSON."_
  - AI replies: `{"parties": ["Freelancer", "Client"], "law": "Karnataka"}`.
- **Risk Explanation:**
  - If a "High Risk" clause is found (e.g., Infinite Indemnity), the backend sends just that clause to the AI: _"Explain why this is risky to a 5-year-old."_
  - AI generates a simple, easy-to-read explanation.

### Step 5: Scoring & Response (Backend -> Frontend)

- **Risk Algorithm:**
  - High Risk = +25 points
  - Medium Risk = +10 points
  - Score = Min(100, Total). (0 is safest, 100 is riskiest).
- **Final Packet:** A JSON object containing the Score, Summary, and a list of Flags is sent back to the frontend.

### Step 6: Visualization (Frontend)

- The React app receives the JSON.
- **Bento Grid:** Renders cards for each risk factor.
- **Interactive Chat:** Users can now ask "What happens if I quit?" and the backend searches the _already processed_ clauses (cached in memory) to answer instantly.

---

## 🛠️ Technology Stack Breakdown

| Component       | Technology         | Role                         |
| :-------------- | :----------------- | :--------------------------- |
| **Frontend**    | React (Vite)       | fast, responsive UI          |
| **Styling**     | TailwindCSS        | Modern, utility-first design |
| **Animations**  | Framer Motion      | Smooth entry/exit effects    |
| **Backend**     | FastAPI (Python)   | High-performance async API   |
| **Text Engine** | PyPDF / Docx       | File parsing                 |
| **AI Runtime**  | Ollama             | Runs Llama3/Qwen locally     |
| **AI Logic**    | LangChain / Custom | Manages prompts & context    |

---

## ⚠️ Key Features Explained

1.  **Hybrid Analysis (Regex + AI):**
    - We don't use AI for everything (it's slow).
    - We use Regex for instantaneous detection of standard clauses.
    - We use AI only for _semantic_ understanding (summaries, Q&A).
2.  **Privacy-First Architecture:**
    - Zero Persistence. Refresh the page -> Data is gone.
    - All processing happens on `localhost`. Your contract never leaves your WiFi network.
