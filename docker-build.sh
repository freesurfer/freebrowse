#!/bin/bash

VERSION=`cat ./frontend/package.json |grep version|awk '{print $2}'|sed s/\"//g | sed s/,//`
echo "Building version ${VERSION}"

docker build -f docker/Dockerfile -t pwighton/freebrowse:$VERSION .

docker build -f docker/Dockerfile --build-arg SERVERLESS=true -t pwighton/freebrowse:$VERSION-serverless .
