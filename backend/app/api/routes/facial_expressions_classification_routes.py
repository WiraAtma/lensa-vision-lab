import logging

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.services.facial_expressions_classification_service import (
  FacialExpressionsClassificationService,
)

router = APIRouter()
service = FacialExpressionsClassificationService()
logger = logging.getLogger(__name__)

@router.post("", status_code=status.HTTP_200_OK)
async def predict(file: UploadFile = File(...)):  # noqa: B008
  try:
    return await service.predict(file)
  except HTTPException:
    raise

  except Exception:
    logger.exception("Unexpected error")

    raise HTTPException(
      status_code=500,
      detail="Internal Server Error",
    )