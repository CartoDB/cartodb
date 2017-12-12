#!/bin/bash

npm update

VERSION=$(node --eval "console.log(require('./package.json').version);")

npm test || exit 1

echo "Ready to publish Carto.js version $VERSION"
echo "Has the version number been bumped?"
read -n1 -r -p "Press Ctrl+C to cancel, or any other key to continue." key

npm run build

echo "Uploading to CDN..."

grunt publish_s3
grunt invalidate

echo "All done."
