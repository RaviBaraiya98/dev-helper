const BaseDetector = require('./base');
const { fileExists, readFile, directoryExists, commandExists, getCommandVersion } = require('../utils/runner');
const { extractVersion } = require('../utils/version');

class FlutterDetector extends BaseDetector {
  constructor() {
    super();
    this.name = 'Flutter';
    this.type = 'flutter';
    this.configFiles = ['pubspec.yaml'];
    this.runtimeCommand = 'flutter';
    this.packageManager = 'pub';
  }

  detect(dir) {
    // Flutter projects have pubspec.yaml with flutter dependency
    if (!fileExists('pubspec.yaml', dir)) return false;
    
    const pubspec = readFile('pubspec.yaml', dir) || '';
    return pubspec.includes('flutter:') || pubspec.includes('flutter_test:');
  }

  analyze(dir) {
    const pubspec = readFile('pubspec.yaml', dir) || '';
    
    return {
      detected: true,
      name: this.name,
      type: this.type,
      projectName: this.extractProjectName(pubspec),
      version: this.extractVersion(pubspec),
      hasPackages: directoryExists('.dart_tool', dir),
      hasPubspecLock: fileExists('pubspec.lock', dir),
      platforms: this.detectPlatforms(dir)
    };
  }

  extractProjectName(pubspec) {
    const match = pubspec.match(/name:\s*(.+)/);
    return match ? match[1].trim() : 'unknown';
  }

  extractVersion(pubspec) {
    const match = pubspec.match(/version:\s*(.+)/);
    return match ? match[1].trim() : null;
  }

  detectPlatforms(dir) {
    const platforms = [];
    if (directoryExists('android', dir)) platforms.push('Android');
    if (directoryExists('ios', dir)) platforms.push('iOS');
    if (directoryExists('web', dir)) platforms.push('Web');
    if (directoryExists('macos', dir)) platforms.push('macOS');
    if (directoryExists('windows', dir)) platforms.push('Windows');
    if (directoryExists('linux', dir)) platforms.push('Linux');
    return platforms;
  }

  getChecks() {
    return [
      {
        id: 'flutter-installed',
        name: 'Flutter installed',
        check: () => commandExists('flutter'),
        getVersion: () => {
          const output = getCommandVersion('flutter');
          return extractVersion(output);
        },
        fix: 'Install Flutter from https://flutter.dev/docs/get-started/install'
      },
      {
        id: 'dart-installed',
        name: 'Dart installed',
        check: () => commandExists('dart'),
        getVersion: () => {
          const output = getCommandVersion('dart');
          return extractVersion(output);
        },
        fix: 'Dart comes with Flutter - reinstall Flutter'
      },
      {
        id: 'dependencies-installed',
        name: 'Dependencies installed',
        check: (dir) => directoryExists('.dart_tool', dir),
        fix: 'flutter pub get'
      },
      {
        id: 'flutter-doctor',
        name: 'Flutter environment',
        check: () => 'manual',
        fix: 'Run "flutter doctor" to check your Flutter setup'
      }
    ];
  }
}

module.exports = FlutterDetector;
