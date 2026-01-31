from typing import List, Dict, Optional
from openai import OpenAI

# This connects to Ollama, which handles the GPU logic automatically
class LocalLLM:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LocalLLM, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        self.client = OpenAI(
            base_url="http://127.0.0.1:11434/v1",
            api_key="ollama",
            timeout=120.0
        )
        self.model_name = "vidhi-brain"
        
        print(f"✅ Connecting to Local AI (Ollama) at {self.client.base_url}...")
        try:
             models = self.client.models.list()
             print(f"🧠 Active Models: {[m.id for m in models.data]}")
             print(f"🎯 Selected Model: {self.model_name}")
        except Exception as e:
             print(f"⚠️ Could not list models (Ollama might be off): {e}")

        self._initialized = True

    def generate(self, prompt: str, max_tokens: int = 512) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "Professional Indian Legal Assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.2,
                stream=False
            )
            content = response.choices[0].message.content
            if content is None or content.strip() == "":
                return "Error: Local AI returned an empty response."
            return content.strip()
        except Exception as e:
            return f"Error: {str(e)}"

    def generate_stream(self, prompt: str, max_tokens: int = 600):
        """Yields chunks of text as they are generated for real-time streaming."""
        try:
            stream = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "Professional Indian Legal Assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.2,
                stream=True
            )
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"Error in stream: {str(e)}"

    def safe_parse_json(self, text: str) -> Optional[Dict]:
        """
        Robustly extracts and parses JSON from potentially 'chatty' AI output.
        Handles intro/outro text and trailing commas.
        """
        import json
        import re
        
        text = str(text).strip()
        
        # 1. Find the bounds of the JSON object
        start_idx = text.find('{')
        end_idx = text.rfind('}') + 1
        
        if start_idx == -1 or end_idx <= start_idx:
             return None
             
        json_str = text[start_idx:end_idx]
        
        # 2. Try standard parse
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            # 3. Aggressive cleanup for common AI mistakes (trailing commas)
            try:
                # Remove trailing commas before } or ]
                cleaned = re.sub(r",\s*([\]}])", r"\1", json_str)
                return json.loads(cleaned)
            except:
                return None

# Singleton access
local_ai_singleton = None

def get_local_ai():
    global local_ai_singleton
    if local_ai_singleton is None:
        local_ai_singleton = LocalLLM()
    return local_ai_singleton
