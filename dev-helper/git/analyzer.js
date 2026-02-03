/**
 * Git Repository Analyzer
 * Analyzes the current Git repository state
 */

const { runCommand, fileExists, directoryExists } = require('../utils/runner');
const path = require('path');

/**
 * Check if current directory is a Git repository
 */
function isGitRepository(dir = process.cwd()) {
  const result = runCommand('git rev-parse --is-inside-work-tree 2>&1', { cwd: dir });
  return result.success && result.stdout === 'true';
}

/**
 * Get comprehensive Git repository status
 */
function getRepositoryStatus(dir = process.cwd()) {
  if (!isGitRepository(dir)) {
    return { isRepo: false };
  }

  const status = {
    isRepo: true,
    branch: getCurrentBranch(dir),
    isDetachedHead: checkDetachedHead(dir),
    hasUncommittedChanges: hasUncommittedChanges(dir),
    hasStagedChanges: hasStagedChanges(dir),
    hasUntrackedFiles: hasUntrackedFiles(dir),
    isMergeInProgress: isMergeInProgress(dir),
    isRebaseInProgress: isRebaseInProgress(dir),
    isCherryPickInProgress: isCherryPickInProgress(dir),
    hasConflicts: hasConflicts(dir),
    ahead: 0,
    behind: 0,
    remote: getRemote(dir),
    lastCommit: getLastCommit(dir)
  };

  // Get ahead/behind counts
  const aheadBehind = getAheadBehind(dir);
  status.ahead = aheadBehind.ahead;
  status.behind = aheadBehind.behind;
  status.hasUpstream = aheadBehind.hasUpstream;

  return status;
}

/**
 * Get current branch name
 */
function getCurrentBranch(dir = process.cwd()) {
  const result = runCommand('git branch --show-current 2>&1', { cwd: dir });
  return result.success ? result.stdout : null;
}

/**
 * Check if in detached HEAD state
 */
function checkDetachedHead(dir = process.cwd()) {
  const result = runCommand('git symbolic-ref HEAD 2>&1', { cwd: dir });
  return !result.success || result.stderr.includes('not a symbolic ref');
}

/**
 * Check for uncommitted changes
 */
function hasUncommittedChanges(dir = process.cwd()) {
  const result = runCommand('git status --porcelain 2>&1', { cwd: dir });
  return result.success && result.stdout.length > 0;
}

/**
 * Check for staged changes
 */
function hasStagedChanges(dir = process.cwd()) {
  const result = runCommand('git diff --cached --quiet 2>&1', { cwd: dir });
  return !result.success; // Non-zero exit means there are staged changes
}

/**
 * Check for untracked files
 */
function hasUntrackedFiles(dir = process.cwd()) {
  const result = runCommand('git ls-files --others --exclude-standard 2>&1', { cwd: dir });
  return result.success && result.stdout.length > 0;
}

/**
 * Check if merge is in progress
 */
function isMergeInProgress(dir = process.cwd()) {
  return fileExists('.git/MERGE_HEAD', dir);
}

/**
 * Check if rebase is in progress
 */
function isRebaseInProgress(dir = process.cwd()) {
  return directoryExists('.git/rebase-merge', dir) || 
         directoryExists('.git/rebase-apply', dir);
}

/**
 * Check if cherry-pick is in progress
 */
function isCherryPickInProgress(dir = process.cwd()) {
  return fileExists('.git/CHERRY_PICK_HEAD', dir);
}

/**
 * Check for merge conflicts
 */
function hasConflicts(dir = process.cwd()) {
  const result = runCommand('git ls-files -u 2>&1', { cwd: dir });
  return result.success && result.stdout.length > 0;
}

/**
 * Get remote name
 */
function getRemote(dir = process.cwd()) {
  const result = runCommand('git remote 2>&1', { cwd: dir });
  if (result.success && result.stdout) {
    return result.stdout.split('\n')[0];
  }
  return null;
}

/**
 * Get last commit info
 */
function getLastCommit(dir = process.cwd()) {
  const result = runCommand('git log -1 --format="%h %s" 2>&1', { cwd: dir });
  if (result.success && result.stdout) {
    const [hash, ...messageParts] = result.stdout.split(' ');
    return {
      hash: hash,
      message: messageParts.join(' ')
    };
  }
  return null;
}

/**
 * Get ahead/behind counts relative to upstream
 */
function getAheadBehind(dir = process.cwd()) {
  const result = runCommand('git rev-list --left-right --count HEAD...@{upstream} 2>&1', { cwd: dir });
  
  if (!result.success) {
    return { ahead: 0, behind: 0, hasUpstream: false };
  }

  const parts = result.stdout.trim().split(/\s+/);
  return {
    ahead: parseInt(parts[0], 10) || 0,
    behind: parseInt(parts[1], 10) || 0,
    hasUpstream: true
  };
}

/**
 * Get list of conflicted files
 */
function getConflictedFiles(dir = process.cwd()) {
  const result = runCommand('git diff --name-only --diff-filter=U 2>&1', { cwd: dir });
  if (result.success && result.stdout) {
    return result.stdout.split('\n').filter(f => f.trim());
  }
  return [];
}

/**
 * Get stash list
 */
function getStashList(dir = process.cwd()) {
  const result = runCommand('git stash list 2>&1', { cwd: dir });
  if (result.success && result.stdout) {
    return result.stdout.split('\n').filter(s => s.trim());
  }
  return [];
}

/**
 * Get recent reflog entries (for recovery)
 */
function getReflog(dir = process.cwd(), count = 10) {
  const result = runCommand(`git reflog -${count} --format="%h %gd %gs" 2>&1`, { cwd: dir });
  if (result.success && result.stdout) {
    return result.stdout.split('\n').filter(l => l.trim()).map(line => {
      const [hash, ref, ...action] = line.split(' ');
      return { hash, ref, action: action.join(' ') };
    });
  }
  return [];
}

module.exports = {
  isGitRepository,
  getRepositoryStatus,
  getCurrentBranch,
  checkDetachedHead,
  hasUncommittedChanges,
  hasStagedChanges,
  hasUntrackedFiles,
  isMergeInProgress,
  isRebaseInProgress,
  isCherryPickInProgress,
  hasConflicts,
  getConflictedFiles,
  getRemote,
  getLastCommit,
  getAheadBehind,
  getStashList,
  getReflog
};
