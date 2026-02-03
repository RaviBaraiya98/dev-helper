const BaseDetector = require('./base');
const { fileExists, readJsonFile, directoryExists, commandExists, getCommandVersion } = require('../utils/runner');
const { extractVersion } = require('../utils/version');

class PHPDetector extends BaseDetector {
  constructor() {
    super();
    this.name = 'PHP';
    this.type = 'php';
    this.configFiles = ['composer.json'];
    this.runtimeCommand = 'php';
    this.packageManager = 'composer';
  }

  detect(dir) {
    return fileExists('composer.json', dir);
  }

  analyze(dir) {
    const composerJson = readJsonFile('composer.json', dir) || {};
    
    return {
      detected: true,
      name: this.name,
      type: this.type,
      projectName: composerJson.name || 'unknown',
      framework: this.detectFramework(dir, composerJson),
      hasVendor: directoryExists('vendor', dir),
      hasLockFile: fileExists('composer.lock', dir),
      phpVersion: composerJson.require?.php || null
    };
  }

  detectFramework(dir, composerJson = null) {
    const composer = composerJson || readJsonFile('composer.json', dir) || {};
    const allDeps = { ...composer.require, ...composer['require-dev'] };
    
    if (allDeps['laravel/framework']) return 'Laravel';
    if (allDeps['symfony/framework-bundle']) return 'Symfony';
    if (allDeps['slim/slim']) return 'Slim';
    if (allDeps['cakephp/cakephp']) return 'CakePHP';
    if (allDeps['codeigniter4/framework']) return 'CodeIgniter';
    if (allDeps['yiisoft/yii2']) return 'Yii';
    if (allDeps['wordpress']) return 'WordPress';
    if (fileExists('wp-config.php', dir)) return 'WordPress';
    
    return null;
  }

  getChecks() {
    return [
      {
        id: 'php-installed',
        name: 'PHP installed',
        check: () => commandExists('php'),
        getVersion: () => {
          const output = getCommandVersion('php');
          return extractVersion(output);
        },
        fix: 'Install PHP from https://php.net or use a package manager'
      },
      {
        id: 'composer-installed',
        name: 'Composer installed',
        check: () => commandExists('composer'),
        getVersion: () => {
          const output = getCommandVersion('composer');
          return extractVersion(output);
        },
        fix: 'Install Composer from https://getcomposer.org'
      },
      {
        id: 'dependencies-installed',
        name: 'Dependencies installed',
        check: (dir) => directoryExists('vendor', dir),
        fix: 'composer install'
      },
      {
        id: 'autoload-generated',
        name: 'Autoload configured',
        check: (dir) => fileExists('vendor/autoload.php', dir),
        fix: 'composer dump-autoload'
      }
    ];
  }
}

module.exports = PHPDetector;
