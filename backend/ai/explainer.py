from .local_llm import get_local_ai

def explain_flag(flag_data: dict) -> str:
    ai = get_local_ai()
    
    legal_prompt = f"""
    You are a legal assistant explaining Indian contract law to a layman.
    
    Context:
    Act: {flag_data['law']}
    Section: {flag_data['section']}
    Reason for flag: {flag_data['reason']}
    
    Provide a 2-3 sentence explanation of why this is a risk under Indian Law.
    Keep it simple and avoid legal jargon.
    """

    try:
        explanation = ai.generate(legal_prompt, max_tokens=150)
        return explanation if explanation else flag_data['reason']
    except Exception:
        return flag_data['reason']
