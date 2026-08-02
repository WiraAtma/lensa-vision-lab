import time

import torch
from PIL import Image


def predict_image(
  model: torch.nn.Module,
  image: Image.Image,
  device: torch.device,
  transform=None,
):

  start_total = time.perf_counter()

  if transform is not None:
    start = time.perf_counter()

    image = transform(image)

    transform_time = time.perf_counter() - start
  else:
    transform_time = 0


  image = image.unsqueeze(0).to(device)


  model.eval()

  start = time.perf_counter()

  with torch.inference_mode():
    logits = model(image)
    probs = torch.softmax(logits, dim=1)

  inference_time = time.perf_counter() - start


  prediction = probs.argmax(dim=1).item()
  confidence = probs.max().item()

  top_probs, top_indices = torch.topk(
    probs.squeeze(),
    k=5
  )


  total_time = time.perf_counter() - start_total


  print(
    f"""
    ========== PREDICT BENCHMARK ==========
    Transform : {transform_time:.4f}s
    Inference : {inference_time:.4f}s
    Total     : {total_time:.4f}s
    =======================================
    """
  )


  return (
    prediction,
    confidence,
    top_indices.tolist(),
    top_probs.tolist(),
  )