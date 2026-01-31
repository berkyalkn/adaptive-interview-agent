from langchain_google_genai import ChatGoogleGenerativeAI, HarmBlockThreshold, HarmCategory
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

safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

llm = ChatGoogleGenerativeAI(
    model=Config.AGENT_MODEL_NAME,
    credentials=credentials, 
    project=Config.PROJECT_ID,
    temperature=0.7,
    max_output_tokens=2048,
    location="global",
    safety_settings=safety_settings
)

def start_interview(state: InterviewState):
    role = state["job_role"]
    context = state.get("company_context", "General Tech")
    initial_msg = f"Hello! Welcome to the interview for the {role} position at our {context} company. Let's get started. Could you please briefly introduce yourself?"
    return {"messages": [AIMessage(content=initial_msg)], "interview_step": 0}

def run_interviewer_agent(state: InterviewState):
    role = state["job_role"]
    context = state.get("company_context", "General Tech")
    current_step = state.get("interview_step", 0)
    step = current_step + 1
    messages = state["messages"]

    if step > 4:
        bye_system_msg = """
        The candidate has answered all 4 questions.
        Your goal is ONLY to end the session politely.
        INSTRUCTIONS:
        1. Thank the candidate briefly.
        2. DO NOT summarize.
        3. APPEND EXACTLY: "INTERVIEW_FINISHED" to the end.
        """
        prompt = [SystemMessage(content=bye_system_msg)] + messages
    else:
        system_msg = INTERVIEWER_SYSTEM_PROMPT.format(role=role, step=step, context=context)
        prompt = [SystemMessage(content=system_msg)] + messages
    
    try:
        response = llm.invoke(prompt)
    except Exception as e:
        print(f"LLM Error: {e}")
        response = AIMessage(content="I apologize, I missed that. Could you please repeat? (System Error)")

    return {"messages": [response], "interview_step": step}


def run_evaluator_agent(state: InterviewState):
    role = state["job_role"]
    context = state.get("company_context", "General Tech")
    messages = state["messages"]
    
    transcript = "--- INTERVIEW TRANSCRIPT START ---\n"
    for msg in messages:
        sender = "Interviewer" if isinstance(msg, AIMessage) else "Candidate"
        content = msg.content
        if isinstance(content, list):
            content = "".join([item.get("text", "") for item in content if isinstance(item, dict)])
        transcript += f"{sender}: {content}\n"
    transcript += "--- INTERVIEW TRANSCRIPT END ---"

    evaluator_prompt = [
        SystemMessage(content=EVALUATOR_SYSTEM_PROMPT.format(role=role, context=context)),
        HumanMessage(content=f"Please analyze the following interview transcript:\n\n{transcript}")
    ]
    
    try:
        response = llm.invoke(evaluator_prompt)
        content = response.content
        clean_text = ""
        if isinstance(content, list):
            clean_text = content[0].get("text", "")
        else:
            clean_text = str(content)
            
        if not clean_text.strip():
            clean_text = "Report generated but content was empty."
            
    except Exception as e:
        clean_text = f"Report generation failed. Error: {str(e)}"

    return {"feedback": clean_text}


def route_step(state: InterviewState):
    last_msg = state["messages"][-1]
    content = last_msg.content
    if isinstance(content, list):
        text = content[0].get("text", "")
    else:
        text = str(content)
    
    if "INTERVIEW_FINISHED" in text:
        return "evaluator"
    return END

def route_to_start(state: InterviewState):
    if not state.get("messages") or len(state["messages"]) == 0:
        return "start"
    return "interviewer"

def build_graph():
    workflow = StateGraph(InterviewState)
    
    workflow.add_node("start", start_interview)
    workflow.add_node("interviewer", run_interviewer_agent)
    workflow.add_node("evaluator", run_evaluator_agent)
    
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
            "evaluator": "evaluator",
            END: END
        }
    )
    
    workflow.add_edge("evaluator", END)
    
    return workflow.compile()