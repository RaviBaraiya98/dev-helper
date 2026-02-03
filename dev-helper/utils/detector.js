const fs = require('fs');
const path = require('path');

/**
 * Legacy detector - kept for backward compatibility
 * The new modular detector system is in /detectors
 */

/**
 * Detect the project type based on configuration files in the current directory
 * @returns {string|null} Project type identifier or null
 */
function detectProjectType() {
  const cwd = process.cwd();

  // Check for Node.js project
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    return 'nodejs';
  }

  // Check for Python project
  if (fs.existsSync(path.join(cwd, 'requirements.txt')) || 
      fs.existsSync(path.join(cwd, 'pyproject.toml')) ||
      fs.existsSync(path.join(cwd, 'setup.py')) ||
      fs.existsSync(path.join(cwd, 'Pipfile'))) {
    return 'python';
  }

  // Check for Java/Maven project
  if (fs.existsSync(path.join(cwd, 'pom.xml'))) {
    return 'java-maven';
  }

  // Check for Java/Gradle project
  if (fs.existsSync(path.join(cwd, 'build.gradle')) ||
      fs.existsSync(path.join(cwd, 'build.gradle.kts'))) {
    return 'java-gradle';
  }

  // Check for Go project
  if (fs.existsSync(path.join(cwd, 'go.mod'))) {
    return 'go';
  }

  // Check for Rust project
  if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) {
    return 'rust';
  }

  // Check for .NET project
  const files = fs.readdirSync(cwd);
  if (files.some(f => f.endsWith('.csproj') || f.endsWith('.fsproj') || f.endsWith('.sln'))) {
    return 'dotnet';
  }

  // Check for PHP project
  if (fs.existsSync(path.join(cwd, 'composer.json'))) {
    return 'php';
  }

  // Check for C/C++ project
  if (fs.existsSync(path.join(cwd, 'CMakeLists.txt'))) {
    return 'cpp-cmake';
  }
  if (fs.existsSync(path.join(cwd, 'Makefile')) || fs.existsSync(path.join(cwd, 'makefile'))) {
    return 'cpp-make';
  }

  // Check for Flutter project
  if (fs.existsSync(path.join(cwd, 'pubspec.yaml'))) {
    return 'flutter';
  }

  // Check for Docker project
  if (fs.existsSync(path.join(cwd, 'Dockerfile')) ||
      fs.existsSync(path.join(cwd, 'docker-compose.yml')) ||
      fs.existsSync(path.join(cwd, 'docker-compose.yaml'))) {
    return 'docker';
  }

  return null;
}

/**
 * Detect all project types in a directory (multi-project support)
 * @param {string} dir - Directory to scan
 * @returns {string[]} Array of detected project types
 */
function detectAllProjectTypes(dir = process.cwd()) {
  const types = [];
  
  if (fs.existsSync(path.join(dir, 'package.json'))) types.push('nodejs');
  if (fs.existsSync(path.join(dir, 'requirements.txt')) || 
      fs.existsSync(path.join(dir, 'pyproject.toml')) ||
      fs.existsSync(path.join(dir, 'Pipfile'))) types.push('python');
  if (fs.existsSync(path.join(dir, 'pom.xml'))) types.push('java-maven');
  if (fs.existsSync(path.join(dir, 'build.gradle')) ||
      fs.existsSync(path.join(dir, 'build.gradle.kts'))) types.push('java-gradle');
  if (fs.existsSync(path.join(dir, 'go.mod'))) types.push('go');
  if (fs.existsSync(path.join(dir, 'Cargo.toml'))) types.push('rust');
  if (fs.existsSync(path.join(dir, 'composer.json'))) types.push('php');
  if (fs.existsSync(path.join(dir, 'CMakeLists.txt'))) types.push('cpp-cmake');
  if (fs.existsSync(path.join(dir, 'Makefile'))) types.push('cpp-make');
  if (fs.existsSync(path.join(dir, 'pubspec.yaml'))) types.push('flutter');
  if (fs.existsSync(path.join(dir, 'Dockerfile'))) types.push('docker');
  
  try {
    const files = fs.readdirSync(dir);
    if (files.some(f => f.endsWith('.csproj') || f.endsWith('.fsproj') || f.endsWith('.sln'))) {
      types.push('dotnet');
    }
  } catch {}
  
  return types;
}

module.exports = {
  detectProjectType,
  detectAllProjectTypes
};
