"""Tests for the util module."""

import os
import tempfile
import pytest

from util import delete_file


def test_delete_file_removes_file():
    """Test that delete_file removes an existing file."""
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(b"test content")
        filepath = tmp.name

    assert os.path.exists(filepath)
    delete_file(filepath)
    assert not os.path.exists(filepath)


def test_delete_file_raises_on_nonexistent():
    """Test that delete_file raises FileNotFoundError for non-existent file."""
    with pytest.raises(FileNotFoundError):
        delete_file("/tmp/nonexistent_file_xyz_12345.txt")
