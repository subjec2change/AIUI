<p align="center">
  <img src="https://github.com/lspahija/AIUI/assets/44912218/4a8537fc-8438-4f27-bdfb-32d4418fb06b" alt="AIUI">
</p>

# A Voice Interface for AI

Point-and-click user interfaces will soon be a thing of the past. The main user interface of the near future will be entirely voice-based.

AIUI is a platform that aims to enable seamless two-way verbal communication with AI models. It works in both desktop and mobile browsers and currently supports GPT-4 and GPT-3.5 models, with support for local open-source models under development.

## Demo Video
https://github.com/lspahija/AIUI/assets/44912218/0c984aed-973a-4fdd-983a-198414e5b573

## Usage
To interact with AIUI, simply start speaking after navigating to the app in your browser. AIUI will listen to your voice input, process it using an AI model, and provide a synthesized speech response. You can have a natural, continuous conversation with the AI by speaking and listening to its responses.

## Quick Start (run.sh)

The simplest way to run AIUI is with the provided `run.sh` script:

```bash
# Default: build and run with OpenAI and Edge TTS
chmod +x run.sh && ./run.sh EDGETTS
```

### run.sh Options

```
--help                Show usage information
--local               Skip building frontend, use existing dist directory
--ollama              Enable local AI mode (AI_PROVIDER=ollama, STT_PROVIDER=ollama)
--model <name>        Specify the Ollama model name (e.g., --model llama3)
```

### run.sh Examples

```bash
# OpenAI + Edge TTS (default)
./run.sh EDGETTS

# OpenAI + Google TTS (free, multilingual)
./run.sh gTTS

# Local Ollama AI + Edge TTS
./run.sh --ollama --model llama3 EDGETTS

# Local Ollama AI + gTTS with custom model
./run.sh --ollama --model mistral --tts gTTS

# Use existing frontend build (faster startup)
./run.sh --local EDGETTS
```

### Supported TTS Providers

| Provider | Description | API Key Required |
|----------|-------------|------------------|
| `gTTS` | Google Text-to-Speech (free, multilingual) | No |
| `EDGETTS` | Microsoft Edge TTS (free, high quality) | No |
| `ELEVENLABS` | ElevenLabs voice cloning | Yes |
| `STREAMELEMENTS` | StreamElements voice (free) | No |
| `OLLAMA` | Local Ollama TTS | No (requires Ollama) |

## Configuration

All configuration is done via environment variables. Copy `.env.example` to `.env` and edit it:

```bash
cp .env.example .env
```

### Environment Variables

#### AI Provider

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes (if AI_PROVIDER=openai) | Your OpenAI API key |
| `AI_PROVIDER` | No | AI backend: `openai` or `ollama` (default: `openai`) |
| `AI_COMPLETION_MODEL` | No | OpenAI model to use (default: `gpt-3.5-turbo`) |

#### Ollama (Local AI)

| Variable | Required | Description |
|----------|----------|-------------|
| `OLLAMA_MODEL` | No | Ollama model name (default: `llama3`) |
| `OLLAMA_BASE_URL` | No | Ollama API URL (default: `http://host.docker.internal:11434`) |

#### STT (Speech-to-Text)

| Variable | Required | Description |
|----------|----------|-------------|
| `STT_PROVIDER` | No | STT backend: `openai` or `ollama` (default: `openai`) |

> **Note:** STT provider follows the AI provider when using Ollama mode. When `AI_PROVIDER=ollama`, STT automatically uses Ollama's Whisper model.

#### TTS (Text-to-Speech)

| Variable | Required | Description |
|----------|----------|-------------|
| `TTS_PROVIDER` | No | TTS provider: `gTTS`, `ELEVENLABS`, `STREAMELEMENTS`, `EDGETTS`, `OLLAMA` (default: `EDGETTS`) |
| `ELEVENLABS_API_KEY` | Yes (if TTS_PROVIDER=ELEVENLABS) | ElevenLabs API key |
| `ELEVENLABS_VOICE` | No | ElevenLabs voice ID (default: `EXAVITQu4vr4xnSDxMaL`) |
| `EDGETTS_VOICE` | No | Edge TTS voice (default: `en-US-EricNeural`) |

#### General

| Variable | Required | Description |
|----------|----------|-------------|
| `LANGUAGE` | No | ISO-639-1 language code (default: `en`) |
| `MAX_WORKERS` | No | Worker count (default: `5`) |

## Docker

### Manual Docker Build

```bash
# amd64
docker build -t aiui .

# arm64
docker buildx build --platform linux/arm64 -t aiui .

# Run with OpenAI
docker run -d -e OPENAI_API_KEY=your-key -e TTS_PROVIDER=EDGETTS -e EDGETTS_VOICE=en-US-EricNeural -p 8000:8000 aiui

# Run with Ollama (local AI)
docker run -d -e AI_PROVIDER=ollama -e STT_PROVIDER=ollama -e OLLAMA_MODEL=llama3 -e OLLAMA_BASE_URL=http://host.docker.internal:11434 -e TTS_PROVIDER=EDGETTS -p 8000:8000 aiui
```

### Docker Compose

1. Copy `.env.example` to `.env` and configure your variables:
   ```bash
   cp .env.example .env
   ```

2. Start with Docker Compose:
   ```bash
   # Default (OpenAI + Edge TTS)
   docker compose up -d

   # With Ollama local AI
   AI_PROVIDER=ollama AI_COMPLETION_MODEL=ollama STT_PROVIDER=ollama docker compose up -d
   ```

3. Navigate to `localhost:8000` in your browser.

## Notes

### AI Model Configuration

The AI model defaults to `gpt-3.5-turbo` but you can adjust this by setting the `AI_COMPLETION_MODEL` environment variable (e.g., to `gpt-4` if your `OPENAI_API_KEY` has access to it).

### Language Support

You can configure the language by setting the `LANGUAGE` environment variable to the corresponding ISO-639-1 code. The default is `en`.

Languages other than English are currently only supported when using the `gTTS` or `edge_tts` providers for text-to-speech. The TTS provider can be selected by setting the environment variable `TTS_PROVIDER` to one of the values listed above.

### Local AI Mode with Ollama

You can run AIUI entirely locally using [Ollama](https://ollama.ai):

1. Install Ollama from https://ollama.ai
2. Pull a model: `ollama pull llama3`
3. Run AIUI with Ollama:
   ```bash
   # Using run.sh
   ./run.sh --ollama --model llama3 EDGETTS

   # Using docker-compose
   AI_PROVIDER=ollama STT_PROVIDER=ollama OLLAMA_MODEL=llama3 docker compose up -d
   ```

> **Note:** When running Ollama inside Docker, use `http://host.docker.internal:11434` as the `OLLAMA_BASE_URL` to connect to the host's Ollama instance. On Linux with Docker Desktop, you may need to use `http://host.containers.internal:11434` instead.

## Notes

The AI model defaults to `gpt-3.5-turbo` but you can adjust this by setting the `AI_COMPLETION_MODEL` environment variable (e.g. to `gpt-4` if your `OPENAI_API_KEY` has access to it)

You can configure the language by setting the `LANGUAGE` environment variable to the corresponding ISO-639-1 code. The default is `en`.
Languages other than English are currently only supported when using the `gTTS` or `edge_tts` providers for text-to-speech. The TTS provider can be selected by setting the environment variable `TTS_PROVIDER` to one of the values in [tts.py](./backend/tts.py).

<br/>

## One Click Deployment
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/XxIOWs?referralCode=VcOv5G)

## Find this useful?
Please star this repository! It helps contributors gauge the popularity of the repo and determine how much time to allot to development.
