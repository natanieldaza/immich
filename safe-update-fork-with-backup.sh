#!/bin/bash

echo "🔧 Starting safe fork update with stash + backup protection..."

# Step 1: Ask remotes and branches
read -p "🛰️  Upstream remote? [upstream]: " UPSTREAM_REMOTE
UPSTREAM_REMOTE=${UPSTREAM_REMOTE:-upstream}

read -p "🌿 Upstream branch? [main]: " UPSTREAM_BRANCH
UPSTREAM_BRANCH=${UPSTREAM_BRANCH:-main}

read -p "📦 Local base branch? [main]: " LOCAL_BASE
LOCAL_BASE=${LOCAL_BASE:-main}

read -p "✏️  Your custom working branch (with edits)? " MY_BRANCH
if [ -z "$MY_BRANCH" ]; then
  echo "❌ You must provide a branch name."
  exit 1
fi

# Step 2: Stash uncommitted changes
echo "🧷 Stashing uncommitted changes (if any)..."
git stash push -u -m "Auto-stash before upstream rebase"
STASHED=$?

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
git fetch "$UPSTREAM_REMOTE" || exit 1

# Step 5: Update local base
echo "👉 Switching to $LOCAL_BASE..."
git checkout "$LOCAL_BASE" || exit 1

echo "🔄 Merging $UPSTREAM_REMOTE/$UPSTREAM_BRANCH into $LOCAL_BASE..."
git merge "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH" || exit 1

# Step 6: Rebase working branch
echo "👉 Switching to $MY_BRANCH..."
git checkout "$MY_BRANCH" || exit 1

echo "🔁 Rebasing $MY_BRANCH onto $LOCAL_BASE..."
git rebase "$LOCAL_BASE" || {
  echo "❌ Rebase failed. Resolve conflicts, then run 'git rebase --continue'."
  exit 1
}

# Step 7: Restore stash
if [ $STASHED -eq 0 ]; then
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
  echo "📤 Pushing to origin/$MY_BRANCH..."
  git push origin "$MY_BRANCH"
  echo "✅ Changes pushed!"
else
  echo "✅ Rebase complete. Changes not pushed."
fi

