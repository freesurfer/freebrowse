#!/bin/bash
mkdir -p volumes
wget -nc https://niivue.github.io/niivue-demo-images/mni152.nii.gz -P volumes/
wget -nc https://niivue.github.io/niivue-demo-images/pcasl.nii.gz -P volumes/
wget -nc https://niivue.com/demos/images/hippo.nii.gz -P volumes/
wget -nc https://niivue.com/demos/images/aparc.a2009s+aseg.mgz -P volumes/

mkdir -p surf-eg
wget -nc https://niivue.com/demos/images/fs/brainmask.mgz -P surf-eg/
wget -nc https://niivue.com/demos/images/fs/wm.mgz -P surf-eg/
wget -nc https://niivue.com/demos/images/fs/rh.pial -P surf-eg/
wget -nc https://niivue.com/demos/images/fs/lh.pial -P surf-eg/
wget -nc https://niivue.com/demos/images/fs/lh.white -P surf-eg/
wget -nc https://niivue.com/demos/images/fs/rh.white -P surf-eg/
