"""Tests for the /health endpoint."""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Provide a FastAPI test client."""
    from main import app
    with TestClient(app) as c:
        yield c


def test_health_returns_ok(client):
    """Test that /health returns {\"status\": \"ok\"} with status 200."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
