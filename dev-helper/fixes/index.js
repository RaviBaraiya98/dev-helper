/**
 * Fix suggestion templates
 * Provides consistent fix suggestions across all checkers
 */

const { isWindows, getCopyCommand, getVenvActivateCommand } = require('../utils/platform');

/**
 * Common fix templates
 */
const fixes = {
  // Node.js
  installNode: 'Install Node.js from https://nodejs.org',
  installNpm: 'npm comes with Node.js - reinstall Node.js',
  npmInstall: 'npm install',
  yarnInstall: 'yarn install',
  pnpmInstall: 'pnpm install',
  bunInstall: 'bun install',
  
  // Python
  installPython: 'Install Python from https://python.org',
  createVenv: (pythonCmd = 'python') => `${pythonCmd} -m venv venv`,
  activateVenv: (venvPath = 'venv') => getVenvActivateCommand(venvPath),
  pipInstall: 'pip install -r requirements.txt',
  poetryInstall: 'poetry install',
  pipenvInstall: 'pipenv install',
  
  // Java
  installJava: 'Install Java from https://adoptium.net',
  installMaven: 'Install Maven from https://maven.apache.org',
  mvnInstall: 'mvn install',
  mvnCompile: 'mvn compile',
  gradleBuild: './gradlew build (or gradle build)',
  
  // Go
  installGo: 'Install Go from https://go.dev/dl/',
  goModTidy: 'go mod tidy',
  goBuild: 'go build ./...',
  
  // Rust
  installRust: 'Install Rust from https://rustup.rs',
  cargoFetch: 'cargo fetch',
  cargoBuild: 'cargo build',
  
  // .NET
  installDotnet: 'Install .NET SDK from https://dotnet.microsoft.com/download',
  dotnetRestore: 'dotnet restore',
  dotnetBuild: 'dotnet build',
  
  // PHP
  installPhp: 'Install PHP from https://php.net',
  installComposer: 'Install Composer from https://getcomposer.org',
  composerInstall: 'composer install',
  
  // C++
  installCmake: 'Install CMake from https://cmake.org',
  cmakeBuild: 'mkdir build && cd build && cmake .. && make',
  
  // Docker
  installDocker: 'Install Docker from https://docker.com/get-started',
  startDocker: 'Start Docker Desktop or the Docker daemon',
  
  // Git
  installGit: 'Install Git from https://git-scm.com',
  gitInit: 'git init',
  
  // Environment files
  copyEnv: (source, dest = '.env') => getCopyCommand(source, dest)
};

/**
 * Get platform-specific fix
 */
function getPlatformFix(fix) {
  if (typeof fix === 'object') {
    if (isWindows && fix.win) return fix.win;
    if (fix.unix) return fix.unix;
    return fix.default || fix.unix;
  }
  return fix;
}

/**
 * Format a fix for display
 */
function formatFix(fix, context = {}) {
  if (typeof fix === 'function') {
    return fix(context);
  }
  return getPlatformFix(fix);
}

module.exports = {
  fixes,
  getPlatformFix,
  formatFix
};
