from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.core.graph import build_graph

app = FastAPI(
    title="Adaptive Interview AI API",
    description="Backend service for Adaptive Interview Agent",
    version="1.0.0"
)


class MessageSchema(BaseModel):
    role: str  
    content: str

class ChatRequest(BaseModel):
    job_role: str
    user_input: Optional[str] = None 
    messages: List[MessageSchema] = [] 
    interview_step: int = 0

class ChatResponse(BaseModel):
    response_text: str
    interview_step: int
    is_finished: bool


def convert_to_langchain_messages(schemas: List[MessageSchema]):
    lc_messages = []
    for m in schemas:
        if m.role == "user":
            lc_messages.append(HumanMessage(content=m.content))
        elif m.role == "ai":
            lc_messages.append(AIMessage(content=m.content))
    return lc_messages


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
            "interview_step": request.interview_step,
            "feedback": ""
        }
        
        output = workflow.invoke(current_state)
        
        ai_msg = output["messages"][-1]
        
        ai_content = ai_msg.content
        ai_text = ""
        if isinstance(ai_content, list):
            ai_text = ai_content[0].get("text", "")
        else:
            ai_text = str(ai_content)
            
        is_finished = "INTERVIEW_FINISHED" in ai_text
        
        return ChatResponse(
            response_text=ai_text,
            interview_step=output["interview_step"],
            is_finished=is_finished
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "active", "service": "mock-master-ai"}