def run():
    import uvicorn

    uvicorn.run(
        "src.api.main:app", host="0.0.0.0", port=8000, reload=True, timeout_graceful_shutdown=30
    )


if __name__ == "__main__":
    run()
