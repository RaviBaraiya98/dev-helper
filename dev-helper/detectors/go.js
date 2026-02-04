/**
 * Go Project Detector
 * ✅ SAFE: Uses only file reads and version checks
 * ❌ NEVER executes: go run, go build, etc.
 */
const BaseDetector = require('./base');
const { fileExists, readFile, commandExists, getCommandVersion } = require('../utils/runner');
const { extractVersion } = require('../utils/version');

class GoDetector extends BaseDetector {
  constructor() {
    super();
    this.name = 'Go';
    this.type = 'go';
    this.configFiles = ['go.mod'];
    this.runtimeCommand = 'go';
  }

  detect(dir) {
    return fileExists('go.mod', dir);
  }

  analyze(dir) {
    const goMod = readFile('go.mod', dir) || '';
    
    return {
      detected: true,
      name: this.name,
      type: this.type,
      moduleName: this.extractModuleName(goMod),
      goVersion: this.extractGoVersion(goMod),
      framework: this.detectFramework(dir),
      hasVendor: fileExists('vendor', dir),
      hasGoSum: fileExists('go.sum', dir)
    };
  }

  extractModuleName(goMod) {
    const match = goMod.match(/module\s+(.+)/);
    return match ? match[1].trim() : 'unknown';
  }

  extractGoVersion(goMod) {
    const match = goMod.match(/go\s+(\d+\.\d+)/);
    return match ? match[1] : null;
  }

  detectFramework(dir) {
    const goMod = readFile('go.mod', dir) || '';
    
    if (goMod.includes('github.com/gin-gonic/gin')) return 'Gin';
    if (goMod.includes('github.com/gofiber/fiber')) return 'Fiber';
    if (goMod.includes('github.com/labstack/echo')) return 'Echo';
    if (goMod.includes('github.com/gorilla/mux')) return 'Gorilla Mux';
    if (goMod.includes('github.com/beego/beego')) return 'Beego';
    if (goMod.includes('github.com/revel/revel')) return 'Revel';
    
    return null;
  }

  getChecks() {
    return [
      {
        id: 'go-installed',
        name: 'Go installed',
        check: () => commandExists('go'),
        getVersion: () => {
          const output = getCommandVersion('go', 'version');
          return extractVersion(output);
        },
        fix: 'Install Go from https://go.dev/dl/'
      },
      {
        id: 'go-mod-tidy',
        name: 'Dependencies synchronized',
        check: (dir) => fileExists('go.sum', dir),
        fix: 'go mod tidy'
      },
      {
        id: 'go-build',
        name: 'Project compiles',
        check: () => {
          // We could run go build here but it might be slow
          return 'skip'; // Let user verify
        },
        fix: 'go build ./...'
      }
    ];
  }
}

module.exports = GoDetector;
