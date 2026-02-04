/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                        SAFETY MODULE - CRITICAL                           ║
 * ║                                                                           ║
 * ║  This module enforces strict safety rules for dev-helper.                 ║
 * ║  dev-helper is a READ-ONLY ANALYZER - it must NEVER:                      ║
 * ║                                                                           ║
 * ║    ❌ Execute user project code                                           ║
 * ║    ❌ Start servers or open ports                                         ║
 * ║    ❌ Install dependencies                                                ║
 * ║    ❌ Modify project files                                                ║
 * ║    ❌ Run user-defined scripts                                            ║
 * ║    ❌ Execute build commands                                              ║
 * ║                                                                           ║
 * ║  ALLOWED OPERATIONS (read-only):                                          ║
 * ║    ✅ Check tool versions (git --version, node --version, etc.)           ║
 * ║    ✅ Check tool availability (where/which commands)                      ║
 * ║    ✅ Read configuration (git config --get)                               ║
 * ║    ✅ Read file system (fs.readFileSync)                                  ║
 * ║    ✅ Check git repository status (read-only)                             ║
 * ║                                                                           ║
 * ║  ALL OTHER COMMANDS ARE BLOCKED.                                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * ALLOWLIST: These are the ONLY commands that can be executed.
 * Each entry is a regex pattern that matches safe commands.
 * 
 * SECURITY PRINCIPLE: Allowlist, not blocklist.
 * If a command is not explicitly allowed, it is blocked.
 */
const SAFE_COMMAND_PATTERNS = [
  // ═══════════════════════════════════════════════════════════════════
  // VERSION CHECKS - Read-only queries for installed tool versions
  // ═══════════════════════════════════════════════════════════════════
  /^git\s+--version$/i,
  /^node\s+--version$/i,
  /^node\s+-v$/i,
  /^npm\s+--version$/i,
  /^npm\s+-v$/i,
  /^python\s+--version$/i,
  /^python\s+-V$/i,
  /^python3\s+--version$/i,
  /^python3\s+-V$/i,
  /^java\s+--version$/i,
  /^java\s+-version$/i,
  /^java\s+-version\s+2>&1$/i,
  /^javac\s+--version$/i,
  /^javac\s+-version$/i,
  /^go\s+version$/i,
  /^rustc\s+--version$/i,
  /^cargo\s+--version$/i,
  /^dotnet\s+--version$/i,
  /^php\s+--version$/i,
  /^php\s+-v$/i,
  /^composer\s+--version$/i,
  /^flutter\s+--version$/i,
  /^dart\s+--version$/i,
  /^docker\s+--version$/i,
  /^docker\s+-v$/i,
  /^docker\s+version$/i,
  /^mvn\s+--version$/i,
  /^mvn\s+-v$/i,
  /^gradle\s+--version$/i,
  /^gradle\s+-v$/i,
  /^cmake\s+--version$/i,
  /^make\s+--version$/i,
  /^gcc\s+--version$/i,
  /^g\+\+\s+--version$/i,
  /^clang\s+--version$/i,
  /^pip\s+--version$/i,
  /^pip3\s+--version$/i,
  /^poetry\s+--version$/i,
  /^pipenv\s+--version$/i,
  /^yarn\s+--version$/i,
  /^pnpm\s+--version$/i,
  /^bun\s+--version$/i,

  // ═══════════════════════════════════════════════════════════════════
  // TOOL EXISTENCE CHECKS - Check if a command exists in PATH
  // ═══════════════════════════════════════════════════════════════════
  /^where\s+\w+$/i,           // Windows: where git
  /^which\s+\w+$/i,           // Unix: which git
  /^command\s+-v\s+\w+$/i,    // POSIX: command -v git

  // ═══════════════════════════════════════════════════════════════════
  // GIT READ-ONLY OPERATIONS - Configuration and status queries
  // ═══════════════════════════════════════════════════════════════════
  /^git\s+config\s+--global\s+user\.name$/i,
  /^git\s+config\s+--global\s+user\.email$/i,
  /^git\s+config\s+--global\s+init\.defaultBranch$/i,
  /^git\s+config\s+--get\s+[\w.]+$/i,
  /^git\s+status$/i,
  /^git\s+status\s+--porcelain(\s+2>&1)?$/i,
  /^git\s+rev-parse\s+--git-dir$/i,
  /^git\s+rev-parse\s+--is-inside-work-tree(\s+2>&1)?$/i,
  /^git\s+branch\s+--show-current(\s+2>&1)?$/i,
  /^git\s+symbolic-ref\s+HEAD(\s+2>&1)?$/i,
  /^git\s+diff\s+--cached\s+--quiet(\s+2>&1)?$/i,
  /^git\s+ls-files\s+--others\s+--exclude-standard(\s+2>&1)?$/i,
  /^git\s+ls-files\s+-u(\s+2>&1)?$/i,
  /^git\s+remote(\s+2>&1)?$/i,
  /^git\s+log\s+-1\s+--format="[^"]*"(\s+2>&1)?$/i,
  /^git\s+rev-list\s+--left-right\s+--count\s+HEAD\.\.\.@\{upstream\}(\s+2>&1)?$/i,
  /^git\s+diff\s+--name-only\s+--diff-filter=U(\s+2>&1)?$/i,
  /^git\s+stash\s+list(\s+2>&1)?$/i,
  /^git\s+reflog\s+-\d+\s+--format="[^"]*"(\s+2>&1)?$/i,

  // ═══════════════════════════════════════════════════════════════════
  // DOCKER READ-ONLY - Check if Docker daemon is running
  // ═══════════════════════════════════════════════════════════════════
  /^docker\s+info$/i,
  /^docker\s+ps$/i,
];

/**
 * BLOCKLIST: Commands that are EXPLICITLY DANGEROUS
 * These patterns will be blocked even if they somehow match an allowlist pattern.
 * This is a defense-in-depth measure.
 */
const DANGEROUS_COMMAND_PATTERNS = [
  // ═══════════════════════════════════════════════════════════════════
  // NODE.JS EXECUTION - NEVER execute user JavaScript
  // ═══════════════════════════════════════════════════════════════════
  /\bnode\s+(?!-v|--version)/i,           // node anything except version
  /\bnpm\s+(start|run|exec|test)/i,       // npm start, npm run, etc.
  /\bnpm\s+install/i,                      // npm install
  /\bnpx\b/i,                              // npx anything
  /\byarn\s+(start|run|dev|build)/i,      // yarn scripts
  /\byarn\s+install/i,                     // yarn install
  /\bpnpm\s+(start|run|dev|build)/i,      // pnpm scripts
  /\bbun\s+(run|start|dev)/i,             // bun scripts

  // ═══════════════════════════════════════════════════════════════════
  // PYTHON EXECUTION - NEVER execute user Python code
  // ═══════════════════════════════════════════════════════════════════
  /\bpython[3]?\s+(?!-V|--version)/i,     // python anything except version
  /\bpip[3]?\s+install/i,                  // pip install
  /\bpoetry\s+(install|run)/i,             // poetry commands
  /\bpipenv\s+(install|run)/i,             // pipenv commands
  /\bconda\s+(install|run|activate)/i,     // conda commands

  // ═══════════════════════════════════════════════════════════════════
  // JAVA EXECUTION - NEVER execute user Java code
  // ═══════════════════════════════════════════════════════════════════
  /\bjava\s+(?!-version|--version)/i,     // java anything except version
  /\bmvn\s+(compile|install|exec|spring-boot:run|package|test)/i,
  /\bgradle\s+(run|bootRun|build|assemble)/i,
  /\b\.\/gradlew\s/i,                      // Gradle wrapper

  // ═══════════════════════════════════════════════════════════════════
  // OTHER LANGUAGE EXECUTION
  // ═══════════════════════════════════════════════════════════════════
  /\bgo\s+(run|build|test)/i,              // Go execution
  /\bcargo\s+(run|build|test)/i,           // Rust execution
  /\bdotnet\s+(run|build|test)/i,          // .NET execution
  /\bphp\s+(?!-v|--version)/i,             // PHP execution
  /\bflutter\s+(run|build)/i,              // Flutter execution
  /\bdart\s+run/i,                         // Dart execution

  // ═══════════════════════════════════════════════════════════════════
  // DOCKER EXECUTION - NEVER start containers
  // ═══════════════════════════════════════════════════════════════════
  /\bdocker\s+(run|start|compose|build|exec)/i,
  /\bdocker-compose\b/i,

  // ═══════════════════════════════════════════════════════════════════
  // SHELL COMMANDS THAT COULD CAUSE SIDE EFFECTS
  // ═══════════════════════════════════════════════════════════════════
  /\brm\s/i,                               // Delete files
  /\bmkdir\s/i,                            // Create directories
  /\btouch\s/i,                            // Create files
  /\bcp\s/i,                               // Copy files
  /\bmv\s/i,                               // Move files
  /\bcurl\s/i,                             // HTTP requests
  /\bwget\s/i,                             // HTTP requests
  /\bsudo\b/i,                             // Elevated privileges
  /\bsh\s+-c/i,                            // Shell execution
  /\bbash\s+-c/i,                          // Bash execution
  /\bpowershell/i,                         // PowerShell execution
  /\bcmd\s+\/c/i,                          // CMD execution
  /[;&|](?!1)/,                            // Command chaining (allow 2>&1)
  /\$\(/,                                  // Command substitution
  /`/,                                     // Backtick execution
  /(?<!2)>(?!&)/,                          // Output redirection to files (allow 2>&1 pattern)
  /<(?!&)/,                                // Input redirection (except 2>&1)
];

/**
 * Check if a command is safe to execute
 * @param {string} command - The command to check
 * @returns {{safe: boolean, reason: string}} Safety check result
 */
function isCommandSafe(command) {
  if (!command || typeof command !== 'string') {
    return { safe: false, reason: 'Invalid command: empty or not a string' };
  }

  // Normalize the command
  const normalizedCmd = command.trim();

  // FIRST: Check against dangerous patterns (defense in depth)
  for (const pattern of DANGEROUS_COMMAND_PATTERNS) {
    if (pattern.test(normalizedCmd)) {
      return {
        safe: false,
        reason: `BLOCKED: Command matches dangerous pattern. dev-helper is read-only and cannot execute project code.`
      };
    }
  }

  // SECOND: Check if command matches allowlist
  for (const pattern of SAFE_COMMAND_PATTERNS) {
    if (pattern.test(normalizedCmd)) {
      return { safe: true, reason: 'Command is on the safe allowlist' };
    }
  }

  // DEFAULT: Block everything not explicitly allowed
  return {
    safe: false,
    reason: `BLOCKED: Command not on allowlist. dev-helper only executes read-only version and config checks.`
  };
}

/**
 * Log a blocked command attempt (for debugging/audit)
 * @param {string} command - The command that was blocked
 * @param {string} reason - Why it was blocked
 */
function logBlockedCommand(command, reason) {
  // Only log in debug mode to avoid cluttering output
  if (process.env.DEV_HELPER_DEBUG === 'true') {
    console.error(`[SAFETY] Blocked command: "${command}"`);
    console.error(`[SAFETY] Reason: ${reason}`);
  }
}

/**
 * Assert that a command is safe - throws if not
 * @param {string} command - Command to validate
 * @throws {Error} If command is not safe
 */
function assertCommandSafe(command) {
  const result = isCommandSafe(command);
  if (!result.safe) {
    logBlockedCommand(command, result.reason);
    throw new Error(`Security violation: ${result.reason}`);
  }
}

/**
 * Sanitize user input that might be used in commands
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input safe for use
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  // Remove any characters that could be used for command injection
  return input.replace(/[;&|$`"'<>(){}[\]\\]/g, '');
}

module.exports = {
  isCommandSafe,
  assertCommandSafe,
  logBlockedCommand,
  sanitizeInput,
  SAFE_COMMAND_PATTERNS,
  DANGEROUS_COMMAND_PATTERNS
};
