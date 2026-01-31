from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from langchain_core.messages import HumanMessage, AIMessage

from app.core.graph import build_graph

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
        
        output = await workflow.ainvoke(current_state)

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

@app.get("/health")
async def health_check():
    return {"status": "active", "service": "adaptive-interview-agent"}