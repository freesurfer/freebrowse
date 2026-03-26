from typing import List, Literal

import torch


def clip_volume(
    tensor: torch.Tensor,
    mode: Literal["percentile"],
    percentiles: List[float],
) -> torch.Tensor:
    """Clip tensor intensities to the given percentile bounds.

    Parameters
    ----------
    tensor : torch.Tensor
        Input volume tensor.
    mode : Literal["percentile"]
        Clipping mode. Only "percentile" is supported.
    percentiles : List[float]
        Lower and upper percentile bounds, e.g. [0.5, 99.5].

    Returns
    -------
    torch.Tensor
        Tensor with values clipped to [p_low, p_high].
    """
    assert mode == "percentile", f"Unsupported clip mode: {mode}"
    assert len(percentiles) == 2, "percentiles must be [low, high]"

    low, high = torch.quantile(tensor.float(), torch.tensor(percentiles) / 100.0)
    return tensor.clamp(low.item(), high.item())


def relative_norm(tensor: torch.Tensor) -> torch.Tensor:
    """Linearly rescale tensor values to [0, 1].

    Parameters
    ----------
    tensor : torch.Tensor
        Input tensor.

    Returns
    -------
    torch.Tensor
        Tensor rescaled to [0, 1].
    """
    vmin, vmax = tensor.min(), tensor.max()
    return (tensor - vmin) / (vmax - vmin)
