# LeNet-5 Architecture Source : https://medium.com/codex/lenet-5-complete-architecture-84c6d08215f9

from torch import nn


class LeNet5(nn.Module):
  """
  LeNet-5 (Paper Style)

  Reference:
  LeCun et al. (1998)
  https://ieeexplore.ieee.org/document/726791
  """


  def __init__(self, num_classes:int = 10):
    super().__init__()

    self.features = nn.Sequential(
      # Convolution Layer 1
      nn.Conv2d(in_channels=1, out_channels=6, kernel_size=5),
      nn.Tanh(),

      # Subsampling Layer 2
      nn.AvgPool2d(kernel_size=2, stride=2),

      # Convolution Layer 3
      nn.Conv2d(6, 16, kernel_size=5),
      nn.Tanh(),

      # Subsampling Layer 4
      nn.AvgPool2d(kernel_size=2, stride=2),

      # Convolution Layer 5
      nn.Conv2d(in_channels=16, out_channels=120, kernel_size=5),
      nn.Tanh(),
    )

    self.classifier = nn.Sequential(
      nn.Flatten(),

      # Fully Connected
      nn.Linear(120, 84),
      nn.Tanh(),

      # Output 
      nn.Linear(84, num_classes)
    )

  def forward(self, x):
    x = self.features(x)
    x = self.classifier(x)

    return x