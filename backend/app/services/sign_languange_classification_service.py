from pathlib import Path

import torch
from fastapi import HTTPException, UploadFile, status
from PIL import Image
from torchvision import transforms

from app.architectures.efficientnet_b0 import efficientnet_b0
from app.core import checkpoint
from app.core.formatter import format_class_name
from app.core.predict import predict_image

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = (BASE_DIR / "models" / "sign_languange_classification" / "efficient_b0_sign_languange_model_v1.pth")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MODEL, CLASS_NAMES = checkpoint.load_checkpoint(
  model=efficientnet_b0(num_classes=36),
  model_path=str(MODEL_PATH),
  device=DEVICE,
)

predict_transform = transforms.Compose([
  transforms.Resize((224, 224)),
  transforms.ToTensor(),
  transforms.Normalize(mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225]),
])

class SignLanguangeClassificationService:
  async def predict(self, file: UploadFile):

    if not file.content_type.startswith("image/"):
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="File must be an image.",
      )

    try:
      image = Image.open(file.file).convert("RGB")

    except Exception:  # noqa: BLE001
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid image file.",
      )

    pred, confidence, top_indices, top_probs = predict_image(
      model=MODEL,
      image=image,
      device=DEVICE,
      transform=predict_transform,
    )

    return {
      "prediction": format_class_name(CLASS_NAMES[pred]),
      "confidence": round(confidence * 100, 2),
      "probabilities": [
        {
          "class": CLASS_NAMES[idx],
          "probability": round(prob * 100, 2),
        }
        for idx, prob in zip(top_indices, top_probs)
      ],
    }