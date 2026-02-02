from agents.base import BaseAgent
from agents.llm import ask_llm


class UXAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            "UX Architect",
            "You are a UX designer. Define user flows and screens."
        )

    def run(self, context):
        reply = ask_llm(self.system_prompt, context["product_plan"])
        return {"ux_design": reply}
