from pathlib import Path

import torch
from fastapi import HTTPException, UploadFile, status
from PIL import Image
from torchvision import transforms

from app.architectures.lenet5 import LeNet5
from app.core.model import create_model_loader
from app.core.predict import predict_image

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = (BASE_DIR / "models" / "handwritten_digit" / "lenet5_handwritten_digit_model_v1.pth")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

get_model = create_model_loader(
  model_builder=lambda: LeNet5(num_classes=10),
  model_path=MODEL_PATH,
  device=DEVICE,
  name="HANDWRITTEN DIGITS MODEL"
)

predict_transform = transforms.Compose([
  transforms.Resize((32, 32)),
  transforms.Grayscale(num_output_channels=1),
  transforms.ToTensor(),
  transforms.Normalize((0.5,), (0.5,))
])

class HandwrittenDigitService:
  async def predict(self, file: UploadFile):

    if not file.content_type.startswith("image/"):
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="File must be an image.",
      )

    try:
      image = Image.open(file.file)

    except Exception:  # noqa: BLE001
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid image file.",
      )

    model, class_names = get_model()

    pred, confidence, top_indices, top_probs = predict_image(
      model=model,
      image=image,
      device=DEVICE,
      transform=predict_transform,
    )

    return {
      "prediction": class_names[pred],
      "confidence": round(confidence * 100, 2),
      "probabilities": [
        {
          "class": class_names[idx],
          "probability": round(prob * 100, 2),
        }
        for idx, prob in zip(top_indices, top_probs)
      ],
    }