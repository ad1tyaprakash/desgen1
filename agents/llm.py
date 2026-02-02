import os
import random
import time

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "gpt-5-nano")
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
BASE_DELAY_SECONDS = float(os.getenv("BASE_DELAY_SECONDS", "2"))
THROTTLE_SECONDS = float(os.getenv("THROTTLE_SECONDS", "0"))
LOG_USAGE = os.getenv("LOG_USAGE", "0") == "1"

_LAST_CALL_AT = 0.0


def _get_client():
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("API_KEY")
    if not api_key:
        raise RuntimeError(
            "Missing OPENAI_API_KEY. Set it in the environment or pass it with docker run -e OPENAI_API_KEY=..."
        )
    return OpenAI(api_key=api_key)

def ask_llm(system_prompt, user_prompt):
    prompt = f"""
SYSTEM:
{system_prompt}

USER:
{user_prompt}
"""
    global _LAST_CALL_AT
    client = _get_client()

    if THROTTLE_SECONDS > 0:
        now = time.time()
        sleep_for = THROTTLE_SECONDS - (now - _LAST_CALL_AT)
        if sleep_for > 0:
            time.sleep(sleep_for)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.responses.create(
                model=MODEL_NAME,
                input=prompt,
            )
            _LAST_CALL_AT = time.time()
            if LOG_USAGE and getattr(response, "usage", None):
                usage = response.usage
                print(
                    f"[usage] input_tokens={usage.input_tokens} "
                    f"output_tokens={usage.output_tokens} total_tokens={usage.total_tokens}"
                )
            return response.output_text
        except Exception as exc:
            message = str(exc)
            status_code = getattr(exc, "status_code", None)
            is_rate_limited = status_code == 429 or "rate limit" in message.lower()
            if not is_rate_limited or attempt == MAX_RETRIES:
                raise
            backoff = BASE_DELAY_SECONDS * (2 ** (attempt - 1))
            jitter = random.uniform(0, 0.5)
            time.sleep(backoff + jitter)

    raise RuntimeError("LLM call failed after retries.")
