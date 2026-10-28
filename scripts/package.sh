#!/bin/sh
# Build the Chrome Web Store upload zip (extension files only).
set -e
cd "$(dirname "$0")/.."
mkdir -p dist
rm -f dist/farsi-be-gone.zip
zip -r dist/farsi-be-gone.zip manifest.json detect.js content.js content.css popup.html popup.js icons >/dev/null
echo "dist/farsi-be-gone.zip"
