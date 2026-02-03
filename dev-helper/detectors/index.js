/**
 * Detector Registry
 * Central registry for all language/framework detectors
 */

const NodeJSDetector = require('./nodejs');
const PythonDetector = require('./python');
const JavaDetector = require('./java');
const GoDetector = require('./go');
const RustDetector = require('./rust');
const DotNetDetector = require('./dotnet');
const PHPDetector = require('./php');
const CppDetector = require('./cpp');
const FlutterDetector = require('./flutter');
const DockerDetector = require('./docker');

// Registry of all available detectors
const detectors = [
  new NodeJSDetector(),
  new PythonDetector(),
  new JavaDetector(),
  new GoDetector(),
  new RustDetector(),
  new DotNetDetector(),
  new PHPDetector(),
  new CppDetector(),
  new FlutterDetector(),
  new DockerDetector()
];

/**
 * Detect all project types in a directory
 * @param {string} dir - Directory to scan
 * @returns {object[]} Array of detection results
 */
function detectAll(dir = process.cwd()) {
  const results = [];
  
  for (const detector of detectors) {
    try {
      if (detector.detect(dir)) {
        const analysis = detector.analyze(dir);
        results.push({
          detector: detector,
          analysis: analysis,
          checks: detector.getChecks()
        });
      }
    } catch (error) {
      // Silently skip failed detectors
      console.error(`Detector ${detector.name} failed:`, error.message);
    }
  }
  
  return results;
}

/**
 * Detect the primary project type
 * @param {string} dir - Directory to scan
 * @returns {object|null} Primary detection result
 */
function detectPrimary(dir = process.cwd()) {
  const results = detectAll(dir);
  
  // Filter out Docker if there are other project types
  // (Docker is usually supplementary)
  if (results.length > 1) {
    const nonDocker = results.filter(r => r.analysis.type !== 'docker');
    if (nonDocker.length > 0) {
      return nonDocker[0];
    }
  }
  
  return results[0] || null;
}

/**
 * Get a detector by type
 * @param {string} type - Detector type (e.g., 'nodejs', 'python')
 * @returns {BaseDetector|null}
 */
function getDetector(type) {
  return detectors.find(d => d.type === type) || null;
}

/**
 * Get all registered detectors
 * @returns {BaseDetector[]}
 */
function getAllDetectors() {
  return detectors;
}

/**
 * Register a custom detector
 * @param {BaseDetector} detector - Detector instance
 */
function registerDetector(detector) {
  detectors.push(detector);
}

module.exports = {
  detectAll,
  detectPrimary,
  getDetector,
  getAllDetectors,
  registerDetector
};
