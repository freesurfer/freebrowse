"""
Wrapper for MONAI UNet for interactive 3D segmentation.
"""
from typing import Union, Sequence, Literal, List, Callable

import torch
import monai
from torch import nn
import neurite as ne


class SegModel(ne.nn.models.BasicUNet):

    def __init__(
        self,
        ndim: int = 3,
        in_channels: int = 5,
        out_channels: int = 1,
        nb_features: Union[Sequence[int], Sequence[Sequence[int]]] = (4, 16, 256, 256),
        padding_mode: Literal['zeros', 'replicate', 'reflect'] = 'zeros',
        upsample_mode: Literal['linear', 'transposed', 'nearest'] = 'linear',
        normalizations: Union[List[Union[Callable, str]], Callable, str, None] = None,
        activations: Union[List[Union[Callable, str]], Callable, str, None] = nn.ReLU,
        order: str = 'ca',
        final_activation: Union[str, nn.Module, None] = None,
        skip_connections: bool = True,
        *args,
        **kwargs
    ):
        super().__init__(
            ndim=ndim,
            in_channels=in_channels,
            out_channels=out_channels,
            nb_features=nb_features,
            padding_mode=padding_mode,
            upsample_mode=upsample_mode,
            normalizations=normalizations,
            activations=activations,
            order=order,
            final_activation=final_activation,
            skip_connections=skip_connections,
            *args,
            **kwargs
        )

    @property
    def device(self):
        return next(self.parameters()).device

    def forward(
        self,
        target_image,
        support_images=None,
        support_labels=None
    ):
        return super().forward(target_image)
