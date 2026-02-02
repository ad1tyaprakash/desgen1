from agents.code_agent import CodeAgent
from agents.product_agent import ProductAgent
from agents.ux_agent import UXAgent
from agents.visual_agent import VisualAgent

class Orchestrator:
    def __init__(self):
        self.product = ProductAgent()
        self.ux = UXAgent()
        self.visual = VisualAgent()
        self.code = CodeAgent()

    def handle(self, prompt: str):
        context = {"prompt": prompt}

        context.update(self.product.run(context))
        context.update(self.ux.run(context))
        context.update(self.visual.run(context))
        context.update(self.code.run(context))

        return context
