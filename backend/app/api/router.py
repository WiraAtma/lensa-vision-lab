from fastapi import APIRouter

from .routes.handwritten_digit_routes import router as handwritten_digit_router

router = APIRouter()

@router.get("/")
async def root():
  return {
    "message": "Welcome to LensaVision Lab API"
  }

router.include_router(
  router=handwritten_digit_router,
  prefix="/predict/handwritten_digit",
  tags=["Handwritten Digit"]
)