const BaseDetector = require('./base');
const { fileExists, readFile, directoryExists, commandExists, getCommandVersion } = require('../utils/runner');
const { extractVersion } = require('../utils/version');

class RustDetector extends BaseDetector {
  constructor() {
    super();
    this.name = 'Rust';
    this.type = 'rust';
    this.configFiles = ['Cargo.toml'];
    this.runtimeCommand = 'rustc';
    this.packageManager = 'cargo';
  }

  detect(dir) {
    return fileExists('Cargo.toml', dir);
  }

  analyze(dir) {
    const cargoToml = readFile('Cargo.toml', dir) || '';
    
    return {
      detected: true,
      name: this.name,
      type: this.type,
      projectName: this.extractProjectName(cargoToml),
      version: this.extractVersion(cargoToml),
      framework: this.detectFramework(dir),
      hasLockFile: fileExists('Cargo.lock', dir),
      hasTarget: directoryExists('target', dir),
      isWorkspace: cargoToml.includes('[workspace]')
    };
  }

  extractProjectName(cargoToml) {
    const match = cargoToml.match(/name\s*=\s*"([^"]+)"/);
    return match ? match[1] : 'unknown';
  }

  extractVersion(cargoToml) {
    const match = cargoToml.match(/version\s*=\s*"([^"]+)"/);
    return match ? match[1] : null;
  }

  detectFramework(dir) {
    const cargoToml = readFile('Cargo.toml', dir) || '';
    
    if (cargoToml.includes('actix-web')) return 'Actix Web';
    if (cargoToml.includes('rocket')) return 'Rocket';
    if (cargoToml.includes('axum')) return 'Axum';
    if (cargoToml.includes('warp')) return 'Warp';
    if (cargoToml.includes('tide')) return 'Tide';
    if (cargoToml.includes('tauri')) return 'Tauri';
    if (cargoToml.includes('yew')) return 'Yew';
    if (cargoToml.includes('leptos')) return 'Leptos';
    if (cargoToml.includes('tokio')) return 'Tokio (async runtime)';
    
    return null;
  }

  getChecks() {
    return [
      {
        id: 'rust-installed',
        name: 'Rust installed',
        check: () => commandExists('rustc'),
        getVersion: () => {
          const output = getCommandVersion('rustc');
          return extractVersion(output);
        },
        fix: 'Install Rust from https://rustup.rs'
      },
      {
        id: 'cargo-installed',
        name: 'Cargo installed',
        check: () => commandExists('cargo'),
        getVersion: () => {
          const output = getCommandVersion('cargo');
          return extractVersion(output);
        },
        fix: 'Cargo comes with Rust - install from https://rustup.rs'
      },
      {
        id: 'dependencies-fetched',
        name: 'Dependencies fetched',
        check: (dir) => fileExists('Cargo.lock', dir),
        fix: 'cargo fetch'
      },
      {
        id: 'project-built',
        name: 'Project compiled',
        check: (dir) => directoryExists('target/debug', dir) || directoryExists('target/release', dir),
        fix: 'cargo build'
      }
    ];
  }
}

module.exports = RustDetector;
