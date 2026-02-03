const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Run a shell command and return the result
 * @param {string} command - Command to execute
 * @param {object} options - Options
 * @returns {object} { success, stdout, stderr, code }
 */
function runCommand(command, options = {}) {
  const {
    cwd = process.cwd(),
    timeout = 30000,
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
 * Run a command and return just the output (legacy compatibility)
 * @param {string} command - Command to execute
 * @returns {string|null} Command output or null if failed
 */
function runCommandSimple(command) {
  const result = runCommand(command);
  return result.success ? result.stdout : (result.stderr || result.stdout || null);
}

/**
 * Check if a command exists in PATH
 * @param {string} cmd - Command to check
 * @returns {boolean}
 */
function commandExists(cmd) {
  const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
  const result = runCommand(checkCmd);
  return result.success && result.stdout.length > 0;
}

/**
 * Get version of a command
 * @param {string} cmd - Command to check
 * @param {string} versionFlag - Flag to get version (default: --version)
 * @returns {string|null} Version string or null
 */
function getCommandVersion(cmd, versionFlag = '--version') {
  const result = runCommand(`${cmd} ${versionFlag} 2>&1`);
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
  runCommand,
  runCommandSimple,
  commandExists,
  getCommandVersion,
  fileExists,
  directoryExists,
  readJsonFile,
  readFile,
  listFiles,
  findFiles
};
