#!/bin/bash

set -e  # Exit immediately on error

function prompt_default() {
  local prompt="$1"
  local default="$2"
  read -p "$prompt [$default]: " input
  echo "${input:-$default}"
}

echo "🔧 Safe Fork Script: Rebase with upstream OR just save to GitHub"

# Ask for mode
read -p "🛠️  Do you want to (r)ebase with upstream or just (s)ave your local changes to GitHub? (r/s): " MODE

if [[ "$MODE" == "s" || "$MODE" == "S" ]]; then
  # Simple save mode
  echo "💾 Save Mode: Push changes to your GitHub fork"
  BRANCH=$(git branch --show-current)
  read -p "✏️  Commit message: " MSG
  git add .
  git commit -m "$MSG"
  git push origin "$BRANCH"
  echo "✅ Work saved to origin/$BRANCH"
  exit 0
fi

# Rebase mode begins
UPSTREAM_REMOTE=$(prompt_default "🛰️  Upstream remote?" "upstream")
UPSTREAM_BRANCH=$(prompt_default "🌿 Upstream branch?" "main")
LOCAL_BASE=$(prompt_default "📦 Local base branch?" "main")
read -p "✏️  Your custom working branch (with edits)? " MY_BRANCH
if [ -z "$MY_BRANCH" ]; then
  echo "❌ You must provide a branch name."
  exit 1
fi

# Step 2: Stash uncommitted changes
echo "🧷 Stashing uncommitted changes (if any)..."
git stash push -u -m "Auto-stash before upstream rebase" || true

# Step 3: Optional backup before rebase
read -p "🛡️  Do you want to backup '$MY_BRANCH' to your fork before rebasing? (y/n): " SHOULD_BACKUP
if [[ "$SHOULD_BACKUP" == "y" || "$SHOULD_BACKUP" == "Y" ]]; then
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  BACKUP_BRANCH="backup/${MY_BRANCH}-${TIMESTAMP}"
  echo "📤 Pushing backup to: origin/$BACKUP_BRANCH"
  git push origin "$MY_BRANCH:$BACKUP_BRANCH" || {
    echo "❌ Backup push failed. Aborting."
    exit 1
  }
else
  echo "⏭️  Skipping backup..."
fi

# Step 4: Fetch upstream
echo "👉 Fetching from $UPSTREAM_REMOTE..."
git fetch "$UPSTREAM_REMOTE"

# Step 5: Update local base
echo "👉 Switching to $LOCAL_BASE..."
git checkout "$LOCAL_BASE"
echo "🔄 Merging $UPSTREAM_REMOTE/$UPSTREAM_BRANCH into $LOCAL_BASE..."
git merge "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH"

# Step 6: Rebase working branch
echo "👉 Switching to $MY_BRANCH..."
git checkout "$MY_BRANCH"
echo "🔁 Rebasing $MY_BRANCH onto $LOCAL_BASE..."
git rebase "$LOCAL_BASE" || {
  echo "❌ Rebase failed. Resolve conflicts, then run 'git add .' and 'git rebase --continue'."
  echo "📌 Once done, re-run this script to continue."
  exit 1
}

# Step 7: Restore stash
if git stash list | grep -q "Auto-stash before upstream rebase"; then
  echo "📦 Applying stashed changes back..."
  git stash pop || {
    echo "⚠️  Warning: Could not apply stash. Your changes are safe in stash. Use 'git stash list' and 'git stash apply'."
  }
else
  echo "✅ No stash needed."
fi

# Step 8: Push updated branch
read -p "🚀 Push updated '$MY_BRANCH' to your GitHub fork? (y/n): " SHOULD_PUSH
if [[ "$SHOULD_PUSH" == "y" || "$SHOULD_PUSH" == "Y" ]]; then
  git add .
  git commit -m "Final commit after rebase and stash restoration (if any)" || true
  echo "📤 Pushing to origin/$MY_BRANCH..."
  git push origin "$MY_BRANCH"
  echo "✅ Changes pushed!"
else
  echo "✅ Rebase complete. Changes not pushed."
fi
