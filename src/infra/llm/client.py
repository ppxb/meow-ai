import os
from typing import Optional

from langchain_openai import ChatOpenAI


class LLMClient:
    @staticmethod
    def get_model(model: Optional[str] = None) -> ChatOpenAI:
        api_key = os.getenv("LLM_API_KEY")
        if not api_key:
            raise RuntimeError("LLM_API_KEY not set")

        return ChatOpenAI(
            model=model or os.getenv("LLM_MODEL", "gpt-5.5"),
            api_key=api_key,
            streaming=True,
        )
