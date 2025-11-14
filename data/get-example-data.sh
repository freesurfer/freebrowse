#!/bin/bash
mkdir -p volumes
wget -nc https://niivue.github.io/niivue-demo-images/mni152.nii.gz -P volumes/
wget -nc https://niivue.github.io/niivue-demo-images/pcasl.nii.gz -P volumes/
wget -nc https://niivue.com/demos/images/hippo.nii.gz -P volumes/
wget -nc https://niivue.com/demos/images/aparc.a2009s+aseg.mgz -P volumes/

