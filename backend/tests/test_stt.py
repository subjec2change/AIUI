"""Tests for the STT (speech-to-text) module."""

import io
import os
import tempfile
import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from stt import transcribe, _transcribe_openai, _transcribe_ollama, STT_PROVIDER


@pytest.mark.asyncio
async def test_transcribe_openai_provider(mock_stt_ollama_client):
    """Test transcribe with openai provider uses Whisper."""
    mock_stt_ollama_client.return_value = MagicMock(text="transcribed text")

    audio_file = io.BytesIO(b"fake audio")
    audio_file.filename = "test.wav"

    with patch("ffmpeg.run"):
        with patch("stt.delete_file"):
            result = await transcribe(audio_file)

    assert result == "transcribed text"


@pytest.mark.asyncio
async def test_transcribe_ollama_provider(env_override, mock_stt_ollama_client):
    """Test transcribe with ollama provider uses local Ollama."""
    env_override(STT_PROVIDER="ollama")

    # Reimport stt module after env override
    import importlib
    import stt
    importlib.reload(stt)

    mock_stt_ollama_client.return_value = MagicMock(text="ollama transcribed")

    audio_file = io.BytesIO(b"fake audio")
    audio_file.filename = "test.wav"

    with patch("ffmpeg.run"):
        with patch("stt.delete_file"):
            result = await stt.transcribe(audio_file)

    assert result == "ollama transcribed"


def test_transcribe_opens_openai_client(mock_stt_ollama_client):
    """Test transcribe opens the OpenAI client."""
    mock_stt_ollama_client.return_value = MagicMock(text="hello")

    audio_file = io.BytesIO(b"fake audio")
    audio_file.filename = "test.wav"

    with patch("ffmpeg.run"):
        with patch("stt.delete_file"):
            transcribe(audio_file)

    mock_stt_ollama_client.assert_called_once()


@pytest.mark.asyncio
async def test_ffmpeg_conversion(mock_ffmpeg_run, mock_stt_delete_file):
    """Test that ffmpeg conversion works correctly."""
    from stt import transcribe

    mock_ffmpeg_run.return_value = None

    audio_file = io.BytesIO(b"fake audio")
    audio_file.filename = "test.wav"

    # Mock the OpenAI transcription
    with patch("stt.openai.audio.transcriptions.create") as mock_transcribe_create:
        mock_transcribe_create = AsyncMock()
        mock_transcribe_create.return_value = MagicMock(text="ffmpeg converted text")

        result = await transcribe(audio_file)

    assert result == "ffmpeg converted text"

    # Verify ffmpeg was called
    mock_ffmpeg_run.assert_called_once()

    # Verify delete_file was called for both initial and converted files
    assert mock_stt_delete_file.call_count == 2
