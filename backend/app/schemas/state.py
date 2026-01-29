from typing import TypedDict, Annotated, List, Optional
from langchain_core.messages import BaseMessage
import operator

class InterviewState(TypedDict):
    """
    Represents the state of the interview session.
    """
    messages: Annotated[List[BaseMessage], operator.add] 
    job_role: str       
    interview_step: int 
    feedback: Optional[str]      