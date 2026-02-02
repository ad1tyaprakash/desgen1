import sys

from app.orchestrator import Orchestrator
if __name__ == "__main__":
    orchestrator = Orchestrator()

    print("\nAI Design System Ready")
    user_prompt = " ".join(sys.argv[1:]).strip()
    if not user_prompt:
        user_prompt = input("\nWhat do you want to design?\n> ")

    result = orchestrator.handle(user_prompt)

    print("\n Final Design Output:\n")
    for key, value in result.items():
        print(f"\n{key.upper()}:\n{value}")
