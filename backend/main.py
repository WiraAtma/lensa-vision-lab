import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router

torch.set_num_threads(1)

app = FastAPI(
    title="Lensa Vision Lab",
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