#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# Next version from the latest vN tag.
latest=$(git tag --sort=-v:refname | grep -E '^v[0-9]+$' | head -1)
if [ -z "$latest" ]; then
  next=1
else
  next=$(( ${latest#v} + 1 ))
fi
version="v$next"
echo "Releasing $version..."

( cd pwa && npm run build )      # fail fast if it doesn't build

git add -A
if git diff --cached --quiet; then
  echo "No changes to commit — tagging current HEAD as $version."
else
  git commit -m "$version"
fi
git tag "$version"
git push
git push --tags
echo "Done — $version pushed and tagged."
