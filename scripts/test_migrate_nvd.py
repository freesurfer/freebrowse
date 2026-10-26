"""pytest for scripts/migrate-nvd.py and scripts/migrate_nvd_embedded.py.

Run:  python3 -m pytest scripts/

Fixtures are tiny synthetic NIfTI-1 files built in memory, so nothing here
depends on the 45 MB documents in 20260914-freebrowse-embedded-nvd/.
"""

from __future__ import annotations

import base64
import gzip
import importlib.util
import json
import math
import os
import struct
import sys

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))


def _load(name, filename):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, filename))
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod  # so `import migrate_nvd_embedded` inside the script resolves
    spec.loader.exec_module(mod)
    return mod


migrate_nvd = _load("migrate_nvd", "migrate-nvd.py")
embedded = _load("migrate_nvd_embedded", "migrate_nvd_embedded.py")

HDR_KEYS = [
    "littleEndian", "dim_info", "dims", "pixDims", "intent_p1", "intent_p2",
    "intent_p3", "intent_code", "datatypeCode", "numBitsPerVoxel", "slice_start",
    "vox_offset", "scl_slope", "scl_inter", "slice_end", "slice_code",
    "xyzt_units", "cal_max", "cal_min", "slice_duration", "toffset",
    "description", "aux_file", "qform_code", "sform_code", "quatern_b",
    "quatern_c", "quatern_d", "qoffset_x", "qoffset_y", "qoffset_z", "affine",
    "intent_name", "magic",
]

DIMS = (4, 3, 2)
SROW = [[2.0, 0.0, 0.0, -10.0], [0.0, 3.0, 0.0, -20.0], [0.0, 0.0, 4.0, -30.0]]


def make_nifti(
    *,
    little=True,
    datatype=2,
    sform_code=1,
    qform_code=0,
    quatern=(0.0, 0.0, 0.0),
    qoffset=(0.0, 0.0, 0.0),
    pixdim=(1.0, 2.0, 3.0, 4.0),
    voxels=None,
    scl_slope=float("nan"),
    description="synthetic",
):
    e = "<" if little else ">"
    bitpix = {2: 8, 4: 16, 16: 32}[datatype]
    nvox = DIMS[0] * DIMS[1] * DIMS[2]
    if voxels is None:
        voxels = list(range(nvox))
    fmt = {2: "B", 4: "h", 16: "f"}[datatype]
    img = struct.pack(e + f"{nvox}{fmt}", *voxels)

    h = bytearray(348)
    struct.pack_into(e + "i", h, 0, 348)
    h[39] = 0
    struct.pack_into(e + "8h", h, 40, 3, *DIMS, 1, 1, 1, 1)
    struct.pack_into(e + "3f", h, 56, 0.0, 0.0, 0.0)
    struct.pack_into(e + "h", h, 68, 0)
    struct.pack_into(e + "h", h, 70, datatype)
    struct.pack_into(e + "h", h, 72, bitpix)
    struct.pack_into(e + "8f", h, 76, *pixdim, 1.0, 0.0, 0.0, 0.0)
    struct.pack_into(e + "f", h, 108, 352.0)
    struct.pack_into(e + "f", h, 112, scl_slope)
    struct.pack_into(e + "f", h, 116, 0.0)
    h[123] = 10  # xyzt_units mm + sec
    struct.pack_into(e + "f", h, 124, 0.0)
    struct.pack_into(e + "f", h, 128, 0.0)
    h[148 : 148 + len(description)] = description.encode()
    struct.pack_into(e + "h", h, 252, qform_code)
    struct.pack_into(e + "h", h, 254, sform_code)
    struct.pack_into(e + "3f", h, 256, *quatern)
    struct.pack_into(e + "3f", h, 268, *qoffset)
    for r in range(3):
        struct.pack_into(e + "4f", h, 280 + 16 * r, *SROW[r])
    h[344:348] = b"n+1\x00"
    return bytes(h) + bytes(4) + img, voxels


def legacy_doc(blob, name="orig.nii", **extra):
    opt = {
        "name": name,
        "url": "",
        "imageType": 1,
        "colormap": "freesurfer",
        "opacity": 0.7,
        "cal_min": 0,
        "cal_max": 255,
    }
    doc = {
        "title": "t",
        "imageOptionsArray": [opt],
        "encodedImageBlobs": [base64.b64encode(blob).decode()],
        "encodedDrawingBlob": "",
        "meshesString": "",
        "previewImageDataURL": "",
        "sceneData": {
            "azimuth": 42,
            "elevation": -7,
            "gamma": 1.5,
            "volScaleMultiplier": 2.5,
            "crosshairPos": [0.1, 0.2, 0.3],
            "pan2Dxyzmm": [1, 2, 3, 4],
            "clipPlanes": [[0, 0, 0, 0]],
        },
    }
    doc.update(extra)
    return doc


# --- parse_nifti1 --------------------------------------------------------------


def test_header_keys_match_extractHeaderData_exactly():
    blob, _ = make_nifti()
    out = embedded.parse_nifti1(blob)
    assert list(out["hdr"].keys()) == HDR_KEYS
    assert set(out) == {"hdr", "img", "datatypeCode"}


def test_little_endian_uint8_roundtrip():
    blob, voxels = make_nifti()
    out = embedded.parse_nifti1(blob)
    hdr = out["hdr"]
    assert hdr["dims"] == [3, 4, 3, 2, 1, 1, 1, 1]
    assert hdr["pixDims"][:4] == [1.0, 2.0, 3.0, 4.0]
    assert hdr["datatypeCode"] == 2 and hdr["numBitsPerVoxel"] == 8
    assert hdr["vox_offset"] == 352.0
    assert hdr["magic"] == "n+1"
    assert hdr["description"] == "synthetic"
    assert hdr["xyzt_units"] == 10
    assert hdr["littleEndian"] is True
    assert out["img"] == bytes(voxels)
    assert out["datatypeCode"] == 2


def test_sform_affine_is_the_srow_rows():
    blob, _ = make_nifti(sform_code=1)
    aff = embedded.parse_nifti1(blob)["hdr"]["affine"]
    assert aff[:3] == SROW
    assert aff[3] == [0.0, 0.0, 0.0, 1.0]


def test_qform_only_affine_uses_quaternion_method():
    # b=c=0, d=1 -> 180 degrees about z: R = diag(-1, -1, 1)
    blob, _ = make_nifti(sform_code=0, qform_code=1, quatern=(0.0, 0.0, 1.0),
                         qoffset=(5.0, 6.0, 7.0), pixdim=(1.0, 2.0, 3.0, 4.0))
    aff = embedded.parse_nifti1(blob)["hdr"]["affine"]
    assert [round(x, 6) for x in aff[0]] == [-2.0, 0.0, 0.0, 5.0]
    assert [round(x, 6) for x in aff[1]] == [0.0, -3.0, 0.0, 6.0]
    assert [round(x, 6) for x in aff[2]] == [0.0, 0.0, 4.0, 7.0]


def test_qform_wins_over_lower_sform_code():
    blob, _ = make_nifti(sform_code=1, qform_code=2, quatern=(0.0, 0.0, 0.0))
    aff = embedded.parse_nifti1(blob)["hdr"]["affine"]
    assert aff[0][:3] == [2.0, 0.0, 0.0]  # identity rotation * pixdim, not SROW


def test_no_form_codes_gives_pixdim_diagonal():
    blob, _ = make_nifti(sform_code=0, qform_code=0)
    aff = embedded.parse_nifti1(blob)["hdr"]["affine"]
    assert aff == [[2.0, 0, 0, 0], [0, 3.0, 0, 0], [0, 0, 4.0, 0], [0, 0, 0, 1.0]]


def test_big_endian_int16_is_swapped_to_native():
    voxels = [-3, 7, 300] * 8
    blob, _ = make_nifti(little=False, datatype=4, voxels=voxels)
    out = embedded.parse_nifti1(blob)
    assert out["hdr"]["littleEndian"] is True
    assert out["hdr"]["datatypeCode"] == 4
    assert struct.unpack("<24h", out["img"]) == tuple(voxels)
    assert out["hdr"]["affine"][:3] == SROW


def test_non_finite_header_floats_become_zero():
    blob, _ = make_nifti(scl_slope=float("nan"))
    hdr = embedded.parse_nifti1(blob)["hdr"]
    assert hdr["scl_slope"] == 0.0
    assert all(math.isfinite(v) for v in (hdr["scl_slope"], hdr["scl_inter"], hdr["toffset"]))


def test_gzip_wrapped_blob_decodes():
    blob, voxels = make_nifti()
    b64 = base64.b64encode(gzip.compress(blob)).decode()
    out = embedded.parse_nifti1(embedded.decode_blob(b64))
    assert out["img"] == bytes(voxels)


def test_bad_magic_is_rejected():
    blob, _ = make_nifti()
    bad = bytearray(blob)
    bad[344:348] = b"xyz\x00"
    with pytest.raises(ValueError, match="magic"):
        embedded.parse_nifti1(bytes(bad))


def test_not_nifti_is_rejected():
    with pytest.raises(ValueError, match="sizeof_hdr"):
        embedded.parse_nifti1(b"\x00" * 400)


def test_truncated_payload_is_rejected():
    blob, _ = make_nifti()
    with pytest.raises(ValueError, match="voxel payload"):
        embedded.parse_nifti1(blob[:-5])


# --- document-level ------------------------------------------------------------


def test_embedded_document_dispatch_and_shape():
    blob, voxels = make_nifti()
    doc = legacy_doc(blob)
    assert migrate_nvd.is_embedded_document(doc)
    out = migrate_nvd.migrate_document(doc, doc_stem="eg")
    assert out["version"] == migrate_nvd.DOCUMENT_VERSION
    assert len(out["volumes"]) == 1
    vol = out["volumes"][0]
    assert "url" not in vol
    assert vol["name"] == "orig.nii"
    assert vol["colormap"] == "Freesurfer"
    assert vol["opacity"] == 0.7
    assert vol["calMin"] == 0 and vol["calMax"] == 255
    assert vol["data"]["img"] == bytes(voxels)
    assert vol["data"]["datatypeCode"] == 2
    assert out["meshes"] == []


def test_scene_is_carried_over_from_sceneData():
    blob, _ = make_nifti()
    out = migrate_nvd.migrate_document(legacy_doc(blob), doc_stem="eg")
    scene = out["scene"]
    assert scene["azimuth"] == 42 and scene["elevation"] == -7
    assert scene["gamma"] == 1.5 and scene["scaleMultiplier"] == 2.5
    assert scene["crosshairPos"] == [0.1, 0.2, 0.3]
    assert scene["pan2Dxyzmm"] == [1, 2, 3, 4]
    assert "clipPlanes" not in scene  # not a v9 scene field
    assert scene["backgroundColor"] == [0, 0, 0, 1]  # default kept


def test_transform_scene_defaults_and_non_finite():
    d = migrate_nvd.transform_scene(None)
    assert d == migrate_nvd._scene_defaults()
    s = migrate_nvd.transform_scene({"azimuth": "nan", "crosshairPos": [0.5, "inf", 0.5]})
    assert s["azimuth"] == 110  # non-finite dropped -> default
    assert s["crosshairPos"] == [0.5, 0.5, 0.5]  # malformed -> default


def test_vectors_serialized_as_objects_are_accepted():
    # Old niivue JSON.stringify'd Float32Array vectors into {"0":..,"1":..}.
    s = migrate_nvd.transform_scene({
        "crosshairPos": {"0": 0.5, "1": 0.4372, "2": 0.4193},
        "pan2Dxyzmm": {"0": 1, "1": 2, "2": 3, "3": 4},
    })
    assert s["crosshairPos"] == [0.5, 0.4372, 0.4193]
    assert s["pan2Dxyzmm"] == [1, 2, 3, 4]
    assert migrate_nvd.transform_scene({"crosshairPos": {"0": 1, "2": 3}})["crosshairPos"] == [0.5, 0.5, 0.5]


def test_url_document_also_carries_scene():
    doc = {"imageOptionsArray": [{"url": "https://x/y.nii.gz", "name": "y.nii.gz"}],
           "sceneData": {"crosshairPos": [0.9, 0.8, 0.7]}}
    out = migrate_nvd.migrate_document(doc)
    assert out["scene"]["crosshairPos"] == [0.9, 0.8, 0.7]
    assert out["volumes"][0]["url"] == "https://x/y.nii.gz"


def test_json_output_tags_bytes_and_has_no_non_finite_text():
    blob, voxels = make_nifti()
    out = migrate_nvd.migrate_document(legacy_doc(blob), doc_stem="eg")
    tagged = migrate_nvd.to_json_safe(out)
    text = json.dumps(tagged, allow_nan=False)
    img = tagged["volumes"][0]["data"]["img"]
    assert img["$ta"] == "Uint8Array"
    assert base64.b64decode(img["b64"]) == bytes(voxels)
    assert "NaN" not in text and "Infinity" not in text
    # hdr is plain JSON (no tags), as extractHeaderData writes it
    assert tagged["volumes"][0]["data"]["hdr"]["dims"] == [3, 4, 3, 2, 1, 1, 1, 1]


def test_blobless_entry_with_url_stays_linked_and_without_is_dropped(capsys):
    blob, _ = make_nifti()
    doc = legacy_doc(blob)
    doc["imageOptionsArray"].append({"name": "linked.nii.gz", "url": "https://x/l.nii.gz"})
    doc["imageOptionsArray"].append({"name": "orphan.nii", "url": ""})
    doc["encodedImageBlobs"] += ["", ""]
    out = migrate_nvd.migrate_document(doc, doc_stem="eg")
    assert [v.get("url") for v in out["volumes"]] == [None, "https://x/l.nii.gz"]
    assert "orphan.nii" in capsys.readouterr().err


def test_drawing_blob_and_mesh_payload_warn_but_do_not_fail(capsys):
    blob, _ = make_nifti()
    doc = legacy_doc(blob, encodedDrawingBlob="AAAA",
                     meshesString=json.dumps([{"url": "https://x/lh.pial"}]))
    out = migrate_nvd.migrate_document(doc, doc_stem="eg")
    err = capsys.readouterr().err
    assert len(out["volumes"]) == 1
    assert "drawing" in err and "freebrowse#43" in err


def test_assets_dir_is_ignored_with_warning(capsys):
    blob, _ = make_nifti()
    out = migrate_nvd.migrate_document(legacy_doc(blob), assets_dir="/tmp/x", doc_stem="eg")
    assert "data" in out["volumes"][0]
    assert "assets-dir is ignored" in capsys.readouterr().err


# --- output naming -------------------------------------------------------------


def test_default_output_is_tagged_with_target_version():
    v = migrate_nvd.DOCUMENT_VERSION
    assert migrate_nvd._output_path("/a/b/scene.nvd", None, False) == f"/a/b/scene.v{v}.nvd"
    assert migrate_nvd._output_path("/a/b/scene.nvd", None, True) == f"/a/b/scene.v{v}.nvd"


def test_outdir_output_keeps_the_stem(tmp_path):
    out = migrate_nvd._output_path("/a/b/scene.nvd", str(tmp_path), False)
    assert out == str(tmp_path / "scene.nvd")


# --- URL-path transforms -------------------------------------------------------


def test_transform_volume_remaps_fields_and_ignores_visible():
    vol = migrate_nvd.transform_volume({
        "url": "https://x/aseg.mgz", "name": "aseg.mgz", "colormap": "freesurfer",
        "colormapNegative": "winter", "opacity": 0.7, "visible": False,
        "cal_min": 0, "cal_max": 255, "cal_minNeg": "nan", "cal_maxNeg": -1.5,
    })
    assert vol["url"] == "https://x/aseg.mgz" and vol["name"] == "aseg.mgz"
    assert vol["colormap"] == "Freesurfer" and vol["colormapNegative"] == "Winter"
    assert vol["opacity"] == 0.7  # `visible: false` must NOT zero it (mgz-surf-eg regression)
    assert vol["calMin"] == 0 and vol["calMax"] == 255 and vol["calMaxNeg"] == -1.5
    assert vol["calMinNeg"] is None  # dropped by to_json_safe
    assert "visible" not in vol


def test_transform_volume_defaults_opacity_and_omits_absent_fields():
    vol = migrate_nvd.transform_volume({"url": "https://x/t1.nii.gz"})
    assert vol == {"url": "https://x/t1.nii.gz", "opacity": 1.0}


def test_transform_layer_negative_cmap_and_ranges():
    layer = migrate_nvd.transform_layer({
        "url": "https://x/lh.curv", "name": "lh.curv", "colormap": "nih",
        "cal_min": -0.75, "cal_max": 0.75, "opacity": 1, "useNegativeCmap": True,
    })
    assert layer == {
        "url": "https://x/lh.curv", "name": "lh.curv", "colormap": "Nih",
        "calMin": -0.75, "calMax": 0.75, "opacity": 1, "colormapNegative": "Winter",
    }
    assert "colormapNegative" not in migrate_nvd.transform_layer({"url": "u", "useNegativeCmap": False})


def test_transform_mesh_color_shader_and_layers():
    mesh = migrate_nvd.transform_mesh({
        "url": "https://x/lh.white", "name": "lh.white", "rgba255": [255, 255, 0, 255],
        "meshShaderIndex": 14, "opacity": 0.5,
        "layers": [{"url": "https://x/lh.curv", "cal_min": -1, "cal_max": 1}],
    })
    assert mesh["color"] == [1.0, 1.0, 0.0, 1.0]
    assert mesh["shaderType"] == "crosscut"
    assert mesh["opacity"] == 0.5
    assert mesh["layers"] == [{"url": "https://x/lh.curv", "calMin": -1, "calMax": 1}]


@pytest.mark.parametrize("index,name", [(0, "phong"), (1, "matte"), (14, "crosscut"), (None, "phong")])
def test_shader_table(index, name, capsys):
    assert migrate_nvd.shader_name(index) == name
    assert "no niivue-mono equivalent" not in capsys.readouterr().err


def test_unmapped_shader_index_falls_back_to_phong_with_warning(capsys):
    assert migrate_nvd.shader_name(99) == "phong"
    assert "meshShaderIndex 99" in capsys.readouterr().err


@pytest.mark.parametrize("raw,canon", [
    ("gray", "Gray"), ("freesurfer", "Freesurfer"), ("roi_i256", "Roi_i256"),
    ("Gray", "Gray"), ("", ""), (None, None),
])
def test_canonical_colormap(raw, canon):
    assert migrate_nvd._canonical_colormap(raw) == canon


@pytest.mark.parametrize("value,expected", [
    ("nan", None), ("NaN", None), ("-infinity", None), ("inf", None), ("+Infinity", None),
    (float("nan"), None), (float("-inf"), None),
    ("1.5", 1.5), (2, 2), (0.0, 0.0), ("not-a-number", "not-a-number"), (None, None),
])
def test_num_drops_non_finite_and_coerces_numeric_strings(value, expected):
    out = migrate_nvd._num(value)
    assert out == expected and type(out) is type(expected)


# --- classifiers ---------------------------------------------------------------


def test_is_embedded_document_tests_values_not_key_presence():
    empty_full_export = {"encodedImageBlobs": [], "encodedDrawingBlob": "",
                         "meshesString": "[[1,[]]]", "previewImageDataURL": "",
                         "imageOptionsArray": [{"url": "https://x/a.nii.gz"}]}
    assert migrate_nvd.is_embedded_document(empty_full_export) is False
    assert migrate_nvd.is_embedded_document({"encodedImageBlobs": ["", "AAAA"]}) is True
    assert migrate_nvd.is_embedded_document({"encodedDrawingBlob": "AAAA"}) is True
    assert migrate_nvd.is_embedded_document({"meshesString": json.dumps([{"url": "u"}])}) is True
    assert migrate_nvd.is_embedded_document({"meshesString": "{not json"}) is True  # routed for attention
    assert migrate_nvd.is_embedded_document({"imageOptionsArray": []}) is False


@pytest.mark.parametrize("doc,expected", [
    ({"version": 9}, True), ({"version": 8.0}, True), ({"version": "9"}, False),
    ({"version": True}, False), ({"imageOptionsArray": []}, False),
])
def test_is_already_migrated(doc, expected):
    assert migrate_nvd.is_already_migrated(doc) is expected


def test_legacy_nan_calMinNeg_is_omitted_from_json_output():
    doc = {"imageOptionsArray": [{"url": "https://x/a.nii.gz", "cal_minNeg": "nan",
                                  "cal_maxNeg": "-infinity", "cal_min": 1}]}
    out = migrate_nvd.to_json_safe(migrate_nvd.migrate_document(doc))
    vol = out["volumes"][0]
    assert "calMinNeg" not in vol and "calMaxNeg" not in vol and vol["calMin"] == 1
    json.dumps(out, allow_nan=False)  # must not raise


def test_url_document_drops_opts_with_warning(capsys):
    out = migrate_nvd.migrate_document({"imageOptionsArray": [], "opts": {"sliceType": 3}})
    assert out["volumes"] == [] and "opts" not in out
    assert "'opts' block dropped" in capsys.readouterr().err


# --- CLI -----------------------------------------------------------------------


def _write(path, obj):
    with open(path, "w") as f:
        json.dump(obj, f)


def test_collect_inputs_recurses_directories_and_expands_globs(tmp_path):
    (tmp_path / "a" / "b").mkdir(parents=True)
    _write(tmp_path / "top.nvd", {})
    _write(tmp_path / "a" / "b" / "deep.NVD", {})
    _write(tmp_path / "a" / "other.txt", {})
    found = sorted(os.path.relpath(p, tmp_path) for p in migrate_nvd._collect_inputs([str(tmp_path)]))
    assert found == ["a/b/deep.NVD", "top.nvd"]
    globbed = migrate_nvd._collect_inputs([str(tmp_path / "**" / "*.nvd")])
    assert [os.path.basename(p) for p in globbed] == ["top.nvd"]


def test_cli_end_to_end_default_naming_skip_and_exit_codes(tmp_path, capsys):
    v = migrate_nvd.DOCUMENT_VERSION
    _write(tmp_path / "scene.nvd", {"imageOptionsArray": [{"url": "https://x/t1.nii.gz", "name": "t1"}],
                                    "meshes": [{"url": "https://x/lh.pial", "meshShaderIndex": 1}]})
    _write(tmp_path / "done.nvd", {"version": v, "volumes": [], "meshes": []})

    assert migrate_nvd.main([str(tmp_path), "-v"]) == 0
    err = capsys.readouterr()
    out_file = tmp_path / f"scene.v{v}.nvd"
    assert out_file.exists()
    assert not (tmp_path / f"done.v{v}.nvd").exists()
    assert "already niivue-mono format" in err.err
    assert f"(1 volumes [0 embedded], 1 meshes)" in err.out
    migrated = json.load(open(out_file))
    assert migrated["version"] == v
    assert migrated["volumes"][0]["url"] == "https://x/t1.nii.gz"
    assert migrated["meshes"][0]["shaderType"] == "matte"

    # Second run: the v9 output and the pre-migrated file are skipped; the legacy
    # input is regenerated to identical content apart from the `created` stamp
    # (the default naming never touches an original, so re-running is safe).
    without_created = lambda d: {k: v for k, v in d.items() if k != "created"}  # noqa: E731
    before = without_created(json.load(open(out_file)))
    assert migrate_nvd.main([str(tmp_path)]) == 0
    assert without_created(json.load(open(out_file))) == before
    assert "2 file(s) already migrated" in capsys.readouterr().err

    # A broken file fails that file only and makes the exit code non-zero.
    (tmp_path / "broken.nvd").write_text("{not json")
    assert migrate_nvd.main([str(tmp_path)]) == 1
    assert "1 file(s) failed" in capsys.readouterr().err


def test_cli_outdir_writes_flat_stem_names(tmp_path):
    src = tmp_path / "in"; src.mkdir()
    out = tmp_path / "out"
    _write(src / "scene.nvd", {"imageOptionsArray": []})
    assert migrate_nvd.main([str(src), "-o", str(out)]) == 0
    assert sorted(os.listdir(out)) == ["scene.nvd"]


def test_cli_no_inputs_is_an_error(capsys):
    assert migrate_nvd.main(["/nonexistent/path/*.nvd"]) == 1
    assert "no input files" in capsys.readouterr().err
