/**
 * Git Recovery Suggestions
 * Provides safe recovery paths for Git issues
 */

const { getReflog, getStashList, getCurrentBranch } = require('./analyzer');

/**
 * Generate recovery options for detached HEAD
 */
function recoverDetachedHead(repoStatus) {
  const options = [];
  
  options.push({
    description: 'Return to the main/master branch',
    commands: ['git checkout main', '# or: git checkout master'],
    safe: true
  });
  
  options.push({
    description: 'Create a new branch to keep your current work',
    commands: ['git checkout -b new-branch-name'],
    safe: true
  });
  
  return options;
}

/**
 * Generate recovery options for merge conflicts
 */
function recoverMergeConflict(repoStatus, conflictedFiles = []) {
  const options = [];
  
  options.push({
    description: 'Resolve conflicts and complete the merge',
    commands: [
      '# 1. Open each conflicted file and resolve the conflicts',
      '# 2. Look for <<<<<<< HEAD, =======, and >>>>>>> markers',
      '# 3. Keep the code you want and remove the markers',
      '# 4. Stage the resolved files:',
      'git add <resolved-file>',
      '# 5. Complete the merge:',
      'git commit'
    ],
    safe: true
  });
  
  options.push({
    description: 'Abort the merge and go back to before you started',
    commands: ['git merge --abort'],
    safe: true
  });
  
  if (conflictedFiles.length > 0) {
    options.push({
      description: 'Accept all "theirs" changes (incoming branch wins)',
      commands: conflictedFiles.map(f => `git checkout --theirs "${f}"`).concat(['git add .']),
      safe: false,
      warning: 'This will discard your local changes in conflicted files'
    });
  }
  
  return options;
}

/**
 * Generate recovery options for rebase in progress
 */
function recoverRebaseInProgress() {
  const options = [];
  
  options.push({
    description: 'Continue the rebase after fixing conflicts',
    commands: [
      '# First resolve any conflicts, then:',
      'git add .',
      'git rebase --continue'
    ],
    safe: true
  });
  
  options.push({
    description: 'Skip the current commit and continue',
    commands: ['git rebase --skip'],
    safe: false,
    warning: 'This will skip the current commit entirely'
  });
  
  options.push({
    description: 'Abort the rebase and go back to the original state',
    commands: ['git rebase --abort'],
    safe: true
  });
  
  return options;
}

/**
 * Generate recovery options for rejected push
 */
function recoverRejectedPush(repoStatus) {
  const options = [];
  const branch = repoStatus.branch || 'main';
  
  options.push({
    description: 'Pull remote changes and merge with yours',
    commands: [
      `git pull origin ${branch}`,
      '# Resolve any conflicts if they occur',
      'git push'
    ],
    safe: true
  });
  
  options.push({
    description: 'Pull with rebase to keep a cleaner history',
    commands: [
      `git pull --rebase origin ${branch}`,
      '# Resolve any conflicts if they occur',
      'git push'
    ],
    safe: true
  });
  
  options.push({
    description: 'Force push (DANGEROUS - overwrites remote)',
    commands: [`git push --force origin ${branch}`],
    safe: false,
    warning: 'This will overwrite the remote branch and may delete others\' work!'
  });
  
  return options;
}

/**
 * Generate recovery options for no upstream branch
 */
function recoverNoUpstream(repoStatus) {
  const branch = repoStatus.branch || 'main';
  
  return [{
    description: `Set up tracking and push to remote`,
    commands: [`git push -u origin ${branch}`],
    safe: true
  }];
}

/**
 * Generate recovery options for lost commits
 */
function recoverLostCommits(dir) {
  const reflog = getReflog(dir, 15);
  const options = [];
  
  if (reflog.length > 0) {
    options.push({
      description: 'View recent history to find lost commits',
      commands: [
        'git reflog',
        '# Find the commit hash you want to recover',
        '# Then create a branch at that point:',
        'git branch recovery-branch <commit-hash>'
      ],
      safe: true
    });
    
    // Show recent reflog entries
    options.push({
      description: 'Recent reflog entries (possible recovery points):',
      info: reflog.slice(0, 5).map(r => `${r.hash}: ${r.action}`),
      safe: true
    });
  }
  
  return options;
}

/**
 * Generate recovery options for permission denied
 */
function recoverPermissionDenied() {
  return [
    {
      description: 'Check if SSH key exists',
      commands: [
        '# On Windows:',
        'dir %USERPROFILE%\\.ssh',
        '# On Mac/Linux:',
        'ls -la ~/.ssh'
      ],
      safe: true
    },
    {
      description: 'Generate a new SSH key',
      commands: [
        'ssh-keygen -t ed25519 -C "your.email@example.com"',
        '# Press Enter to accept defaults',
        '# Then add the key to your GitHub/GitLab account'
      ],
      safe: true
    },
    {
      description: 'Switch to HTTPS instead of SSH',
      commands: [
        '# Get current remote URL:',
        'git remote -v',
        '# Change to HTTPS:',
        'git remote set-url origin https://github.com/user/repo.git'
      ],
      safe: true
    }
  ];
}

/**
 * Generate recovery options based on repository state
 */
function generateRecoveryOptions(repoStatus, errorInfo = null) {
  if (!repoStatus.isRepo) {
    return [{
      description: 'Initialize a new Git repository',
      commands: ['git init'],
      safe: true
    }];
  }
  
  if (repoStatus.isDetachedHead) {
    return recoverDetachedHead(repoStatus);
  }
  
  if (repoStatus.hasConflicts || repoStatus.isMergeInProgress) {
    return recoverMergeConflict(repoStatus);
  }
  
  if (repoStatus.isRebaseInProgress) {
    return recoverRebaseInProgress();
  }
  
  if (!repoStatus.hasUpstream) {
    return recoverNoUpstream(repoStatus);
  }
  
  return [];
}

module.exports = {
  recoverDetachedHead,
  recoverMergeConflict,
  recoverRebaseInProgress,
  recoverRejectedPush,
  recoverNoUpstream,
  recoverLostCommits,
  recoverPermissionDenied,
  generateRecoveryOptions
};
