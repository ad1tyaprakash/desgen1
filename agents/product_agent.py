from agents.base import BaseAgent
from agents.llm import ask_llm


class ProductAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            "Product Strategist",
            "You are a senior product manager. Extract product goals, target users, and core features."
        )

    def run(self, context):
        reply = ask_llm(self.system_prompt, context["prompt"])
        return {"product_plan": reply}
