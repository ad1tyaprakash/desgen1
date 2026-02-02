from agents.base import BaseAgent
from agents.llm import ask_llm


class VisualAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            "Visual Designer",
            "You are a visual designer. Define color palette, typography, and UI style."
        )

    def run(self, context):
        reply = ask_llm(self.system_prompt, context["ux_design"])
        return {"visual_design": reply}
