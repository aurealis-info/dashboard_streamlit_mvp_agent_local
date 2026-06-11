"""In-process local LLM — llama-cpp-python loading a GGUF file.

No server, no daemon, no open port: the model runs inside the Streamlit
process and reads one weights file from disk. Corporate-friendly by design.

Model resolution:
  1. GGUF_MODEL_PATH env var, if set
  2. otherwise the first *.gguf file in ./models/

Get a model with `python download_model.py` (defaults to Google's
Gemma 3 4B instruct, Q4_K_M quantization, ~2.5 GB).
"""

import os
from pathlib import Path

import streamlit as st

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
N_CTX = 8192

# CPU by default: deterministic and stable everywhere (matches the corporate
# laptop), and avoids a llama.cpp Metal teardown bug that can abort the
# process (ggml-org/llama.cpp#17869). Set GGUF_GPU_LAYERS=-1 to offload to
# GPU on capable machines at your own risk.
N_GPU_LAYERS = int(os.environ.get("GGUF_GPU_LAYERS", "0"))


def model_path() -> Path | None:
    if env := os.environ.get("GGUF_MODEL_PATH"):
        return Path(env)
    if MODELS_DIR.exists():
        # Largest file wins (best quality available); override with
        # GGUF_MODEL_PATH to force a specific (e.g. lightweight) model.
        candidates = sorted(
            MODELS_DIR.glob("*.gguf"), key=lambda p: p.stat().st_size, reverse=True
        )
        if candidates:
            return candidates[0]
    return None


def available() -> bool:
    try:
        import llama_cpp  # noqa: F401
    except ImportError:
        return False
    path = model_path()
    return path is not None and path.exists()


def model_name() -> str | None:
    path = model_path()
    return path.name if path else None


@st.cache_resource(show_spinner="Loading local model (first use only)…")
def _llm():
    from llama_cpp import Llama

    return Llama(
        model_path=str(model_path()),
        n_ctx=N_CTX,
        n_gpu_layers=N_GPU_LAYERS,
        verbose=False,
    )


def chat(system: str, user, temperature: float = 0.1, max_tokens: int = 700) -> str:
    """user: a string, or a list of {'role','content'} messages (no system).

    Some chat templates (older Gemma) reject a system role — fall back to
    merging the system prompt into the first user message.
    """
    messages = user if isinstance(user, list) else [{"role": "user", "content": user}]
    try:
        out = _llm().create_chat_completion(
            messages=[{"role": "system", "content": system}, *messages],
            temperature=temperature, max_tokens=max_tokens,
        )
    except Exception:
        merged = [
            {"role": "user", "content": f"{system}\n\n{messages[0]['content']}"},
            *messages[1:],
        ]
        out = _llm().create_chat_completion(
            messages=merged, temperature=temperature, max_tokens=max_tokens,
        )
    return out["choices"][0]["message"]["content"].strip()
