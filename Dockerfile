# Frontend builder stage
FROM node:18-alpine AS frontend_builder

WORKDIR /frontend

COPY ./frontend/package.json ./frontend/yarn.lock ./

RUN yarn install --frozen-lockfile

COPY ./frontend/ ./

RUN yarn build

# Backend stage
FROM python:3.12-slim

# Install curl for HEALTHCHECK, ffmpeg for audio processing, and build tools for pydub/ffmpeg-python
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ffmpeg \
        gcc \
        libffi-dev \
        python3-dev \
        && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./backend/requirements.txt requirements.txt

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY ./backend .
COPY --from=frontend_builder /frontend/dist ./frontend/dist

ENV MAX_WORKERS=5
ENV PYTHONUNBUFFERED=1

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
