from pydantic import BaseModel, Field
from typing import Literal

class InterviewDecision(BaseModel):
    """
    Model to structure the interviewer's decision and response.
    """
    response_text: str = Field(
        description="The content of the message to act to the candidate."
    )
    action: Literal["CONTINUE", "CLARIFY", "END"] = Field(
        description="""
        The action to take based on the user's input:
        - 'CONTINUE': The user answered the question (correctly or incorrectly) or said 'I don't know'. Move to next question.
        - 'CLARIFY': The user didn't understand, asked for a repeat, or asked a clarification question. Do NOT move to next question.
        - 'END': The interview is finished (after the 4th question).
        """
    )