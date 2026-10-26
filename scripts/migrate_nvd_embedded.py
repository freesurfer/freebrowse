#!/usr/bin/env python3
"""Embedded (full-export) legacy .nvd -> niivue-mono NVDocumentData v9.

Companion to migrate-nvd.py, which dispatches here when a legacy document
carries embedded payloads (`is_embedded_document`). Old niivue's full export
(`NVDocument.json(true)`) base64-encodes every volume as an uncompressed NIfTI-1
file (`NVImage.toUint8Array`: little-endian header, `vox_offset` 352, voxels in
the volume's typed-array order) into `encodedImageBlobs[i]`, alongside the
display options in `imageOptionsArray[i]`.

niivue-mono's own self-contained documents keep a volume as
`volumes[i].data = {hdr, img, datatypeCode}` (packages/niivue/src/NVDocument.ts:
`NVDocumentVolumeData`, written by `extractHeaderData` + `typedArrayToBytes`,
read back by `reconstructVolume` -> `NVVolume.nii2volume(hdr, img, name)`).
This module produces exactly that shape, so a migrated document stays ONE file
and is byte-compatible with what the app writes. `hdr` mirrors the 36 fields
`extractHeaderData` copies from a nifti-reader-js `NIFTI1` header; `img` is the
raw little-endian voxel bytes (migrate-nvd.py's `to_json_safe` tags bytes as
`{"$ta": "Uint8Array", "b64": ...}`; `write_cbor` writes them as a byte string).

Not handled here, by decision (20260911-niivue-mono-migration-plan.md, Step 4):
  * `meshesString` / top-level `meshes` with geometry -> deferred until after
    Step 8 (freesurfer/freebrowse#43). URL meshes convert via transform_mesh.
  * `encodedDrawingBlob` -> never emitted by FreeBrowse 2.4.x; warned and skipped.

Stdlib only.
"""

from __future__ import annotations

import base64
import gzip
import math
import struct
import sys

NIFTI1_HEADER_SIZE = 348
NIFTI1_MAGIC = ("n+1", "ni1")

# NIfTI datatype codes niivue-mono can view as a typed array (volume/utils.ts
# toTypedView). Anything else would silently become a Uint8Array view of the raw
# bytes, so reject it here instead. Value: element size in bytes for byte-swapping.
SUPPORTED_DATATYPES = {
    2: 1,  # DT_UINT8
    4: 2,  # DT_INT16
    8: 4,  # DT_INT32
    16: 4,  # DT_FLOAT32
    64: 8,  # DT_FLOAT64 (nii2volume converts to float32 on load)
    128: 1,  # DT_RGB24
    256: 1,  # DT_INT8
    512: 2,  # DT_UINT16
    768: 4,  # DT_UINT32
    2304: 1,  # DT_RGBA32
}


def _warn(msg: str) -> None:
    print(f"migrate-nvd: warning: {msg}", file=sys.stderr)


def _finite(x: float) -> float:
    """nifti-reader-js keeps NaN/Inf header floats; the JSON codec cannot. Zero
    is what niivue's own defaults use for every one of these fields."""
    return x if math.isfinite(x) else 0.0


def _string_at(raw: bytes, start: int, end: int) -> str:
    """Mirror nifti-reader-js Utils.getStringAt: drop NUL bytes, keep the rest."""
    return "".join(chr(b) for b in raw[start:end] if b != 0)


def decode_blob(b64: str) -> bytes:
    """base64 -> bytes, transparently gunzipping a .nii.gz payload."""
    raw = base64.b64decode(b64)
    if raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    return raw


def parse_nifti1(blob: bytes) -> dict:
    """Parse a NIfTI-1 file into niivue-mono's document `hdr` + `img` bytes.

    Returns {"hdr": <36-key dict>, "img": <bytes>, "datatypeCode": int}. The
    header dict has the same keys, in the same order, as `extractHeaderData`
    in niivue-mono's NVDocument.ts; `affine` is derived exactly as
    nifti-reader-js does (dist/nifti1.js): quaternion method when
    `qform_code > 0 and sform_code < qform_code`, `srow_*` when `sform_code > 0`,
    else a diagonal of `pixDims`.
    """
    if len(blob) < NIFTI1_HEADER_SIZE:
        raise ValueError(f"blob too short for a NIfTI-1 header ({len(blob)} bytes)")

    # Byte order: sizeof_hdr must read 348 in exactly one order.
    if struct.unpack_from("<i", blob, 0)[0] == NIFTI1_HEADER_SIZE:
        e, little = "<", True
    elif struct.unpack_from(">i", blob, 0)[0] == NIFTI1_HEADER_SIZE:
        e, little = ">", False
    else:
        raise ValueError("not a NIfTI-1 file (sizeof_hdr != 348)")

    magic = _string_at(blob, 344, 348)
    if magic not in NIFTI1_MAGIC:
        raise ValueError(f"not a NIfTI-1 file (magic {magic!r})")

    u = lambda fmt, off: struct.unpack_from(e + fmt, blob, off)  # noqa: E731

    dims = list(u("8h", 40))
    pix_dims = [_finite(x) for x in u("8f", 76)]
    datatype = u("h", 70)[0]
    bitpix = u("h", 72)[0]
    qform_code = u("h", 252)[0]
    sform_code = u("h", 254)[0]
    qb, qc, qd = (_finite(x) for x in u("3f", 256))
    qx, qy, qz = (_finite(x) for x in u("3f", 268))
    srow = [[_finite(x) for x in u("4f", 280 + 16 * r)] for r in range(3)]

    # Affine, per nifti-reader-js (a 4x4 identity-bottom-row matrix; the branches
    # below are the same three it takes, in the same order).
    affine = [[0.0] * 4 for _ in range(4)]
    affine[3][3] = 1.0
    if qform_code < 1 and sform_code < 1:
        affine[0][0] = pix_dims[1]
        affine[1][1] = pix_dims[2]
        affine[2][2] = pix_dims[3]
    if qform_code > 0 and sform_code < qform_code:
        qa = math.sqrt(max(0.0, 1.0 - (qb * qb + qc * qc + qd * qd)))
        qfac = 1.0 if pix_dims[0] == 0 else pix_dims[0]
        a, b, c, d = qa, qb, qc, qd
        R = [
            [a * a + b * b - c * c - d * d, 2 * b * c - 2 * a * d, 2 * b * d + 2 * a * c],
            [2 * b * c + 2 * a * d, a * a + c * c - b * b - d * d, 2 * c * d - 2 * a * b],
            [2 * b * d - 2 * a * c, 2 * c * d + 2 * a * b, a * a + d * d - c * c - b * b],
        ]
        for r in range(3):
            for col in range(3):
                affine[r][col] = R[r][col] * pix_dims[col + 1]
                if col == 2:
                    affine[r][col] *= qfac
        affine[0][3] = qx
        affine[1][3] = qy
        affine[2][3] = qz
    elif sform_code > 0:
        for r in range(3):
            affine[r] = list(srow[r])

    hdr = {
        "littleEndian": True,  # img is emitted little-endian below, whatever the input
        "dim_info": blob[39],
        "dims": dims,
        "pixDims": pix_dims,
        "intent_p1": _finite(u("f", 56)[0]),
        "intent_p2": _finite(u("f", 60)[0]),
        "intent_p3": _finite(u("f", 64)[0]),
        "intent_code": u("h", 68)[0],
        "datatypeCode": datatype,
        "numBitsPerVoxel": bitpix,
        "slice_start": u("h", 74)[0],
        "vox_offset": _finite(u("f", 108)[0]),
        "scl_slope": _finite(u("f", 112)[0]),
        "scl_inter": _finite(u("f", 116)[0]),
        "slice_end": u("h", 120)[0],
        "slice_code": blob[122],
        "xyzt_units": blob[123],
        "cal_max": _finite(u("f", 124)[0]),
        "cal_min": _finite(u("f", 128)[0]),
        "slice_duration": _finite(u("f", 132)[0]),
        "toffset": _finite(u("f", 136)[0]),
        "description": _string_at(blob, 148, 228),
        "aux_file": _string_at(blob, 228, 252),
        "qform_code": qform_code,
        "sform_code": sform_code,
        "quatern_b": qb,
        "quatern_c": qc,
        "quatern_d": qd,
        "qoffset_x": qx,
        "qoffset_y": qy,
        "qoffset_z": qz,
        "affine": affine,
        "intent_name": _string_at(blob, 328, 344),
        "magic": magic,
    }

    if datatype not in SUPPORTED_DATATYPES:
        raise ValueError(f"unsupported NIfTI datatype code {datatype}")
    elem = SUPPORTED_DATATYPES[datatype]
    if bitpix != elem * 8 and datatype not in (128, 2304):
        raise ValueError(f"bitpix {bitpix} disagrees with datatype {datatype}")

    ndim = dims[0]
    if not 1 <= ndim <= 7:
        raise ValueError(f"invalid dim[0] = {ndim}")
    nvox = 1
    for i in range(1, ndim + 1):
        nvox *= max(dims[i], 1)
    nbytes = nvox * (bitpix // 8)
    start = int(hdr["vox_offset"])
    img = blob[start : start + nbytes]
    if len(img) != nbytes:
        raise ValueError(
            f"voxel payload is {len(img)} bytes, header implies {nbytes} "
            f"(dims {dims[: ndim + 1]}, {bitpix} bits/voxel)"
        )
    if not little and elem > 1:
        # Old niivue only ever wrote little-endian, but a hand-made big-endian
        # blob must still land as native-order bytes for the app's typed array.
        arr = bytearray(img)
        arr[:] = b"".join(
            arr[i : i + elem][::-1] for i in range(0, len(arr), elem)
        )
        img = bytes(arr)
    return {"hdr": hdr, "img": img, "datatypeCode": datatype}


def embedded_volume(image_option: dict, blob_b64: str, helpers) -> dict:
    """imageOptionsArray[i] + encodedImageBlobs[i] -> NVDocumentVolume with data."""
    vol = helpers.transform_volume(image_option)
    # The bytes travel inside the document; a stale url would make niivue's
    # linkData path try to refetch it on the next save.
    vol.pop("url", None)
    vol["data"] = parse_nifti1(decode_blob(blob_b64))
    return vol


def migrate_embedded_document(
    doc: dict,
    *,
    created: str | None = None,
    assets_dir=None,
    doc_stem: str = "doc",
    helpers=None,
) -> dict:
    """Transform an embedded legacy doc into NVDocumentData v9 (untagged).

    `helpers` is the migrate-nvd module (passed by its dispatcher, since the
    script's hyphenated filename is not importable by name); it supplies the
    skeleton, scene and URL transforms so the two paths cannot drift.
    """
    if helpers is None:
        raise TypeError("migrate_embedded_document needs helpers=<migrate-nvd module>")
    if assets_dir:
        _warn(
            f"{doc_stem}: --assets-dir is ignored; embedded volumes are migrated "
            "self-contained (volumes[i].data), not exploded to sidecars"
        )

    out = helpers.new_document_skeleton(created=created)
    out["scene"] = helpers.transform_scene(doc.get("sceneData"))

    options = doc.get("imageOptionsArray") or []
    blobs = doc.get("encodedImageBlobs") or []
    volumes = []
    for i, opt in enumerate(options):
        b64 = blobs[i] if i < len(blobs) else None
        if b64:
            volumes.append(embedded_volume(opt, b64, helpers))
        elif opt.get("url"):
            volumes.append(helpers.transform_volume(opt))
        else:
            _warn(
                f"{doc_stem}: volume {i} ({opt.get('name') or 'unnamed'}) has "
                "neither an embedded blob nor a url — dropped"
            )
    out["volumes"] = volumes

    if helpers._has_mesh_payload(doc.get("meshesString")):
        _warn(
            f"{doc_stem}: meshesString carries mesh geometry, which is not migrated "
            "(deferred until after Step 8, freesurfer/freebrowse#43)"
        )
    out["meshes"] = [helpers.transform_mesh(m) for m in doc.get("meshes", [])]

    if doc.get("encodedDrawingBlob"):
        _warn(
            f"{doc_stem}: encodedDrawingBlob present but drawing migration is not "
            "implemented; drawing dropped"
        )
    if doc.get("opts"):
        _warn(
            "legacy 'opts' block dropped (not mapped to niivue-mono config "
            "groups); viewer defaults will apply"
        )
    return out
