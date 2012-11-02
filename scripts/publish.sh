#!/bin/sh

BRANCH=`git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/\1/'`

rm -rf v2
rm -rf dist
git checkout gh-pages
git merge $BRANCH
<<<<<<< HEAD
clean
release
=======
make clean release
>>>>>>> develop
git add v2
git ci -a -m "publish"
git checkout $BRANCH
