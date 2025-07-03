#!/bin/bash

set -e  # Exit immediately on error

# Set timeouts to prevent hanging
export GIT_TERMINAL_PROMPT=0  # Disable git prompts
export GIT_SSH_COMMAND="ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no"

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function prompt_default() {
  local prompt="$1"
  local default="$2"
  local timeout="${3:-30}"  # Default 30 second timeout
  
  if read -t "$timeout" -p "$prompt [$default]: " input; then
    echo "${input:-$default}"
  else
    echo ""
    log_warning "Input timeout after ${timeout}s, using default: $default"
    echo "$default"
  fi
}

function log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

function log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

function log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

function log_error() {
  echo -e "${RED}❌ $1${NC}"
}

function validate_remote() {
  local remote="$1"
  if ! git remote get-url "$remote" >/dev/null 2>&1; then
    log_error "Remote '$remote' not found. Available remotes:"
    git remote -v
    exit 1
  fi
}

function validate_branch() {
  local branch="$1"
  if ! git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
    log_error "Local branch '$branch' not found. Available branches:"
    git branch -a
    exit 1
  fi
}

function safe_git_operation() {
  local operation="$1"
  local max_retries=3
  local retry=0
  
  while [ $retry -lt $max_retries ]; do
    log_info "Attempting: $operation (try $((retry + 1))/$max_retries)"
    
    if timeout 60 bash -c "$operation"; then
      return 0
    else
      retry=$((retry + 1))
      if [ $retry -lt $max_retries ]; then
        log_warning "Operation failed, retrying in 5 seconds..."
        sleep 5
      fi
    fi
  done
  
  log_error "Operation failed after $max_retries attempts: $operation"
  return 1
}

function prompt_with_timeout() {
  local prompt="$1"
  local timeout="${2:-30}"
  
  if read -t "$timeout" -p "$prompt" response; then
    echo "$response"
  else
    echo ""
    log_warning "Input timeout after ${timeout}s"
    return 1
  fi
}

function has_uncommitted_changes() {
  ! git diff-index --quiet HEAD -- 2>/dev/null
}

function cleanup_on_failure() {
  log_warning "Cleaning up after failure..."
  git rebase --abort 2>/dev/null || true
  if [ -n "$MY_BRANCH" ]; then
    git checkout "$MY_BRANCH" 2>/dev/null || true
  fi
  # Kill any hanging git processes
  pkill -f "git" 2>/dev/null || true
}

# Set up error handling
trap cleanup_on_failure ERR
trap cleanup_on_failure INT  # Handle Ctrl+C

echo "🔧 Safe Fork Script: Rebase with upstream OR just save to GitHub"

# Verify we're in a git repository
if ! timeout 10 git rev-parse --git-dir >/dev/null 2>&1; then
  log_error "Not in a git repository or git is hanging!"
  exit 1
fi

# Show current status
log_info "Current repository: $(timeout 5 git rev-parse --show-toplevel | xargs basename || echo "Unknown")"
log_info "Current branch: $(timeout 5 git branch --show-current || echo "Unknown")"
log_info "Uncommitted changes: $(has_uncommitted_changes && echo "Yes" || echo "No")"

# Ask for mode
MODE=$(prompt_with_timeout "🛠️  Do you want to (r)ebase with upstream or just (s)ave your local changes to GitHub? (r/s): " 30)
if [ -z "$MODE" ]; then
  log_error "No input received, exiting"
  exit 1
fi
  
if [[ "$MODE" == "s" || "$MODE" == "S" ]]; then
  # Simple save mode
  log_info "Save Mode: Push changes to your GitHub fork"
  BRANCH=$(timeout 5 git branch --show-current || { log_error "Cannot determine current branch"; exit 1; })
  
  # Check if there are changes to commit
  if ! has_uncommitted_changes && git diff --cached --quiet; then
    log_warning "No changes to commit!"
    CONTINUE=$(prompt_with_timeout "Continue anyway? (y/n): " 15)
    if [[ "$CONTINUE" != "y" && "$CONTINUE" != "Y" ]]; then
      log_info "Operation cancelled"
      exit 0
    fi
  fi
  
  MSG=$(prompt_with_timeout "✏️  Commit message: " 60)
  if [ -z "$MSG" ]; then
    log_error "Commit message cannot be empty or timed out"
    exit 1
  fi

  log_info "Adding files to staging area..."
  if ! timeout 120 git add .; then
    log_error "Git add operation timed out or failed"
    exit 1
  fi
  
  log_info "Committing changes..."
  git commit -m "$MSG" || true
  
  if safe_git_operation "git push origin \"$BRANCH\""; then
    log_success "Work saved to origin/$BRANCH"
  else
    log_error "Failed to push to origin/$BRANCH"
    exit 1
  fi
  exit 0
fi

# Rebase mode begins
log_info "Rebase Mode: Sync with upstream and rebase your changes"

UPSTREAM_REMOTE=$(prompt_default "🛰️  Upstream remote?" "upstream" 20)
UPSTREAM_BRANCH=$(prompt_default "🌿 Upstream branch?" "main" 20)
LOCAL_BASE=$(prompt_default "📦 Local base branch?" "main" 20)
MY_BRANCH=$(prompt_with_timeout "✏️  Your custom working branch (with edits)? " 30)

# Validate inputs
log_info "Validating configuration..."
validate_remote "$UPSTREAM_REMOTE"
validate_branch "$LOCAL_BASE"
validate_branch "$MY_BRANCH"

# Check if we're currently on the working branch
CURRENT_BRANCH=$(timeout 5 git branch --show-current || echo "unknown")
if [ "$CURRENT_BRANCH" != "$MY_BRANCH" ]; then
  log_warning "Currently on '$CURRENT_BRANCH', not '$MY_BRANCH'"
  SWITCH=$(prompt_with_timeout "Switch to '$MY_BRANCH' now? (y/n): " 15)
  if [[ "$SWITCH" == "y" || "$SWITCH" == "Y" ]]; then
    git checkout "$MY_BRANCH"
  else
    log_error "Please switch to '$MY_BRANCH' manually and re-run the script"
    exit 1
  fi
fi

# Step 2: Stash uncommitted changes
if has_uncommitted_changes; then
  log_info "Stashing uncommitted changes..."
  git stash push -u -m "Auto-stash before upstream rebase"
  STASH_CREATED=true
else
  log_success "No uncommitted changes to stash"
  STASH_CREATED=false
fi

# Step 3: Optional backup before rebase
SHOULD_BACKUP=$(prompt_with_timeout "🛡️  Do you want to backup '$MY_BRANCH' to your fork before rebasing? (y/n): " 20)
if [[ "$SHOULD_BACKUP" == "y" || "$SHOULD_BACKUP" == "Y" ]]; then
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  BACKUP_BRANCH="backup/${MY_BRANCH}-${TIMESTAMP}"
  log_info "Pushing backup to: origin/$BACKUP_BRANCH"
  if safe_git_operation "git push origin \"$MY_BRANCH:$BACKUP_BRANCH\""; then
    log_success "Backup created: origin/$BACKUP_BRANCH"
  else
    log_error "Backup push failed. Aborting."
    exit 1
  fi
else
  log_info "Skipping backup..."
fi

if [ -z "$MY_BRANCH" ]; then
  log_error "You must provide a branch name or input timed out."
  exit 1
fi

# Step 4: Fetch upstream
log_info "Fetching from $UPSTREAM_REMOTE (no submodules)..."
if ! safe_git_operation "git fetch \"$UPSTREAM_REMOTE\" --no-recurse-submodules"; then
  log_error "Failed to fetch from upstream"
  exit 1
fi

# Check if upstream branch exists
if ! git show-ref --verify --quiet "refs/remotes/$UPSTREAM_REMOTE/$UPSTREAM_BRANCH" 2>/dev/null; then
  log_error "Upstream branch '$UPSTREAM_REMOTE/$UPSTREAM_BRANCH' not found"
  log_info "Available upstream branches:"
  git branch -r | grep "$UPSTREAM_REMOTE/" || echo "No upstream branches found"
  exit 1
fi

# Step 5: Update local base
log_info "Switching to $LOCAL_BASE..."
if ! timeout 30 git checkout "$LOCAL_BASE"; then
  log_error "Failed to switch to $LOCAL_BASE branch"
  exit 1
fi

log_info "Merging $UPSTREAM_REMOTE/$UPSTREAM_BRANCH into $LOCAL_BASE..."
if ! timeout 60 git merge "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH"; then
  log_error "Failed to merge upstream changes into $LOCAL_BASE"
  log_info "Please resolve conflicts manually and re-run the script"
  exit 1
fi

# Step 6: Rebase working branch
log_info "Switching to $MY_BRANCH..."
if ! timeout 30 git checkout "$MY_BRANCH"; then
  log_error "Failed to switch to $MY_BRANCH"
  exit 1
fi

log_info "Rebasing $MY_BRANCH onto $LOCAL_BASE..."
if ! timeout 300 git rebase "$LOCAL_BASE"; then
  log_error "Rebase failed or timed out. Resolve conflicts, then run 'git add .' and 'git rebase --continue'."
  log_info "Once done, re-run this script to continue."
  log_warning "Your stash is preserved and can be applied later with 'git stash pop'"
  exit 1
fi

# Step 7: Restore stash
if [ "$STASH_CREATED" = true ]; then
  log_info "Applying stashed changes back..."
  git stash pop || {
    log_warning "Could not apply stash automatically. Your changes are safe in stash."
    log_info "Use 'git stash list' and 'git stash apply' to restore them manually."
  }
else
  log_success "No stash to restore."
fi

# Step 8: Push updated branch
SHOULD_PUSH=$(prompt_with_timeout "🚀 Push updated '$MY_BRANCH' to your GitHub fork? (y/n): " 20)
if [[ "$SHOULD_PUSH" == "y" || "$SHOULD_PUSH" == "Y" ]]; then
  # Check if there are new changes to commit
  if has_uncommitted_changes; then
    log_info "Committing final changes..."
    log_info "Adding files to staging area..."
    if ! timeout 120 git add .; then
      log_warning "Git add timed out, trying to add key files only..."
      timeout 30 git add server/src/services/ server/src/controllers/ || true
    fi
    git commit -m "Final commit after rebase and stash restoration" || true
  fi
  
  log_info "Pushing to origin/$MY_BRANCH..."
  if ! safe_git_operation "git push --force-with-lease origin \"$MY_BRANCH\""; then
    log_warning "Push failed due to stale info. Fetching latest from origin..."
    safe_git_operation "git fetch origin \"$MY_BRANCH\"" || true
    log_info "Retrying push..."
    if ! safe_git_operation "git push --force-with-lease origin \"$MY_BRANCH\""; then
      log_error "Push still rejected."
      FORCE_ANYWAY=$(prompt_with_timeout "⚠️  Do you want to force push anyway? (y/n): " 15)
      if [[ "$FORCE_ANYWAY" == "y" || "$FORCE_ANYWAY" == "Y" ]]; then
        if safe_git_operation "git push --force origin \"$MY_BRANCH\""; then
          log_success "Force push complete."
        else
          log_error "Force push failed"
        fi
      else
        log_warning "Push aborted. Please review manually."
        log_info "You can push later with: git push --force-with-lease origin $MY_BRANCH"
      fi
    else
      log_success "Push succeeded after fetching."
    fi
  else
    log_success "Changes pushed!"
  fi
else
  log_success "Rebase complete. Changes not pushed."
  log_info "You can push later with: git push --force-with-lease origin $MY_BRANCH"
fi

log_success "Script completed successfully!"
