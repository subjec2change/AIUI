"""Tests for the TTS (text-to-speech) module."""

import os
import io
import tempfile
import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from tts import to_speech, TTS_PROVIDER


@pytest.mark.asyncio
async def test_gtts_provider(mock_gtts, mock_tts_delete_file):
    """Test gTTS TTS provider works correctly."""
    filepath = await to_speech("Hello world", MagicMock())

    # Verify gTTS was called
    assert mock_gtts.called

    # Verify the returned filepath exists
    assert filepath.startswith("/tmp/")
    assert filepath.endswith(".mp3")

    # Verify delete_file was scheduled
    assert mock_tts_delete_file.called


@pytest.mark.asyncio
async def test_edge_tts_provider(mock_edge_tts, mock_tts_delete_file):
    """Test edge_tts provider works correctly."""
    filepath = await to_speech("Hello world", MagicMock())

    # Verify edge_tts.Communicate was called with correct params
    mock_edge_tts.save.assert_called_once()

    assert filepath.startswith("/tmp/")
    assert filepath.endswith(".mp3")


@pytest.mark.asyncio
async def test_invalid_tts_provider_raises_value_error(env_override):
    """Test that an invalid TTS_PROVIDER raises ValueError."""
    env_override(TTS_PROVIDER="INVALID_PROVIDER")

    import importlib
    import tts
    importlib.reload(tts)

    with pytest.raises(ValueError, match="TTS_PROVIDER"):
        await tts.to_speech("Hello world", MagicMock())


@pytest.mark.asyncio
async def test_elevenlabs_provider(mock_elevenlabs_generate, mock_elevenlabs_save, mock_tts_delete_file):
    """Test ElevenLabs TTS provider works correctly."""
    filepath = await to_speech("Hello world", MagicMock())

    assert mock_elevenlabs_generate.called
    assert mock_elevenlabs_save.called

    assert filepath.startswith("/tmp/")
    assert filepath.endswith(".mp3")


@pytest.mark.asyncio
async def test_streamelements_provider(mock_requests_get, mock_tts_delete_file):
    """Test StreamElements TTS provider works correctly."""
    filepath = await to_speech("Hello world", MagicMock())

    assert mock_requests_get.called

    assert filepath.startswith("/tmp/")
    assert filepath.endswith(".mp3")
