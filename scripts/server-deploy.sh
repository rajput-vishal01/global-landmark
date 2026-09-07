#!/usr/bin/env bash
# Runs ON the server, called over SSH by .github/workflows/deploy.yml with the
# .next tarball the runner just built. Nothing is compiled here.
#
# One ordering quirk: this script pulls the commit that contains itself, so a
# change to THIS file takes effect on the deploy AFTER the one that introduces
# it. When you change this script, `git pull` on the server once by hand.
set -euo pipefail

TARBALL="${1:?usage: server-deploy.sh <tarball>}"

# Secrets live outside the repo and outside git, so a deploy can never
# overwrite them and a leaked repo never contains them.
ENV_FILE="${GL_ENV_FILE:-/var/www/globallandmarkrealty.env}"
PM2_NAME="${GL_PM2_NAME:-globallandmarkrealty}"

cd "$(dirname "$0")/.."

# --- make the toolchain findable -----------------------------------------
# Node here is installed via nvm, and a non-interactive ssh shell does not
# source .bashrc — so npm and pm2 are both "command not found" from CI, while
# working perfectly when you ssh in and run this by hand. `set +u` around the
# source because nvm.sh references unset variables.
if ! command -v npm > /dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    set +u
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh" > /dev/null 2>&1 || true
    set -u
  fi
fi
for cmd in npm pm2 git tar curl flock sha256sum; do
  command -v "$cmd" > /dev/null 2>&1 || { echo "$cmd is not on PATH"; exit 1; }
done

# --- one deploy at a time -------------------------------------------------
# The workflow's cancel-in-progress kills the RUNNER, not the ssh command it
# has already started on the server. Without this lock, a second deploy can
# reset the working tree while the first is mid-untar. Placed after the
# toolchain check so a missing flock reports itself instead of masquerading
# as "another deploy is running".
exec 9> /tmp/gl-deploy.lock
flock -n 9 || { echo "another deploy is running; giving up"; exit 1; }

# --- preflight ------------------------------------------------------------
[ -f "$ENV_FILE" ] || { echo "env file missing: $ENV_FILE"; exit 1; }
[ -s "$TARBALL" ]  || { echo "tarball missing or empty: $TARBALL"; exit 1; }
tar -tzf "$TARBALL" > /dev/null 2>&1 || { echo "tarball is corrupt: $TARBALL"; exit 1; }

set -a; . "$ENV_FILE"; set +a
: "${DATABASE_URL:?DATABASE_URL is not set in $ENV_FILE}"
PORT="${PORT:-3000}"

# Leave no half-unpacked directory behind on any failure.
trap 'rm -rf .next.new' EXIT

# --- source ---------------------------------------------------------------
# BatchMode so a passphrase-protected or missing deploy key fails in seconds
# instead of hanging on a prompt until the workflow times out.
export GIT_SSH_COMMAND="ssh -o BatchMode=yes"
git fetch --all
# Untracked files survive this — which is what keeps uploads/ and the tarball
# alive. Never make it `git clean -fdx`: that deletes every uploaded photo and
# legal document.
git reset --hard origin/main

# --- dependencies ---------------------------------------------------------
# Production only. The build already happened on the runner; all the server
# still needs out of node_modules is mysql2, for the two scripts below. This
# means `npm run build` will NOT work on the server — that is deliberate.
# Only reinstall when the lockfile actually moved: npm ci wipes node_modules
# first, and doing that on every deploy is a pointless window where the
# migrate scripts have no driver.
LOCK_STAMP=".deploy-lock-hash"
LOCK_NOW="$(sha256sum package-lock.json | cut -d' ' -f1)"
if [ ! -f "$LOCK_STAMP" ] || [ "$(cat "$LOCK_STAMP")" != "$LOCK_NOW" ] || [ ! -d node_modules ]; then
  npm ci --omit=dev
  echo "$LOCK_NOW" > "$LOCK_STAMP"
else
  echo "dependencies unchanged"
fi

# --- schema ---------------------------------------------------------------
# Before the new code is swapped in, so an additive migration is already
# applied when the new build starts serving.
node scripts/migrate.mjs
# Seed only fills gaps and is idempotent; a failure here should not block a
# deploy that is otherwise good.
node scripts/seed.mjs || true

# --- swap -----------------------------------------------------------------
# Unpack beside the live directory and move, rather than untarring over it:
# extracting in place serves half-old, half-new chunks for the length of the
# untar. A mv is atomic enough that nobody sees it.
rm -rf .next.new .next.old
mkdir .next.new
tar -xzf "$TARBALL" -C .next.new --strip-components=1
[ -f .next.new/standalone/server.js ] || { echo "tarball has no standalone server"; exit 1; }
# `[ -d .next ] && mv ...` would exit the whole script under `set -e` on the
# first deploy, when there is nothing to move yet.
if [ -d .next ]; then mv .next .next.old; fi
mv .next.new .next
rm -f "$TARBALL"

pm2 restart "$PM2_NAME" --update-env || \
  pm2 start npm --name "$PM2_NAME" -- start
pm2 save

# --- prove it actually serves --------------------------------------------
# pm2 reports "online" for a process that is crash-looping, so a bad build
# would otherwise deploy "successfully" and take the site down until somebody
# noticed. Poll the health route, and put the old build back if it never
# answers.
healthy() {
  for _ in $(seq 1 30); do
    if curl -fsS --max-time 3 "http://127.0.0.1:${PORT}/api/health" > /dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

if ! healthy; then
  echo "::error::health check failed on port ${PORT} after 60s"
  pm2 logs "$PM2_NAME" --lines 40 --nostream || true
  if [ -d .next.old ]; then
    echo "rolling back to the previous build"
    rm -rf .next
    mv .next.old .next
    pm2 restart "$PM2_NAME" --update-env
    healthy && echo "rollback is serving" || echo "::error::rollback did NOT recover"
  fi
  exit 1
fi

rm -rf .next.old
echo "deployed $(git rev-parse --short HEAD) on port ${PORT}"
