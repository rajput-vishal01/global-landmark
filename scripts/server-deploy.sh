#!/usr/bin/env bash
# Runs ON the server, called over SSH by .github/workflows/deploy.yml with the
# .next tarball the runner just built. Nothing is compiled here.
#
# Note the one ordering quirk: this script pulls the commit that contains
# itself, so a change to THIS file takes effect on the deploy after the one
# that introduces it. Same as any self-updating deploy script.
set -euo pipefail

TARBALL="${1:?usage: server-deploy.sh <tarball>}"

# Secrets live here, outside the repo and outside git, so a deploy can never
# overwrite them and a leaked repo never contains them.
ENV_FILE="${GL_ENV_FILE:-/var/www/globallandmarkrealty.env}"
PM2_NAME="${GL_PM2_NAME:-globallandmarkrealty}"

cd "$(dirname "$0")/.."

set -a; . "$ENV_FILE"; set +a

git fetch --all
# Untracked files survive this — which is what keeps uploads/ and the tarball
# alive. Never make it `git clean -fdx`: that deletes every uploaded photo and
# legal document.
git reset --hard origin/main

# Production deps only. The build already happened on the runner; all the
# server needs from node_modules is mysql2, for the two scripts below.
npm ci --omit=dev

node scripts/migrate.mjs
# Seed is idempotent and only fills gaps, so a failure here should not block a
# deploy that is otherwise good.
node scripts/seed.mjs || true

# Swap rather than extract in place. Unpacking over a live .next means the
# running server serves half-old, half-new chunks for the length of the untar;
# a mv is atomic enough that nobody sees it.
rm -rf .next.new .next.old
mkdir .next.new
tar -xzf "$TARBALL" -C .next.new --strip-components=1
# `[ -d .next ] && mv ...` would exit the whole script under `set -e` on the
# first deploy, when there is nothing to move yet.
if [ -d .next ]; then mv .next .next.old; fi
mv .next.new .next
rm -rf .next.old "$TARBALL"

pm2 restart "$PM2_NAME" --update-env
pm2 save

echo "deployed $(git rev-parse --short HEAD)"
