from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router

app = FastAPI(
    title="AI Vision API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lensa-vision-lab.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)