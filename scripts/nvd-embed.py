#!/usr/bin/env python3
"""Embed NVD data into a freebrowse HTML file for self-contained viewing.

This script has no external dependencies (standard library only) and can be
copied and distributed independently.

Example usage:
    # Basic: embed NVD into HTML
    ./nvd-embed.py freebrowse.html scan.nvd

    # Specify output file
    ./nvd-embed.py -o my-viewer.html freebrowse.html scan.nvd

    # Verbose output
    ./nvd-embed.py -v freebrowse.html scan.nvd
"""

import argparse
import json
import sys
from pathlib import Path


def create_bootstrap_script(nvd_json: str) -> str:
    """Create the JavaScript bootstrap that loads embedded NVD data."""
    return f'''<script type="application/json" id="embedded-nvd-data">
{nvd_json}
</script>
<script>
(function() {{
  // Parse embedded NVD data
  var dataElement = document.getElementById('embedded-nvd-data');
  if (!dataElement) return;

  try {{
    var nvdData = JSON.parse(dataElement.textContent);
    window.__EMBEDDED_NVD_DATA__ = nvdData;

    // Dispatch event after DOM is ready
    function dispatchLoadEvent() {{
      window.dispatchEvent(new CustomEvent('loadEmbeddedNvd', {{
        detail: nvdData
      }}));
    }}

    if (document.readyState === 'loading') {{
      document.addEventListener('DOMContentLoaded', dispatchLoadEvent);
    }} else {{
      // DOM already ready, dispatch after a short delay to let React mount
      setTimeout(dispatchLoadEvent, 100);
    }}
  }} catch (e) {{
    console.error('Failed to parse embedded NVD data:', e);
  }}
}})();
</script>'''


def embed_nvd(html_content: str, nvd_content: str) -> str:
    """Embed NVD JSON into HTML content.

    Args:
        html_content: The freebrowse HTML content
        nvd_content: The NVD JSON content

    Returns:
        Modified HTML with embedded NVD data
    """
    # Validate NVD is valid JSON
    try:
        json.loads(nvd_content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid NVD JSON: {e}")

    # Create bootstrap script with embedded data
    bootstrap = create_bootstrap_script(nvd_content)

    # Insert before the LAST </body> tag (important: there may be </body>
    # inside JS string literals in single-file builds)
    body_lower = html_content.rfind('</body>')
    body_upper = html_content.rfind('</BODY>')

    # Use whichever appears last (closest to end of file)
    insert_pos = max(body_lower, body_upper)

    if insert_pos != -1:
        return html_content[:insert_pos] + bootstrap + '\n' + html_content[insert_pos:]
    else:
        # No body tag found, append to end
        return html_content + '\n' + bootstrap


def main():
    parser = argparse.ArgumentParser(
        description="Embed NVD data into a freebrowse HTML file for self-contained viewing.",
        epilog="Example: %(prog)s freebrowse.html scan.nvd -o viewer.html"
    )
    parser.add_argument(
        "html_file",
        help="Input freebrowse HTML file"
    )
    parser.add_argument(
        "nvd_file",
        help="NVD file to embed"
    )
    parser.add_argument(
        "-o", "--output",
        help="Output HTML file (default: {nvd_stem}--{html_filename})"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Print info to stderr"
    )

    args = parser.parse_args()

    html_path = Path(args.html_file)
    nvd_path = Path(args.nvd_file)

    # Validate input files exist
    if not html_path.exists():
        print(f"Error: HTML file not found: {html_path}", file=sys.stderr)
        sys.exit(1)
    if not nvd_path.exists():
        print(f"Error: NVD file not found: {nvd_path}", file=sys.stderr)
        sys.exit(1)

    # Determine output filename
    if args.output:
        output_path = Path(args.output)
    else:
        # Default: {nvd_stem}--{html_filename}
        output_path = Path(f"{nvd_path.stem}--{html_path.name}")

    if args.verbose:
        print(f"HTML input: {html_path} ({html_path.stat().st_size:,} bytes)", file=sys.stderr)
        print(f"NVD input: {nvd_path} ({nvd_path.stat().st_size:,} bytes)", file=sys.stderr)

    # Read input files
    html_content = html_path.read_text(encoding='utf-8')
    nvd_content = nvd_path.read_text(encoding='utf-8')

    # Embed NVD into HTML
    try:
        output_content = embed_nvd(html_content, nvd_content)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    # Write output
    output_path.write_text(output_content, encoding='utf-8')

    if args.verbose:
        print(f"Output: {output_path} ({len(output_content):,} bytes)", file=sys.stderr)
    else:
        print(output_path)


if __name__ == "__main__":
    main()
