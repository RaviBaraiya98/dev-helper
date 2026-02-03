/**
 * Version parsing and comparison utilities
 */

/**
 * Parse a version string into components
 * @param {string} versionStr - Version string like "v18.17.0" or "3.11.4"
 * @returns {object} { major, minor, patch, prerelease, original }
 */
function parseVersion(versionStr) {
  if (!versionStr) return null;
  
  // Clean the version string
  const cleaned = versionStr
    .trim()
    .replace(/^v/i, '')
    .replace(/[^\d.\-a-z]/gi, ' ')
    .split(' ')[0];
  
  const match = cleaned.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-(.+))?/);
  
  if (!match) return null;
  
  return {
    major: parseInt(match[1], 10) || 0,
    minor: parseInt(match[2], 10) || 0,
    patch: parseInt(match[3], 10) || 0,
    prerelease: match[4] || null,
    original: versionStr.trim()
  };
}

/**
 * Extract version from command output
 * @param {string} output - Command output like "node v18.17.0" or "Python 3.11.4"
 * @returns {string|null} Version string
 */
function extractVersion(output) {
  if (!output) return null;
  
  // Common patterns for version extraction
  const patterns = [
    /v?(\d+\.\d+\.\d+)/,           // Standard semver
    /version\s+v?(\d+\.\d+\.\d+)/i, // "version 1.2.3"
    /v?(\d+\.\d+)/,                 // Major.minor only
  ];
  
  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Compare two version strings
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);
  
  if (!parsed1 && !parsed2) return 0;
  if (!parsed1) return -1;
  if (!parsed2) return 1;
  
  if (parsed1.major !== parsed2.major) {
    return parsed1.major > parsed2.major ? 1 : -1;
  }
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor > parsed2.minor ? 1 : -1;
  }
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch > parsed2.patch ? 1 : -1;
  }
  
  return 0;
}

/**
 * Check if version meets minimum requirement
 * @param {string} version - Current version
 * @param {string} minimum - Minimum required version
 * @returns {boolean}
 */
function meetsMinimum(version, minimum) {
  return compareVersions(version, minimum) >= 0;
}

/**
 * Format version for display
 * @param {string} version - Version string
 * @returns {string} Formatted version
 */
function formatVersion(version) {
  const parsed = parseVersion(version);
  if (!parsed) return version || 'unknown';
  
  let formatted = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
  if (parsed.prerelease) {
    formatted += `-${parsed.prerelease}`;
  }
  return formatted;
}

module.exports = {
  parseVersion,
  extractVersion,
  compareVersions,
  meetsMinimum,
  formatVersion
};
