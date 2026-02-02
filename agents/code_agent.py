from agents.base import BaseAgent
from agents.llm import ask_llm


class CodeAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            "Frontend Engineer",
            "You are a senior frontend engineer. Produce implementation-ready UI code or component structure."
        )

    def run(self, context):
        prompt = context.get("visual_design") or context.get("ux_design") or context.get("product_plan")
        reply = ask_llm(self.system_prompt, prompt)
        return {"code_plan": reply}
