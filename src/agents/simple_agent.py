from collections.abc import AsyncGenerator

from langchain_core.messages import HumanMessage

from src.infra.llm.client import LLMClient
from src.infra.writer.presenter import Presenter


class SimpleAgent:
    async def stream(
        self, message: str, session_id: str | None = None, model: str | None = None
    ) -> AsyncGenerator:
        presenter = Presenter(session_id=session_id)

        yield presenter.metadata()

        try:
            llm = LLMClient.get_model(model=model)
            async for chunk in llm.astream([HumanMessage(content=message)]):
                content = chunk.content
                if isinstance(content, str) and content:
                    yield presenter.message_chunk(content)

            yield presenter.done()

        except Exception as e:
            yield presenter.error(str(e))
            yield presenter.done()
