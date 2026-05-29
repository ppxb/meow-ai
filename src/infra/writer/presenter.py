import json
import uuid
from typing import Any


class Presenter:
    def __init__(self, session_id: str | None = None):
        self.session_id = session_id
        self.run_id = f"run_{uuid.uuid4().hex}"

    def sse(self, event: str, data: dict[str, Any]) -> str:
        payload = json.dumps(data, ensure_ascii=False)
        return f"event: {event}\ndata: {payload}\n\n"

    def metadata(self) -> str:
        return self.sse("metadata", {"session_id": self.session_id, "run_id": self.run_id})

    def message_chunk(self, content: str) -> str:
        return self.sse("message:chunk", {"content": content})

    def error(self, message: str) -> str:
        return self.sse("error", {"message": message})

    def done(self) -> str:
        return self.sse("done", {"session_id": self.session_id, "run_id": self.run_id})
