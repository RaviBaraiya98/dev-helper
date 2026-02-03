/**
 * Base Detector class
 * All language/framework detectors extend this class
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
