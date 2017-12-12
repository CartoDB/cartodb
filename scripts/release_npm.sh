#!/bin/bash

npm update

VERSION=$(node --eval "console.log(require('./package.json').version);")

npm test || exit 1

echo "Ready to publish Carto.js version $VERSION"
echo "Has the version number been bumped?"
read -n1 -r -p "Press Ctrl+C to cancel, or any other key to continue." key

npm run build

node scripts/generate-package-json.js

echo "Uploading to NPM..."

cd dist/public

npm publish

echo "All done."
