from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from langgraph.graph import StateGraph, END

from app.utils.config import Config
from app.schemas.state import InterviewState
from app.core.prompts import INTERVIEWER_SYSTEM_PROMPT, EVALUATOR_SYSTEM_PROMPT

from google.oauth2 import service_account
credentials = service_account.Credentials.from_service_account_file(
    Config.GOOGLE_CREDENTIALS_PATH,
    scopes=["https://www.googleapis.com/auth/cloud-platform"],
)


llm = ChatGoogleGenerativeAI(
    model=Config.AGENT_MODEL_NAME,
    credentials=credentials, 
    project=Config.PROJECT_ID,
    temperature=Config.TEMPERATURE,
    max_output_tokens=1024,
    location="global",  
)

def start_interview(state: InterviewState):

    role = state["job_role"]
    initial_msg = f"Hello! Welcome to the interview for the {role} position. Let's get started. Could you please briefly introduce yourself?"
    return {"messages": [AIMessage(content=initial_msg)], "interview_step": 0}

def generate_question(state: InterviewState):

    role = state["job_role"]
    step = state["interview_step"] + 1
    messages = state["messages"]

    system_msg = INTERVIEWER_SYSTEM_PROMPT.format(role=role, step=step)
    prompt = [SystemMessage(content=system_msg)] + messages
    
    response = llm.invoke(prompt)
    
    return {"messages": [response], "interview_step": step}

def generate_feedback(state: InterviewState):
    """Final evaluation."""
    role = state["job_role"]
    messages = state["messages"]
    
    system_msg = EVALUATOR_SYSTEM_PROMPT.format(role=role)
    prompt = [SystemMessage(content=system_msg)] + messages
    
    response = llm.invoke(prompt)
    
    content = response.content
    clean_text = ""
    if isinstance(content, list):
        clean_text = content[0].get("text", "")
    else:
        clean_text = str(content)
        
    return {"feedback": clean_text}


def route_step(state: InterviewState):
    """Is interview over or continue ?"""
    last_msg = state["messages"][-1]
    
    content = last_msg.content
    if isinstance(content, list):
        text = content[0].get("text", "")
    else:
        text = str(content)
    
    if "INTERVIEW_FINISHED" in text:
        return "feedback"
    return END

def route_to_start(state: InterviewState):
    if not state.get("messages") or len(state["messages"]) == 0:
        return "start"
    return "interviewer"


def build_graph():
    workflow = StateGraph(InterviewState)
    
    workflow.add_node("start", start_interview)
    workflow.add_node("interviewer", generate_question)
    workflow.add_node("feedback", generate_feedback)
    
    workflow.set_conditional_entry_point(
        route_to_start,
        {
            "start": "start",
            "interviewer": "interviewer"
        }
    )
    
    workflow.add_edge("start", END)
    
    workflow.add_conditional_edges(
        "interviewer",
        route_step,
        {
            "feedback": "feedback",
            END: END
        }
    )
    
    workflow.add_edge("feedback", END)
    
    return workflow.compile()



