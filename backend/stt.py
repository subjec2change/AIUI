import logging
import os
import shutil
import tempfile
import time
import uuid

import ffmpeg
import openai

from util import delete_file

LANGUAGE = os.getenv("LANGUAGE", "en")
STT_PROVIDER = os.getenv("STT_PROVIDER", "openai")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "lfm2.5-audio")


async def transcribe(audio):
    start_time = time.time()
    initial_filepath = f"/tmp/{uuid.uuid4()}{audio.filename}"

    with open(initial_filepath, "wb+") as file_object:
        shutil.copyfileobj(audio.file, file_object)

    converted_filepath = f"/tmp/ffmpeg-{uuid.uuid4()}{audio.filename}"

    logging.debug("running through ffmpeg")
    (
        ffmpeg
        .input(initial_filepath)
        .output(converted_filepath, loglevel="error")
        .run()
    )
    logging.debug("ffmpeg done")

    delete_file(initial_filepath)

    read_file = open(converted_filepath, "rb")

    if STT_PROVIDER == "ollama":
        transcription = await _transcribe_ollama(read_file)
    else:
        transcription = await _transcribe_openai(read_file)

    logging.info("STT response received from whisper in %s %s", time.time() - start_time, 'seconds')
    logging.info('user prompt: %s', transcription)

    delete_file(converted_filepath)

    return transcription


async def _transcribe_openai(read_file):
    logging.debug("calling whisper (openai)")
    transcription = (await openai.audio.transcriptions.create(
        model="whisper-1",
        file=read_file,
        language=LANGUAGE,
    ))["text"]
    return transcription


async def _transcribe_ollama(read_file):
    logging.debug("calling whisper (ollama, model=%s)", OLLAMA_MODEL)
    client = openai.OpenAI(
        base_url="http://localhost:11434/v1",
        api_key="ollama",
    )
    transcription = (await client.audio.transcriptions.create(
        model=OLLAMA_MODEL,
        file=read_file,
        language=LANGUAGE,
    ))["text"]
    return transcription
