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
        
        # Ollama runs on port 11434 by default
        print("Connecting to local Ollama server (http://127.0.0.1:11434/v1)...")
        self.client = OpenAI(
            base_url="http://127.0.0.1:11434/v1",
            api_key="ollama", # Required but ignored by Ollama
            timeout=120.0 # High timeout for 7B model on 4GB VRAM
        )
        self.model_name = "vidhi-brain"
        self._initialized = True

    def generate(self, prompt: str, max_tokens: int = 512) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a professional Indian Legal Assistant based on the Indian Contract Act."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.2
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error communicating with Ollama: {e}")
            return f"ERROR: Make sure Ollama is open and you ran 'ollama run {self.model_name}'"

# Singleton instance access
def get_local_ai():
    return LocalLLM()

# Singleton instance
local_ai = None

def get_local_ai():
    global local_ai
    if local_ai is None:
        local_ai = LocalLLM()
    return local_ai
