from fastapi import FastAPI

from src.api.routes.chat import router as chat_router

app = FastAPI(title="Minimal Agent API")

app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])


@app.get("/health")
async def health():
    return {"status": "ok"}
