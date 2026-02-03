/**
 * Checker System
 * Runs checks for detected projects and returns results
 */

const output = require('../utils/output');

/**
 * Result status constants
 */
const Status = {
  PASS: 'pass',
  FAIL: 'fail',
  WARN: 'warn',
  SKIP: 'skip',
  MANUAL: 'manual'
};

/**
 * Run all checks for a detected project
 * @param {object} detection - Detection result from a detector
 * @param {string} dir - Project directory
 * @returns {object[]} Array of check results
 */
function runChecks(detection, dir = process.cwd()) {
  const results = [];
  const checks = detection.checks || [];
  const analysis = detection.analysis || {};

  for (const check of checks) {
    try {
      const result = runSingleCheck(check, dir, analysis);
      results.push(result);
    } catch (error) {
      results.push({
        id: check.id,
        name: check.name,
        status: Status.FAIL,
        message: `Check failed: ${error.message}`,
        fix: check.fix
      });
    }
  }

  return results;
}

/**
 * Run a single check
 * @param {object} check - Check definition
 * @param {string} dir - Project directory
 * @param {object} analysis - Project analysis
 * @returns {object} Check result
 */
function runSingleCheck(check, dir, analysis) {
  const result = {
    id: check.id,
    name: check.name,
    status: Status.PASS,
    message: '',
    version: null,
    fix: null
  };

  // Run the check
  const checkResult = check.check(dir, analysis);

  if (checkResult === 'skip') {
    result.status = Status.SKIP;
    result.message = 'Not applicable';
    return result;
  }

  if (checkResult === 'manual') {
    result.status = Status.MANUAL;
    result.message = 'Manual verification required';
    result.fix = typeof check.fix === 'function' ? check.fix(analysis, dir) : check.fix;
    return result;
  }

  if (checkResult === true) {
    result.status = Status.PASS;
    
    // Try to get version if available
    if (check.getVersion) {
      try {
        result.version = check.getVersion(dir, analysis);
      } catch {}
    }
    
    // Try to get script if available
    if (check.getScript) {
      try {
        result.script = check.getScript(dir, analysis);
      } catch {}
    }
    
    return result;
  }

  // Check failed
  result.status = Status.FAIL;
  result.message = typeof checkResult === 'string' ? checkResult : '';
  result.fix = typeof check.fix === 'function' ? check.fix(analysis, dir) : check.fix;
  result.warning = check.warning || null;

  return result;
}

/**
 * Summarize check results
 * @param {object[]} results - Array of check results
 * @returns {object} Summary
 */
function summarizeResults(results) {
  const summary = {
    total: results.length,
    passed: 0,
    failed: 0,
    warnings: 0,
    skipped: 0,
    manual: 0,
    ready: true
  };

  for (const result of results) {
    switch (result.status) {
      case Status.PASS:
        summary.passed++;
        break;
      case Status.FAIL:
        summary.failed++;
        summary.ready = false;
        break;
      case Status.WARN:
        summary.warnings++;
        break;
      case Status.SKIP:
        summary.skipped++;
        break;
      case Status.MANUAL:
        summary.manual++;
        break;
    }
  }

  return summary;
}

/**
 * Print check results to console
 * @param {object[]} results - Array of check results
 * @param {object} options - Display options
 */
function printResults(results, options = {}) {
  const { verbose = false } = options;

  for (const result of results) {
    if (result.status === Status.SKIP && !verbose) {
      continue;
    }

    switch (result.status) {
      case Status.PASS:
        const versionStr = result.version ? `v${result.version}` : '';
        const scriptStr = result.script ? `→ ${result.script}` : '';
        output.success(result.name, versionStr || scriptStr);
        break;
      
      case Status.FAIL:
        output.error(result.name, result.message);
        if (result.fix) {
          output.fix(result.fix);
        }
        if (result.warning) {
          console.log(output.symbols.warning + ' ' + result.warning);
        }
        break;
      
      case Status.WARN:
        output.warning(result.name, result.message);
        if (result.fix) {
          output.fix(result.fix);
        }
        break;
      
      case Status.SKIP:
        output.info(result.name, 'Skipped');
        break;
      
      case Status.MANUAL:
        output.warning(result.name, 'Manual check required');
        if (result.fix) {
          output.fix(result.fix);
        }
        break;
    }
  }
}

module.exports = {
  Status,
  runChecks,
  runSingleCheck,
  summarizeResults,
  printResults
};
