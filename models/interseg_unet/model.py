"""
Wrapper for MONAI UNet for interactive 3D segmentation.
"""
import torch
import monai


class SegModel(monai.networks.nets.UNet):
    """
    MONAI UNet for interactive 3D segmentation.

    Input: (1, 5, D, H, W) - 5 channels:
        - Channel 0: Normalized image [0, 1]
        - Channel 1: Bounding box (unused)
        - Channel 2: Positive clicks
        - Channel 3: Negative clicks
        - Channel 4: Prior mask (unused)

    Output: (1, 1, D, H, W) - logits (apply sigmoid + threshold externally)
    """

    def __init__(self):
        super().__init__(
            spatial_dims=3,
            in_channels=5,
            out_channels=1,
            channels=(128, 128, 128, 128),
            strides=(2, 2, 2),
        )

    @property
    def device(self):
        return next(self.parameters()).device

    def forward(
        self,
        target_image: torch.Tensor,
        support_images: torch.Tensor | None = None,
        support_labels: torch.Tensor | None = None,
    ) -> torch.Tensor:
        return super().forward(target_image)
