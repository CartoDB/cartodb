#!/bin/sh
git pull
git checkout staging
git merge master
git checkout production
git merge staging
git push
git checkout master
cap production deploy
