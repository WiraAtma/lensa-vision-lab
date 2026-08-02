from functools import lru_cache

from app.core import checkpoint


def create_model_loader(
  *,
  model_builder,
  model_path,
  device,
  name="MODEL"
):
  """
  Universal lazy model loader.

  Args:
    model_builder: function untuk membuat architecture model
    model_path: lokasi checkpoint
    device: cpu/cuda
    name: nama model untuk logging

  Returns:
    function get_model()
  """

  @lru_cache(maxsize=1)
  def get_model():

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