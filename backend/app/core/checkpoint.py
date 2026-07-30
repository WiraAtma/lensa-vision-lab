import torch


def load_checkpoint(
  model: torch.nn.Module,
  model_path: str,
  device: torch.device,
):
  checkpoint = torch.load(model_path, map_location=device)

  model.load_state_dict(checkpoint["model_state_dict"])
  model.to(device)
  model.eval()

  return model, checkpoint["class_names"]