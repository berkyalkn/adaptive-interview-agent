from fastapi import FastAPI, HTTPException, UploadFile, Form, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from langchain_core.messages import HumanMessage, AIMessage
from app.services.audio import transcribe_audio, text_to_speech
import shutil
import json
import os
import base64
import tempfile
import asyncio


from app.core.graph import build_graph

app_graph = build_graph()

app = FastAPI(
    title="Adaptive Interview AI API",
    description="Backend service for Adaptive Interview Agent",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)


class MessageSchema(BaseModel):
    role: str  
    content: str

class ChatRequest(BaseModel):
    job_role: str
    company_context: str = "General Tech"
    user_input: Optional[str] = None 
    messages: List[MessageSchema] = [] 
    interview_step: int = 0
    generate_audio: bool = False

class ChatResponse(BaseModel):
    response_text: str
    response_audio: str | None = None
    interview_step: int
    is_finished: bool
    feedback: Optional[str] = None


def convert_to_langchain_messages(schemas: List[MessageSchema]):
    lc_messages = []
    for m in schemas:
        if m.role == "user":
            lc_messages.append(HumanMessage(content=m.content))
        elif m.role == "ai":
            lc_messages.append(AIMessage(content=m.content))
    return lc_messages


def extract_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        return "".join([item.get("text", "") for item in content if isinstance(item, dict)])
    return str(content)


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        workflow = build_graph()
        
        history = convert_to_langchain_messages(request.messages)
        
        if request.user_input:
            history.append(HumanMessage(content=request.user_input))
            
        current_state = {
            "messages": history,
            "job_role": request.job_role,
            "company_context": request.company_context,
            "interview_step": request.interview_step,
            "feedback": ""
        }
        
        output = await app_graph.ainvoke(current_state)

        last_msg = output["messages"][-1]

        raw_ai_text = extract_text(last_msg.content)

        clean_response_text = raw_ai_text.replace("INTERVIEW_FINISHED", "").strip()

        feedback_text = output.get("feedback", None)

        if feedback_text and not feedback_text.strip():
            feedback_text = None
            
        is_finished = feedback_text is not None or "INTERVIEW_FINISHED" in raw_ai_text

        audio_base64 = None
        if request.generate_audio and clean_response_text:
             audio_base64 = await text_to_speech(clean_response_text)
        
        return ChatResponse(
            response_text=clean_response_text, 
            response_audio=audio_base64,      
            interview_step=output.get("interview_step", 0),
            is_finished=is_finished,
            feedback=feedback_text
        )

    except Exception as e:
        print(f"API Error: {str(e)}") 
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/audio")
async def chat_audio_endpoint(
    audio: UploadFile = File(...),
    job_role: str = Form(...),
    company_context: str = Form("General Tech"),
    job_description: str = Form(""),
    interview_step: int = Form(0),
    messages: str = Form("[]") 
):
    temp_filename = f"temp_{audio.filename}"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
        
    try:
        user_text = await transcribe_audio(temp_filename)
        print(f"User Said: {user_text}")
        
        if not user_text.strip():
             return {
                "user_input": "",
                "response_text": "I couldn't hear you clearly. Could you please repeat?",
                "response_audio": "", 
                "interview_step": interview_step,
                "is_finished": False,
                "feedback": None
            }

        raw_history = json.loads(messages)
        
        history_objects = []
        for msg in raw_history:
            if msg.get("role") == "user":
                history_objects.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("role") == "ai":
                history_objects.append(AIMessage(content=msg.get("content", "")))
        
        history_objects.append(HumanMessage(content=user_text))

        current_state = {
            "messages": history_objects, 
            "job_role": job_role,
            "company_context": company_context,
            "job_description": job_description,
            "interview_step": interview_step,
            "feedback": ""
        }
        
        result = await app_graph.ainvoke(current_state)
        
        last_msg = result["messages"][-1]
        
        if hasattr(last_msg, 'content'):
            ai_response_text = last_msg.content
        elif isinstance(last_msg, dict):
            ai_response_text = last_msg.get('content', '')
        else:
            ai_response_text = str(last_msg)

        clean_audio_text = ai_response_text.replace("INTERVIEW_FINISHED", "").strip()

        new_step = result.get("interview_step", interview_step)
        feedback = result.get("feedback", None)
        
        audio_base64 = ""
        if not clean_audio_text:
            audio_base64 = await text_to_speech(clean_audio_text)
        
        return {
            "user_input": user_text,
            "response_text": clean_audio_text,
            "response_audio": audio_base64,
            "interview_step": new_step,
            "is_finished": feedback is not None,
            "feedback": feedback
        }

    except Exception as e:
        print(f"Audio Endpoint Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)


@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🔌 WebSocket Connected (Real-Time Mode)")
    
    # Her bağlantı için bir state (hafıza) tutalım
    chat_history = [] 
    
    try:
        while True:
            # 1. Frontend'den Mesaj Bekle (JSON Formatında)
            # Beklenen format: { "type": "audio", "payload": "BASE64_STRING", "job_role": "...", ... }
            data = await websocket.receive_json()
            
            if data.get("type") == "audio" and data.get("payload"):
                print("🎤 Audio received via WS...")
                
                # A. Base64 Sesi Dosyaya Çevir
                try:
                    audio_bytes = base64.b64decode(data["payload"])
                except Exception:
                    print("⚠️ Base64 decode error")
                    continue

                # 🔥 GÜVENLİK DUVARI: Dosya boyutu kontrolü (Bayt cinsinden)
                # 3072 bytes = 3KB. Bunun altı muhtemelen sadece gürültü veya boş header'dır.
                file_size = len(audio_bytes)
                if file_size < 3000: 
                    print(f"🔇 Ignored small audio/noise packet ({file_size} bytes)")
                    continue  # Döngünün başına dön, Whisper'a gitme!
                
                # Geçici dosya oluştur
                with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
                    temp_audio.write(audio_bytes)
                    temp_audio_path = temp_audio.name
                
                try:
                    # B. Whisper ile Transkript (STT)
                    user_text = await transcribe_audio(temp_audio_path)
                    print(f"🗣️ Transcribed: {user_text}")
                    
                    # Eğer ses boşsa veya anlaşılamadıysa atla
                    if not user_text or len(user_text.strip()) < 2:
                        continue

                    # C. LangGraph Ajanını Çalıştır (Beyin)
                    # Not: Gerçek senaryoda buradaki state yönetimini iyileştireceğiz
                    current_state = {
                        "messages": chat_history + [HumanMessage(content=user_text)],
                        "job_role": data.get("job_role", "Developer"),
                        "company_context": data.get("company_context", "Tech"),
                        "job_description": "",
                        "interview_step": data.get("interview_step", 1),
                        "feedback": ""
                    }
                    
                    output = await app_graph.ainvoke(current_state)
                    
                    last_msg = output["messages"][-1]
                    ai_text = extract_text(last_msg.content)

                    feedback_text = output.get("feedback", None)
                    
                    # Chat geçmişini güncelle
                    chat_history = output["messages"]
                    
                    # Temizlik (Etiketleri kaldır)
                    clean_text = ai_text.replace("INTERVIEW_FINISHED", "").strip()
                    print(f"🤖 AI Response: {clean_text}")

                    # D. Cevabı Sese Çevir (TTS)
                    audio_base64 = await text_to_speech(clean_text)
                    
                    # E. Frontend'e Geri Yolla
                    response_payload = {
                        "type": "audio",
                        "text": clean_text,
                        "audio": audio_base64,
                        "interview_step": output.get("interview_step", 1),
                        "is_finished": "INTERVIEW_FINISHED" in ai_text or feedback_text is not None,
                        "feedback": feedback_text # <--- BU EKSİKTİ
                    }
                    
                    await websocket.send_json(response_payload)

                except Exception as e:
                    print(f"❌ Processing Error: {e}")
                    await websocket.send_json({"type": "error", "message": str(e)})
                
                finally:
                    # Geçici dosyayı sil
                    if os.path.exists(temp_audio_path):
                        os.unlink(temp_audio_path)

    except WebSocketDisconnect:
        print("🔌 WebSocket Disconnected")


@app.get("/health")
async def health_check():
    return {"status": "active", "service": "adaptive-interview-agent"}