import os
import requests

HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL = "microsoft/phi-3-mini-4k-instruct"

HF_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

HEADERS = {
    "Authorization": f"Bearer {HF_API_KEY}",
    "Content-Type": "application/json"
}

def explain_flag(flag: dict) -> str:
    """
    Explains a legal risk flag in simple language using Hugging Face Inference API.
    Falls back safely if API is unavailable.
    """

    # Fallback if key not set
    if not HF_API_KEY:
        return (
            f"This clause may be risky under {flag['law']} "
            f"({flag['section']}) because {flag['reason']}."
        )

    prompt = f"""
You are explaining Indian contract law to a freelancer with no legal background.

Law: {flag['law']}
Section: {flag['section']}
Reason: {flag['reason']}

Explain this risk in very simple terms (2–3 sentences).
Do NOT add new laws or advice.
"""

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 150,
            "temperature": 0.2,
            "return_full_text": False
        }
    }

    try:
        response = requests.post(
    HF_URL,
    headers=HEADERS,
    json=payload,
    timeout=10   # ADD THIS
)


        if response.status_code != 200:
            return (
                f"This clause may be risky under {flag['law']} "
                f"({flag['section']}) because {flag['reason']}."
            )

        data = response.json()

        # Hugging Face returns list of generated texts
        if isinstance(data, list) and "generated_text" in data[0]:
            return data[0]["generated_text"].strip()

        return (
            f"This clause may be risky under {flag['law']} "
            f"({flag['section']}) because {flag['reason']}."
        )

    except Exception:
        return (
            f"This clause may be risky under {flag['law']} "
            f"({flag['section']}) because {flag['reason']}."
        )
