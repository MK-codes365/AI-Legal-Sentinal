from .local_llm import get_local_ai
import re

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

import eli5
from eli5.lime import TextExplainer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import numpy as np

# Mock internal classifier for eli5
class RiskHeuristicClassifier:
    def __init__(self, target_keywords):
        self.target_keywords = [k.lower() for k in target_keywords]
    
    def predict_proba(self, texts):
        probs = []
        for text in texts:
            text_lower = text.lower()
            score = 0
            for kw in self.target_keywords:
                if kw in text_lower:
                    score += 0.4
            
            # Bound probability [0, 1]
            prob_risk = min(0.95, 0.1 + score)
            probs.append([1 - prob_risk, prob_risk])
        return np.array(probs)

def highlight_risky_words(text: str, reason: str = "") -> str:
    """Uses eli5 library to generate an HTML heatmap of risky keywords."""
    # Common risky keywords based on typical legal flags
    risk_map = {
        "non-compete": ["exclusive", "not engage", "client", "competitor", "solicit", "territory", "restraint"],
        "indemnity": ["harmless", "losses", "damages", "breaches", "negligence", "reimburse", "defend", "claims"],
        "ip": ["ownership", "assignment", "work made for hire", "transfer", "moral rights", "perpetuity", "exclusive"],
        "termination": ["without notice", "immediately", "convenience", "liquidated", "forfeiture", "severance"],
        "default": ["shall", "must", "required", "prohibited", "forbid", "failure", "breach"]
    }
    
    # Determine which keywords to look for based on reason
    target_kws = []
    reason_lower = (reason or "").lower()
    for key, kws in risk_map.items():
        if key in reason_lower:
            target_kws.extend(kws)
    
    if not target_kws:
        target_kws = risk_map["default"]
        
    te = TextExplainer(random_state=42)
    clf = RiskHeuristicClassifier(target_kws)
    
    try:
        # We use a simple linear explainer on our heuristic
        te.fit(text, clf.predict_proba)
        # Generate HTML (limiting to just the text section, no table/weights)
        # Note: eli5's show_prediction returns an IPYTHON display object
        # We want the formatted text.
        explanation = te.explain_prediction()
        # Create a simpler HTML representation focusing on the highlighted text
        # eli5 doesn't easily expose the raw highlighted string without formatting
        # so we'll use their built-in formatter but trim it.
        html_output = eli5.format_as_html(explanation, show_thumbnail=False, force_weights=False)
        return html_output
    except Exception as e:
        return f"<div style='color:red'>Highlighting error: {str(e)}</div>"

def _clean_ai_output(text: str) -> str:
    """Removes leaked instructions, markdown artifacts, and repetitions from AI output."""
    if not text: return ""
    
    # Remove markdown blocks and headers
    text = re.sub(r"```[a-z]*", "", text) # Remove ```markdown, ```python, etc.
    text = re.sub(r"###?\s*Explanation.*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"###?\s*Summary.*", "", text, flags=re.IGNORECASE)
    text = text.replace("`", "")
    
    # Remove direct prompt leaks
    lines = text.split('\n')
    cleaned_lines = []
    forbidden_starters = ["Follow these rules:", "Risk identified:", "Rule:", "---", "Clause Text:", "1.", "2.", "3.", "4.", "Output:", "Input:"]
    
    for line in lines:
        line = line.strip()
        if not any(line.lower().startswith(start.lower()) for start in forbidden_starters) and line:
            cleaned_lines.append(line)
    
    result = " ".join(cleaned_lines)
    
    # Remove specific jargon leak found in image
    result = result.replace("This means you can't work for the client's competitors for a year after leaving the", "")
    
    # Deduplicate sentences (very basic)
    sentences = re.split(r'\.\s+', result)
    uniques = []
    for s in sentences:
        s = s.strip()
        if s and s not in uniques and len(s) > 5:
            uniques.append(s)
    
    final_output = ". ".join(uniques).strip()
    if not final_output.endswith('.'):
        final_output += "."
        
    return final_output

def explain_raw_text(text: str, reason: str = None) -> str:
    ai = get_local_ai()
    
    context_clause = f"\nRisk identified: {reason}" if reason else ""
    
    prompt = f"""
    You are a friendly legal assistant. Your task is to explain a legal clause in 1-2 very simple sentences for a 5-year old.
    
    ### EXAMPLES:
    Input: "Founder shall not engage in any competing business for 2 years." (Risk: Unenforceable)
    Output: This clause says you cannot work for any other client for 2 years. This is likely illegal in India because it stops you from earning a living.
    
    Input: "Company owns all IP created by founder." (Risk: Standard)
    Output: This means the company owns all the code and ideas you create. It's like school owning your project after you turn it in.
    
    ### YOUR TASK:
    Clause: "{text}"{context_clause}
    
    Rules:
    - Start with "This clause says..." or "This means..."
    - Use NO legal jargon.
    - Return ONLY the output explanation. No intro, no "Here is the explanation", no rules.
    """
    
    try:
        explanation = ai.generate(prompt, max_tokens=150)
        return _clean_ai_output(explanation)
    except Exception as e:
        return f"Error explaining text: {str(e)}"
