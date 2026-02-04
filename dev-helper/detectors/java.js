/**
 * Java Project Detector
 * ✅ SAFE: Uses only file reads and version checks
 * ❌ NEVER executes: java, mvn, gradle, etc.
 */
const BaseDetector = require('./base');
const { fileExists, readFile, directoryExists, commandExists, getCommandVersion, safeRunCommand } = require('../utils/runner');
const { extractVersion } = require('../utils/version');

class JavaDetector extends BaseDetector {
  constructor() {
    super();
    this.name = 'Java';
    this.type = 'java';
    this.configFiles = ['pom.xml', 'build.gradle', 'build.gradle.kts'];
    this.runtimeCommand = 'java';
  }

  detect(dir) {
    return fileExists('pom.xml', dir) ||
           fileExists('build.gradle', dir) ||
           fileExists('build.gradle.kts', dir);
  }

  analyze(dir) {
    const buildTool = this.detectBuildTool(dir);
    
    return {
      detected: true,
      name: this.name,
      type: this.type,
      buildTool: buildTool,
      framework: this.detectFramework(dir),
      hasTarget: directoryExists('target', dir),
      hasBuild: directoryExists('build', dir),
      projectName: this.detectProjectName(dir, buildTool)
    };
  }

  detectBuildTool(dir) {
    if (fileExists('pom.xml', dir)) return 'maven';
    if (fileExists('build.gradle', dir) || fileExists('build.gradle.kts', dir)) return 'gradle';
    return 'unknown';
  }

  detectFramework(dir) {
    const pom = readFile('pom.xml', dir) || '';
    const gradle = readFile('build.gradle', dir) || readFile('build.gradle.kts', dir) || '';
    const combined = pom + gradle;

    if (combined.includes('spring-boot')) return 'Spring Boot';
    if (combined.includes('spring')) return 'Spring';
    if (combined.includes('quarkus')) return 'Quarkus';
    if (combined.includes('micronaut')) return 'Micronaut';
    if (combined.includes('jakarta.ee') || combined.includes('javax.servlet')) return 'Jakarta EE';
    if (combined.includes('android')) return 'Android';
    if (combined.includes('javafx')) return 'JavaFX';

    return null;
  }

  detectProjectName(dir, buildTool) {
    if (buildTool === 'maven') {
      const pom = readFile('pom.xml', dir);
      if (pom) {
        const match = pom.match(/<artifactId>([^<]+)<\/artifactId>/);
        if (match) return match[1];
      }
    }
    return 'unknown';
  }

  getChecks() {
    return [
      {
        id: 'java-installed',
        name: 'Java installed',
        check: () => commandExists('java'),
        getVersion: () => {
          // ✅ SAFE: java -version is on the allowlist
          const result = safeRunCommand('java -version 2>&1');
          if (result.stdout || result.stderr) {
            const output = result.stdout || result.stderr;
            const match = output.match(/version "([^"]+)"/);
            return match ? match[1] : extractVersion(output);
          }
          return null;
        },
        fix: 'Install Java from https://adoptium.net'
      },
      {
        id: 'javac-installed',
        name: 'Java compiler installed',
        check: () => commandExists('javac'),
        fix: 'Install JDK (not just JRE) from https://adoptium.net'
      },
      {
        id: 'maven-installed',
        name: 'Maven installed',
        check: (dir, analysis) => {
          if (analysis?.buildTool !== 'maven') return 'skip';
          return commandExists('mvn');
        },
        getVersion: () => {
          const output = getCommandVersion('mvn');
          return extractVersion(output);
        },
        fix: 'Install Maven from https://maven.apache.org'
      },
      {
        id: 'gradle-installed',
        name: 'Gradle installed',
        check: (dir, analysis) => {
          if (analysis?.buildTool !== 'gradle') return 'skip';
          // Check for Gradle wrapper first
          if (fileExists('gradlew', dir) || fileExists('gradlew.bat', dir)) return true;
          return commandExists('gradle');
        },
        getVersion: () => {
          const output = getCommandVersion('gradle');
          return extractVersion(output);
        },
        fix: 'Use ./gradlew (Gradle wrapper) or install Gradle from https://gradle.org'
      },
      {
        id: 'project-built',
        name: 'Project compiled',
        check: (dir, analysis) => {
          if (analysis?.buildTool === 'maven') return directoryExists('target/classes', dir);
          if (analysis?.buildTool === 'gradle') return directoryExists('build/classes', dir);
          return false;
        },
        fix: (analysis) => {
          if (analysis?.buildTool === 'maven') return 'mvn compile';
          if (analysis?.buildTool === 'gradle') return './gradlew build (or gradle build)';
          return 'Build the project';
        }
      }
    ];
  }
}

module.exports = JavaDetector;
