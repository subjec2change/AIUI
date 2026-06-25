import base64
import json
import logging
import os
import time

import openai

AI_COMPLETION_MODEL = os.getenv("AI_COMPLETION_MODEL", "gpt-3.5-turbo")
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
LANGUAGE = os.getenv("LANGUAGE", "en")
INITIAL_PROMPT = f"You are AIUI - a helpful assistant with a voice interface. Keep your responses very succinct and limited to a single sentence since the user is interacting with you through a voice interface. Always provide your responses in the language that corresponds to the ISO-639-1 code: {LANGUAGE}."


async def get_completion(user_prompt, conversation_thus_far):
    if _is_empty(user_prompt):
        raise ValueError("empty user prompt received")

    start_time = time.time()
    messages = [
        {
            "role": "system",
            "content": INITIAL_PROMPT
        }
    ]

    messages.extend(json.loads(base64.b64decode(conversation_thus_far)))
    messages.append({"role": "user", "content": user_prompt})

    logging.debug("calling %s (provider=%s)", AI_COMPLETION_MODEL, AI_PROVIDER)

    if AI_PROVIDER == "ollama":
        completion = await _get_completion_ollama(messages)
    else:
        completion = await _get_completion_openai(messages)

    logging.info("response received from %s in %s seconds", AI_COMPLETION_MODEL, time.time() - start_time)
    logging.info('%s response: %s', AI_COMPLETION_MODEL, completion)

    return completion


async def _get_completion_openai(messages):
    res = await openai.chat.completions.create(
        model=AI_COMPLETION_MODEL,
        messages=messages,
        timeout=15,
    )
    return res.choices[0].message.content


async def _get_completion_ollama(messages):
    logging.debug("calling LLM (ollama, model=%s)", OLLAMA_MODEL)
    client = openai.OpenAI(
        base_url="http://localhost:11434/v1",
        api_key="ollama",
    )
    res = client.chat.completions.create(
        model=OLLAMA_MODEL,
        messages=messages,
    )
    return res.choices[0].message.content


def _is_empty(user_prompt: str):
    return not user_prompt or user_prompt.isspace()
