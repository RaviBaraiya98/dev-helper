/**
 * System-level checks
 * Checks for system-wide tools and configurations
 * 
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                        SAFETY ENFORCED                                    ║
 * ║                                                                           ║
 * ║  This module ONLY:                                                        ║
 * ║    ✅ Checks tool versions (git --version, node --version, etc.)          ║
 * ║    ✅ Reads git configuration (git config --get)                          ║
 * ║    ✅ Checks environment variables (no execution)                         ║
 * ║                                                                           ║
 * ║  This module NEVER:                                                       ║
 * ║    ❌ Executes user project code                                          ║
 * ║    ❌ Installs anything                                                   ║
 * ║    ❌ Modifies system state                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { commandExists, getCommandVersion, safeRunCommand } = require('../utils/runner');
const { extractVersion } = require('../utils/version');
const { getPlatformInfo, isWindows, isElevated } = require('../utils/platform');

/**
 * Check for common developer tools
 */
function checkDeveloperTools() {
  const tools = [
    { name: 'git', display: 'Git' },
    { name: 'node', display: 'Node.js' },
    { name: 'npm', display: 'npm' },
    { name: 'python', display: 'Python', alt: 'python3' },
    { name: 'java', display: 'Java' },
    { name: 'docker', display: 'Docker' }
  ];

  const results = [];

  for (const tool of tools) {
    const exists = commandExists(tool.name) || (tool.alt && commandExists(tool.alt));
    let version = null;

    if (exists) {
      const versionOutput = getCommandVersion(tool.name) || 
                           (tool.alt && getCommandVersion(tool.alt));
      version = extractVersion(versionOutput);
    }

    results.push({
      name: tool.display,
      command: tool.name,
      installed: exists,
      version: version
    });
  }

  return results;
}

/**
 * Check Git configuration
 * ✅ SAFE: Only reads git config values, no modifications
 */
function checkGitConfig() {
  const checks = [];

  // Check if git is installed
  if (!commandExists('git')) {
    return [{ name: 'Git', status: 'missing', fix: 'Install Git from https://git-scm.com' }];
  }

  // Check user.name - ✅ SAFE: read-only config query
  const userName = safeRunCommand('git config --global user.name');
  checks.push({
    name: 'Git user.name',
    status: userName.success && userName.stdout ? 'configured' : 'missing',
    value: userName.stdout || null,
    fix: 'git config --global user.name "Your Name"'
  });

  // Check user.email - ✅ SAFE: read-only config query
  const userEmail = safeRunCommand('git config --global user.email');
  checks.push({
    name: 'Git user.email',
    status: userEmail.success && userEmail.stdout ? 'configured' : 'missing',
    value: userEmail.stdout || null,
    fix: 'git config --global user.email "your.email@example.com"'
  });

  // Check default branch - ✅ SAFE: read-only config query
  const defaultBranch = safeRunCommand('git config --global init.defaultBranch');
  checks.push({
    name: 'Git default branch',
    status: defaultBranch.success && defaultBranch.stdout ? 'configured' : 'not set',
    value: defaultBranch.stdout || 'master (default)',
    fix: 'git config --global init.defaultBranch main'
  });

  return checks;
}

/**
 * Check for PATH issues
 */
function checkPath() {
  const pathVar = process.env.PATH || process.env.Path || '';
  const paths = pathVar.split(isWindows ? ';' : ':');

  const issues = [];

  // Check for empty path entries
  const emptyPaths = paths.filter(p => !p.trim());
  if (emptyPaths.length > 0) {
    issues.push({
      type: 'warning',
      message: `PATH contains ${emptyPaths.length} empty entries`
    });
  }

  // Check for duplicate entries
  const uniquePaths = new Set(paths.map(p => p.toLowerCase()));
  if (uniquePaths.size < paths.length) {
    issues.push({
      type: 'info',
      message: 'PATH contains duplicate entries'
    });
  }

  return {
    count: paths.length,
    issues: issues
  };
}

/**
 * Get system information
 */
function getSystemInfo() {
  const info = getPlatformInfo();
  info.elevated = isElevated();
  return info;
}

module.exports = {
  checkDeveloperTools,
  checkGitConfig,
  checkPath,
  getSystemInfo
};
