import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "google_credentials.json")
    
    PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
    
    AGENT_MODEL_NAME = "gemini-3-flash-preview" 
    
    TEMPERATURE = 0.7

    @staticmethod
    def validate():
        if not os.path.exists(Config.GOOGLE_CREDENTIALS_PATH):
            raise ValueError(f"Credential file not found at: {Config.GOOGLE_CREDENTIALS_PATH}")
            
        if not Config.PROJECT_ID:
             raise ValueError("GOOGLE_CLOUD_PROJECT is missing in .env")

Config.validate()