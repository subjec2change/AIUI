"""Tests for the AI (LLM completion) module."""

import pytest
import os
from unittest.mock import AsyncMock, patch, MagicMock

from ai import get_completion, AI_PROVIDER, _get_completion_openai, _get_completion_ollama


@pytest.mark.asyncio
async def test_get_completion_openai_provider(mock_openai_open):
    """Test get_completion uses openai provider correctly."""
    mock_openai_open.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content="OpenAI response"))]
    )

    result = await get_completion("Hello", "")

    mock_openai_open.assert_awaited_once()
    assert result == "OpenAI response"


@pytest.mark.asyncio
async def test_get_completion_ollama_provider(env_override, mock_ai_ollama_client):
    """Test get_completion uses ollama provider correctly."""
    env_override(AI_PROVIDER="ollama")

    # Need to reimport ai module after env override to pick up new AI_PROVIDER
    import importlib
    import ai
    importlib.reload(ai)

    result = await ai.get_completion("Hello", "")

    mock_ai_ollama_client.assert_called_once()
    assert result == "AI response"


@pytest.mark.asyncio
async def test_get_completion_raises_value_error_on_empty_prompt():
    """Test get_completion raises ValueError for empty prompt."""
    with pytest.raises(ValueError, match="empty user prompt received"):
        await get_completion("", "")


@pytest.mark.asyncio
async def test_get_completion_raises_value_error_on_whitespace_prompt():
    """Test get_completion raises ValueError for whitespace-only prompt."""
    with pytest.raises(ValueError, match="empty user prompt received"):
        await get_completion("   ", "")


@pytest.mark.asyncio
async def test_ai_provider_switching(env_override, mock_openai_open):
    """Test that AI provider switching works correctly."""
    env_override(AI_PROVIDER="ollama")

    # Reimport ai module after env override
    import importlib
    import ai
    importlib.reload(ai)

    assert ai.AI_PROVIDER == "ollama"

    mock_ai_ollama_client = MagicMock()
    mock_ai_ollama_client.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content="Ollama response"))]
    )
    with patch("ai.openai.OpenAI") as mock_cls:
        mock_cls.return_value = mock_ai_ollama_client
        result = await ai.get_completion("Test prompt", "")

    assert result == "Ollama response"
