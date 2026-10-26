#!/bin/bash
mkdir -p volumes
wget -nc https://niivue.github.io/niivue-demo-images/mni152.nii.gz -P volumes/
wget -nc https://niivue.github.io/niivue-demo-images/pcasl.nii.gz -P volumes/
wget -nc https://niivue.com/demos/images/hippo.nii.gz -P volumes/
wget -nc https://niivue.com/demos/images/aparc.a2009s+aseg.mgz -P volumes/
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/orig.nii.gz -P volumes/
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/aseg.nii.gz -P volumes/

mkdir -p surfaces
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/lh.curv -P surfaces/
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/lh.curv.pial -P surfaces/
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/lh.pial -P surfaces/
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/lh.thickness -P surfaces/
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/lh.white -P surfaces/
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/rh.curv -P surfaces/
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/rh.curv.pial -P surfaces/
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/rh.pial -P surfaces/
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/rh.thickness -P surfaces/
wget -nc https://raw.githubusercontent.com/pwighton/freebrowse-test-data/main/freesurfer/surfaces/rh.white -P surfaces/

wget -nc https://pwighton.github.io/freebrowse-test-data/pet/tpl-MNI305_T1w.nii.gz -P volumes/
wget -nc https://pwighton.github.io/freebrowse-test-data/pet/sub-PS11_ses-baselinebrain_space-mni305_pvc-nopvc_desc-preproc_pet.nii.gz -P volumes/
