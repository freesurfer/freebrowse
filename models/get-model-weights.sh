#!/usr/bin/env bash
set -euo pipefail

MODEL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

declare -A URLS=(
  [sp3d-neurite]="https://www.dropbox.com/scl/fi/k9fl9uzd5me07b7x0axtu/sp3d-neurite-weights.pt?rlkey=pnafhvrcwrcusv1z7kbhgfjcm&st=avdu66ms&dl=1"
  [sp3d-neurite-deeper]="https://www.dropbox.com/scl/fi/ag9ddrrm6159ynz70926u/sp3d-neurite-deeper-weights.pt?rlkey=3z256nigp6r7imckzzpf0io41&st=25fwqt6r&dl=1"
  [sp3d-neurite-lesions]="https://www.dropbox.com/scl/fi/3bh744kzub5yhcgtr2sq5/sp3d-neurite-lesions-weights.pt?rlkey=08lmexqd0bi6fa3f1lgftgtmc&st=fzvnfllm&dl=1"
)

usage() {
  cat <<EOF
Usage: $(basename "$0") [all|sp3d-neurite|sp3d-neurite-deeper|sp3d-neurite-lesions]

Downloads model weights into their respective model directories.
With no argument (or "all"), downloads every model's weights.
EOF
}

download_one() {
  local name="$1"
  local url="${URLS[$name]}"
  local dest_dir="$MODEL_DIR/$name"
  local dest="$dest_dir/weights.pt"

  if [[ ! -d "$dest_dir" ]]; then
    echo "Error: destination directory does not exist: $dest_dir" >&2
    return 1
  fi

  echo "Downloading $name -> $dest"
  wget --show-progress -O "$dest" "$url"
}

main() {
  local target="${1:-all}"

  case "$target" in
    -h|--help)
      usage
      ;;
    all)
      for name in "${!URLS[@]}"; do
        download_one "$name"
      done
      ;;
    sp3d-neurite|sp3d-neurite-deeper|sp3d-neurite-lesions)
      download_one "$target"
      ;;
    *)
      echo "Error: unknown model '$target'" >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
