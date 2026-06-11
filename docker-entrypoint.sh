#!/bin/sh
set -e

# Seed demo data when no database is mounted (real deployments mount the
# pipeline's SQLite file at $DASHBOARD_DB_PATH instead).
if [ ! -f "${DASHBOARD_DB_PATH:-data/dashboard.db}" ]; then
    echo "No database found at ${DASHBOARD_DB_PATH} - seeding demo data."
    python seed_data.py
fi

if [ ! -f "${GGUF_MODEL_PATH}" ]; then
    echo "No model at ${GGUF_MODEL_PATH} - the assistant will run in demo mode."
    echo "Mount a GGUF file (see download_model.py) to enable local AI."
fi

exec streamlit run app.py --server.address=0.0.0.0 --server.port=8501
