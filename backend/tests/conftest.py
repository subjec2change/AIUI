"""
Shared pytest fixtures for the AIUI backend test suite.
"""

import os
import tempfile
import uuid
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def clean_env():
    """Reset all known env vars to defaults before each test."""
    defaults = {
        "AI_PROVIDER": "openai",
        "STT_PROVIDER": "openai",
        "OLLAMA_MODEL": "llama3",
        "TTS_PROVIDER": "EDGETTS",
        "OPENAI_API_KEY": "",
        "LANGUAGE": "en",
        "ELEVENLABS_API_KEY": "",
        "ELEVENLABS_VOICE": "EXAVITQu4vr4xnSDxMaL",
        "EDGETTS_VOICE": "en-US-EricNeural",
    }
    for key, value in defaults.items():
        os.environ[key] = value
    yield


@pytest.fixture
def env_override():
    """Yield a helper function that temporarily overrides env vars."""
    original = {}

    def _set(**kwargs):
        for key, value in kwargs.items():
            original[key] = os.environ.get(key)
            os.environ[key] = value

    yield _set

    # Restore original values
    for key, value in original.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value


@pytest.fixture
def mock_openai_open():
    """Patch the OpenAI client's chat.completions.create with an AsyncMock."""
    with patch("openai.OpenAI") as mock_openai_cls:
        mock_client = AsyncMock()
        mock_openai_cls.return_value = mock_client
        mock_client.chat.completions.create = AsyncMock()
        yield mock_client.chat.completions.create


@pytest.fixture
def mock_openai_module_chat_create():
    """Patch the module-level openai.chat.completions.create."""
    with patch("openai.chat.completions.create") as mock_create:
        mock_create = AsyncMock()
        yield mock_create


@pytest.fixture
def mock_openai_module_transcriptions_create():
    """Patch the module-level openai.audio.transcriptions.create."""
    with patch("openai.audio.transcriptions.create") as mock_create:
        mock_create = AsyncMock()
        yield mock_create


@pytest.fixture
def mock_stt_ollama_client():
    """Patch the ollama STT path's OpenAI client."""
    with patch("stt.openai.OpenAI") as mock_cls:
        mock_client = MagicMock()
        mock_client.audio.transcriptions.create.return_value = MagicMock(text="hello world")
        mock_cls.return_value = mock_client
        yield mock_client.audio.transcriptions.create


@pytest.fixture
def mock_ai_ollama_client():
    """Patch the ollama AI path's OpenAI client."""
    with patch("ai.openai.OpenAI") as mock_cls:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(content="AI response"))]
        )
        mock_cls.return_value = mock_client
        yield mock_client.chat.completions.create


@pytest.fixture
def sample_audio_file(tmp_path):
    """Create a temporary audio file for testing."""
    audio_path = tmp_path / f"{uuid.uuid4()}.wav"
    audio_path.write_bytes(b"\x00" * 100)
    return audio_path


@pytest.fixture
def mock_ffmpeg_run():
    """Patch ffmpeg.run to skip actual ffmpeg conversion."""
    with patch("ffmpeg.run") as mock_run:
        mock_run.return_value = None
        yield mock_run


@pytest.fixture
def mock_delete_file():
    """Patch util.delete_file to skip actual file deletion."""
    with patch("util.delete_file") as mock_delete:
        yield mock_delete


@pytest.fixture
def mock_stt_delete_file():
    """Patch stt module's delete_file import."""
    with patch("stt.delete_file") as mock_delete:
        yield mock_delete


@pytest.fixture
def mock_ai_delete_file():
    """Patch ai module's delete_file import (if used)."""
    with patch("ai.delete_file") as mock_delete:
        yield mock_delete


@pytest.fixture
def mock_tts_delete_file():
    """Patch tts module's delete_file import."""
    with patch("tts.delete_file") as mock_delete:
        yield mock_delete


@pytest.fixture
def mock_edge_tts():
    """Patch edge_tts.Communicate to avoid real network calls."""
    mock_comm = MagicMock()
    mock_comm.save = AsyncMock(return_value=None)

    with patch("tts.edge_tts.Communicate") as mock_comm_cls:
        mock_comm_cls.return_value = mock_comm
        yield mock_comm


@pytest.fixture
def mock_gtts():
    """Patch gTTS to avoid real network calls."""
    mock_gtts = MagicMock()
    mock_gtts.save = MagicMock(return_value=None)

    with patch("tts.gTTS") as mock_gTTS_cls:
        mock_gTTS_cls.return_value = mock_gtts
        yield mock_gtts


@pytest.fixture
def mock_elevenlabs_generate():
    """Patch elevenlabs.generate."""
    with patch("tts.generate") as mock_gen:
        mock_gen.return_value = b"fake audio bytes"
        yield mock_gen


@pytest.fixture
def mock_elevenlabs_save():
    """Patch elevenlabs.save."""
    with patch("tts.save") as mock_save:
        yield mock_save


@pytest.fixture
def mock_requests_get():
    """Patch requests.get for StreamElements TTS."""
    with patch("tts.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.content = b"fake audio"
        mock_get.return_value = mock_response
        yield mock_get
