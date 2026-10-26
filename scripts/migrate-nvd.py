#!/usr/bin/env python3
"""Migrate legacy FreeBrowse .nvd documents to niivue-mono's NVDocumentData v9.

Migrate niivue documents from the old convention (up to @niivue/niivue-v0.69.0)
to the new convention (aka niivue-mono since niivue@1.0.0-rc.2)

The input is old niivue's OWN document format -- `DocumentData` /
`ExportDocumentData` in niivue/packages/niivue/src/nvdocument.ts (`title`,
`imageOptionsArray`, `opts`, `encodedImageBlobs`, `encodedDrawingBlob`,
`meshesString`, `sceneData`, ...) -- plus ONE FreeBrowse-specific extension: a
top-level `meshes` array carrying surfaces and their scalar-overlay layers.
Classic niivue has `meshOptionsArray` and serializes meshes into `meshesString`;
it never reads a top-level `meshes`. That extension is why niivue-mono's own
converter (packages/niivue/src/documentLegacy.ts, which reads meshes only from
`meshesString`) cannot replace this script -- it would silently drop every
surface.

Usage:
    migrate-nvd.py INPUT [INPUT ...] [-o OUTDIR] [--cbor] [-v]

INPUT may be a file, a directory (recursed for *.nvd), or a glob.

Embedded (full-export) documents -- `encodedImageBlobs` holding NIfTI bytes --
are handled by the companion module migrate_nvd_embedded.py, which emits
niivue-mono's own self-contained `volumes[i].data = {hdr, img, datatypeCode}`
so the output stays one file. Mesh geometry embedded in `meshesString` is not
migrated (deferred until after Step 8 of the migration plan; see
freesurfer/freebrowse#43).
"""

from __future__ import annotations

import argparse
import base64
import glob as globmod
import json
import math
import os
import sys
import types
from datetime import datetime, timezone

# niivue-mono's current schema (NVConstants.NVD_DOCUMENT_VERSION). v8 -> v9 was
# the sparse-settings change (niivue/mono 29f943e), not a field change, and
# `deserialize` carries no v8 -> v9 migration -- it rejects only versions NEWER
# than its own and migrates only `version <= 5`. So emitting 9 is accuracy, not
# a compatibility requirement.
DOCUMENT_VERSION = 9

# --- mesh shader index (old niivue) -> shaderType name (niivue-mono) ----------
# Old order: createDefaultMeshShaders() in niivue/.../ShaderManager.ts.
# New names: fragmentShaders keys in niivue-mono/.../gl/meshShader.ts (minus
# vertexColor). Old shaders with no niivue-mono equivalent fall back to 'phong'
# (the view layer would do the same on an unknown name; we emit a clean name).
SHADER_INDEX_TO_NAME = {
    0: "phong",
    1: "matte",
    4: "crevice",
    7: "outline",
    9: "toon",
    10: "flat",
    12: "rim",
    13: "silhouette",
    14: "crosscut",
}
# Known old indices with no direct equivalent (Harmonic/Hemispheric/Edge/
# Diffuse/Specular/Matcap) -> phong, but warn so the drift is visible.
_SHADER_FALLBACK = "phong"


def _warn(msg: str) -> None:
    print(f"migrate-nvd: warning: {msg}", file=sys.stderr)


def shader_name(index) -> str:
    """Map an old meshShaderIndex (int, or None/absent) to a shaderType name."""
    if index is None:
        return _SHADER_FALLBACK
    name = SHADER_INDEX_TO_NAME.get(index)
    if name is None:
        _warn(
            f"meshShaderIndex {index!r} has no niivue-mono equivalent; "
            f"using {_SHADER_FALLBACK!r}"
        )
        return _SHADER_FALLBACK
    return name


def _num(value):
    """Coerce a legacy numeric field to a float, DROPPING non-finite values.

    Old niivue serialized non-finite numbers as the strings 'NaN' / 'infinity' /
    '-infinity' (see encodeNumberForJSON); Python's json also parses bare `NaN` /
    `Infinity` literals into real floats. Either way niivue-mono's JSON codec has
    no representation for them (encodeDocumentJSON tags typed arrays only), so
    returning None here drops the field -- to_json_safe omits None keys, and
    `applyDocumentToModel` guards every field with `!== undefined`, leaving the
    model's own default. For calMinNeg/calMaxNeg that default IS NaN
    (NVModel.ts:1411), so omitting reproduces the legacy value exactly.

    This also keeps `json.dump(allow_nan=False)` in write_json meaningful as the
    assertion that nothing non-finite escaped the walk.

    Leaves genuine finite numbers untouched; returns other values unchanged.
    """
    if isinstance(value, str):
        s = value.strip().lower()
        if s in ("nan", "infinity", "inf", "+infinity", "+inf", "-infinity", "-inf"):
            return None
        try:
            value = float(value)
        except ValueError:
            return value
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def _canonical_colormap(name):
    """Canonicalize a colormap name to niivue-mono's stored form.

    niivue-mono keys every colormap as `name[0].toUpperCase() + name[1:]`
    (buildLutIndex / lookupColorMap / addColormap all apply this exact rule), and
    exact-case consumers — including FreeBrowse's own `<select>` colormap picker —
    match against that canonical name. Legacy FreeBrowse docs stored lowercase
    names (`gray`, `freesurfer`), which then fail to match `Gray`/`Freesurfer` and
    display as the wrong entry. Emitting the canonical case here keeps migrated
    documents portable across the niivue ecosystem. This mirrors niivue's rule
    verbatim (first char upper, remainder untouched) so it lands on the same key
    niivue derives from the lowercase LUT filenames.
    """
    if not isinstance(name, str) or not name:
        return name
    return name[0].upper() + name[1:]


# --- JSON tag walk (mirror of encodeDocumentJSON in niivue-mono) --------------
# Tag convention: niivue-mono/packages/niivue/src/documentJson.ts
#   bytes -> {"$ta": "Uint8Array", "b64": "..."}
# That is the ONLY tag it defines. Non-finite numbers have no encoding (they
# would become bare `null`), so `_num` drops those fields upstream of this
# walk rather than inventing a tag niivue could not read. See niivue/mono
# issue 8a in 20260911-niivue-mono-migration-plan.md.
def to_json_safe(value):
    """Return a JSON-safe copy: bytes become $ta-tagged dicts."""
    if isinstance(value, (bytes, bytearray, memoryview)):
        return {
            "$ta": "Uint8Array",
            "b64": base64.b64encode(bytes(value)).decode("ascii"),
        }
    if isinstance(value, dict):
        out = {}
        for k, v in value.items():
            if v is None:
                # Drop null the way JSON.stringify drops undefined, keeping the
                # tree canonical. (Legacy fields we don't set are simply absent.)
                continue
            out[k] = to_json_safe(v)
        return out
    if isinstance(value, (list, tuple)):
        return [to_json_safe(v) for v in value]
    return value


# --- v8 skeleton (defaults sourced from niivue-mono/.../NVConstants.ts) --------
# These mirror LAYOUT/UI/VOLUME/MESH/DRAW/INTERACTION_DEFAULTS and the model
# scene defaults. Included so the migrated document is self-descriptive and
# round-trips identically to an app-saved one; niivue-mono would otherwise fill
# the same values from its own defaults on load.
def _scene_defaults():
    return {
        "azimuth": 110,
        "elevation": 10,
        "scaleMultiplier": 1.0,
        "gamma": 1.0,
        "crosshairPos": [0.5, 0.5, 0.5],
        "pan2Dxyzmm": [0, 0, 0, 1],
        "backgroundColor": [0, 0, 0, 1],
        "clipPlaneColor": [0.7, 0, 0.7, 0.4],
        "isClipPlaneCutaway": False,
    }


def _vector(value, n):
    """A legacy vec3/vec4 as a list of n finite numbers, or None.

    Old niivue serialized gl-matrix vectors with JSON.stringify, which turns a
    Float32Array into an OBJECT keyed "0".."n-1" (`{"0": 0.5, "1": 0.5, ...}`),
    so both that and a plain array are accepted.
    """
    if isinstance(value, dict):
        try:
            value = [value[str(i)] for i in range(n)]
        except KeyError:
            return None
    if not isinstance(value, (list, tuple)) or len(value) != n:
        return None
    nums = [_num(x) for x in value]
    if not all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in nums):
        return None
    return nums


def transform_scene(scene_data) -> dict:
    """Legacy `sceneData` -> v9 `scene`, overlaid on the defaults.

    Old niivue's `sceneData` (SceneData in nvdocument.ts) and niivue-mono's
    `scene` share the camera/crosshair fields under slightly different names:
    `volScaleMultiplier` became `scaleMultiplier`; the rest are unchanged. Old
    `clipPlanes` / `clipPlaneDepthAziElevs` are per-plane 4-vectors, while v9
    `clipPlanes` is a flat number list with different semantics, so they are
    not carried over (warned only when non-empty). Documents without
    `sceneData` -- the whole URL corpus -- get the defaults, as before.
    """
    scene = _scene_defaults()
    if not isinstance(scene_data, dict):
        return scene
    for old_key, new_key in (
        ("azimuth", "azimuth"),
        ("elevation", "elevation"),
        ("gamma", "gamma"),
        ("volScaleMultiplier", "scaleMultiplier"),
    ):
        if old_key in scene_data:
            v = _num(scene_data[old_key])
            if v is not None:
                scene[new_key] = v
    for key, n in (("crosshairPos", 3), ("pan2Dxyzmm", 4)):
        nums = _vector(scene_data.get(key), n)
        if nums is not None:
            scene[key] = nums
    for key in ("clipPlanes", "clipPlaneDepthAziElevs"):
        v = scene_data.get(key)
        if isinstance(v, list) and any(
            isinstance(p, list) and any(x for x in p) for p in v
        ):
            _warn(f"legacy sceneData.{key} not carried over (v9 clip planes differ)")
            break
    return scene


def new_document_skeleton(created: str | None = None):
    """A minimal, valid, empty NVDocumentData v9 (no volumes/meshes yet).

    Only the fields niivue-mono's `deserialize` / `applyDocumentToModel` actually
    require are emitted, keeping migrated docs close to the terse originals:
      * `version`     — validated (must be a number <= 9).
      * `scene`       — required, and every field is read individually (the color
                        arrays are spread), so it must be COMPLETE.
      * `layout`      — required only to be present/truthy; applied via
                        `Object.assign`, so `{}` keeps the model's own defaults.
      * `clipPlanes`  — iterated (`doc.clipPlanes.length`), so must exist.
      * `volumes` / `meshes` — iterated by loadDocument, so must be arrays.
    The `ui` / `volume` / `mesh` / `draw` / `interaction` groups are applied via
    `Object.assign(model.X, doc.X)`, which ignores a missing source — so we omit
    them entirely and the viewer falls back to its built-in defaults (identical
    result, far smaller file). `created` is not read by niivue but is cheap,
    conventional provenance, so we keep it.
    """
    return {
        "version": DOCUMENT_VERSION,
        "created": created or datetime.now(timezone.utc).isoformat(),
        "scene": _scene_defaults(),
        "layout": {},
        "clipPlanes": [],
        "volumes": [],
        "meshes": [],
    }


# --- URL-referencing transform ------------------------------------------------
def transform_volume(old: dict) -> dict:
    """imageOptionsArray[] entry -> NVDocumentVolume (URL-referenced)."""
    vol: dict = {}
    if old.get("url"):
        vol["url"] = old["url"]
    if old.get("name"):
        vol["name"] = old["name"]
    if old.get("colormap"):
        vol["colormap"] = _canonical_colormap(old["colormap"])
    if old.get("colormapNegative"):
        vol["colormapNegative"] = _canonical_colormap(old["colormapNegative"])
    # A legacy `visible` key is ignored on purpose: old niivue never had it on
    # volume options and old FreeBrowse only read it on meshes, so it was a
    # no-op there. Mapping it to opacity 0 hid both volumes of the
    # `mgz-surf-eg` demo (the one corpus file that carries it).
    vol["opacity"] = _num(old.get("opacity", 1.0))
    if "cal_min" in old:
        vol["calMin"] = _num(old["cal_min"])
    if "cal_max" in old:
        vol["calMax"] = _num(old["cal_max"])
    if "cal_minNeg" in old:
        vol["calMinNeg"] = _num(old["cal_minNeg"])
    if "cal_maxNeg" in old:
        vol["calMaxNeg"] = _num(old["cal_maxNeg"])
    return vol


def transform_layer(old: dict) -> dict:
    """meshes[].layers[] entry -> NVDocumentMeshLayer (URL-referenced)."""
    layer: dict = {}
    if old.get("url"):
        layer["url"] = old["url"]
    if old.get("name"):
        layer["name"] = old["name"]
    if old.get("colormap"):
        layer["colormap"] = _canonical_colormap(old["colormap"])
    if "cal_min" in old:
        layer["calMin"] = _num(old["cal_min"])
    if "cal_max" in old:
        layer["calMax"] = _num(old["cal_max"])
    if "opacity" in old:
        layer["opacity"] = _num(old["opacity"])
    # Old boolean flag -> a negative colormap name. FreeBrowse used 'winter'
    # (canonical 'Winter' so the picker matches).
    if old.get("useNegativeCmap"):
        layer["colormapNegative"] = "Winter"
    return layer


def transform_mesh(old: dict) -> dict:
    """meshes[] entry -> NVDocumentMesh (URL-referenced)."""
    mesh: dict = {}
    if old.get("url"):
        mesh["url"] = old["url"]
    if old.get("name"):
        mesh["name"] = old["name"]
    if "opacity" in old:
        mesh["opacity"] = _num(old["opacity"])
    rgba = old.get("rgba255")
    if rgba:
        mesh["color"] = [c / 255 for c in rgba]
    mesh["shaderType"] = shader_name(old.get("meshShaderIndex"))
    layers = old.get("layers")
    if layers:
        mesh["layers"] = [transform_layer(l) for l in layers]
    return mesh


def _contains_object(node) -> bool:
    """True if a parsed JSON tree contains a dict anywhere."""
    if isinstance(node, dict):
        return True
    if isinstance(node, list):
        return any(_contains_object(x) for x in node)
    return False


def _has_mesh_payload(meshes_string) -> bool:
    """True if `meshesString` carries real serialized mesh geometry.

    Old niivue's ExportDocumentData declares `meshesString` as REQUIRED, so its
    serializer emits the key even with no meshes — presence proves nothing. The
    corpus's only example is `'[[1,[]]]'`, a degenerate empty list that must not
    be treated as payload.

    A real entry is an OBJECT (both this script's transform_mesh and niivue-mono's
    own documentLegacy.ts read `m.url` / `m.name` off dicts), so "contains a dict"
    is the test. An unparseable string is treated as payload — better to route it
    to the 5d path for attention than to silently drop meshes.
    """
    if not isinstance(meshes_string, str) or len(meshes_string.strip()) <= 2:
        return False
    try:
        return _contains_object(json.loads(meshes_string))
    except ValueError:
        return True


def is_already_migrated(doc: dict) -> bool:
    """True if this is already a niivue-mono document rather than a legacy one.

    A niivue-mono document always carries a numeric `version` (NVDocument's
    `deserialize` rejects anything else outright with "Invalid NVD file: missing
    version"); old niivue's DocumentData / ExportDocumentData has no such field.
    Verified against the corpus: 0 of 261 legacy documents carry a numeric
    `version`.

    Re-migrating one is silently destructive — there is no `imageOptionsArray` to
    read, so it emits a structurally valid document with zero volumes and zero
    meshes, discarding the scene.
    """
    v = doc.get("version")
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def is_embedded_document(doc: dict) -> bool:
    """True if the doc carries embedded binary payloads (full-export shape).

    Tests VALUES, not key presence: a document saved by old niivue's full export
    always carries `encodedImageBlobs` / `meshesString` / `previewImageDataURL`,
    empty or not, because the type declares them required. Keying off presence
    misclassified every such document as embedded — including URL-only documents
    that convert perfectly well.
    """
    if any(bool(b) for b in doc.get("encodedImageBlobs") or []):
        return True
    if doc.get("encodedDrawingBlob"):
        return True
    return _has_mesh_payload(doc.get("meshesString"))


def migrate_url_document(doc: dict, *, created: str | None = None) -> dict:
    """Transform a URL-referencing legacy doc into NVDocumentData v8 (untagged)."""
    out = new_document_skeleton(created=created)
    out["scene"] = transform_scene(doc.get("sceneData"))
    out["volumes"] = [transform_volume(v) for v in doc.get("imageOptionsArray", [])]
    out["meshes"] = [transform_mesh(m) for m in doc.get("meshes", [])]
    if doc.get("opts"):
        # The handful of {imageOptionsArray, opts, title} docs. Mapping old flat
        # opts onto the new config groups is best-effort and none of the required
        # surface docs need it; drop with a warning (model defaults apply).
        _warn(
            "legacy 'opts' block dropped (not mapped to niivue-mono config "
            "groups); viewer defaults will apply"
        )
    return out


def migrate_document(doc: dict, *, created: str | None = None, assets_dir=None,
                     doc_stem: str = "doc") -> dict:
    """Dispatch a legacy doc (URL or embedded) to NVDocumentData v8 (untagged)."""
    if is_embedded_document(doc):
        # Embedded/full-export path lives in the companion module. It gets THIS
        # module as `helpers` (the hyphenated script name is not importable), so
        # both paths share one skeleton / scene / volume / mesh transform.
        import migrate_nvd_embedded

        return migrate_nvd_embedded.migrate_embedded_document(
            doc,
            created=created,
            assets_dir=assets_dir,
            doc_stem=doc_stem,
            helpers=sys.modules.get(__name__) or types.SimpleNamespace(**globals()),
        )
    return migrate_url_document(doc, created=created)


# --- output -------------------------------------------------------------------
def write_json(doc_v8: dict, out_path: str) -> None:
    """Write the tagged JSON form (loadable by FreeBrowse)."""
    tagged = to_json_safe(doc_v8)
    with open(out_path, "w") as f:
        json.dump(tagged, f, indent=2, allow_nan=False)


def write_cbor(doc_v8: dict, out_path: str) -> None:
    """Write the binary CBOR form (loadable by vanilla niivue-mono / ipyniivue)."""
    try:
        import cbor2  # optional dependency, only needed for --cbor
    except ImportError:
        raise SystemExit(
            "migrate-nvd: --cbor requires the 'cbor2' package (pip install cbor2)"
        )
    # cbor2 encodes NaN/Infinity and byte strings natively, wire-compatible with
    # niivue-mono's cbor-x decoder.
    with open(out_path, "wb") as f:
        f.write(cbor2.dumps(doc_v8))


# --- CLI ----------------------------------------------------------------------
def _collect_inputs(inputs):
    """Expand files, directories (recursive *.nvd), and globs into a file list."""
    files = []
    for item in inputs:
        if os.path.isdir(item):
            for root, _dirs, names in os.walk(item):
                for name in names:
                    if name.lower().endswith(".nvd"):
                        files.append(os.path.join(root, name))
        elif os.path.isfile(item):
            files.append(item)
        else:
            expanded = globmod.glob(item, recursive=True)
            if not expanded:
                _warn(f"no such file/dir/glob: {item}")
            files.extend(expanded)
    return files


def _output_path(in_path, outdir, as_cbor):
    stem = os.path.splitext(os.path.basename(in_path))[0]
    if outdir:
        os.makedirs(outdir, exist_ok=True)
        return os.path.join(outdir, stem + ".nvd")
    # Non-destructive default: alongside the input, tagged with the document
    # version it was migrated TO (`foo.nvd` -> `foo.v9.nvd`), so the tag moves
    # with DOCUMENT_VERSION and a later re-migration is distinguishable.
    d = os.path.dirname(in_path)
    return os.path.join(d, f"{stem}.v{DOCUMENT_VERSION}.nvd")


def main(argv=None):
    p = argparse.ArgumentParser(description="Migrate legacy FreeBrowse .nvd -> niivue-mono v8")
    p.add_argument("inputs", nargs="+", help="file(s), dir(s) (recursed), or glob(s)")
    p.add_argument("-o", "--outdir", help=f"write outputs here (default: alongside input as <stem>.v{DOCUMENT_VERSION}.nvd)")
    p.add_argument("--cbor", action="store_true", help="emit binary CBOR instead of JSON (needs cbor2)")
    p.add_argument("--assets-dir", help="ignored (embedded volumes are migrated self-contained); kept for old invocations")
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args(argv)

    files = _collect_inputs(args.inputs)
    if not files:
        _warn("no input files")
        return 1

    errors = 0
    skipped = 0
    for in_path in files:
        try:
            with open(in_path) as f:
                doc = json.load(f)
            if isinstance(doc, dict) and is_already_migrated(doc):
                # Not an error: a mixed directory legitimately contains both.
                _warn(
                    f"{in_path}: already niivue-mono format "
                    f"(version {doc.get('version')}) — skipped"
                )
                skipped += 1
                continue
            stem = os.path.splitext(os.path.basename(in_path))[0]
            doc_v8 = migrate_document(
                doc, assets_dir=args.assets_dir, doc_stem=stem
            )
            out_path = _output_path(in_path, args.outdir, args.cbor)
            if args.cbor:
                write_cbor(doc_v8, out_path)
            else:
                write_json(doc_v8, out_path)
            if args.verbose:
                vols = doc_v8.get("volumes", [])
                ne = sum(1 for v in vols if "data" in v)
                nm = len(doc_v8.get("meshes", []))
                print(
                    f"{in_path} -> {out_path}  "
                    f"({len(vols)} volumes [{ne} embedded], {nm} meshes)"
                )
        except Exception as e:  # noqa: BLE001 - report and continue the batch
            _warn(f"{in_path}: {e}")
            errors += 1

    if skipped:
        _warn(f"{skipped} file(s) already migrated, skipped")
    if errors:
        _warn(f"{errors} file(s) failed")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
