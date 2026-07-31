from fastapi import APIRouter

from .routes.food_classification_routes import router as food_classification_router
from .routes.handwritten_digit_routes import router as handwritten_digit_router
from .routes.sign_languange_classification_routes import (
  router as sign_languange_classification_router,
)

router = APIRouter()

@router.get("/")
async def root():
  return {
    "message": "Welcome to LensaVision Lab! 🚀",
    "description": "Build, explore, and experiment with open-source machine learning, deep learning, computer vision, and LLM models.",
    "repository": "https://github.com/WiraAtma/lensa-vision-lab"
  }

router.include_router(
  router=handwritten_digit_router,
  prefix="/predict/handwritten_digit",
  tags=["Handwritten Digit"]
)

router.include_router(
  router=food_classification_router,
  prefix="/predict/food_classification",
  tags=["Food Classification"]
)

router.include_router(
  router=sign_languange_classification_router,
  prefix="/predict/sign_languange_classification",
  tags=["Food Classification"]
)