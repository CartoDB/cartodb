#!/bin/bash

# Pull requests and commits to other branches shouldn't try to deploy
if [ "$TRAVIS_PULL_REQUEST" != "false" ] && [ "$TRAVIS_BRANCH" != "jsdoc-api" ]; then
  echo "Current branch does not generate docs"
  echo "Skip deploy."
  exit 0
fi

echo "Starting deployment"
echo "Target: gh-pages branch"

SOURCE_DIR="out"
TARGET_DIR="docs"
CURRENT_COMMIT=`git rev-parse HEAD`
ORIGIN_URL=`git config --get remote.origin.url`
ORIGIN_URL_WITH_CREDENTIALS="https://$GITHUB_TOKEN@github.com/$TRAVIS_REPO_SLUG"

echo "Generating documentation"
npm run docs
npm run docs:all
cp doc/index.html out/index.html || exit 1

echo "Fetching gh-pages branch"
git fetch origin gh-pages:refs/remotes/origin/gh-pages || exit 1

echo "Checking out gh-pages branch"
git checkout -b gh-pages origin/gh-pages || exit 1

echo "Copying source content to root"
rm -rf $TARGET_DIR || exit 1
mv $SOURCE_DIR $TARGET_DIR || exit 1
mv $TARGET_DIR/index.html index.html || exit 1

echo "Pushing new content to $ORIGIN_URL"
git config user.name "Cartofante" || exit 1
git config user.email "systems@cartodb.com" || exit 1

git add index.html || exit 1
git add $TARGET_DIR || exit 1
git commit --allow-empty -m "Update docs for $CURRENT_COMMIT" || exit 1
git push --force --quiet "$ORIGIN_URL_WITH_CREDENTIALS" gh-pages > /dev/null 2>&1

echo "Cleaning up temp files"
rm -rf $TARGET_DIR

echo "Deployed successfully."
exit 0
