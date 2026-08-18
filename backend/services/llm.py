import json
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai


# ============================================================
# ENVIRONMENT
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_DIR / ".env"

load_dotenv(ENV_FILE)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing from backend/.env"
    )


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# ============================================================
# CURRENT MODELS
# ============================================================

# Current high-capability Flash model.
PRIMARY_MODEL = "gemini-3.6-flash"

# Current low-latency/cost-effective fallback.
FALLBACK_MODEL = "gemini-3.5-flash-lite"


# ============================================================
# GEMINI REQUEST
# ============================================================

def _generate(prompt: str) -> str:

    last_error = None

    models = [
        PRIMARY_MODEL,
        FALLBACK_MODEL,
    ]

    for model in models:

        for attempt in range(2):

            try:

                print(
                    f"[LLM] Trying {model} "
                    f"(attempt {attempt + 1})"
                )

                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                )

                text = response.text

                if not text:
                    raise RuntimeError(
                        f"{model} returned an empty response."
                    )

                print(
                    f"[LLM] {model} succeeded"
                )

                return text

            except Exception as exc:

                last_error = exc

                error_text = str(exc)

                print(
                    f"[LLM] {model} failed: "
                    f"{error_text}"
                )

                # Retry temporary capacity errors.
                if (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                    or "429" in error_text
                    or "RESOURCE_EXHAUSTED" in error_text
                ):

                    if attempt == 0:
                        time.sleep(2)

                    continue

                # Don't retry permanent errors.
                break

    raise RuntimeError(
        f"Gemini generation failed: {last_error}"
    )


# ============================================================
# NORMAL TEXT GENERATION
# ============================================================

def generate_review(prompt: str) -> str:

    return _generate(prompt)


# ============================================================
# JSON GENERATION
# ============================================================

def generate_json(*args, **kwargs):
    """
    Supports both:

        generate_json(prompt)

    and:

        generate_json(system_prompt, user_prompt)

    Returns a JSON string because the existing agents
    use json.loads() on the result.
    """

    if len(args) == 1:

        prompt = args[0]

    elif len(args) == 2:

        system_prompt = args[0]
        user_prompt = args[1]

        prompt = (
            f"{system_prompt}\n\n"
            f"{user_prompt}"
        )

    elif "prompt" in kwargs:

        prompt = kwargs["prompt"]

    else:

        raise TypeError(
            "generate_json() expects "
            "one prompt or system_prompt + user_prompt."
        )

    text = _generate(
        str(prompt)
    )

    text = text.strip()

    # --------------------------------------------------------
    # Remove Markdown JSON fences
    # --------------------------------------------------------

    text = re.sub(
        r"^```json\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"^```\s*",
        "",
        text,
    )

    text = re.sub(
        r"\s*```$",
        "",
        text,
    )

    text = text.strip()

    # --------------------------------------------------------
    # Parse JSON
    # --------------------------------------------------------

    try:

        data = json.loads(text)

    except json.JSONDecodeError:

        data = None

        # Try extracting a JSON object.
        start = text.find("{")
        end = text.rfind("}")

        if start != -1 and end != -1:

            candidate = text[
                start:end + 1
            ]

            try:
                data = json.loads(candidate)

            except json.JSONDecodeError:
                pass

        # Try extracting a JSON array.
        if data is None:

            start = text.find("[")
            end = text.rfind("]")

            if start != -1 and end != -1:

                candidate = text[
                    start:end + 1
                ]

                try:
                    data = json.loads(candidate)

                except json.JSONDecodeError:
                    pass

        if data is None:

            raise ValueError(
                "Gemini returned invalid JSON.\n\n"
                f"Raw response:\n{text}"
            )

    # IMPORTANT:
    # Return a STRING because the existing agents call
    # json.loads() themselves.
    return json.dumps(data)