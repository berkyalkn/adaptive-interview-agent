import os
import base64
from openai import AsyncOpenAI  
from app.utils.config import Config


client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def transcribe_audio(file_path: str) -> str:
    """
    It converts the audio file to text asynchronously.
    """
    try:
        with open(file_path, "rb") as audio_file:
            transcription = await client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file,
                language="en",
                temperature=0.0, 
                prompt=(
                    "Software Engineering Interview context. "
                    "Technical terms: Python, SQL, React, AWS, Docker, Kubernetes, "
                    "System Design, Scalability, REST API, Algorithms, Data Structures."
                    "The candidate is speaking clearly."
                )
            )
        return transcription.text
    except Exception as e:
        print(f"Whisper Async Error: {e}")
        return ""

async def text_to_speech(text: str) -> str:
    """
    It converts text to speech asynchronously.
    """
    try:
        response = await client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )

        audio_content = response.content 
        
        audio_base64 = base64.b64encode(audio_content).decode("utf-8")
        return audio_base64
    except Exception as e:
        print(f"TTS Async Error: {e}")
        return ""