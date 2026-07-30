import torch
from PIL import Image


def predict_image(
  model: torch.nn.Module,
  image: Image.Image,
  device: torch.device,
  transform=None,
):
    if transform is not None:
      image = transform(image)

    image = image.unsqueeze(0).to(device)

    model.eval()

    with torch.inference_mode():
      logits = model(image)
      probs = torch.softmax(logits, dim=1)

    prediction = probs.argmax(dim=1).item()
    confidence = probs.max().item()

    # limit 5 Higher probs
    top_probs, top_indices = torch.topk(probs.squeeze(), k=5)

    return (
      prediction,
      confidence,
      top_indices.tolist(),
      top_probs.tolist(),
    )