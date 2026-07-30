import torch
from typing import Tuple
from PIL import Image
from pathlib import Path

def predict_image(
  model: torch.nn.Module,
  image_path: str | Path,
  device: torch.device,
  transform=None,
) -> Tuple[int, float]:

  if device is None:
    device = next(model.parameters()).device

  image = Image.open(image_path)

  if transform is not None:
    image = transform(image)

  image = image.unsqueeze(0).to(device)

  model.to(device)
  model.eval()

  with torch.inference_mode():
    logits = model(image)
    probs = torch.softmax(logits, dim=1)

  pred = probs.argmax(dim=1).item()
  prob = probs.max().item()

  return pred, prob