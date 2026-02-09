from fastapi import FastAPI, HTTPException, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from langchain_core.messages import HumanMessage, AIMessage
from app.services.audio import transcribe_audio, text_to_speech
import shutil
import json
import os


from app.core.graph import build_graph

app_graph = build_graph()

app = FastAPI(
    title="Adaptive Interview AI API",
    description="Backend service for Adaptive Interview Agent",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
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

class ChatResponse(BaseModel):
    response_text: str
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
        
        return ChatResponse(
            response_text=clean_response_text,
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
        if not feedback and clean_audio_text:
            audio_base64 = await text_to_speech(clean_audio_text)
        
        return {
            "user_input": user_text,
            "response_text": ai_response_text,
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

@app.get("/health")
async def health_check():
    return {"status": "active", "service": "adaptive-interview-agent"}