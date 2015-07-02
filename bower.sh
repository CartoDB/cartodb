#!/bin/bash

# Script for updating the cartodb.js bower repo from current local build.

echo "#################################"
echo "#### Update bower ###############"
echo "#################################"

ORG=CartoDB
REPO=cartodb.js-bower

# prepare repo folder
if [ -d $REPO ]
  then
    rm -rf $REPO
fi

# clone repo
echo "-- Cloning $REPO"
git clone git@github.com:$ORG/$REPO.git

# clean up cloned files
rm -rf $REPO/*

# move js files from the build
cp -r dist/cartodb*.js $REPO/

# move css and images files from the build
mkdir $REPO/themes/ && cp -r dist/themes/* $REPO/themes/

cp -R bower.json $REPO/bower.json

cp -R LICENSE $REPO/LICENSE.md

# commit and tag repo
echo "-- Committing and tagging $REPO"
cd $REPO
git add -A
CARTODBJS_VER=$(git diff bower.json | grep version | cut -d':' -f2 | cut -d'"' -f2 | sort -g -r | head -1) && if [ $(echo $CARTODBJS_VER | wc -m | tr -d ' ') = '1' ]; then echo 'VERSION DID NOT CHANGE'; else git tag -a $CARTODBJS_VER -m "Version $CARTODBJS_VER"; fi
git tag -a $CARTODBJS_VER -m "Version $CARTODBJS_VER"
git commit -m "v$CARTODBJS_VER"

echo "-- Pushing $REPO"
git push -fq origin master
git push -fq origin --tags

cd ..

echo "-- Finished"
