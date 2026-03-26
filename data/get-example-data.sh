#!/bin/bash
mkdir -p volumes
wget -nc https://niivue.github.io/niivue-demo-images/mni152.nii.gz -P volumes/
wget -nc https://niivue.github.io/niivue-demo-images/pcasl.nii.gz -P volumes/
wget -nc https://niivue.com/demos/images/hippo.nii.gz -P volumes/
wget -nc https://niivue.com/demos/images/aparc.a2009s+aseg.mgz -P volumes/

mkdir -p surf-eg/1
wget -nc https://niivue.com/demos/images/fs/brainmask.mgz -P surf-eg/1
wget -nc https://niivue.com/demos/images/fs/wm.mgz -P surf-eg/1
wget -nc https://niivue.com/demos/images/fs/rh.pial -P surf-eg/1
wget -nc https://niivue.com/demos/images/fs/lh.pial -P surf-eg/1
wget -nc https://niivue.com/demos/images/fs/lh.white -P surf-eg/1
wget -nc https://niivue.com/demos/images/fs/rh.white -P surf-eg/1

mkdir -p surf-eg/2
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/lh.curv -P surf-eg/2
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/lh.curv.pial -P surf-eg/2
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/lh.pial -P surf-eg/2
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/lh.thickness -P surf-eg/2
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/lh.white -P surf-eg/2
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/rh.curv -P surf-eg/2
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/rh.curv.pial -P surf-eg/2
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/rh.pial -P surf-eg/2
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/rh.thickness -P surf-eg/2
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/rh.white -P surf-eg/2

mkdir -p 4d-eg
wget -nc https://pwighton.github.io/freebrowse-test-data/pet/tpl-MNI305_T1w.nii.gz -P 4d-eg/
wget -nc https://pwighton.github.io/freebrowse-test-data/pet/sub-PS11_ses-baselinebrain_space-mni305_pvc-nopvc_desc-preproc_pet.nii.gz -P 4d-eg/
