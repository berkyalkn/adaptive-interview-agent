from langchain_core.messages import HumanMessage
from app.core.graph import build_graph, generate_question

def run_cli_simulation():
    user_role = input("Enter the job role you are applying for (e.g., AI Engineer): ")

    app = build_graph()
    
    current_state = {
        "messages": [],
        "job_role": user_role,
        "interview_step": 0,
        "feedback": ""
    }

    initial_output = app.invoke(current_state)
    welcome_msg = initial_output["messages"][-1]
    
    welcome_content = welcome_msg.content
    if isinstance(welcome_content, list):
        welcome_text = welcome_content[0].get("text", "")
    else:
        welcome_text = str(welcome_content)
        
    print(f"\nAI: {welcome_text}")

    current_state["messages"].append(welcome_msg)

    while True:
        user_input = input("\nYou: ")
        if user_input.lower() in ["q", "exit", "quit"]:
            break

        current_state["messages"].append(HumanMessage(content=user_input))

        ai_output = generate_question(current_state)
        ai_msg = ai_output["messages"][0]
        
        ai_content = ai_msg.content
        if isinstance(ai_content, list):
            ai_text = ai_content[0].get("text", "")
        else:
            ai_text = str(ai_content)

        if "INTERVIEW_FINISHED" in ai_text:
            print("\nAI: Thank you. The interview is now completed. Analyzing results...")
            break
        
        print(f"\nAI: {ai_text}")
        
        current_state["messages"].append(ai_msg)
        current_state["interview_step"] = ai_output["interview_step"]

if __name__ == "__main__":
    run_cli_simulation()