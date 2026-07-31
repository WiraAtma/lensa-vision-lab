import torch
from torchvision.models import EfficientNet_B0_Weights, efficientnet_b0


def create_efficientnet_b0(
  class_names,
  device,
  weights=EfficientNet_B0_Weights.DEFAULT,
  dropout=0.2,
):
  model = efficientnet_b0(weights=weights)

  in_features = model.classifier[1].in_features

  model.classifier = torch.nn.Sequential(
    torch.nn.Dropout(dropout),
    torch.nn.Linear(in_features, len(class_names))
  )

  return model.to(device)