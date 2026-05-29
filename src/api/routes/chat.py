from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from src.agents.simple_agent import SimpleAgent
from src.kernel.schemas.agent import AgentRequest

router = APIRouter()


@router.post("/stream")
async def stream_chat(request: AgentRequest):
    agent = SimpleAgent()
    model = request.agent_options.get("model")

    return StreamingResponse(
        agent.stream(message=request.message, session_id=request.session_id, model=model),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
