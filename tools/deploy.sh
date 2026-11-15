#!/usr/bin/env bash
# Build the game and publish dist/ to the gh-pages branch (served at https://beez.ly/brownber/).
# Usage: npm run deploy        (set DEPLOY_URL to push somewhere other than origin)
set -euo pipefail
cd "$(dirname "$0")/.."
URL="${DEPLOY_URL:-$(git remote get-url origin)}"
npm run build
cd dist
rm -rf .git
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.name="$(git -C .. config user.name || echo deploy)" -c user.email="$(git -C .. config user.email || echo deploy@localhost)" \
  commit -q -m "Deploy $(git -C .. rev-parse --short HEAD)"
git push -f "$URL" gh-pages
rm -rf .git
echo "Deployed. Live in a minute or two at https://beez.ly/brownber/"
