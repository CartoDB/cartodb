#!/bin/bash

# Pull requests and commits to other branches shouldn't try to deploy
if [ "$TRAVIS_PULL_REQUEST" != "false" ] || [ "$TRAVIS_BRANCH" != "public-api" ]; then
  echo "Skip deploy: $TRAVIS_BRANCH"
  exit 0
fi

echo "Starting deployment"
echo "Target: dist branch"

DIST_DIR="dist"
TMP_DIST_DIR="tmp_dist"
PUBLIC_DIR="public"
INTERNAL_DIR="internal"
CURRENT_COMMIT=`git rev-parse HEAD`
ORIGIN_URL=`git config --get remote.origin.url`
ORIGIN_URL_WITH_CREDENTIALS="https://$GITHUB_TOKEN@github.com/$TRAVIS_REPO_SLUG"

echo "Generating dist"
npm run dist

echo "Move to tmp file"
mv $DIST_DIR $TMP_DIST_DIR

echo "Fetching dist branch"
git fetch origin dist:refs/remotes/origin/dist || exit 1

echo "Checking out dist branch"
git checkout -- . || exit 1
git checkout -b dist origin/dist || exit 1

echo "Copying source content to root"
rm -rf $PUBLIC_DIR || exit 1
mv $TMP_DIST_DIR/$PUBLIC_DIR $PUBLIC_DIR || exit 1
# rm -rf $INTERNAL_DIR || exit 1
# mv $TMP_DIST_DIR/$INTERNAL_DIR $INTERNAL_DIR || exit 1

echo "Pushing new content to $ORIGIN_URL"
git config user.name "Cartofante" || exit 1
git config user.email "systems@cartodb.com" || exit 1

git add $PUBLIC_DIR || exit 1
# git add $INTERNAL_DIR || exit 1
git commit --allow-empty -m "Update dist for $CURRENT_COMMIT" || exit 1
git push --force --quiet "$ORIGIN_URL_WITH_CREDENTIALS" dist > /dev/null 2>&1

echo "Checking out $TRAVIS_BRANCH"
git checkout -- . || exit 1
git checkout $TRAVIS_BRANCH || exit 1

echo "Deployed successfully."
exit 0
