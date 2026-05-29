from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from src.infra.utils.datetime import utc_now


class AgentRequest(BaseModel):
    """Request to run the agent."""

    message: str = Field(..., description="User message or task description")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    agent_options: Optional[dict[str, Any]] = Field(
        None, description="Agent options (e.g., enable_thinking)"
    )


class StreamEvent(BaseModel):
    """Streaming event."""

    event_type: str  # thinking, content, tool_call, tool_result, step, complete, error
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=utc_now)
