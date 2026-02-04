/**
 * C/C++ Project Detector
 * ✅ SAFE: Uses only file reads and version checks
 * ❌ NEVER executes: make, cmake build, gcc, etc.
 */
const BaseDetector = require('./base');
const { fileExists, readFile, directoryExists, commandExists, getCommandVersion } = require('../utils/runner');
const { extractVersion } = require('../utils/version');

class CppDetector extends BaseDetector {
  constructor() {
    super();
    this.name = 'C/C++';
    this.type = 'cpp';
    this.configFiles = ['CMakeLists.txt', 'Makefile', 'makefile', 'meson.build'];
    this.runtimeCommand = 'g++';
  }

  detect(dir) {
    return fileExists('CMakeLists.txt', dir) ||
           fileExists('Makefile', dir) ||
           fileExists('makefile', dir) ||
           fileExists('meson.build', dir) ||
           fileExists('configure', dir) ||
           fileExists('configure.ac', dir);
  }

  analyze(dir) {
    return {
      detected: true,
      name: this.name,
      type: this.type,
      buildSystem: this.detectBuildSystem(dir),
      hasBuildDir: directoryExists('build', dir),
      projectName: this.extractProjectName(dir)
    };
  }

  detectBuildSystem(dir) {
    if (fileExists('CMakeLists.txt', dir)) return 'cmake';
    if (fileExists('meson.build', dir)) return 'meson';
    if (fileExists('configure.ac', dir) || fileExists('configure.in', dir)) return 'autotools';
    if (fileExists('configure', dir)) return 'configure';
    if (fileExists('Makefile', dir) || fileExists('makefile', dir)) return 'make';
    return 'unknown';
  }

  extractProjectName(dir) {
    const cmakeLists = readFile('CMakeLists.txt', dir);
    if (cmakeLists) {
      const match = cmakeLists.match(/project\s*\(\s*(\w+)/i);
      if (match) return match[1];
    }
    return 'unknown';
  }

  getChecks() {
    return [
      {
        id: 'compiler-installed',
        name: 'C++ compiler installed',
        check: () => commandExists('g++') || commandExists('clang++') || commandExists('cl'),
        getVersion: () => {
          const output = getCommandVersion('g++') || getCommandVersion('clang++');
          return extractVersion(output);
        },
        fix: 'Install a C++ compiler (g++, clang++, or MSVC)'
      },
      {
        id: 'cmake-installed',
        name: 'CMake installed',
        check: (dir, analysis) => {
          if (analysis?.buildSystem !== 'cmake') return 'skip';
          return commandExists('cmake');
        },
        getVersion: () => {
          const output = getCommandVersion('cmake');
          return extractVersion(output);
        },
        fix: 'Install CMake from https://cmake.org'
      },
      {
        id: 'make-installed',
        name: 'Make installed',
        check: () => commandExists('make') || commandExists('mingw32-make') || commandExists('nmake'),
        fix: 'Install Make (or use CMake with another generator)'
      },
      {
        id: 'build-dir-created',
        name: 'Build directory exists',
        check: (dir, analysis) => {
          if (analysis?.buildSystem === 'cmake') {
            return directoryExists('build', dir);
          }
          return 'skip';
        },
        fix: 'mkdir build && cd build && cmake ..'
      }
    ];
  }
}

module.exports = CppDetector;
