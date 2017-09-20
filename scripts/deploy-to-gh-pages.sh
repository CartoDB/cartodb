#!/bin/bash

# Pull requests and commits to other branches shouldn't try to deploy
if [ "$TRAVIS_PULL_REQUEST" != "false" ] && [ "$TRAVIS_BRANCH" != "jsdoc-ghpages" ]; then
  exit 0
fi

echo "Starting deployment"
echo "Target: gh-pages branch"

SOURCE_DIR="out/v4"
TARGET_DIR="v4"
CURRENT_COMMIT=`git rev-parse HEAD`
ORIGIN_URL=`git config --get remote.origin.url`
ORIGIN_URL_WITH_CREDENTIALS="https://$GITHUB_TOKEN@github.com/$TRAVIS_REPO_SLUG"

echo "Fetching gh-pages branch"
git fetch origin gh-pages:refs/remotes/origin/gh-pages || exit 1

echo "Checking out gh-pages branch"
git checkout -b gh-pages origin/gh-pages || exit 1

echo "Copying source content to root"
rm -rf $TARGET_DIR || exit 1
cp -r $SOURCE_DIR $TARGET_DIR || exit 1

echo "Pushing new content to $ORIGIN_URL"
git config user.name "CartoBot" || exit 1
git config user.email "frontend@carto.com" || exit 1

git add $TARGET_DIR || exit 1
git commit --allow-empty -m "Update docs for $CURRENT_COMMIT" || exit 1
git push --force --quiet "$ORIGIN_URL_WITH_CREDENTIALS" gh-pages

echo "Cleaning up temp files"
rm -rf $TARGET_DIR

echo "Deployed successfully."
exit 0
