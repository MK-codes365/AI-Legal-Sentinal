import os
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
                temperature=0.2
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"Error: {str(e)}"

# Singleton access
local_ai_singleton = None

def get_local_ai():
    global local_ai_singleton
    if local_ai_singleton is None:
        local_ai_singleton = LocalLLM()
    return local_ai_singleton
