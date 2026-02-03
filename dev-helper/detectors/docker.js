const BaseDetector = require('./base');
const { fileExists, readFile, directoryExists, commandExists, getCommandVersion } = require('../utils/runner');
const { extractVersion } = require('../utils/version');

class DockerDetector extends BaseDetector {
  constructor() {
    super();
    this.name = 'Docker';
    this.type = 'docker';
    this.configFiles = ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];
    this.runtimeCommand = 'docker';
  }

  detect(dir) {
    return fileExists('Dockerfile', dir) ||
           fileExists('docker-compose.yml', dir) ||
           fileExists('docker-compose.yaml', dir) ||
           fileExists('compose.yml', dir) ||
           fileExists('compose.yaml', dir);
  }

  analyze(dir) {
    return {
      detected: true,
      name: this.name,
      type: this.type,
      hasDockerfile: fileExists('Dockerfile', dir),
      hasCompose: this.hasComposeFile(dir),
      composeFile: this.getComposeFile(dir),
      baseImage: this.extractBaseImage(dir),
      services: this.extractServices(dir)
    };
  }

  hasComposeFile(dir) {
    return fileExists('docker-compose.yml', dir) ||
           fileExists('docker-compose.yaml', dir) ||
           fileExists('compose.yml', dir) ||
           fileExists('compose.yaml', dir);
  }

  getComposeFile(dir) {
    if (fileExists('docker-compose.yml', dir)) return 'docker-compose.yml';
    if (fileExists('docker-compose.yaml', dir)) return 'docker-compose.yaml';
    if (fileExists('compose.yml', dir)) return 'compose.yml';
    if (fileExists('compose.yaml', dir)) return 'compose.yaml';
    return null;
  }

  extractBaseImage(dir) {
    const dockerfile = readFile('Dockerfile', dir);
    if (dockerfile) {
      const match = dockerfile.match(/FROM\s+([^\s]+)/i);
      if (match) return match[1];
    }
    return null;
  }

  extractServices(dir) {
    const composeFile = this.getComposeFile(dir);
    if (!composeFile) return [];
    
    const content = readFile(composeFile, dir);
    if (!content) return [];
    
    // Simple YAML parsing for services
    const services = [];
    const matches = content.matchAll(/^\s{2}(\w[\w-]*):\s*$/gm);
    for (const match of matches) {
      services.push(match[1]);
    }
    return services;
  }

  getChecks() {
    return [
      {
        id: 'docker-installed',
        name: 'Docker installed',
        check: () => commandExists('docker'),
        getVersion: () => {
          const output = getCommandVersion('docker');
          return extractVersion(output);
        },
        fix: 'Install Docker from https://docker.com/get-started'
      },
      {
        id: 'docker-running',
        name: 'Docker daemon running',
        check: () => {
          const { runCommand } = require('../utils/runner');
          const result = runCommand('docker info');
          return result.success;
        },
        fix: 'Start Docker Desktop or the Docker daemon'
      },
      {
        id: 'docker-compose-installed',
        name: 'Docker Compose available',
        check: (dir, analysis) => {
          if (!analysis?.hasCompose) return 'skip';
          // Modern Docker includes compose as a subcommand
          const { runCommand } = require('../utils/runner');
          const result = runCommand('docker compose version');
          return result.success || commandExists('docker-compose');
        },
        fix: 'Docker Compose is included in Docker Desktop, or install separately'
      }
    ];
  }
}

module.exports = DockerDetector;
