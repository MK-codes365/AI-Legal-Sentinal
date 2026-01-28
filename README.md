# Vidhi Setu 🇮🇳

**Privacy-First AI Contract Risk Analysis Grounded in Indian Law**

Vidhi Setu is an intelligent LegalTech platform designed specifically for the Indian creative community, freelancers, and early-stage startups. It bridges the gap between complex legal jargon and fair professional agreements by providing jurisdiction-aware risk assessment anchored in **The Indian Contract Act, 1872**.

---

## 🚀 Key Features

### ⚖️ Jurisdiction-Aware Legal Engine

- **Statutory Grounding**: Every risk flag is mapped to specific Indian statutes like the Indian Contract Act, 1872 or the Copyright Act, 1957.
- **Jurisdiction Lock**: Hard guardrails that block non-Indian legal concepts (e.g., Delaware law, at-will employment) to ensure 100% domestic compliance.

### 🛡️ Privacy & Security (Zero-Logging)

- **PII Tokenization**: Automatically detects and replaces names, emails, and company names with privacy tokens (e.g., `[PERSON_1]`, `[COMPANY_A]`) before analysis.
- **Ephemeral Processing**: Contracts are processed in-memory and never stored permanently on our servers.
- **User-Controlled Purge**: Users can permanently delete their session data from server memory with a single click.

### 🧠 Intelligent Analysis

- **Statutory Risk Scoring**: A deterministic 0-100 score based on legal severity.
- **ELI5 Explanations**: Complex clauses are translated into simple, plain English summaries.
- **Template Deviation Check**: Compares contract clauses against a baseline of "fair" industry standards to detect unfair terms.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion (for high-end animations), Lucide React.
- **Backend**: FastAPI (Python), Local RAG Engine (Sentence Transformers), **Ollama (Qwen 2.5 7B)** for local inference.
- **Design**: Premium dark/glassmorphism aesthetic with a citation-first user experience.

---

## 🏁 Getting Started

### 1. 🧠 AI Engine Setup (Ollama)

This project runs 100% locally. You MUST have Ollama installed and the model imported:

1.  **Install Ollama** from [ollama.com](https://ollama.com).
2.  **Pull Qwen 2.5**:
    ```bash
    ollama run qwen2.5:7b
    ```
3.  **Import as Vidhi Brain**: Follow the instructions in `backend/ai/README.md` (or simply ensure a model named `vidhi-brain` is available in your local Ollama instance).

### 2. 🔌 Backend Setup

1.  Navigate to the `backend/` directory.
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run the server:
    ```bash
    uvicorn main:app --reload
    ```

### 3. 🎨 Frontend Setup

1.  Navigate to the `frontend/` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

---

## 🧪 Testing the Platform (Jury Guide)

To evaluate the full depth of Vidhi Setu's local legal intelligence:

1.  Access the **Dashboard** via the "Get Started" button.
2.  Upload a contract (e.g., from `sample_contracts/`) or click **"Test with Sample"**.
3.  Observe the **Section 27 (Non-Compete)** detection and the **Jurisdiction Guardrail** blocking non-Indian law.
4.  Notice the **Local AI Insight** cards providing plain-English legal explanations grounded in Indian Statute.

---

## ⚠️ Disclaimer

Vidhi Setu is an assistive tool intended to improve legal awareness and understanding. It does **not** provide legal advice. Users should always consult a qualified legal professional before signing any agreement.

---

**Vidhi Setu: Zero Data, Absolute Clarity.** 🚀⚖️
