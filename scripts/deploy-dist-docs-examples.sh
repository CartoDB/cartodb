#!/bin/bash

SEMVER_PATTERN="^v(0|[1-9]+)\.(0|[1-9]+)\.(0|[1-9]+)(-[a-z]+(\.[0-9a-z]+)?)?$"

DIST_DIR="dist"
DOCS_DIR="docs"
EXAMPLES_DIR="examples"
TMP_DIST_DIR="tmp_dist"
TMP_DOCS_DIR="tmp_docs"
TMP_EXAMPLES_DIR="tmp_examples"

CURRENT_COMMIT=`git rev-parse HEAD`
ORIGIN_URL=`git config --get remote.origin.url`
ORIGIN_URL_WITH_CREDENTIALS="https://$GITHUB_TOKEN@github.com/$TRAVIS_REPO_SLUG"

# - Deploy only semver tags

if [[ ! $TRAVIS_BRANCH =~ $SEMVER_PATTERN ]]; then
  echo "Skip deploy: $TRAVIS_BRANCH"
  exit 0
fi

# - Generation

echo "Generating dist"
npm run dist

echo "Generating docs"
npm run docs
npm run docs:internal

echo "Move dist to tmp file"
mv $DIST_DIR $TMP_DIST_DIR

echo "Move docs to tmp file"
mv $DOCS_DIR $TMP_DOCS_DIR

echo "Move examples to tmp file"
mv $EXAMPLES_DIR $TMP_EXAMPLES_DIR

echo "Copy index.html"
cp config/jsdoc/index.html $TMP_DOCS_DIR/index.html || exit 1

# - Deployment

echo "Starting dist deployment"
echo "Target: dist branch"

echo "Fetching dist branch"
git fetch origin dist:refs/remotes/origin/dist || exit 1

echo "Checking out dist branch"
git checkout -- . || exit 1
git checkout -b dist origin/dist || exit 1

echo "Copying source content to root"
rm -rf *.js *.map || exit 1
cp $TMP_DIST_DIR/public/* . || exit 1

echo "Pushing new content to $ORIGIN_URL"
git config user.name "Cartofante" || exit 1
git config user.email "systems@cartodb.com" || exit 1

git add *.js *.map || exit 1
git commit --allow-empty -m "Update dist for $TRAVIS_BRANCH $CURRENT_COMMIT" || exit 1
git push --force --quiet "$ORIGIN_URL_WITH_CREDENTIALS" dist > /dev/null 2>&1
git tag "@${TRAVIS_BRANCH:1}"
git push "$ORIGIN_URL_WITH_CREDENTIALS" "@${TRAVIS_BRANCH:1}"

echo "Dist deployed successfully."

echo "Starting docs/examples deployment"
echo "Target: gh-pages branch"

echo "Fetching gh-pages branch"
git fetch origin gh-pages:refs/remotes/origin/gh-pages || exit 1

echo "Checking out gh-pages branch"
git checkout -- . || exit 1
git checkout -b gh-pages origin/gh-pages || exit 1

echo "Copying source content to root"
rm -rf $DOCS_DIR/v4 || exit 1
mv $TMP_DOCS_DIR/public $DOCS_DIR/v4 || exit 1
rm -rf $DOCS_DIR/v4-internal || exit 1
mv $TMP_DOCS_DIR/internal $DOCS_DIR/v4-internal || exit 1
rm -rf $EXAMPLES_DIR/v4 || exit 1
mv $TMP_EXAMPLES_DIR/public $EXAMPLES_DIR/v4 || exit 1
mv $TMP_DOCS_DIR/index.html index.html || exit 1

echo "Add version in index.html"
sed -i "s|%VERSION|$TRAVIS_BRANCH|g" index.html

echo "Use CDN carto.js in the v4 examples"
OLD="../../../dist/public/carto.uncompressed.js"
CDN="https://cdn.rawgit.com/CartoDB/cartodb.js/@${TRAVIS_BRANCH:1}/carto.js"
sed -i "s|$OLD|$CDN|g" $EXAMPLES_DIR/v4/*

echo "Pushing new content to $ORIGIN_URL"
git config user.name "Cartofante" || exit 1
git config user.email "systems@cartodb.com" || exit 1

git add index.html || exit 1
git add $DOCS_DIR || exit 1
git add $EXAMPLES_DIR || exit 1
git commit --allow-empty -m "Update docs/examples for $TRAVIS_BRANCH $CURRENT_COMMIT" || exit 1
git push --force --quiet "$ORIGIN_URL_WITH_CREDENTIALS" gh-pages > /dev/null 2>&1

echo "Docs/examples deployed successfully."

exit 0
