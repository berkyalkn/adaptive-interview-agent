from langchain_core.messages import HumanMessage
from app.core.graph import build_graph

def extract_text(content):
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        return "".join([item.get("text", "") for item in content if isinstance(item, dict)])
    return str(content)

def run_cli_simulation():
    print("---Multi-Agent Interview Simulation Begins---")
    user_role = input("Position Applied For (e.g., AI Engineer): ")

    app = build_graph()
    
    current_state = {
        "messages": [],
        "job_role": user_role,
        "interview_step": 0,
        "feedback": ""
    }

    print(f"\n Interview environment is being prepared for the [{user_role}] position...\n")

    output = app.invoke(current_state)
    current_state = output
    
    last_msg = current_state["messages"][-1]
    welcome_msg = extract_text(last_msg.content)
    
    print(f"AI Interviewer: {welcome_msg}")

    while True:
        user_input = input("\nYou: ")
        if user_input.lower() in ["q", "exit", "quit"]:
            print("The interview has ended.")
            break

        current_state["messages"].append(HumanMessage(content=user_input))

        output = app.invoke(current_state)
        current_state = output

        if output.get("feedback"):
            last_msg = output["messages"][-1]
            bye_msg = extract_text(last_msg.content).replace("INTERVIEW_FINISHED", "").strip()
            
            print(f"\nAI Interviewer: {bye_msg}")
            
            print("\n" + "="*50)
            print("Evaluator Report(Evaluator Agent)")
            print("="*50)
            print(output["feedback"])
            print("="*50)
            break
            
        else:
            last_msg = output["messages"][-1]
            msg_text = extract_text(last_msg.content).replace("INTERVIEW_FINISHED", "").strip()
            print(f"\nAI Interviewer: {msg_text}")

if __name__ == "__main__":
    run_cli_simulation()