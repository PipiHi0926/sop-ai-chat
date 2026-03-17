"""
LLM Client
==========
封裝公司內部 LLM API 呼叫，支援一般回應與串流（Streaming）模式。
"""
import os
from openai import OpenAI
from typing import Iterator

# 可透過環境變數覆蓋（方便未來切換模型）
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://litellm-db.nv.123.v1")
LLM_API_KEY  = os.getenv("LLM_API_KEY",  "123456")
LLM_MODEL    = os.getenv("LLM_MODEL",    "ai-infra/MiniMaxAI/MiniMax-M2.1")

_client = OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)


def chat_complete(messages: list[dict], temperature: float = 0.3, max_tokens: int = 2000) -> str:
    """一次性回應（非串流）"""
    response = _client.chat.completions.create(
        model=LLM_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content


def chat_stream(messages: list[dict], temperature: float = 0.3, max_tokens: int = 2000) -> Iterator[str]:
    """串流回應，yield 每個 chunk 的文字內容"""
    stream = _client.chat.completions.create(
        model=LLM_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content
