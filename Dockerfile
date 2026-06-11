FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    DASHBOARD_DB_PATH=/data/dashboard.db \
    GGUF_MODEL_PATH=/models/gemma-3-4b-it-Q4_K_M.gguf

# build-essential + cmake: llama-cpp-python compiles llama.cpp at install
# time when no prebuilt wheel matches; curl: container healthcheck.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential cmake curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN mkdir -p /data /models && chmod +x docker-entrypoint.sh

EXPOSE 8501
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
    CMD curl -fs http://localhost:8501/_stcore/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
