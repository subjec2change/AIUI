#!/bin/bash
set -e

CONTAINER_LABEL="created_by=aiui_script"

TTS_OPTIONS=("gTTS" "ELEVENLABS" "STREAMELEMENTS" "EDGETTS" "OLLAMA")

# Defaults
AI_PROVIDER="openai"
OLLAMA_MODEL=""
USE_LOCAL=false
BUILD_FRONTEND=true

usage() {
    cat <<EOF
Usage: $0 [OPTIONS] <TTS_PROVIDER>

Options:
  --help                Show this help message
  --local               Skip building frontend, use existing dist directory
  --ollama              Enable local AI mode (AI_PROVIDER=ollama, STT_PROVIDER=ollama)
  --model <name>        Specify the Ollama model name (e.g., llama3, mistral)
  --tts <provider>      Override TTS provider (gTTS, ELEVENLABS, STREAMELEMENTS, EDGETTS, OLLAMA)

TTS Providers:
  gTTS              Google Text-to-Speech (free, no API key needed)
  ELEVENLABS        ElevenLabs voice cloning (requires ELEVENLABS_API_KEY)
  STREAMELEMENTS    StreamElements voice (free, limited voices)
  EDGETTS           Microsoft Edge TTS (free, high quality)
  OLLAMA            Local Ollama TTS (requires --ollama mode)

Environment Variables (required):
  OPENAI_API_KEY      OpenAI API key (not needed for OLLAMA mode)
  AI_COMPLETION_MODEL AI model to use (default: gpt-3.5-turbo)
  LANGUAGE            ISO-639-1 language code (default: en)

Environment Variables (optional):
  ELEVENLABS_API_KEY    ElevenLabs API key (required for ELEVENLABS TTS)
  ELEVENLABS_VOICE      ElevenLabs voice ID (default: EXAVITQu4vr4xnSDxMaL)
  EDGETTS_VOICE         Edge TTS voice (default: en-US-EricNeural)
  OLLAMA_MODEL          Ollama model name (default: llama3)
  OLLAMA_BASE_URL       Ollama API base URL (default: http://host.docker.internal:11434)
  AI_PROVIDER           AI backend (openai or ollama)
  STT_PROVIDER          Speech-to-text backend (openai or ollama)

Examples:
  $0 --ollama --model llama3 EDGETTS
    Run with Ollama local AI and Edge TTS

  $0 --local gTTS
    Run without rebuilding frontend, using gTTS for voice

  $0 EDGETTS
    Default: build and run with OpenAI and Edge TTS

  $0 --ollama --model mistral --tts gTTS
    Run with Ollama local AI and gTTS for voice
EOF
    exit 0
}

check_env_var() {
    if [[ -z "${!1}" ]]; then
        echo "Error: $1 is not set."
        exit 1
    fi
}

remove_containers() {
    if [ "$(docker ps -a -q -f "label=$1")" ]; then
        docker rm -f $(docker ps -a -q -f "label=$1")
    fi
}

build_docker() {
    local arch
    arch=$(uname -m)
    echo "Detected architecture: $arch"

    if [ "$arch" == "arm64" ]; then
        echo "Building for linux/arm64..."
        docker buildx build --platform linux/arm64 -t aiui .
    else
        echo "Building for linux/amd64..."
        docker build -t aiui .
    fi
    echo "Docker image built successfully."
}

run_docker() {
    local tts_provider="$1"

    # Validate TTS provider
    local valid=false
    for opt in "${TTS_OPTIONS[@]}"; do
        if [[ "$tts_provider" == "$opt" ]]; then
            valid=true
            break
        fi
    done

    if [ "$valid" = false ]; then
        echo "Error: Invalid TTS provider '$tts_provider'."
        echo "Valid providers: ${TTS_OPTIONS[*]}"
        exit 1
    fi

    local docker_args=()

    # Set AI and STT provider defaults based on ollama mode
    local ai_provider="$AI_PROVIDER"
    local stt_provider="$AI_PROVIDER"  # STT follows AI provider when using ollama

    if [ "$USE_LOCAL" = true ]; then
        echo "Using local frontend dist (no build)"
    fi

    # Common environment variables
    docker_args+=(-e AI_PROVIDER="$ai_provider")
    docker_args+=(-e STT_PROVIDER="$stt_provider")

    if [ "$USE_LOCAL" = true ]; then
        echo "Running with existing frontend dist..."
    else
        echo "Running Docker container with $tts_provider TTS..."
    fi

    # Provider-specific configuration
    case "$tts_provider" in
        gTTS)
            docker_args+=(-e TTS_PROVIDER=gTTS)
            echo "  TTS: gTTS (free, uses LANGUAGE env var: ${LANGUAGE:-en})"
            ;;
        ELEVENLABS)
            check_env_var "ELEVENLABS_API_KEY"
            docker_args+=(-e TTS_PROVIDER=ELEVENLABS)
            docker_args+=(-e ELEVENLABS_API_KEY="$ELEVENLABS_API_KEY")
            docker_args+=(-e ELEVENLABS_VOICE="${ELEVENLABS_VOICE:-EXAVITQu4vr4xnSDxMaL}")
            echo "  TTS: ElevenLabs"
            ;;
        STREAMELEMENTS)
            docker_args+=(-e TTS_PROVIDER=STREAMELEMENTS)
            echo "  TTS: StreamElements"
            ;;
        EDGETTS)
            docker_args+=(-e TTS_PROVIDER=EDGETTS)
            docker_args+=(-e EDGETTS_VOICE="${EDGETTS_VOICE:-en-US-EricNeural}")
            echo "  TTS: Edge TTS"
            ;;
        OLLAMA)
            docker_args+=(-e TTS_PROVIDER=OLLAMA)
            docker_args+=(-e OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://host.docker.internal:11434}")
            docker_args+=(-e OLLAMA_MODEL="${OLLAMA_MODEL:-llama3}")
            echo "  TTS: Ollama local (model: ${OLLAMA_MODEL:-llama3})"
            ;;
    esac

    # AI provider configuration
    if [ "$ai_provider" = "ollama" ]; then
        check_env_var "OLLAMA_BASE_URL"
        docker_args+=(-e AI_PROVIDER=ollama)
        docker_args+=(-e STT_PROVIDER=ollama)
        docker_args+=(-e OLLAMA_BASE_URL="$OLLAMA_BASE_URL")

        if [ -n "$OLLAMA_MODEL" ]; then
            docker_args+=(-e OLLAMA_MODEL="$OLLAMA_MODEL")
            echo "  AI: Ollama local model ($OLLAMA_MODEL)"
        else
            echo "  AI: Ollama local (default model: llama3)"
        fi
    else
        check_env_var "OPENAI_API_KEY"
        docker_args+=(-e OPENAI_API_KEY="$OPENAI_API_KEY")
        docker_args+=(-e AI_PROVIDER=openai)
        docker_args+=(-e STT_PROVIDER=openai)
        echo "  AI: OpenAI"
    fi

    # Optional model override
    if [ -n "$AI_COMPLETION_MODEL" ]; then
        docker_args+=(-e AI_COMPLETION_MODEL="$AI_COMPLETION_MODEL")
    fi

    # Optional language
    if [ -n "$LANGUAGE" ]; then
        docker_args+=(-e LANGUAGE="$LANGUAGE")
    fi

    docker_args+=(-p 8000:8000 --label "$CONTAINER_LABEL" aiui)

    docker run -d "${docker_args[@]}"
}

# Parse arguments
TTS_PROVIDER=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --help)
            usage
            ;;
        --local)
            BUILD_FRONTEND=false
            USE_LOCAL=true
            shift
            ;;
        --ollama)
            AI_PROVIDER="ollama"
            shift
            ;;
        --model)
            if [[ -z "$2" ]]; then
                echo "Error: --model requires a value (e.g., --model llama3)"
                exit 1
            fi
            OLLAMA_MODEL="$2"
            shift 2
            ;;
        --tts)
            if [[ -z "$2" ]]; then
                echo "Error: --tts requires a value (e.g., --tts EDGETTS)"
                exit 1
            fi
            TTS_PROVIDER="$2"
            shift 2
            ;;
        -*)
            echo "Error: Unknown option '$1'"
            echo "Run '$0 --help' for usage information."
            exit 1
            ;;
        *)
            if [ -z "$TTS_PROVIDER" ]; then
                TTS_PROVIDER="$1"
            else
                echo "Error: Unexpected argument '$1'"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate TTS provider was specified
if [ -z "$TTS_PROVIDER" ]; then
    echo "Error: TTS provider is required."
    echo "Run '$0 --help' for usage information."
    exit 1
fi

# Cleanup any existing containers
remove_containers "$CONTAINER_LABEL"

# Build if not using local mode
if [ "$BUILD_FRONTEND" = true ]; then
    build_docker
fi

# Run the container
run_docker "$TTS_PROVIDER"

echo ""
echo "AIUI is running at http://localhost:8000"
echo "Container label: $CONTAINER_LABEL"
echo "Run 'docker logs -f $(docker ps -q -f "label=$CONTAINER_LABEL")' to view logs"
