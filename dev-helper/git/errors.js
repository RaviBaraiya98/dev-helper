/**
 * Git Error Matcher
 * Matches Git output against known error patterns
 */

const path = require('path');

// Load error database
let errorDatabase = null;

function loadErrorDatabase() {
  if (!errorDatabase) {
    try {
      errorDatabase = require('../data/gitErrors.json');
    } catch {
      errorDatabase = { errors: [] };
    }
  }
  return errorDatabase;
}

/**
 * Match an error string against known patterns
 * @param {string} errorText - Git error output
 * @returns {object|null} Matched error info or null
 */
function matchError(errorText) {
  if (!errorText) return null;
  
  const db = loadErrorDatabase();
  const normalizedError = errorText.toLowerCase();
  
  for (const error of db.errors) {
    // Check each pattern for the error
    const patterns = Array.isArray(error.patterns) ? error.patterns : [error.pattern];
    
    for (const pattern of patterns) {
      if (normalizedError.includes(pattern.toLowerCase())) {
        return error;
      }
    }
  }
  
  return null;
}

/**
 * Match repository state to known issues
 * @param {object} repoStatus - Repository status from analyzer
 * @returns {object|null} Matched issue or null
 */
function matchState(repoStatus) {
  const db = loadErrorDatabase();
  
  // Check for specific states
  if (!repoStatus.isRepo) {
    return findErrorByPattern('not a git repository');
  }
  
  if (repoStatus.isDetachedHead) {
    return findErrorByPattern('detached HEAD');
  }
  
  if (repoStatus.hasConflicts) {
    return findErrorByPattern('merge conflict');
  }
  
  if (repoStatus.isRebaseInProgress) {
    return findErrorByPattern('rebase in progress');
  }
  
  if (repoStatus.isMergeInProgress && !repoStatus.hasConflicts) {
    return findErrorByPattern('merge in progress');
  }
  
  if (repoStatus.isCherryPickInProgress) {
    return findErrorByPattern('cherry-pick');
  }
  
  if (!repoStatus.hasUpstream && repoStatus.branch) {
    return findErrorByPattern('no upstream branch');
  }
  
  if (repoStatus.behind > 0 && repoStatus.ahead > 0) {
    return findErrorByPattern('branches have diverged');
  }
  
  return null;
}

/**
 * Find error by pattern string
 */
function findErrorByPattern(patternStr) {
  const db = loadErrorDatabase();
  
  for (const error of db.errors) {
    const patterns = Array.isArray(error.patterns) ? error.patterns : [error.pattern];
    
    for (const pattern of patterns) {
      if (pattern.toLowerCase().includes(patternStr.toLowerCase())) {
        return error;
      }
    }
  }
  
  return null;
}

/**
 * Get all errors from database
 */
function getAllErrors() {
  const db = loadErrorDatabase();
  return db.errors || [];
}

/**
 * Get error categories
 */
function getCategories() {
  const db = loadErrorDatabase();
  const categories = new Set();
  
  for (const error of db.errors) {
    if (error.category) {
      categories.add(error.category);
    }
  }
  
  return Array.from(categories);
}

module.exports = {
  matchError,
  matchState,
  findErrorByPattern,
  getAllErrors,
  getCategories
};
