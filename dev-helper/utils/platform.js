const os = require('os');
const path = require('path');

/**
 * Platform-specific utilities
 */

const platform = process.platform;
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

/**
 * Get the correct command for the current platform
 */
function getCommand(commands) {
  if (isWindows && commands.win) return commands.win;
  if (isMac && commands.mac) return commands.mac;
  if (isLinux && commands.linux) return commands.linux;
  return commands.default || commands.linux || commands.mac;
}

/**
 * Get the correct path separator
 */
function getPathSeparator() {
  return isWindows ? ';' : ':';
}

/**
 * Get the home directory
 */
function getHomeDir() {
  return os.homedir();
}

/**
 * Get OS-specific activation command for virtual environments
 */
function getVenvActivateCommand(venvPath = 'venv') {
  if (isWindows) {
    return `${venvPath}\\Scripts\\activate`;
  }
  return `source ${venvPath}/bin/activate`;
}

/**
 * Get OS-specific copy command
 */
function getCopyCommand(source, dest) {
  if (isWindows) {
    return `copy ${source} ${dest}`;
  }
  return `cp ${source} ${dest}`;
}

/**
 * Get OS-specific remove command
 */
function getRemoveCommand(target, recursive = false) {
  if (isWindows) {
    return recursive ? `rmdir /s /q ${target}` : `del ${target}`;
  }
  return recursive ? `rm -rf ${target}` : `rm ${target}`;
}

/**
 * Normalize path for display
 */
function normalizePath(p) {
  return path.normalize(p);
}

/**
 * Get platform info for diagnostics
 */
function getPlatformInfo() {
  return {
    platform: platform,
    arch: os.arch(),
    release: os.release(),
    type: os.type(),
    version: os.version ? os.version() : 'unknown',
    homedir: os.homedir(),
    tmpdir: os.tmpdir(),
    cpus: os.cpus().length,
    memory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB'
  };
}

/**
 * Get shell being used
 */
function getShell() {
  if (isWindows) {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/sh';
}

/**
 * Check if running as administrator/root
 */
function isElevated() {
  if (isWindows) {
    try {
      require('child_process').execSync('net session', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  return process.getuid && process.getuid() === 0;
}

module.exports = {
  platform,
  isWindows,
  isMac,
  isLinux,
  getCommand,
  getPathSeparator,
  getHomeDir,
  getVenvActivateCommand,
  getCopyCommand,
  getRemoveCommand,
  normalizePath,
  getPlatformInfo,
  getShell,
  isElevated
};
