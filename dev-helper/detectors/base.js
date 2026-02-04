/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      BASE DETECTOR - SAFETY RULES                         ║
 * ║                                                                           ║
 * ║  All detectors MUST follow these rules:                                   ║
 * ║                                                                           ║
 * ║  ALLOWED:                                                                 ║
 * ║    ✅ Read files (readFile, readJsonFile, fileExists)                     ║
 * ║    ✅ Check directory structure (directoryExists, listFiles)              ║
 * ║    ✅ Check tool versions (commandExists, getCommandVersion)              ║
 * ║    ✅ Parse configuration files                                           ║
 * ║                                                                           ║
 * ║  FORBIDDEN:                                                               ║
 * ║    ❌ Execute project code (npm start, python app.py, etc.)               ║
 * ║    ❌ Run build commands (npm run build, mvn compile, etc.)               ║
 * ║    ❌ Install dependencies                                                ║
 * ║    ❌ Start servers or open ports                                         ║
 * ║    ❌ Modify any files                                                    ║
 * ║                                                                           ║
 * ║  All command execution is routed through safeRunCommand which             ║
 * ║  enforces a strict allowlist. Violations are automatically blocked.       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */
class BaseDetector {
  constructor() {
    this.name = 'Base';
    this.type = 'unknown';
    this.configFiles = [];
    this.runtimeCommand = null;
    this.packageManager = null;
  }

  /**
   * Check if this detector matches the current project
   * @param {string} dir - Directory to check
   * @returns {boolean}
   */
  detect(dir) {
    throw new Error('detect() must be implemented by subclass');
  }

  /**
   * Get detailed information about the detected project
   * @param {string} dir - Directory to analyze
   * @returns {object} Detection result with metadata
   */
  analyze(dir) {
    throw new Error('analyze() must be implemented by subclass');
  }

  /**
   * Get checks to run for this project type
   * @returns {object[]} Array of check definitions
   */
  getChecks() {
    return [];
  }

  /**
   * Get the framework detected (if any)
   * @param {string} dir - Directory to check
   * @returns {string|null} Framework name
   */
  detectFramework(dir) {
    return null;
  }
}

module.exports = BaseDetector;
