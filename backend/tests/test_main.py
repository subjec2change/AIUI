"""Tests for the main FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Provide a FastAPI test client."""
    from main import app
    with TestClient(app) as c:
        yield c


def test_root_redirects_to_index(client):
    """Test that the root endpoint redirects to /index.html."""
    response = client.get("/", allow_redirects=False)
    assert response.status_code == 307  # FastAPI uses 307 for RedirectResponse
    assert response.headers.get("location") == "/index.html"


def test_inference_valid_audio(client, monkeypatch):
    """Test /inference with valid audio returns audio file."""
    import io

    # Create a fake audio file
    audio_bytes = b"fake audio data"
    audio_file = io.BytesIO(audio_bytes)

    # Mock the pipeline functions
    async def mock_transcribe(audio):
        return "Hello there"

    async def mock_get_completion(user_prompt, conversation):
        return "Hello! How can I help?"

    async def mock_to_speech(text, background_tasks):
        return "/tmp/fake_response.mp3"

    monkeypatch.setattr("stt.transcribe", mock_transcribe)
    monkeypatch.setattr("ai.get_completion", mock_get_completion)
    monkeypatch.setattr("tts.to_speech", mock_to_speech)

    response = client.post(
        "/inference",
        files={"audio": ("test.wav", audio_file, "audio/wav")},
    )

    assert response.status_code == 200
    assert "text" in response.headers


def test_inference_empty_audio_returns_400(client):
    """Test /inference with no audio file returns 400."""
    response = client.post("/inference")
    assert response.status_code == 400
    body = response.json()
    assert body["detail"] == "No audio file provided"


def test_inference_api_failure_returns_500(client, monkeypatch):
    """Test /inference with a failed transcribe returns 500."""
    import io

    audio_bytes = b"fake audio data"
    audio_file = io.BytesIO(audio_bytes)

    async def mock_transcribe(audio):
        raise Exception("API connection failed")

    monkeypatch.setattr("stt.transcribe", mock_transcribe)

    response = client.post(
        "/inference",
        files={"audio": ("test.wav", audio_file, "audio/wav")},
    )

    assert response.status_code == 500
    body = response.json()
    assert "Inference failed" in body["detail"]
