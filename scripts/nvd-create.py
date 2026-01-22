#!/usr/bin/env python3
"""Create standalone NiiVue documents (.nvd) with embedded imaging data.

This script has no external dependencies (standard library only) and can be
copied and distributed independently to pipeline developers.

Example usage:
    # Basic: create NVD from image files
    ./nvd-create.py -o output.nvd image1.nii.gz image2.nii.gz

    # With template (inherits scene settings, colormaps, etc.)
    ./nvd-create.py --template scene.nvd -o output.nvd image1.nii.gz

    # With title
    ./nvd-create.py --title "Subject 001" -o output.nvd T1.nii.gz seg.nii.gz

    # Output to stdout for piping
    ./nvd-create.py image.nii.gz > output.nvd
"""

import argparse
import base64
import json
import sys
from pathlib import Path


def create_nvd(image_paths, template_path=None, title=None):
    """Create an NVD document from image files.

    Args:
        image_paths: List of paths to image files to embed
        template_path: Optional path to template .nvd file to inherit settings from
        title: Optional document title

    Returns:
        dict: NVD document structure ready for JSON serialization
    """
    # Start from template or empty document
    if template_path:
        with open(template_path) as f:
            nvd = json.load(f)
    else:
        nvd = {"imageOptionsArray": [], "opts": {}}

    # Build encodedImageBlobs array
    nvd["encodedImageBlobs"] = []

    for i, image_path in enumerate(image_paths):
        # Read and encode image
        with open(image_path, "rb") as f:
            blob = base64.b64encode(f.read()).decode("ascii")
        nvd["encodedImageBlobs"].append(blob)

        # Add/update imageOptionsArray entry
        name = Path(image_path).name
        if i < len(nvd.get("imageOptionsArray", [])):
            # Template entry exists - keep settings but clear URL
            nvd["imageOptionsArray"][i]["url"] = ""
        else:
            # No template entry - use defaults
            # First image: gray base layer, subsequent: hot overlay
            if i == 0:
                colormap = "gray"
                opacity = 1
            else:
                colormap = "hot"
                opacity = 0.5

            nvd["imageOptionsArray"].append({
                "name": name,
                "colormap": colormap,
                "opacity": opacity,
                "url": ""
            })

    if title:
        nvd["title"] = title

    return nvd


def main():
    parser = argparse.ArgumentParser(
        description="Create standalone NiiVue documents (.nvd) with embedded imaging data.",
        epilog="Example: %(prog)s -o output.nvd T1.nii.gz segmentation.nii.gz"
    )
    parser.add_argument(
        "images",
        nargs="+",
        help="Image files to embed (nii, nii.gz, etc.)"
    )
    parser.add_argument(
        "-o", "--output",
        help="Output .nvd file path (default: stdout)"
    )
    parser.add_argument(
        "-t", "--template",
        help="Template .nvd file to inherit settings from"
    )
    parser.add_argument(
        "--title",
        help="Document title"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Print info to stderr"
    )

    args = parser.parse_args()

    # Validate input files exist
    for image_path in args.images:
        if not Path(image_path).exists():
            print(f"Error: Image file not found: {image_path}", file=sys.stderr)
            sys.exit(1)

    # Validate template if provided
    if args.template and not Path(args.template).exists():
        print(f"Error: Template file not found: {args.template}", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print(f"Creating NVD with {len(args.images)} image(s)...", file=sys.stderr)
        for img in args.images:
            size = Path(img).stat().st_size
            print(f"  - {img} ({size:,} bytes)", file=sys.stderr)
        if args.template:
            print(f"Using template: {args.template}", file=sys.stderr)

    # Create the NVD document
    nvd = create_nvd(args.images, args.template, args.title)

    # Output
    output_json = json.dumps(nvd, indent=2)

    if args.output:
        with open(args.output, "w") as f:
            f.write(output_json)
        if args.verbose:
            print(f"Wrote {args.output} ({len(output_json):,} bytes)", file=sys.stderr)
    else:
        print(output_json)


if __name__ == "__main__":
    main()
