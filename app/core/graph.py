from google.oauth2 import service_account  
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, AIMessage
from langgraph.graph import StateGraph, END

from app.utils.config import Config
from app.schemas.state import InterviewState
from app.core.prompts import INTERVIEWER_SYSTEM_PROMPT


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
    location="global"
)

def start_interview(state: InterviewState):
    """Generates the welcome message."""
    role = state["job_role"]
    initial_msg = f"Hello! Welcome to the interview for the {role} position. Let's get started. Could you please briefly introduce yourself?"
    return {"messages": [AIMessage(content=initial_msg)], "interview_step": 0}

def generate_question(state: InterviewState):
    """Generates the next interview question based on the context."""
    role = state["job_role"]
    step = state["interview_step"] + 1
    messages = state["messages"]

    system_msg = INTERVIEWER_SYSTEM_PROMPT.format(role=role, step=step)
    
    prompt = [SystemMessage(content=system_msg)] + messages
    
    response = llm.invoke(prompt)
    
    return {"messages": [response], "interview_step": step}

def build_graph():
    """Constructs and compiles the StateGraph."""
    workflow = StateGraph(InterviewState)

    workflow.add_node("start", start_interview)
    workflow.add_node("interviewer", generate_question)

    workflow.set_entry_point("start")

    workflow.add_edge("start", END) 
    
    return workflow.compile()