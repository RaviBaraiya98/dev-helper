const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { isCommandSafe, logBlockedCommand } = require('./safety');

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     COMMAND EXECUTION - SAFETY ENFORCED                   ║
 * ║                                                                           ║
 * ║  ALL command execution in dev-helper goes through this module.            ║
 * ║  The safeRunCommand function enforces the allowlist in safety.js.         ║
 * ║                                                                           ║
 * ║  NEVER bypass the safety checks. NEVER execute user project code.         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * INTERNAL: Execute a command (used only by safeRunCommand after validation)
 * @private - DO NOT EXPORT - DO NOT CALL DIRECTLY
 */
function _executeCommand(command, options = {}) {
  const {
    cwd = process.cwd(),
    timeout = 10000,  // Reduced timeout - version checks should be fast
    silent = true
  } = options;

  try {
    const stdout = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? ['pipe', 'pipe', 'pipe'] : 'inherit',
      timeout,
      cwd,
      windowsHide: true
    });
    return { success: true, stdout: stdout.trim(), stderr: '', code: 0 };
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout ? error.stdout.toString().trim() : '',
      stderr: error.stderr ? error.stderr.toString().trim() : error.message,
      code: error.status || 1
    };
  }
}

/**
 * Safely run a command after validating against the allowlist.
 * 
 * ⚠️  SECURITY: This function ONLY executes commands that are explicitly
 *     on the safe allowlist in safety.js. All other commands are blocked.
 * 
 * @param {string} command - Command to execute (must be on allowlist)
 * @param {object} options - Options
 * @returns {object} { success, stdout, stderr, code }
 */
function safeRunCommand(command, options = {}) {
  const safetyCheck = isCommandSafe(command);
  
  if (!safetyCheck.safe) {
    // Log the blocked attempt for debugging
    logBlockedCommand(command, safetyCheck.reason);
    
    // Return a failure result instead of throwing
    // This allows graceful degradation
    return {
      success: false,
      stdout: '',
      stderr: `[SAFETY] Command blocked: ${safetyCheck.reason}`,
      code: -1,
      blocked: true
    };
  }

  return _executeCommand(command, options);
}

/**
 * @deprecated Use safeRunCommand instead
 * This function is kept for backward compatibility but routes through safety checks.
 */
function runCommand(command, options = {}) {
  // Route ALL calls through the safe execution path
  return safeRunCommand(command, options);
}

/**
 * @deprecated Use safeRunCommand for version checks
 * Returns just the output for legacy compatibility
 */
function runCommandSimple(command) {
  const result = safeRunCommand(command);
  return result.success ? result.stdout : (result.stderr || result.stdout || null);
}

/**
 * Check if a command exists in PATH
 * ✅ SAFE: Only uses where/which commands which are on the allowlist
 * @param {string} cmd - Command to check
 * @returns {boolean}
 */
function commandExists(cmd) {
  // Validate the command name to prevent injection
  if (!cmd || typeof cmd !== 'string' || !/^[\w-]+$/.test(cmd)) {
    return false;
  }
  const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
  const result = safeRunCommand(checkCmd);
  return result.success && result.stdout.length > 0;
}

/**
 * Get version of a command
 * ✅ SAFE: Only uses --version flags which are on the allowlist
 * @param {string} cmd - Command to check
 * @param {string} versionFlag - Flag to get version (default: --version)
 * @returns {string|null} Version string or null
 */
function getCommandVersion(cmd, versionFlag = '--version') {
  // Validate inputs to prevent injection
  if (!cmd || typeof cmd !== 'string' || !/^[\w-]+$/.test(cmd)) {
    return null;
  }
  if (!versionFlag || typeof versionFlag !== 'string' || !/^[-\w]+$/.test(versionFlag)) {
    return null;
  }
  
  // Special case for java which outputs to stderr
  const cmdString = cmd === 'java' ? `${cmd} -version 2>&1` : `${cmd} ${versionFlag}`;
  const result = safeRunCommand(cmdString);
  if (result.success || result.stdout) {
    return result.stdout || result.stderr;
  }
  return null;
}

/**
 * Check if a file exists
 * @param {string} filename - Name or path of the file
 * @param {string} baseDir - Base directory (default: cwd)
 * @returns {boolean}
 */
function fileExists(filename, baseDir = process.cwd()) {
  const filepath = path.isAbsolute(filename) ? filename : path.join(baseDir, filename);
  try {
    return fs.statSync(filepath).isFile();
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists
 * @param {string} dirname - Name or path of the directory
 * @param {string} baseDir - Base directory (default: cwd)
 * @returns {boolean}
 */
function directoryExists(dirname, baseDir = process.cwd()) {
  const dirpath = path.isAbsolute(dirname) ? dirname : path.join(baseDir, dirname);
  try {
    return fs.statSync(dirpath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Read a JSON file
 * @param {string} filename - Path to JSON file
 * @param {string} baseDir - Base directory (default: cwd)
 * @returns {object|null} Parsed JSON or null
 */
function readJsonFile(filename, baseDir = process.cwd()) {
  try {
    const filepath = path.isAbsolute(filename) ? filename : path.join(baseDir, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Read a file's content
 * @param {string} filename - Path to file
 * @param {string} baseDir - Base directory (default: cwd)
 * @returns {string|null} File content or null
 */
function readFile(filename, baseDir = process.cwd()) {
  try {
    const filepath = path.isAbsolute(filename) ? filename : path.join(baseDir, filename);
    return fs.readFileSync(filepath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * List files in directory matching a pattern
 * @param {string} dir - Directory to search
 * @param {RegExp} pattern - Pattern to match
 * @returns {string[]} Matching filenames
 */
function listFiles(dir = process.cwd(), pattern = null) {
  try {
    const files = fs.readdirSync(dir);
    if (pattern) {
      return files.filter(f => pattern.test(f));
    }
    return files;
  } catch {
    return [];
  }
}

/**
 * Find files by name in current directory
 * ✅ SAFE: Uses only file system reads, no command execution
 * @param {string[]} filenames - Array of filenames to find
 * @param {string} baseDir - Base directory
 * @returns {object} Map of filename -> exists
 */
function findFiles(filenames, baseDir = process.cwd()) {
  const result = {};
  for (const name of filenames) {
    result[name] = fileExists(name, baseDir);
  }
  return result;
}

module.exports = {
  // ✅ SAFE: Validates commands against allowlist before execution
  safeRunCommand,
  
  // ⚠️ DEPRECATED: Routes through safeRunCommand for safety
  runCommand,
  runCommandSimple,
  
  // ✅ SAFE: Uses validated version checks only
  commandExists,
  getCommandVersion,
  
  // ✅ SAFE: File system reads only, no execution
  fileExists,
  directoryExists,
  readJsonFile,
  readFile,
  listFiles,
  findFiles
};
