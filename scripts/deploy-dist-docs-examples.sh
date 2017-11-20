#!/bin/bash

# Deploy only semver tags (branches)

SEMVER_PATTERN="^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(\+[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*)?$"

if [[ ! $TRAVIS_BRANCH =~ $SEMVER_PATTERN ]]; then
  echo "Skip deploy: $TRAVIS_BRANCH"
  exit 0
fi


echo "Starting dist deployment"
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
rm -rf *.js *.map || exit 1
cp $TMP_DIST_DIR/$PUBLIC_DIR/* . || exit 1

echo "Pushing new content to $ORIGIN_URL"
git config user.name "Cartofante" || exit 1
git config user.email "systems@cartodb.com" || exit 1

git add *.js *.map || exit 1
git commit --allow-empty -m "Update dist for $TRAVIS_BRANCH $CURRENT_COMMIT" || exit 1
git push --force --quiet "$ORIGIN_URL_WITH_CREDENTIALS" dist > /dev/null 2>&1
git tag "@${TRAVIS_BRANCH:1}"
git push origin "@${TRAVIS_BRANCH:1}"

FIX_VER="@4.0.0-alpha"
git tag -d $FIX_VER
git push origin :$FIX_VER
git tag $FIX_VER
git push origin $FIX_VER

echo "Checking out $TRAVIS_BRANCH"
git checkout -- . || exit 1
git checkout origin/$TRAVIS_BRANCH || exit 1

echo "Deployed successfully."


echo "Starting docs/examples deployment"
echo "Target: gh-pages branch"

DOCS_DIR="docs"
TMP_DOCS_DIR="tmp_docs"
CURRENT_COMMIT=`git rev-parse HEAD`
ORIGIN_URL=`git config --get remote.origin.url`
ORIGIN_URL_WITH_CREDENTIALS="https://$GITHUB_TOKEN@github.com/$TRAVIS_REPO_SLUG"

echo "Generating documentation"
npm run docs
npm run docs:all
cp config/jsdoc/index.html $DOCS_DIR/index.html || exit 1

echo "Move to tmp file"
mv $DOCS_DIR $TMP_DOCS_DIR

echo "Fetching gh-pages branch"
git fetch origin gh-pages:refs/remotes/origin/gh-pages || exit 1

echo "Checking out gh-pages branch"
git checkout -b gh-pages origin/gh-pages || exit 1

echo "Copying source content to root"
rm -rf $DOCS_DIR || exit 1
mv $TMP_DOCS_DIR $DOCS_DIR || exit 1
mv $DOCS_DIR/index.html index.html || exit 1

echo "Pushing new content to $ORIGIN_URL"
git config user.name "Cartofante" || exit 1
git config user.email "systems@cartodb.com" || exit 1

git add index.html || exit 1
git add $DOCS_DIR || exit 1
git commit --allow-empty -m "Update docs for $CURRENT_COMMIT" || exit 1
git push --force --quiet "$ORIGIN_URL_WITH_CREDENTIALS" gh-pages > /dev/null 2>&1

echo "Cleaning up temp files"
rm -rf $DOCS_DIR

echo "Deployed successfully."
exit 0
