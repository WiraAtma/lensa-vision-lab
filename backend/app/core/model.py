from app.core import checkpoint


def create_model_loader(
  *,
  model_builder,
  model_path,
  device,
  name="MODEL"
):

  model = None
  class_names = None


  def get_model():
    nonlocal model, class_names

    if model is None:

      print(f"========== LOAD {name} ==========")

      model, class_names = checkpoint.load_checkpoint(
        model=model_builder(),
        model_path=str(model_path),
        device=device,
      )

      model.eval()

      print(f"========== {name} READY ==========")

    return model, class_names

  return get_model