#!/bin/sh
git pull
git checkout staging
git merge master
git push
git checkout master
cap staging deploy
