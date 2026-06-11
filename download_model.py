"""Download the local model.

  python download_model.py          Gemma 3 4B instruct (~2.5 GB) — default
  python download_model.py small    Gemma 3 1B instruct (~0.8 GB) — faster,
                                    lower quality; good for weak laptops

Override the source with MODEL_URL if your network requires a mirror, or
drop any *.gguf file into ./models/ manually — the app uses the largest one
it finds (or the file set in GGUF_MODEL_PATH).
"""

import os
import sys
import urllib.request
from pathlib import Path

URLS = {
    "default": (
        "https://huggingface.co/ggml-org/gemma-3-4b-it-GGUF"
        "/resolve/main/gemma-3-4b-it-Q4_K_M.gguf"
    ),
    "small": (
        "https://huggingface.co/ggml-org/gemma-3-1b-it-GGUF"
        "/resolve/main/gemma-3-1b-it-Q4_K_M.gguf"
    ),
}
MODELS_DIR = Path(__file__).resolve().parent / "models"


def main() -> None:
    size = "small" if (len(sys.argv) > 1 and sys.argv[1] in ("small", "1b")) else "default"
    url = os.environ.get("MODEL_URL", URLS[size])
    dest = MODELS_DIR / url.rsplit("/", 1)[-1]
    if dest.exists():
        print(f"Already present: {dest}")
        return
    MODELS_DIR.mkdir(exist_ok=True)
    print(f"Downloading {url}\n -> {dest}")

    def progress(blocks, block_size, total):
        if total > 0:
            pct = min(100, blocks * block_size * 100 // total)
            sys.stdout.write(f"\r{pct}% of {total / 1e9:.1f} GB")
            sys.stdout.flush()

    tmp = dest.with_suffix(".part")
    urllib.request.urlretrieve(url, tmp, reporthook=progress)
    tmp.rename(dest)
    print(f"\nDone: {dest}")


if __name__ == "__main__":
    main()
