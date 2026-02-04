/**
 * Node.js Project Detector
 * ✅ SAFE: Uses only file reads and version checks
 * ❌ NEVER executes: npm start, npm run, node, etc.
 */
const BaseDetector = require('./base');
const { fileExists, readJsonFile, directoryExists, commandExists, getCommandVersion } = require('../utils/runner');
const { extractVersion } = require('../utils/version');

class NodeJSDetector extends BaseDetector {
  constructor() {
    super();
    this.name = 'Node.js';
    this.type = 'nodejs';
    this.configFiles = ['package.json'];
    this.runtimeCommand = 'node';
    this.packageManagers = ['npm', 'yarn', 'pnpm', 'bun'];
  }

  detect(dir) {
    return fileExists('package.json', dir);
  }

  analyze(dir) {
    const packageJson = readJsonFile('package.json', dir);
    if (!packageJson) {
      return { detected: false };
    }

    const result = {
      detected: true,
      name: this.name,
      type: this.type,
      projectName: packageJson.name || 'unknown',
      version: packageJson.version || 'unknown',
      framework: this.detectFramework(dir, packageJson),
      packageManager: this.detectPackageManager(dir),
      hasDependencies: directoryExists('node_modules', dir),
      scripts: packageJson.scripts || {},
      engines: packageJson.engines || {},
      dependencies: Object.keys(packageJson.dependencies || {}),
      devDependencies: Object.keys(packageJson.devDependencies || {})
    };

    // Detect runtime (Node, Bun, Deno)
    result.runtime = this.detectRuntime(dir, packageJson);

    return result;
  }

  detectFramework(dir, packageJson = null) {
    const pkg = packageJson || readJsonFile('package.json', dir);
    if (!pkg) return null;

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };

    // Check for popular frameworks
    if (allDeps['next']) return 'Next.js';
    if (allDeps['nuxt']) return 'Nuxt.js';
    if (allDeps['@angular/core']) return 'Angular';
    if (allDeps['vue']) return 'Vue.js';
    if (allDeps['react']) {
      if (allDeps['gatsby']) return 'Gatsby';
      if (allDeps['react-native']) return 'React Native';
      if (allDeps['vite']) return 'React + Vite';
      if (allDeps['react-scripts']) return 'Create React App';
      return 'React';
    }
    if (allDeps['svelte']) return 'Svelte';
    if (allDeps['express']) return 'Express.js';
    if (allDeps['fastify']) return 'Fastify';
    if (allDeps['koa']) return 'Koa';
    if (allDeps['hapi'] || allDeps['@hapi/hapi']) return 'Hapi';
    if (allDeps['nest'] || allDeps['@nestjs/core']) return 'NestJS';
    if (allDeps['electron']) return 'Electron';
    if (allDeps['vite']) return 'Vite';

    return null;
  }

  detectPackageManager(dir) {
    if (fileExists('bun.lockb', dir)) return 'bun';
    if (fileExists('pnpm-lock.yaml', dir)) return 'pnpm';
    if (fileExists('yarn.lock', dir)) return 'yarn';
    if (fileExists('package-lock.json', dir)) return 'npm';
    return 'npm'; // Default
  }

  detectRuntime(dir, packageJson) {
    // Check for Bun
    if (fileExists('bun.lockb', dir) || fileExists('bunfig.toml', dir)) {
      return 'bun';
    }
    
    // Check for Deno
    if (fileExists('deno.json', dir) || fileExists('deno.jsonc', dir)) {
      return 'deno';
    }

    return 'node';
  }

  getChecks() {
    return [
      {
        id: 'node-installed',
        name: 'Node.js installed',
        check: () => commandExists('node'),
        getVersion: () => {
          const output = getCommandVersion('node');
          return extractVersion(output);
        },
        fix: 'Install Node.js from https://nodejs.org'
      },
      {
        id: 'npm-installed',
        name: 'npm installed',
        check: () => commandExists('npm'),
        getVersion: () => {
          const output = getCommandVersion('npm');
          return extractVersion(output);
        },
        fix: 'npm comes with Node.js - reinstall Node.js'
      },
      {
        id: 'dependencies-installed',
        name: 'Dependencies installed',
        check: (dir) => directoryExists('node_modules', dir),
        fix: (analysis) => `${analysis.packageManager || 'npm'} install`
      },
      {
        id: 'start-script',
        name: 'Start script defined',
        check: (dir) => {
          const pkg = readJsonFile('package.json', dir);
          return pkg && pkg.scripts && (pkg.scripts.start || pkg.scripts.dev);
        },
        getScript: (dir) => {
          const pkg = readJsonFile('package.json', dir);
          if (pkg?.scripts?.start) return 'npm start';
          if (pkg?.scripts?.dev) return 'npm run dev';
          return null;
        },
        fix: 'Add a "start" or "dev" script to package.json'
      },
      {
        id: 'env-file',
        name: 'Environment configuration',
        check: (dir) => {
          if (fileExists('.env', dir)) return true;
          return !fileExists('.env.example', dir) && !fileExists('.env.sample', dir);
        },
        fix: (analysis, dir) => {
          if (fileExists('.env.example', dir)) return 'Copy .env.example to .env';
          if (fileExists('.env.sample', dir)) return 'Copy .env.sample to .env';
          return null;
        }
      }
    ];
  }
}

module.exports = NodeJSDetector;
